"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueInventoryCategory } from "@/services/venue-stock";
import { useVenueStockCategories, useVenueStockCategoryMutations } from "../_hooks/use-venue-stock-catalog";
import { buildSwapReorderPayload } from "../../cardapio/_components/reorder-controls";
import { ArchivedBadge } from "./stock-status-badge";

export function CategoriesManagerDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: categories } = useVenueStockCategories(orgId);
  const { create, update, archive, reorder } = useVenueStockCategoryMutations(orgId);

  const [editing, setEditing] = useState<VenueInventoryCategory | null>(null);
  const [nome, setNome] = useState("");

  const list = categories ?? [];

  const handleCreate = () => {
    if (!nome.trim()) return;
    create
      .mutateAsync({ nome: nome.trim() })
      .then(() => {
        toast.success("Categoria criada.");
        setNome("");
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a categoria.")));
  };

  const handleRename = (category: VenueInventoryCategory, value: string) => {
    if (value === category.nome) return;
    update.mutate(
      { categoryId: category.id, payload: { nome: value } },
      {
        onSuccess: () => toast.success("Categoria renomeada."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível renomear.")),
      },
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const { items } = buildSwapReorderPayload(list, index, target);
    reorder.mutate(items, {
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível reordenar.")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Categorias de estoque</DialogTitle>
          <DialogDescription>Agrupam os itens nas listas e nos inventários. Clique no nome pra renomear.</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
          >
            <Input aria-label="Nova categoria" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova categoria" className="min-w-0 flex-1" />
            <Button type="submit" leftIcon="plus" loading={create.isPending} disabled={!nome.trim()} className="shrink-0">
              Adicionar
            </Button>
          </form>

          {list.length === 0 ? (
            <EmptyState compact icon="tags" title="Nenhuma categoria ainda" description="Crie a primeira acima — Bebidas, Insumos, Descartáveis…" />
          ) : (
            <ul className="surface-inset divide-y divide-border/70 rounded-xl">
              {list.map((category, i) => (
                <li key={category.id} className={cn("flex items-center gap-2 py-2 pl-2 pr-2", category.archivedAt && "opacity-70")}>
                  <div className="flex flex-col">
                    <Button variant="subtle" size="icon-sm" className="size-7" aria-label="Mover para cima" disabled={reorder.isPending || i === 0} onClick={() => move(i, -1)}>
                      <Icon name="chevron-up" size={11} />
                    </Button>
                    <Button variant="subtle" size="icon-sm" className="size-7" aria-label="Mover para baixo" disabled={reorder.isPending || i === list.length - 1} onClick={() => move(i, 1)}>
                      <Icon name="chevron-down" size={11} />
                    </Button>
                  </div>

                  {editing?.id === category.id ? (
                    <Input
                      autoFocus
                      aria-label="Nome da categoria"
                      className="h-9 min-w-0 flex-1 md:h-9"
                      defaultValue={category.nome}
                      onBlur={(e) => {
                        handleRename(category, e.target.value.trim() || category.nome);
                        setEditing(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditing(null);
                      }}
                    />
                  ) : (
                    <button type="button" className="min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-2" onClick={() => setEditing(category)} title="Renomear">
                      {category.nome}
                    </button>
                  )}

                  <ArchivedBadge archived={!!category.archivedAt} />

                  {!category.archivedAt ? (
                    <Button
                      variant="subtle"
                      size="icon-sm"
                      aria-label={`Arquivar ${category.nome}`}
                      title="Arquivar"
                      className="hover:bg-danger-bg hover:text-danger"
                      onClick={() =>
                        archive.mutate(category.id, {
                          onSuccess: () => toast.success("Categoria arquivada."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")),
                        })
                      }
                    >
                      <Icon name="ban" size={14} />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
