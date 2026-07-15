"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueMenu, VenueMenuCategory } from "@/services/venue-menu";
import { useVenueCategories, useVenueCategoryMutations } from "../_hooks/use-venue-categories";
import { ActiveBadge } from "./venue-status-badge";
import { ReorderControls, buildSwapReorderPayload } from "./reorder-controls";
import { ImageField } from "./image-field";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";
import { ErrorState } from "../../../_components/states/error-state";

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: VenueMenuCategory | null;
  onSubmit: (values: { nome: string; descricao: string; imageUrl: string | null }) => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(category?.nome ?? "");
  const [descricao, setDescricao] = useState(category?.descricao ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(category?.imageUrl ?? null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setNome(category?.nome ?? "");
          setDescricao(category?.descricao ?? "");
          setImageUrl(category?.imageUrl ?? null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria-nome">Nome</Label>
            <Input
              id="categoria-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Cervejas, Drinks, Porções"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria-descricao">Descrição (opcional)</Label>
            <Textarea
              id="categoria-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
            />
          </div>
          <ImageField value={imageUrl} onChange={setImageUrl} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !nome.trim()}
            onClick={() =>
              onSubmit({ nome: nome.trim(), descricao: descricao.trim(), imageUrl })
            }
          >
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriasTab({
  orgId,
  menus,
  selectedMenuId,
  onSelectMenu,
}: {
  orgId: number;
  menus: VenueMenu[];
  selectedMenuId: number | null;
  onSelectMenu: (menuId: number) => void;
}) {
  const { data: categories, isLoading, isError, refetch } = useVenueCategories(orgId, selectedMenuId);
  const { create, update, setActive, reorder } = useVenueCategoryMutations(
    orgId,
    selectedMenuId ?? -1,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VenueMenuCategory | null>(null);

  const list = categories ?? [];
  const selectedMenu = menus.find((m) => m.id === selectedMenuId) ?? null;

  if (menus.length === 0) {
    return (
      <EmptyState
        title="Nenhum cardápio ainda"
        description="Crie seu primeiro cardápio na aba Cardápios para poder organizar categorias."
      />
    );
  }

  const handleSubmit = (values: { nome: string; descricao: string; imageUrl: string | null }) => {
    if (!selectedMenuId) return;
    const payload = {
      nome: values.nome,
      descricao: values.descricao || undefined,
      imageUrl: values.imageUrl ?? undefined,
    };
    const mutation = editing
      ? update.mutateAsync({ categoryId: editing.id, payload })
      : create.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
        setFormOpen(false);
        setEditing(null);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar a categoria.")));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const payload = buildSwapReorderPayload(list, index, target);
    reorder.mutate(payload, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-sm text-black/60">Cardápio:</Label>
          <Select
            value={selectedMenuId ? String(selectedMenuId) : undefined}
            onValueChange={(v) => onSelectMenu(Number(v))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione um cardápio" />
            </SelectTrigger>
            <SelectContent>
              {menus.map((menu) => (
                <SelectItem key={menu.id} value={String(menu.id)}>
                  {menu.nome} {menu.isMain ? "· Principal" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          disabled={!selectedMenuId || selectedMenu?.status === "ARCHIVED"}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus size={16} /> Nova categoria
        </Button>
      </div>

      {selectedMenu?.status === "ARCHIVED" ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Este cardápio está arquivado — não é possível criar novas categorias nele.
        </p>
      ) : null}

      {isError ? (
        <ErrorState description="Não foi possível carregar as categorias." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria ainda"
          description="Crie categorias como Cervejas, Drinks ou Porções para organizar o cardápio."
          actionLabel="Nova categoria"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <ul className="divide-y divide-black/5">
            {list.map((category, i) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                <ReorderControls
                  index={i}
                  total={list.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  disabled={reorder.isPending}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{category.nome}</p>
                  {category.descricao ? (
                    <p className="truncate text-xs text-black/50">{category.descricao}</p>
                  ) : null}
                </div>
                <ActiveBadge active={category.active} />
                <Switch
                  checked={category.active}
                  aria-label={category.active ? "Desativar categoria" : "Ativar categoria"}
                  onCheckedChange={(checked) =>
                    setActive.mutate(
                      { categoryId: category.id, active: checked },
                      {
                        onError: (err) =>
                          toast.error(getErrorMessage(err, "Não foi possível atualizar a categoria.")),
                      },
                    )
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(category);
                    setFormOpen(true);
                  }}
                >
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
        loading={create.isPending || update.isPending}
      />
    </div>
  );
}
