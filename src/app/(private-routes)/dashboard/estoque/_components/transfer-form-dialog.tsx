"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockTransferMutations } from "../_hooks/use-venue-stock-movements";
import { QuantityField } from "./quantity-field";
import { UNIT_SHORT } from "./stock-primitives";

type DraftLine = { key: string; inventoryItemId: number | null; quantity: string };

function emptyLine(): DraftLine {
  return { key: Math.random().toString(36).slice(2), inventoryItemId: null, quantity: "" };
}

export function TransferFormDialog({
  orgId,
  locations,
  defaultFromLocationId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locations: VenueLocation[];
  defaultFromLocationId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });
  const items = data?.data ?? [];
  const { create } = useVenueStockTransferMutations(orgId);

  const [fromLocationId, setFromLocationId] = useState(String(defaultFromLocationId));
  const [toLocationId, setToLocationId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  useEffect(() => {
    if (!open) return;
    setFromLocationId(String(defaultFromLocationId));
    setToLocationId("");
    setNotes("");
    setLines([emptyLine()]);
  }, [open, defaultFromLocationId]);

  const updateLine = (key: string, patch: Partial<DraftLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handleSubmit = () => {
    if (!toLocationId || toLocationId === fromLocationId) {
      toast.error("Selecione a unidade de destino (diferente da origem).");
      return;
    }
    if (lines.some((l) => !l.inventoryItemId || !l.quantity)) {
      toast.error("Preencha item e quantidade em todas as linhas.");
      return;
    }

    create
      .mutateAsync({
        fromLocationId: Number(fromLocationId),
        toLocationId: Number(toLocationId),
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({ inventoryItemId: l.inventoryItemId as number, quantity: l.quantity })),
      })
      .then(() => {
        toast.success("Transferência criada como rascunho.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível criar a transferência.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nova transferência</DialogTitle>
          <DialogDescription>Move saldo entre unidades. Sai da origem ao enviar e entra no destino ao receber.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <FieldGroup columns={2}>
            <Field label="Origem" htmlFor="transfer-from">
              <NativeSelect id="transfer-from" value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)}>
                {locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.nome}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Destino" htmlFor="transfer-to">
              <NativeSelect id="transfer-to" value={toLocationId} onChange={(e) => setToLocationId(e.target.value)}>
                <option value="">Selecione</option>
                {locations
                  .filter((l) => String(l.id) !== fromLocationId)
                  .map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.nome}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          </FieldGroup>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-foreground">Itens</h4>
              <Button size="sm" variant="outline" leftIcon="plus" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                Adicionar item
              </Button>
            </div>
            {lines.map((l) => {
              const item = items.find((i) => i.id === l.inventoryItemId);
              return (
                <div key={l.key} className="flex items-center gap-2">
                  <NativeSelect aria-label="Item" className="min-w-0 flex-1" value={l.inventoryItemId ? String(l.inventoryItemId) : ""} onChange={(e) => updateLine(l.key, { inventoryItemId: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Item</option>
                    {items.map((i) => (
                      <option key={i.id} value={String(i.id)}>
                        {i.nome}
                      </option>
                    ))}
                  </NativeSelect>
                  <div className="w-32 shrink-0">
                    <QuantityField value={l.quantity} onChange={(v) => updateLine(l.key, { quantity: v })} suffix={item ? UNIT_SHORT[item.baseUnit] : undefined} />
                  </div>
                  <Button
                    size="icon"
                    variant="subtle"
                    aria-label="Remover linha"
                    title={lines.length === 1 ? "A transferência precisa de ao menos um item" : "Remover linha"}
                    className="shrink-0 hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                </div>
              );
            })}
          </section>

          <Field label="Observações" htmlFor="transfer-notes" optional>
            <Textarea id="transfer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="min-h-20" placeholder="Ex.: gelo pro evento de sábado" />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={create.isPending} leftIcon="save">
            Salvar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
