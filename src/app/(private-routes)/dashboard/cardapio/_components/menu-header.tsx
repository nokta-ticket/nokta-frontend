"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Copy, ExternalLink, ImagePlus, Instagram, MapPin, Pencil, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildMarketingUrl } from "@/lib/surfaces";
import { resolveMediaUrl } from "@/lib/media";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueMenu } from "@/services/venue-menu";
import { useVenueMenuMutations } from "../_hooks/use-venue-menus";
import { useUpdateOrganizationSlug } from "../_hooks/use-organization-slug";
import { useUpdateVenuePublicProfile, useVenuePublicProfile } from "../_hooks/use-venue-public-profile";
import { useImageUpload } from "../_hooks/use-image-upload";

const MARKETING_HOST = buildMarketingUrl("").replace(/^https?:\/\//, "");

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function LogoUploader({ orgId, orgName }: { orgId: number; orgName: string }) {
  const { data: profile } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);
  const { upload, uploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    update.mutate(
      { logoUrl: url },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar a logo.")) },
    );
  };

  const logoUrl = profile?.logoUrl ?? null;

  return (
    <div className="flex flex-col items-start">
      <span className="mb-2 block text-xs font-medium text-black/50">Logo</span>
      <div className="relative flex h-[118px] w-[118px] shrink-0 items-center justify-center rounded-full bg-black shadow-[0_8px_20px_rgba(0,0,0,.18)]">
        {logoUrl ? (
          <Image src={resolveMediaUrl(logoUrl) ?? logoUrl} alt={orgName} fill sizes="118px" className="rounded-full object-cover" unoptimized />
        ) : (
          <>
            <span className="pointer-events-none absolute h-[74px] w-[74px] rounded-full border border-white/35" />
            <span className="relative font-poppins text-[19px] font-medium tracking-[0.12em] text-white">
              {initials(orgName)}
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          aria-label="Trocar logo"
          className="absolute bottom-0.5 right-0.5 grid h-[30px] w-[30px] place-items-center rounded-full border border-black/10 bg-white shadow-sm disabled:opacity-60"
        >
          <Pencil size={14} className="text-black/60" />
        </button>
      </div>
      <p className="mt-3.5 text-[11.5px] leading-relaxed text-black/40">
        Formatos: JPG, PNG ou WEBP
        <br />
        Tamanho recomendado: 512x512px
      </p>
    </div>
  );
}

function NameAndDescription({ menu, orgId }: { menu: VenueMenu; orgId: number }) {
  const { update } = useVenueMenuMutations(orgId);
  const [nome, setNome] = useState(menu.nome);
  const [descricao, setDescricao] = useState(menu.descricao ?? "");

  useEffect(() => {
    setNome(menu.nome);
    setDescricao(menu.descricao ?? "");
  }, [menu.id, menu.nome, menu.descricao]);

  const saveNome = () => {
    const trimmed = nome.trim();
    if (!trimmed || trimmed === menu.nome) {
      setNome(menu.nome);
      return;
    }
    update.mutate(
      { menuId: menu.id, payload: { nome: trimmed } },
      {
        onError: (err) => {
          setNome(menu.nome);
          toast.error(getErrorMessage(err, "Não foi possível renomear o cardápio."));
        },
      },
    );
  };

  const saveDescricao = () => {
    const trimmed = descricao.trim();
    if (trimmed === (menu.descricao ?? "")) return;
    update.mutate(
      { menuId: menu.id, payload: { descricao: trimmed } },
      {
        onError: (err) => {
          setDescricao(menu.descricao ?? "");
          toast.error(getErrorMessage(err, "Não foi possível salvar a descrição."));
        },
      },
    );
  };

  return (
    <div>
      <div className="mb-4">
        <span className="mb-2 block text-xs font-medium text-black/50">Nome do cardápio</span>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={saveNome}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="h-11 rounded-[10px]"
        />
      </div>
      <div>
        <span className="mb-2 block text-xs font-medium text-black/50">Descrição (opcional)</span>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          onBlur={saveDescricao}
          rows={4}
          className="resize-none rounded-[10px]"
        />
      </div>
    </div>
  );
}

function StatusAndLinks({
  orgId,
  orgSlug,
  menu,
  menus,
  onSelectMenu,
}: {
  orgId: number;
  /** Organization.slug — sempre gerado na criação da org, mas o tipo permite null (ver schema); nesse caso mostramos um placeholder em vez de sumir com a seção inteira. */
  orgSlug: string | null;
  menu: VenueMenu;
  menus: VenueMenu[];
  onSelectMenu: (menuId: number) => void;
}) {
  const updateSlug = useUpdateOrganizationSlug(orgId);
  // displaySlug é o que a UI mostra fora do modo de edição — nunca cai de
  // volta pro orgSlug antigo (prop) enquanto a mutation está em voo. Sem
  // isso, salvar troca de editingSlug=false ANTES de refreshOrganizations()
  // (round-trip de rede) resolver e trazer o orgSlug novo, então a UI
  // mostra o valor antigo por um instante e só depois "pisca" pro novo.
  const [displaySlug, setDisplaySlug] = useState(orgSlug);
  const [slugValue, setSlugValue] = useState(orgSlug ?? "");
  const [editingSlug, setEditingSlug] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSlugValue(orgSlug ?? "");
    setDisplaySlug(orgSlug);
  }, [orgSlug]);

  const publicUrl = displaySlug ? buildMarketingUrl(`/cardapio/${displaySlug}`) : null;
  // Link público real só existe pro cardápio PRINCIPAL (o público só tem
  // espaço pra 1 cardápio por organização) — status Publicado/Rascunho já
  // não bloqueia mais nada aqui (todo cardápio principal nasce publicado).
  const canOpenPublic = Boolean(publicUrl) && menu.isMain && menu.status !== "ARCHIVED";

  const saveSlug = () => {
    setEditingSlug(false);
    const trimmed = slugValue.trim();
    if (!trimmed || trimmed === displaySlug) {
      setSlugValue(displaySlug ?? "");
      return;
    }
    setDisplaySlug(trimmed);
    updateSlug.mutate(trimmed, {
      onError: (err) => {
        setSlugValue(orgSlug ?? "");
        setDisplaySlug(orgSlug);
        toast.error(getErrorMessage(err, "Não foi possível alterar o link. Tente outro."));
      },
      onSuccess: () => toast.success("Link público atualizado!"),
    });
  };

  const copy = async (value: string, kind: "slug" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copiado!");
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      if (kind === "slug") setCopiedSlug(true);
      else setCopiedLink(true);
      copyTimeout.current = setTimeout(() => {
        setCopiedSlug(false);
        setCopiedLink(false);
      }, 1800);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <span className="mb-2 block text-xs font-medium text-black/50">Status</span>
        <div className="flex h-11 items-center rounded-[10px] border border-black/10 bg-[#fdfdfe] px-3.5">
          {menu.status === "PUBLISHED" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-700">
              Publicado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-[13px] font-semibold text-black/60">
              {menu.status === "DRAFT" ? "Rascunho" : "Arquivado"}
            </span>
          )}
          {menus.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-auto text-black/30" aria-label="Trocar cardápio">
                  <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menus.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => onSelectMenu(m.id)}>
                    {m.nome} {m.isMain ? "· Principal" : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <span className="mb-2 block text-xs font-medium text-black/50">Slug (link público)</span>
        <div className="flex items-stretch gap-2.5">
          <div className="flex flex-1 items-center overflow-hidden rounded-[10px] border border-black/10 bg-[#fdfdfe]">
            <span className="h-11 shrink-0 whitespace-nowrap border-r border-black/10 bg-black/[0.035] px-3 text-[13px] leading-[44px] text-black/40">
              {MARKETING_HOST}/cardapio/
            </span>
            {editingSlug ? (
              <input
                autoFocus
                value={slugValue}
                onChange={(e) => setSlugValue(e.target.value)}
                onBlur={saveSlug}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    setSlugValue(displaySlug ?? "");
                    setEditingSlug(false);
                  }
                }}
                placeholder="nome-do-seu-negocio"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingSlug(true)}
                className="h-11 min-w-0 flex-1 truncate px-3 text-left text-sm text-foreground"
              >
                {displaySlug ?? <span className="text-black/30">definir link…</span>}
              </button>
            )}
            <button onClick={() => setEditingSlug(true)} className="grid h-11 w-11 shrink-0 place-items-center text-black/40" aria-label="Editar slug">
              <Pencil size={15} />
            </button>
          </div>
          <button
            onClick={() => displaySlug && copy(displaySlug, "slug")}
            disabled={!displaySlug}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-black/50 hover:bg-black/[0.02] disabled:opacity-40"
            aria-label="Copiar slug"
          >
            {copiedSlug ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-black/50">Link público</span>
        <div className="flex items-stretch gap-2.5">
          <div className="flex h-11 flex-1 items-center truncate rounded-[10px] border border-black/10 bg-[#f7f7fa] px-3.5 text-[13.5px] text-black/60">
            {publicUrl ?? "Defina o link acima para gerar a URL pública"}
          </div>
          <button
            onClick={() => publicUrl && copy(publicUrl, "link")}
            disabled={!publicUrl}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-black/50 hover:bg-black/[0.02] disabled:opacity-40"
            aria-label="Copiar link"
          >
            {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
          {canOpenPublic && publicUrl ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-black/50 hover:bg-black/[0.02]"
              aria-label="Abrir cardápio público"
            >
              <ExternalLink size={16} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContactFields({ orgId }: { orgId: number }) {
  const { data: profile } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);

  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (!profile) return;
    setAddress(profile.address ?? "");
    setInstagramUrl(profile.instagramUrl ?? "");
    setWhatsappNumber(profile.whatsappNumber ?? "");
  }, [profile]);

  const saveField = (field: "address" | "instagramUrl" | "whatsappNumber", value: string) => {
    const trimmed = value.trim();
    if (trimmed === (profile?.[field] ?? "")) return;
    update.mutate(
      { [field]: trimmed || undefined },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar. Confira o dado e tente de novo.")) },
    );
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 border-t border-black/[0.06] pt-6 sm:grid-cols-3">
      <div>
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <Instagram size={13} /> Instagram
        </span>
        <Input
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          onBlur={() => saveField("instagramUrl", instagramUrl)}
          placeholder="https://instagram.com/seu-bar"
          className="h-11 rounded-[10px]"
        />
      </div>
      <div>
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <Phone size={13} /> WhatsApp
        </span>
        <Input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          onBlur={() => saveField("whatsappNumber", whatsappNumber)}
          placeholder="+55 11 91234-5678"
          className="h-11 rounded-[10px]"
        />
      </div>
      <div>
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-black/50">
          <MapPin size={13} /> Endereço
        </span>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => saveField("address", address)}
          placeholder="Rua, número, bairro"
          className="h-11 rounded-[10px]"
        />
      </div>
    </div>
  );
}

