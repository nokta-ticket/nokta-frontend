"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatCentsBRL, VENUE_FINANCIAL_PAYMENT_METHOD_LABEL, VENUE_PAYABLE_STATUS_LABEL, type VenuePayable } from "@/services/venue-finance";
import { useVenueFinancePayableMutations, useVenueFinancePayablePayments } from "../_hooks/use-venue-finance-payables";
import { RegisterPayablePaymentDialog } from "./register-payable-payment-dialog";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";
import { ConfirmDialog } from "../../../cardapio/_components/confirm-dialog";
import { CancelWithReasonDialog } from "../../../reservas/_components/cancel-with-reason-dialog";
import { TableSkeleton } from "../../../_components/states/loading-state";

function statusTone(status: VenuePayable["status"]) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE" || status === "CANCELED") return "danger" as const;
  if (status === "PARTIALLY_PAID") return "warning" as const;
  return "neutral" as const;
}

export function PayableDetailSheet({ orgId, payable, open, onOpenChange }: { orgId: number; payable: VenuePayable | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: payments, isLoading } = useVenueFinancePayablePayments(orgId, payable?.id ?? null);
  const { cancel, cancelPayment } = useVenueFinancePayableMutations(orgId);
  const [payOpen, setPayOpen] = useState(false);
  const [cancelPayableOpen, setCancelPayableOpen] = useState(false);
  const [cancelPaymentId, setCancelPaymentId] = useState<number | null>(null);

  if (!payable) return null;

  const remaining = payable.totalAmountCents - payable.paidAmountCents;
  const canPay = payable.status !== "PAID" && payable.status !== "CANCELED";
  const canCancel = payable.status !== "PAID" && payable.status !== "CANCELED" && payable.paidAmountCents === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {payable.publicCode}
            <GenericStatusBadge label={VENUE_PAYABLE_STATUS_LABEL[payable.status]} tone={statusTone(payable.status)} />
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div className="rounded-lg border border-black/10 p-3 text-sm">
            <div className="flex justify-between"><span className="text-black/60">Descrição</span><span>{payable.description}</span></div>
            <div className="flex justify-between"><span className="text-black/60">Categoria</span><span>{payable.category.nome}</span></div>
            {payable.supplier ? <div className="flex justify-between"><span className="text-black/60">Fornecedor</span><span>{payable.supplier.nome}</span></div> : null}
            {payable.purchase ? <div className="flex justify-between"><span className="text-black/60">Origem</span><span>Compra {payable.purchase.publicCode}</span></div> : null}
            <div className="flex justify-between"><span className="text-black/60">Total</span><span>{formatCentsBRL(payable.totalAmountCents)}</span></div>
            <div className="flex justify-between"><span className="text-black/60">Pago</span><span>{formatCentsBRL(payable.paidAmountCents)}</span></div>
            <div className="flex justify-between font-medium"><span>Restante</span><span>{formatCentsBRL(remaining)}</span></div>
            {payable.dueAt ? <div className="flex justify-between"><span className="text-black/60">Vencimento</span><span>{new Date(payable.dueAt).toLocaleDateString("pt-BR")}</span></div> : null}
          </div>

          {canPay ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPayOpen(true)}>Registrar pagamento</Button>
              {canCancel ? (
                <Button size="sm" variant="ghost" onClick={() => setCancelPayableOpen(true)}>Cancelar conta</Button>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-black/60">Pagamentos</h3>
            {isLoading ? (
              <TableSkeleton rows={2} />
            ) : (payments ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Nenhum pagamento registrado ainda.</p>
            ) : (
              (payments ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-black/10 p-2 text-sm">
                  <div>
                    <p className={p.canceledAt ? "text-black/40 line-through" : ""}>{VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[p.method]} · {formatCentsBRL(p.amountCents)}</p>
                    <p className="text-xs text-black/50">{new Date(p.paidAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {!p.canceledAt ? (
                    <Button size="sm" variant="ghost" onClick={() => setCancelPaymentId(p.id)}>Estornar</Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <RegisterPayablePaymentDialog orgId={orgId} payable={payable} open={payOpen} onOpenChange={setPayOpen} />

        <ConfirmDialog
          open={cancelPayableOpen}
          onOpenChange={setCancelPayableOpen}
          title="Cancelar conta"
          description="Contas canceladas não entram nos relatórios financeiros."
          confirmLabel="Cancelar conta"
          loading={cancel.isPending}
          onConfirm={() =>
            cancel.mutate(
              { payableId: payable.id },
              {
                onSuccess: () => { toast.success("Conta cancelada."); setCancelPayableOpen(false); onOpenChange(false); },
                onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
              },
            )
          }
        />

        <CancelWithReasonDialog
          open={cancelPaymentId !== null}
          onOpenChange={(v) => !v && setCancelPaymentId(null)}
          title="Estornar pagamento — se foi em dinheiro, um movimento inverso será criado no caixa (o original nunca é apagado)"
          loading={cancelPayment.isPending}
          onConfirm={(reason) =>
            cancelPaymentId &&
            cancelPayment.mutate(
              { paymentId: cancelPaymentId, reason },
              {
                onSuccess: () => { toast.success("Pagamento estornado."); setCancelPaymentId(null); },
                onError: (err) => toast.error(getErrorMessage(err, "Não foi possível estornar.")),
              },
            )
          }
        />
      </SheetContent>
    </Sheet>
  );
}
