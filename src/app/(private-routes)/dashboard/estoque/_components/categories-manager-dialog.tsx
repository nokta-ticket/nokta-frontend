"use client";

import { useState } from "react";
import { Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueInventoryCategory } from "@/services/venue-stock";
import { useVenueStockCategories, useVenueStockCategoryMutations } from "../_hooks/use-venue-stock-catalog";
import { ReorderControls, buildSwapReorderPayload } from "../../cardapio/_components/reorder-controls";
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
    update.mutate(
      { categoryId: category.id, payload: { nome: value } },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível renomear.")) },
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
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categorias de estoque</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova categoria" />
            <Button size="sm" disabled={create.isPending || !nome.trim()} onClick={handleCreate}>
              <Plus size={16} />
            </Button>
          </div>

          <div className="divide-y divide-black/5 rounded-lg border border-black/10">
            {list.map((category, i) => (
              <div key={category.id} className="flex items-center gap-2 px-3 py-2">
                <ReorderControls
                  index={i}
                  total={list.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  disabled={reorder.isPending}
                />
                {editing?.id === category.id ? (
                  <Input
                    autoFocus
                    className="h-8"
                    defaultValue={category.nome}
                    onBlur={(e) => {
                      handleRename(category, e.target.value.trim() || category.nome);
                      setEditing(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  />
                ) : (
                  <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setEditing(category)}>
                    {category.nome}
                  </button>
                )}
                <ArchivedBadge archived={!!category.archivedAt} />
                {!category.archivedAt ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      archive.mutate(category.id, {
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível arquivar.")),
                      })
                    }
                  >
                    <Archive size={14} />
                  </Button>
                ) : null}
              </div>
            ))}
            {list.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-black/50">Nenhuma categoria ainda.</p>
            ) : null}
          </div>
          <Label className="text-xs text-black/40">Clique no nome para renomear.</Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
