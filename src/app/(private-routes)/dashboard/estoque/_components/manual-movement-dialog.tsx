"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useVenueStockItems } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockManualMovementMutations } from "../_hooks/use-venue-stock-movements";
import { QuantityField } from "./quantity-field";
import { UNIT_SHORT } from "./stock-primitives";

type Kind = "WASTE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

const KIND_LABEL: Record<Kind, string> = {
  WASTE: "Perda",
  ADJUSTMENT_IN: "Entrada",
  ADJUSTMENT_OUT: "Saída",
};

const KIND_HINT: Record<Kind, string> = {
  WASTE: "Quebra, vencimento, desperdício — sai do saldo e fica registrado como perda.",
  ADJUSTMENT_IN: "Corrige o saldo pra cima (ex.: garrafa encontrada, lançamento esquecido).",
  ADJUSTMENT_OUT: "Corrige o saldo pra baixo sem ser perda (ex.: contagem divergente).",
};

const KIND_CTA: Record<Kind, string> = {
  WASTE: "Registrar perda",
  ADJUSTMENT_IN: "Registrar entrada",
  ADJUSTMENT_OUT: "Registrar saída",
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
  const [itemId, setItemId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setKind("WASTE");
    setItemId("");
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
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Lançamento manual</DialogTitle>
          <DialogDescription>Perdas e ajustes que não passam por compra nem venda.</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Field label="Tipo" hint={KIND_HINT[kind]}>
            <SegmentedControl
              fullWidth
              value={kind}
              onChange={setKind}
              options={[
                { value: "WASTE", label: KIND_LABEL.WASTE, icon: "warning" },
                { value: "ADJUSTMENT_IN", label: KIND_LABEL.ADJUSTMENT_IN, icon: "arrow-up" },
                { value: "ADJUSTMENT_OUT", label: KIND_LABEL.ADJUSTMENT_OUT, icon: "arrow-down" },
              ]}
            />
          </Field>

          <Field label="Item" htmlFor="movement-item">
            <NativeSelect id="movement-item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Selecione o item</option>
              {items.map((i) => (
                <option key={i.id} value={String(i.id)}>
                  {i.nome}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <QuantityField id="movement-qty" label="Quantidade" value={quantity} onChange={setQuantity} suffix={item ? UNIT_SHORT[item.baseUnit] : undefined} />

          <Field label="Motivo" htmlFor="movement-reason" required>
            <Textarea id="movement-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="min-h-20" placeholder="Ex.: quebra no manuseio, contagem divergente, correção de lançamento" />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            {KIND_CTA[kind]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
