"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { VenueLocation } from "@/services/venue-operation";
import { VENUE_INVENTORY_UNIT_LABEL } from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockTransferMutations } from "../_hooks/use-venue-stock-movements";
import { QuantityField } from "./quantity-field";

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
  const [toLocationId, setToLocationId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  useEffect(() => {
    if (!open) return;
    setFromLocationId(String(defaultFromLocationId));
    setToLocationId(undefined);
    setNotes("");
    setLines([emptyLine()]);
  }, [open, defaultFromLocationId]);

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova transferência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={fromLocationId} onValueChange={setFromLocationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={toLocationId} onValueChange={setToLocationId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {locations.filter((l) => String(l.id) !== fromLocationId).map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Itens</Label>
              <Button size="sm" variant="outline" onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                <Plus size={14} /> Adicionar item
              </Button>
            </div>
            {lines.map((l) => {
              const item = items.find((i) => i.id === l.inventoryItemId);
              return (
                <div key={l.key} className="flex items-center gap-2">
                  <Select
                    value={l.inventoryItemId ? String(l.inventoryItemId) : undefined}
                    onValueChange={(v) => updateLine(l.key, { inventoryItemId: Number(v) })}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Item" /></SelectTrigger>
                    <SelectContent>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="w-36">
                    <QuantityField
                      value={l.quantity}
                      onChange={(v) => updateLine(l.key, { quantity: v })}
                      suffix={item ? VENUE_INVENTORY_UNIT_LABEL[item.baseUnit] : undefined}
                    />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} disabled={lines.length === 1}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Observações (opcional)</Label>
            <Textarea id="transfer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancelar</Button>
          <Button disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? "Salvando…" : "Salvar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
