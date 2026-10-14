"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatDateBR } from "@/lib/format";
import { venueMenuApi, type VenueMenu } from "@/services/venue-menu";
import { useVenueMenuMutations, useVenueMenus } from "../_hooks/use-venue-menus";
import { venueKeys } from "../_hooks/query-keys";
import { MenuStatusBadge } from "./venue-status-badge";

function MenuFormDialog({ open, onOpenChange, menu, onSubmit, loading }: { open: boolean; onOpenChange: (v: boolean) => void; menu: VenueMenu | null; onSubmit: (values: { nome: string; descricao: string; isMain: boolean }) => void; loading: boolean }) {
  const [nome, setNome] = useState(menu?.nome ?? "");
  const [descricao, setDescricao] = useState(menu?.descricao ?? "");
  const [isMain, setIsMain] = useState(menu?.isMain ?? false);

  useEffect(() => {
    if (open) {
      setNome(menu?.nome ?? "");
      setDescricao(menu?.descricao ?? "");
      setIsMain(menu?.isMain ?? false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menu?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{menu ? "Editar cardápio" : "Novo cardápio"}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="menu-form-nome" required>
            <Input id="menu-form-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cardápio principal, Happy hour" />
          </Field>
          <Field label="Descrição" htmlFor="menu-form-descricao" optional>
            <Textarea id="menu-form-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
          </Field>
          <label htmlFor="menu-form-main" className="surface-inset flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-foreground">Cardápio principal</span>
              <span className="block text-caption text-muted-foreground">É o que aparece no link e no QR code públicos. Substitui o principal atual.</span>
            </span>
            <Switch id="menu-form-main" checked={isMain} onCheckedChange={setIsMain} />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button disabled={!nome.trim()} loading={loading} onClick={() => onSubmit({ nome: nome.trim(), descricao: descricao.trim(), isMain })}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Lista de cardápios (principal, happy hour, camarote…) — só um pode ser o principal. */
export function CardapiosTab({ orgId, selectedMenuId, onSelectMenu }: { orgId: number; selectedMenuId?: number | null; onSelectMenu?: (menuId: number) => void }) {
  const { data: menus, isLoading, isError, refetch } = useVenueMenus(orgId);
  const { create, update, setMain, publish, archive } = useVenueMenuMutations(orgId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueMenu | null>(null);
  const [archiving, setArchiving] = useState<VenueMenu | null>(null);

  const list = menus ?? [];

  // Contagem de categorias/produtos por cardápio — poucos cardápios por org,
  // então buscar o detalhe de cada um em paralelo é barato.
  const detailQueries = useQueries({ queries: list.map((menu) => ({ queryKey: venueKeys.menu(orgId, menu.id), queryFn: () => venueMenuApi.getMenu(orgId, menu.id), staleTime: 60_000 })) });
  const itemsQueries = useQueries({ queries: list.map((menu) => ({ queryKey: venueKeys.menuItems(orgId, menu.id), queryFn: () => venueMenuApi.listMenuItems(orgId, menu.id), staleTime: 60_000 })) });

  const handleSubmit = (values: { nome: string; descricao: string; isMain: boolean }) => {
    const payload = { nome: values.nome, descricao: values.descricao || undefined, isMain: values.isMain };
    const mutation = editing ? update.mutateAsync({ menuId: editing.id, payload }) : create.mutateAsync(payload);
    mutation
      .then(() => {
        toast.success(editing ? "Cardápio atualizado" : "Cardápio criado");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o cardápio.")));
  };

  if (isError) return <ErrorState description="Não foi possível carregar os cardápios." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body text-muted-foreground">Só um pode ser o principal — é o que vai no link e no QR.</p>
        <Button size="sm" leftIcon="plus" onClick={() => { setEditing(null); setFormOpen(true); }}>
          Novo cardápio
        </Button>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={2} />
      ) : list.length === 0 ? (
        <EmptyState icon="utensils" title="Nenhum cardápio ainda" description="Crie o primeiro cardápio pra começar a organizar os produtos." action={<Button leftIcon="plus" onClick={() => setFormOpen(true)}>Novo cardápio</Button>} />
      ) : (
        <ul className="space-y-2.5">
          {list.map((menu, i) => {
            const categoriesCount = detailQueries[i]?.data?.categories.length ?? null;
            const productsCount = itemsQueries[i]?.data?.length ?? null;
            const selected = selectedMenuId === menu.id;
            return (
              <li key={menu.id} className={cn("fade-up rounded-card border bg-surface p-4 shadow-card", selected ? "border-brand/40" : "border-border")} style={{ ["--i" as string]: i } as never}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {menu.isMain ? <Icon name="star" size={12} className="text-brand" /> : null}
                      <p className="truncate font-semibold text-foreground">{menu.nome}</p>
                      <MenuStatusBadge status={menu.status} />
                    </div>
                    <p className="mt-1 text-caption text-muted-foreground tnum">
                      {categoriesCount ?? "–"} categorias · {productsCount ?? "–"} produtos
                      {menu.publishedAt ? ` · publicado em ${formatDateBR(menu.publishedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {onSelectMenu && !selected ? (
                      <Button variant="subtle" size="icon-sm" aria-label="Abrir este cardápio" title="Abrir este cardápio" onClick={() => onSelectMenu(menu.id)}>
                        <Icon name="eye" size={14} />
                      </Button>
                    ) : null}
                    <Button variant="subtle" size="icon-sm" aria-label="Editar" title="Editar" onClick={() => { setEditing(menu); setFormOpen(true); }}>
                      <Icon name="edit" size={14} />
                    </Button>
                    {menu.status !== "ARCHIVED" ? (
                      <Button variant="subtle" size="icon-sm" aria-label="Arquivar" title={menu.isMain ? "O principal não pode ser arquivado" : "Arquivar"} disabled={menu.isMain} className="hover:bg-danger-bg hover:text-danger disabled:opacity-40" onClick={() => setArchiving(menu)}>
                        <Icon name="trash" size={14} />
                      </Button>
                    ) : null}
                  </div>
                </div>
                {menu.status !== "ARCHIVED" && (!menu.isMain || menu.status === "DRAFT") ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {!menu.isMain ? (
                      <Button variant="outline" size="sm" leftIcon="star" loading={setMain.isPending && setMain.variables === menu.id} onClick={() => setMain.mutate(menu.id, { onSuccess: () => toast.success("Definido como principal"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível definir como principal.")) })}>
                        Definir como principal
                      </Button>
                    ) : null}
                    {menu.status === "DRAFT" ? (
                      <Button variant="outline" size="sm" leftIcon="bolt" loading={publish.isPending && publish.variables === menu.id} onClick={() => publish.mutate(menu.id, { onSuccess: () => toast.success("Cardápio publicado"), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível publicar o cardápio.")) })}>
                        Publicar
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <MenuFormDialog open={formOpen} onOpenChange={setFormOpen} menu={editing} onSubmit={handleSubmit} loading={create.isPending || update.isPending} />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar cardápio"
        description={`Arquivar "${archiving?.nome}"? Ele sai da edição e do público, mas nada é apagado.`}
        confirmLabel="Arquivar"
        danger
        onConfirm={async () => {
          if (!archiving) return;
          try {
            await archive.mutateAsync(archiving.id);
            toast.success("Cardápio arquivado");
          } catch (err) {
            toast.error(getErrorMessage(err, "Não foi possível arquivar o cardápio."));
            throw err;
          }
        }}
      />
    </div>
  );
}
