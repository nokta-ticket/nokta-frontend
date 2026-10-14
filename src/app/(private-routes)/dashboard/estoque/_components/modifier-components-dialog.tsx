"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useSetModifierComponents, useVenueModifierComponents } from "../_hooks/use-venue-stock-components";
import { QuantityField } from "./quantity-field";
import { UNIT_SHORT } from "./stock-primitives";

type DraftComponent = { key: string; inventoryItemId: number | null; quantity: string };

/** Export público usado pelo cardápio (adicionais) — assinatura mantida. */
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
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Consumo de estoque{optionName ? ` · ${optionName}` : ""}</DialogTitle>
          <DialogDescription>Quanto sai do estoque cada vez que este adicional é escolhido. Deixe sem itens pra adicionais só descritivos (ex.: &quot;ao ponto&quot;).</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-3">
          {draft.map((d, i) => {
            const item = items.find((it) => it.id === d.inventoryItemId);
            return (
              <div key={d.key} className="flex items-center gap-2">
                <NativeSelect aria-label="Item de estoque" className="min-w-0 flex-1" value={d.inventoryItemId ? String(d.inventoryItemId) : ""} onChange={(e) => setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, inventoryItemId: e.target.value ? Number(e.target.value) : null } : x)))}>
                  <option value="">Item de estoque</option>
                  {items.map((it) => (
                    <option key={it.id} value={String(it.id)}>
                      {it.nome}
                    </option>
                  ))}
                </NativeSelect>
                <div className="w-32 shrink-0">
                  <QuantityField value={d.quantity} onChange={(v) => setDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, quantity: v } : x)))} suffix={item ? UNIT_SHORT[item.baseUnit] : undefined} />
                </div>
                <Button size="icon" variant="subtle" aria-label="Remover item" title="Remover" className="shrink-0 hover:bg-danger-bg hover:text-danger" onClick={() => setDraft((prev) => prev.filter((_, xi) => xi !== i))}>
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            );
          })}
          <div>
            <Button size="sm" variant="outline" leftIcon="plus" onClick={() => setDraft((prev) => [...prev, { key: `new-${prev.length}`, inventoryItemId: null, quantity: "" }])}>
              Adicionar item
            </Button>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={setComponents.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={setComponents.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
