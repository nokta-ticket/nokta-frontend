"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { VENUE_PAYMENT_METHOD_LABEL, newIdempotencyKey, type VenuePaymentMethod } from "@/services/venue-operation";
import { useVenuePaymentMutations } from "../_hooks/use-venue-payments";
import { MoneyInput } from "./money-input";

export const PAYMENT_METHOD_ICON: Record<VenuePaymentMethod, IconName> = {
  CASH: "money",
  PIX: "pix",
  DEBIT_CARD: "credit-card",
  CREDIT_CARD: "credit-card",
  VOUCHER: "ticket",
  OTHER: "ellipsis",
};

const METHODS = Object.keys(VENUE_PAYMENT_METHOD_LABEL) as VenuePaymentMethod[];

export function PaymentDialog({ orgId, tabId, remainingCents, open, onOpenChange }: { orgId: number; tabId: number; remainingCents: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { create } = useVenuePaymentMutations(orgId, tabId);
  const [method, setMethod] = useState<VenuePaymentMethod>("CASH");
  const [amountCents, setAmountCents] = useState(remainingCents);
  const [receivedCents, setReceivedCents] = useState(remainingCents);

  const changeCents = method === "CASH" ? Math.max(0, receivedCents - amountCents) : 0;
  const partial = amountCents > 0 && amountCents < remainingCents;

  // Radix só chama onOpenChange em fechamentos internos — abrir é mudança
  // de prop externa, então o reset reage a `open`.
  useEffect(() => {
    if (open) {
      setMethod("CASH");
      setAmountCents(remainingCents);
      setReceivedCents(remainingCents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = () => {
    if (amountCents <= 0) {
      toast.error("Informe um valor de pagamento.");
      return;
    }
    if (amountCents > remainingCents) {
      toast.error("O valor não pode ultrapassar o saldo restante.");
      return;
    }
    create.mutate(
      {
        method,
        amountCents,
        receivedCents: method === "CASH" ? receivedCents : undefined,
        idempotencyKey: newIdempotencyKey(),
      },
      {
        onSuccess: () => {
          toast.success("Pagamento registrado.");
          onOpenChange(false);
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível registrar o pagamento.")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Receber pagamento</DialogTitle>
          <DialogDescription>
            Saldo restante <span className="font-semibold text-foreground tnum">{formatBRLCents(remainingCents)}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Forma de pagamento">
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const active = m === method;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "press flex h-16 flex-col items-center justify-center gap-1.5 rounded-xl border text-caption font-semibold transition-colors",
                      active ? "border-transparent bg-brand-soft text-brand ring-2 ring-brand" : "border-border bg-surface-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground",
                    )}
                  >
                    <Icon name={PAYMENT_METHOD_ICON[m]} size={18} />
                    {VENUE_PAYMENT_METHOD_LABEL[m]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Valor deste pagamento" htmlFor="pay-amount" hint={partial ? `Pagamento parcial — ficam ${formatBRLCents(remainingCents - amountCents)} em aberto.` : undefined}>
            <MoneyInput id="pay-amount" cents={amountCents} onChange={setAmountCents} />
          </Field>

          {method === "CASH" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recebido do cliente" htmlFor="pay-received">
                <MoneyInput id="pay-received" cents={receivedCents} onChange={setReceivedCents} />
              </Field>
              <div className="surface-inset flex flex-col justify-center rounded-xl px-4 py-3">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Troco</p>
                <p className={cn("mt-1 text-stat font-medium tnum", changeCents > 0 ? "text-money-in" : "text-foreground")}>{formatBRLCents(changeCents)}</p>
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button size="lg" onClick={handleSubmit} loading={create.isPending} disabled={amountCents <= 0} leftIcon="check">
            Registrar {formatBRLCents(amountCents)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
