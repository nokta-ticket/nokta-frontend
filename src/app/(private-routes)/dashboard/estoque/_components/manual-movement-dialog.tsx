"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_INVENTORY_UNIT_LABEL } from "@/services/venue-stock";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockManualMovementMutations } from "../_hooks/use-venue-stock-movements";
import { QuantityField } from "./quantity-field";

type Kind = "WASTE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

const KIND_LABEL: Record<Kind, string> = {
  WASTE: "Registrar perda",
  ADJUSTMENT_IN: "Ajuste de entrada",
  ADJUSTMENT_OUT: "Ajuste de saída",
};

export function ManualMovementDialog({
  orgId,
  locationId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data } = useVenueStockItems(orgId, { status: "ACTIVE", limit: 200 });
  const items = data?.data ?? [];
  const { registerWaste, registerAdjustmentIn, registerAdjustmentOut } = useVenueStockManualMovementMutations(orgId, locationId);

  const [kind, setKind] = useState<Kind>("WASTE");
  const [itemId, setItemId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setKind("WASTE");
    setItemId(undefined);
    setQuantity("");
    setReason("");
  }, [open]);

  const item = items.find((i) => String(i.id) === itemId);
  const mutation = kind === "WASTE" ? registerWaste : kind === "ADJUSTMENT_IN" ? registerAdjustmentIn : registerAdjustmentOut;

  const handleSubmit = () => {
    if (!itemId) {
      toast.error("Selecione o item.");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Informe uma quantidade maior que zero.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Informe o motivo.");
      return;
    }
    mutation
      .mutateAsync({ itemId: Number(itemId), payload: { quantity, reason: reason.trim() } })
      .then(() => {
        toast.success("Movimentação registrada.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível registrar a movimentação.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançamento manual</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <QuantityField
            label={`Quantidade${item ? ` (${VENUE_INVENTORY_UNIT_LABEL[item.baseUnit]})` : ""}`}
            value={quantity}
            onChange={setQuantity}
          />
          <div className="space-y-2">
            <Label htmlFor="movement-reason">Motivo</Label>
            <Textarea id="movement-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex.: quebra no manuseio, contagem divergente, correção de lançamento" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button disabled={mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? "Registrando…" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