function BannerUploader({ orgId }: { orgId: number }) {
  const { data: profile } = useVenuePublicProfile(orgId);
  const update = useUpdateVenuePublicProfile(orgId);
  const { upload, uploading } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    update.mutate(
      { bannerUrl: url },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar o banner.")) },
    );
  };

  const bannerUrl = profile?.bannerUrl ?? null;

  return (
    <div className="mt-6">
      <span className="mb-2 block text-xs font-medium text-black/50">Banner do cardápio (capa)</span>
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden rounded-[14px] bg-[#08080a]">
        {bannerUrl ? (
          <Image src={resolveMediaUrl(bannerUrl) ?? bannerUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(115deg,transparent 40%,rgba(255,255,255,.05) 50%,transparent 60%), radial-gradient(60% 120% at 80% 120%, rgba(124,58,237,.14), transparent 60%)",
            }}
          />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          aria-label={bannerUrl ? "Trocar banner" : "Enviar banner"}
          className="absolute right-3.5 top-3.5 z-[2] grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-60"
        >
          {bannerUrl ? <Pencil size={15} className="text-black/60" /> : <ImagePlus size={15} className="text-black/60" />}
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-black/40">Tamanho recomendado: 1600x400px</p>
    </div>
  );
}

export function MenuHeader({
  orgId,
  orgName,
  orgSlug,
  menu,
  menus,
  onSelectMenu,
}: {
  orgId: number;
  orgName: string;
  orgSlug: string | null;
  menu: VenueMenu | null;
  menus: VenueMenu[];
  onSelectMenu: (menuId: number) => void;
}) {
  if (!menu) return null;

  return (
    <div className="rounded-[18px] border border-black/[0.06] bg-white p-[26px] shadow-[0_1px_2px_rgba(20,20,35,.05),0_1px_3px_rgba(20,20,35,.03)]">
      <div className="grid grid-cols-1 gap-[34px] lg:grid-cols-[150px_1fr_1fr]">
        <LogoUploader orgId={orgId} orgName={orgName} />
        <NameAndDescription menu={menu} orgId={orgId} />
        <StatusAndLinks orgId={orgId} orgSlug={orgSlug} menu={menu} menus={menus} onSelectMenu={onSelectMenu} />
      </div>

      <ContactFields orgId={orgId} />

      <BannerUploader orgId={orgId} />
    </div>
  );
}
