"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, ListChecks, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildMarketingUrl } from "@/lib/surfaces";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueMenu } from "@/services/venue-menu";
import { useVenueMenuMutations } from "../_hooks/use-venue-menus";
import { useUpdateOrganizationSlug } from "../_hooks/use-organization-slug";
import { MenuStatusBadge } from "./venue-status-badge";

const MARKETING_HOST = buildMarketingUrl("").replace(/^https?:\/\//, "");

function EditableName({ menu, orgId }: { menu: VenueMenu; orgId: number }) {
  const { update } = useVenueMenuMutations(orgId);
  const [value, setValue] = useState(menu.nome);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setValue(menu.nome);
  }, [menu.nome]);

  const save = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === menu.nome) {
      setValue(menu.nome);
      return;
    }
    update.mutate(
      { menuId: menu.id, payload: { nome: trimmed } },
      {
        onError: (err) => {
          setValue(menu.nome);
          toast.error(getErrorMessage(err, "Não foi possível renomear o cardápio."));
        },
      },
    );
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setValue(menu.nome);
            setEditing(false);
          }
        }}
        className="h-9 max-w-xs text-xl font-semibold"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex min-w-0 items-center gap-1.5 text-left"
      title="Renomear cardápio"
    >
      <h1 className="truncate text-xl font-semibold text-foreground">{menu.nome}</h1>
      <Pencil size={14} className="shrink-0 text-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function SlugField({ orgId, orgSlug }: { orgId: number; orgSlug: string }) {
  const updateSlug = useUpdateOrganizationSlug(orgId);
  const [value, setValue] = useState(orgSlug);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setValue(orgSlug);
  }, [orgSlug]);

  const save = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === orgSlug) {
      setValue(orgSlug);
      return;
    }
    updateSlug.mutate(trimmed, {
      onError: (err) => {
        setValue(orgSlug);
        toast.error(getErrorMessage(err, "Não foi possível alterar o link. Tente outro."));
      },
      onSuccess: () => toast.success("Link público atualizado!"),
    });
  };

  return (
    <div className="flex min-w-0 items-center gap-1 rounded-lg border border-black/10 bg-black/[0.015] pl-2.5 text-xs text-black/60">
      <span className="shrink-0 py-1.5">{MARKETING_HOST}/cardapio/</span>
      {editing ? (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setValue(orgSlug);
              setEditing(false);
            }
          }}
          className="h-6 min-w-0 flex-1 border-0 bg-transparent p-0 pr-1 text-xs shadow-none focus-visible:ring-0"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 truncate py-1.5 pr-2.5 text-left font-medium text-foreground"
          title="Editar link público"
        >
          {orgSlug}
        </button>
      )}
    </div>
  );
}

export function MenuHeader({
  orgId,
  orgSlug,
  menu,
  menus,
  onSelectMenu,
  onManageMenus,
  onManageStations,
  onCreateProduct,
  onBulkCreateProducts,
}: {
  orgId: number;
  orgSlug: string | null;
  menu: VenueMenu | null;
  menus: VenueMenu[];
  onSelectMenu: (menuId: number) => void;
  onManageMenus: () => void;
  onManageStations: () => void;
  onCreateProduct: () => void;
  onBulkCreateProducts: () => void;
}) {
  const { publish } = useVenueMenuMutations(orgId);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canShare = Boolean(orgSlug) && menu?.isMain && menu?.status === "PUBLISHED";
  const publicUrl = orgSlug ? buildMarketingUrl(`/cardapio/${orgSlug}`) : null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado!");
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const handlePublish = () => {
    if (!menu) return;
    publish.mutate(menu.id, {
      onSuccess: () =>
        toast.success(menu.isMain ? "Cardápio publicado! Já está disponível no link público." : "Cardápio publicado."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível publicar o cardápio.")),
    });
  };

  if (!menu) return null;

  const canPublish = menu.status === "DRAFT";

  return (
    <div className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <EditableName menu={menu} orgId={orgId} />
          <MenuStatusBadge status={menu.status} />
          {menus.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Trocar cardápio">
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {menus.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => onSelectMenu(m.id)}>
                    {m.nome} {m.isMain ? "· Principal" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onManageStations}>
            Estações
          </Button>
          <Button variant="outline" size="sm" onClick={onManageMenus}>
            Gerenciar cardápios
          </Button>
          {canPublish ? (
            <Button variant="outline" size="sm" disabled={publish.isPending} onClick={handlePublish}>
              {publish.isPending ? "Publicando…" : "Publicar cardápio"}
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus size={16} /> Adicionar produto
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateProduct}>Adicionar um produto</DropdownMenuItem>
              <DropdownMenuItem onClick={onBulkCreateProducts}>
                <ListChecks size={14} /> Adicionar vários produtos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {orgSlug ? (
        <div className="flex flex-wrap items-center gap-2">
          <SlugField orgId={orgId} orgSlug={orgSlug} />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={handleCopy} disabled={!publicUrl}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
          {canShare && publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              <ExternalLink size={13} /> Abrir cardápio público
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              {!menu.isMain ? "Só o cardápio principal fica público." : "Publique para abrir o link."}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
