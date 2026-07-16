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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatCentsBRL, VENUE_FINANCIAL_PAYMENT_METHOD_LABEL, type VenueFinancialPaymentMethod, type VenuePayable } from "@/services/venue-finance";
import { useVenueFinancePayableMutations } from "../_hooks/use-venue-finance-payables";
import { useVenueCashSessions } from "../../operacao/_hooks/use-venue-cash";
import { MoneyField } from "../../cardapio/_components/money-field";

export function RegisterPayablePaymentDialog({
  orgId,
  payable,
  open,
  onOpenChange,
}: {
  orgId: number;
  payable: VenuePayable | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { registerPayment } = useVenueFinancePayableMutations(orgId);
  const remaining = payable ? payable.totalAmountCents - payable.paidAmountCents : 0;

  const [amountCents, setAmountCents] = useState(0);
  const [method, setMethod] = useState<VenueFinancialPaymentMethod>("CASH");
  const [cashSessionId, setCashSessionId] = useState<string | undefined>(undefined);
  const [externalReference, setExternalReference] = useState("");

  const { data: cashSessions } = useVenueCashSessions(orgId, payable?.locationId ?? null);
  const openSessions = (cashSessions ?? []).filter((s) => s.status === "OPEN");

  useEffect(() => {
    if (!open || !payable) return;
    setAmountCents(payable.totalAmountCents - payable.paidAmountCents);
    setMethod("CASH");
    setCashSessionId(undefined);
    setExternalReference("");
  }, [open, payable]);

  if (!payable) return null;

  const handleSubmit = () => {
    if (amountCents <= 0 || amountCents > remaining) {
      toast.error("O valor precisa ser maior que zero e não pode ultrapassar o saldo pendente.");
      return;
    }
    if (method === "CASH" && !cashSessionId) {
      toast.error("Selecione o caixa aberto.");
      return;
    }
    registerPayment
      .mutateAsync({
        payableId: payable.id,
        payload: {
          method,
          amountCents,
          cashSessionId: method === "CASH" ? Number(cashSessionId) : undefined,
          externalReference: externalReference.trim() || undefined,
          idempotencyKey: `payable-payment:${payable.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        },
      })
      .then(() => {
        toast.success("Pagamento registrado.");
        onOpenChange(false);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível registrar o pagamento.")));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento — {payable.publicCode}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-black/60">Saldo pendente: <span className="font-medium text-black">{formatCentsBRL(remaining)}</span></p>
          <MoneyField label="Valor do pagamento" cents={amountCents} onChange={setAmountCents} />
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as VenueFinancialPaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(VENUE_FINANCIAL_PAYMENT_METHOD_LABEL) as VenueFinancialPaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {method === "CASH" ? (
            <div className="space-y-2">
              <Label>Caixa</Label>
              <Select value={cashSessionId} onValueChange={setCashSessionId}>
                <SelectTrigger><SelectValue placeholder={openSessions.length ? "Selecione o caixa aberto" : "Nenhum caixa aberto nesta unidade"} /></SelectTrigger>
                <SelectContent>
                  {openSessions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>Caixa #{s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="payment-ref">Referência (opcional)</Label>
              <Input id="payment-ref" value={externalReference} onChange={(e) => setExternalReference(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={registerPayment.isPending}>Cancelar</Button>
          <Button disabled={registerPayment.isPending} onClick={handleSubmit}>
            {registerPayment.isPending ? "Registrando…" : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
