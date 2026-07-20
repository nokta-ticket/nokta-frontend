"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { venueMenuApi, type VenueMenu } from "@/services/venue-menu";
import { useVenueMenuMutations, useVenueMenus } from "../_hooks/use-venue-menus";
import { venueKeys } from "../_hooks/query-keys";
import { MenuStatusBadge } from "./venue-status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  menu: VenueMenu | null;
  onSubmit: (values: { nome: string; descricao: string; isMain: boolean }) => void;
  loading: boolean;
}) {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{menu ? "Editar cardápio" : "Novo cardápio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menu-nome">Nome</Label>
            <Input
              id="menu-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Cardápio Principal, Happy Hour"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menu-descricao">Descrição (opcional)</Label>
            <Textarea
              id="menu-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Cardápio principal</p>
              <p className="text-xs text-black/50">Substitui o principal atual, se houver.</p>
            </div>
            <Switch checked={isMain} onCheckedChange={setIsMain} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nome.trim()}
            onClick={() => onSubmit({ nome: nome.trim(), descricao: descricao.trim(), isMain })}
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CardapiosTab({ orgId }: { orgId: number }) {
  const { data: menus, isLoading, isError, refetch } = useVenueMenus(orgId);
  const { create, update, setMain, publish, archive } = useVenueMenuMutations(orgId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueMenu | null>(null);
  const [archiving, setArchiving] = useState<VenueMenu | null>(null);

  const list = menus ?? [];

  // Contagem de categorias/produtos por cardápio — org tem poucos cardápios,
  // então buscar o detalhe de cada um em paralelo é barato (nada de N+1 real).
  const detailQueries = useQueries({
    queries: list.map((menu) => ({
      queryKey: venueKeys.menu(orgId, menu.id),
      queryFn: () => venueMenuApi.getMenu(orgId, menu.id),
      staleTime: 60_000,
    })),
  });
  const itemsQueries = useQueries({
    queries: list.map((menu) => ({
      queryKey: venueKeys.menuItems(orgId, menu.id),
      queryFn: () => venueMenuApi.listMenuItems(orgId, menu.id),
      staleTime: 60_000,
    })),
  });

  const handleSubmit = (values: { nome: string; descricao: string; isMain: boolean }) => {
    const payload = {
      nome: values.nome,
      descricao: values.descricao || undefined,
      isMain: values.isMain,
    };
    const mutation = editing
      ? update.mutateAsync({ menuId: editing.id, payload })
      : create.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Cardápio atualizado." : "Cardápio criado.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar o cardápio.")));
  };

  if (isError) {
    return <ErrorState description="Não foi possível carregar os cardápios." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60">
          Organize múltiplos cardápios (principal, happy hour, camarote…). Só um pode ser o principal.
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> Novo cardápio
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum cardápio ainda"
          description="Crie seu primeiro cardápio para começar a organizar os produtos do estabelecimento."
          actionLabel="Novo cardápio"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((menu, i) => {
            const categoriesCount = detailQueries[i]?.data?.categories.length ?? null;
            const productsCount = itemsQueries[i]?.data?.length ?? null;
            return (
              <div
                key={menu.id}
                className={`rounded-xl border bg-white p-4 ${menu.isMain ? "border-violet-300 ring-1 ring-violet-200" : "border-black/10"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {menu.isMain ? <Star size={14} className="fill-violet-500 text-violet-500" /> : null}
                      <p className="truncate font-semibold text-gray-900">{menu.nome}</p>
                    </div>
                    <p className="truncate text-xs text-black/40">/{menu.slug}</p>
                  </div>
                  <MenuStatusBadge status={menu.status} />
                </div>

                <div className="mt-3 flex gap-4 text-xs text-black/60">
                  <span>{categoriesCount ?? "—"} categorias</span>
                  <span>{productsCount ?? "—"} produtos</span>
                </div>
                {menu.publishedAt ? (
                  <p className="mt-1 text-xs text-black/40">
                    Publicado em {new Date(menu.publishedAt).toLocaleDateString("pt-BR")}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(menu); setFormOpen(true); }}>
                    Editar
                  </Button>
                  {!menu.isMain && menu.status !== "ARCHIVED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={setMain.isPending}
                      onClick={() =>
                        setMain.mutate(menu.id, {
                          onSuccess: () => toast.success("Definido como cardápio principal."),
                          onError: (err) =>
                            toast.error(getErrorMessage(err, "Não foi possível definir como principal.")),
                        })
                      }
                    >
                      Definir como principal
                    </Button>
                  ) : null}
                  {menu.status === "DRAFT" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={publish.isPending}
                      onClick={() =>
                        publish.mutate(menu.id, {
                          onSuccess: () => toast.success("Cardápio publicado."),
                          onError: (err) =>
                            toast.error(getErrorMessage(err, "Não foi possível publicar o cardápio.")),
                        })
                      }
                    >
                      Publicar
                    </Button>
                  ) : null}
                  {menu.status !== "ARCHIVED" ? (
                    <Button variant="outline" size="sm" onClick={() => setArchiving(menu)}>
                      Arquivar
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MenuFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        menu={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={archiving !== null}
        onOpenChange={(v) => !v && setArchiving(null)}
        title="Arquivar cardápio"
        description={`Tem certeza que deseja arquivar "${archiving?.nome}"? Ele deixa de aparecer para edição operacional, mas nada é apagado.`}
        confirmLabel="Arquivar"
        loading={archive.isPending}
        onConfirm={() => {
          if (!archiving) return;
          archive.mutate(archiving.id, {
            onSuccess: () => {
              toast.success("Cardápio arquivado.");
              setArchiving(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar o cardápio.")),
          });
        }}
      />
    </div>
  );
}
