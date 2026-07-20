"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_INVENTORY_UNIT_LABEL } from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useSetModifierComponents, useVenueModifierComponents } from "../_hooks/use-venue-stock-components";
import { QuantityField } from "./quantity-field";

type DraftComponent = { key: string; inventoryItemId: number | null; quantity: string };

export function ModifierComponentsDialog({
  orgId,
  modifierOptionId,
  optionName,
  open,
  onOpenChange,
}: {
  orgId: number;
  modifierOptionId: number | null;
  optionName?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data } = useVenueModifierComponents(orgId, modifierOptionId);
  const { data: itemsData } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });
  const setComponents = useSetModifierComponents(orgId, modifierOptionId ?? -1);
  const items = itemsData?.data ?? [];

  const [draft, setDraft] = useState<DraftComponent[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(
      data && data.components.length > 0
        ? data.components.map((c) => ({ key: String(c.id), inventoryItemId: c.inventoryItemId, quantity: c.quantityPerSelection }))
        : [{ key: "new-0", inventoryItemId: null, quantity: "" }],
    );
  }, [open, data]);

  const handleSave = () => {
    const valid = draft.filter((d) => d.inventoryItemId && Number(d.quantity) > 0);
    setComponents
      .mutateAsync(valid.map((d) => ({ inventoryItemId: d.inventoryItemId as number, quantityPerSelection: d.quantity })))
      .then(() => {
        toast.success("Consumo de estoque salvo.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Consumo de estoque {optionName ? `— ${optionName}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-black/50">
            Deixe sem itens vinculados para adicionais puramente descritivos (ex.: &quot;ao ponto&quot;), que não baixam estoque.
          </p>
          {draft.map((d, i) => {
            const item = items.find((it) => it.id === d.inventoryItemId);
            return (
              <div key={d.key} className="flex items-center gap-2">
                <Select
                  value={d.inventoryItemId ? String(d.inventoryItemId) : undefined}
                  onValueChange={(v) => setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, inventoryItemId: Number(v) } : x)))}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Item de estoque" /></SelectTrigger>
                  <SelectContent>
                    {items.map((it) => (
                      <SelectItem key={it.id} value={String(it.id)}>{it.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-32">
                  <QuantityField
                    value={d.quantity}
                    onChange={(v) => setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, quantity: v } : x)))}
                    suffix={item ? VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] : undefined}
                  />
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDraft((prev) => prev.filter((_, xi) => xi !== i))}>
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
          <Button size="sm" variant="outline" onClick={() => setDraft((prev) => [...prev, { key: `new-${prev.length}`, inventoryItemId: null, quantity: "" }])}>
            <Plus size={14} /> Adicionar item
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={setComponents.isPending}>Cancelar</Button>
          <Button disabled={setComponents.isPending} onClick={handleSave}>
            {setComponents.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
