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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatCentsBRL, VENUE_PAYMENT_METHOD_LABEL, type VenuePaymentReconciliation } from "@/services/venue-finance";
import { useSetVenueFinanceReconciliation } from "../_hooks/use-venue-finance-reconciliation";
import { MoneyField } from "../../cardapio/_components/money-field";

export function ReconciliationFormDialog({
  orgId,
  locationId,
  row,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  row: VenuePaymentReconciliation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const setReconciliation = useSetVenueFinanceReconciliation(orgId, locationId);
  const [actualNetCents, setActualNetCents] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !row) return;
    setActualNetCents(row.actualNetCents ?? row.expectedNetCents);
    setNotes(row.notes ?? "");
  }, [open, row]);

  if (!row) return null;

  const handleSubmit = () => {
    setReconciliation
      .mutateAsync({ date: row.date, method: row.method, actualNetCents, notes: notes.trim() || undefined })
      .then(() => {
        toast.success("Conciliação registrada.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível registrar a conciliação.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conciliar {VENUE_PAYMENT_METHOD_LABEL[row.method]} — {new Date(`${row.date}T12:00:00`).toLocaleDateString("pt-BR")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-black/10 p-3 text-sm">
            <div className="flex justify-between"><span className="text-black/60">Bruto esperado</span><span>{formatCentsBRL(row.expectedGrossCents)}</span></div>
            <div className="flex justify-between"><span className="text-black/60">Taxa esperada</span><span>{formatCentsBRL(row.expectedFeeCents)}</span></div>
            <div className="flex justify-between font-medium"><span>Líquido esperado</span><span>{formatCentsBRL(row.expectedNetCents)}</span></div>
          </div>
          <MoneyField label="Valor realmente recebido (líquido)" cents={actualNetCents} onChange={setActualNetCents} />
          <div className="space-y-2">
            <Label htmlFor="reconciliation-notes">Observação (opcional)</Label>
            <Textarea id="reconciliation-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={setReconciliation.isPending}>Cancelar</Button>
          <Button disabled={setReconciliation.isPending} onClick={handleSubmit}>
            {setReconciliation.isPending ? "Salvando…" : "Conciliar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
