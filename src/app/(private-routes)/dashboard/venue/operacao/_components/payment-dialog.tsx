"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { centsToBRL, centsToInputValue, inputValueToCents } from "@/services/venue-menu";
import {
  VENUE_PAYMENT_METHOD_LABEL,
  newIdempotencyKey,
  type VenuePaymentMethod,
} from "@/services/venue-operation";
import { useVenuePaymentMutations } from "../_hooks/use-venue-payments";
import { MoneyField } from "../../cardapio/_components/money-field";

export function PaymentDialog({
  orgId,
  tabId,
  remainingCents,
  open,
  onOpenChange,
}: {
  orgId: number;
  tabId: number;
  remainingCents: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { create } = useVenuePaymentMutations(orgId, tabId);
  const [method, setMethod] = useState<VenuePaymentMethod>("CASH");
  const [amountCents, setAmountCents] = useState(remainingCents);
  const [receivedText, setReceivedText] = useState(centsToInputValue(remainingCents));

  const receivedCents = method === "CASH" ? inputValueToCents(receivedText) : undefined;
  const changeCents = method === "CASH" && receivedCents ? Math.max(0, receivedCents - amountCents) : 0;

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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setMethod("CASH");
          setAmountCents(remainingCents);
          setReceivedText(centsToInputValue(remainingCents));
        }
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-black/60">
            Saldo restante: <span className="font-semibold text-gray-900">{centsToBRL(remainingCents)}</span>
          </p>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as VenuePaymentMethod)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VENUE_PAYMENT_METHOD_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MoneyField label="Valor deste pagamento" cents={amountCents} onChange={setAmountCents} />

          {method === "CASH" ? (
            <div className="space-y-2">
              <Label htmlFor="valor-recebido">Valor recebido do cliente</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-black/50">R$</span>
                <input
                  id="valor-recebido"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-xs outline-none"
                  value={receivedText}
                  onChange={(e) => setReceivedText(e.target.value)}
                />
              </div>
              <p className="text-sm text-emerald-600">Troco: {centsToBRL(changeCents)}</p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button disabled={create.isPending || amountCents <= 0} onClick={handleSubmit}>
            {create.isPending ? "Registrando…" : "Registrar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
