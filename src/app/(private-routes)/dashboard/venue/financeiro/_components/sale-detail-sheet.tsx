"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCentsBRL, VENUE_PAYMENT_METHOD_LABEL } from "@/services/venue-finance";
import { useVenueFinanceSaleDetail } from "../_hooks/use-venue-finance-sales";
import { BlockSkeleton } from "../../../_components/states/loading-state";

export function SaleDetailSheet({ orgId, paymentId, open, onOpenChange }: { orgId: number; paymentId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, isLoading } = useVenueFinanceSaleDetail(orgId, paymentId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Venda {data?.tab.publicCode ?? ""}</SheetTitle>
        </SheetHeader>
        {isLoading || !data ? (
          <div className="px-4"><BlockSkeleton className="h-96" /></div>
        ) : (
          <div className="space-y-4 px-4 pb-6">
            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex justify-between"><span className="text-black/60">Cliente/Mesa</span><span>{data.tab.customerName ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-black/60">Desconto</span><span>{formatCentsBRL(data.tab.discountCents)}</span></div>
              <div className="flex justify-between"><span className="text-black/60">Taxa de serviço</span><span>{formatCentsBRL(data.tab.serviceChargeCents)}</span></div>
              <div className="flex justify-between font-medium"><span>Total da comanda</span><span>{formatCentsBRL(data.tab.totalCents)}</span></div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-black/60">Itens</h3>
              {data.tab.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.productNameSnapshot} — {item.variantNameSnapshot}</span>
                  <span>{formatCentsBRL(item.lineTotalCents)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-black/60">Pagamentos</h3>
              {data.tab.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{VENUE_PAYMENT_METHOD_LABEL[p.method]} {p.status === "CANCELED" ? "(cancelado)" : ""}</span>
                  <span>{formatCentsBRL(p.amountCents)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-black/10 p-3 text-sm">
              <div className="flex justify-between"><span className="text-black/60">Taxa estimada</span><span>{formatCentsBRL(data.payment.financialSnapshot?.estimatedFeeCents ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-black/60">Valor líquido estimado</span><span>{formatCentsBRL(data.payment.financialSnapshot?.estimatedNetCents ?? data.payment.amountCents)}</span></div>
              <div className="flex justify-between"><span className="text-black/60">CMV</span><span>{formatCentsBRL(data.cmvCents)}</span></div>
              <div className="flex justify-between font-medium"><span>Margem estimada</span><span>{formatCentsBRL(data.marginCents)}</span></div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
