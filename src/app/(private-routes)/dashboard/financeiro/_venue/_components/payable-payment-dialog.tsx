"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_FINANCIAL_PAYMENT_METHOD_LABEL, type VenueFinancialPaymentMethod, type VenuePayable } from "@/services/venue-finance";
import { useVenueFinancePayableMutations } from "../_hooks/use-venue-finance-payables";
import { FIN_PAYMENT_METHODS, centsToInput, dateInputToIso, idempotencyKey, parseBRLToCents, todayInSaoPaulo } from "./finance-shared";

/** Registra um pagamento (total ou parcial) numa conta a pagar. */
export function PayablePaymentDialog({ orgId, payable, open, onOpenChange }: { orgId: number; payable: VenuePayable | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { registerPayment } = useVenueFinancePayableMutations(orgId);
  const remaining = payable ? payable.totalAmountCents - payable.paidAmountCents : 0;
  const [method, setMethod] = useState<VenueFinancialPaymentMethod>("PIX");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(todayInSaoPaulo());
  const [notes, setNotes] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !payable) return;
    setMethod("PIX");
    setAmount(centsToInput(payable.totalAmountCents - payable.paidAmountCents));
    setPaidAt(todayInSaoPaulo());
    setNotes("");
    setAmountError(null);
  }, [open, payable]);

  const cents = parseBRLToCents(amount);
  const afterPayment = cents === null ? null : remaining - cents;

  const handleSubmit = async () => {
    if (!payable) return;
    if (cents === null || cents <= 0) return setAmountError("Informe um valor maior que zero.");
    if (cents > remaining) return setAmountError(`No máximo ${formatBRLCents(remaining)} (saldo em aberto).`);
    setAmountError(null);
    try {
      await registerPayment.mutateAsync({
        payableId: payable.id,
        payload: {
          method,
          amountCents: cents,
          paidAt: paidAt === todayInSaoPaulo() ? new Date().toISOString() : dateInputToIso(paidAt),
          idempotencyKey: idempotencyKey(),
          notes: notes.trim() || undefined,
        },
      });
      toast.success(cents >= remaining ? "Conta quitada." : "Pagamento registrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível registrar o pagamento."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!registerPayment.isPending ? onOpenChange(v) : null)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>{payable ? `${payable.publicCode} · ${payable.description}` : ""}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {payable ? (
            <DetailGrid columns={3} className="grid-cols-3 sm:grid-cols-3 lg:grid-cols-3">
              <DetailItem label="Total" value={formatBRLCents(payable.totalAmountCents)} />
              <DetailItem label="Já pago" value={formatBRLCents(payable.paidAmountCents)} />
              <DetailItem label="Saldo">
                <span className="text-money-pending">{formatBRLCents(remaining)}</span>
              </DetailItem>
            </DetailGrid>
          ) : null}
          <form
            id="payable-payment-form"
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <FieldGroup columns={2}>
              <Field label="Método" htmlFor="payment-method" required>
                <NativeSelect id="payment-method" value={method} onChange={(e) => setMethod(e.target.value as VenueFinancialPaymentMethod)}>
                  {FIN_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[m]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Data" htmlFor="payment-date" required>
                <Input id="payment-date" type="date" value={paidAt} max={todayInSaoPaulo()} onChange={(e) => setPaidAt(e.target.value)} />
              </Field>
            </FieldGroup>
            <Field
              label="Valor"
              htmlFor="payment-amount"
              required
              error={amountError}
              hint={afterPayment === null ? undefined : afterPayment <= 0 ? "Quita a conta." : `Ficam ${formatBRLCents(afterPayment)} em aberto.`}
              action={
                cents !== remaining ? (
                  <button type="button" className="font-medium text-brand hover:underline" onClick={() => setAmount(centsToInput(remaining))}>
                    Pagar tudo
                  </button>
                ) : undefined
              }
            >
              <Input id="payment-amount" prefix="R$" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={Boolean(amountError) || undefined} autoFocus />
            </Field>
            <Field label="Observações" htmlFor="payment-notes" optional>
              <Textarea id="payment-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Comprovante, quem pagou…" className="min-h-20" />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={registerPayment.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="payable-payment-form" loading={registerPayment.isPending} leftIcon="check">
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
