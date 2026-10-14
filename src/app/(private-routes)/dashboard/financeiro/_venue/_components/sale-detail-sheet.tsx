"use client";

import { StatusBadge } from "@/components/ui/badge";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { ErrorState } from "@/components/ui/empty-state";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRLCents } from "@/lib/format";
import { VENUE_PAYMENT_METHOD_LABEL } from "@/services/venue-finance";
import { useVenueFinanceSaleDetail } from "../_hooks/use-venue-finance-sales";
import { Money, SummaryRow, formatDateTimeSP } from "./finance-shared";

/** Detalhe de uma venda: comanda, itens, totais, taxa estimada e margem. */
export function SaleDetailSheet({ orgId, paymentId, open, onOpenChange }: { orgId: number; paymentId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, isLoading, isError, refetch } = useVenueFinanceSaleDetail(orgId, paymentId);
  const payment = data?.payment;
  const tab = data?.tab;
  const snapshot = payment?.financialSnapshot ?? null;
  const marginPct = data && tab && tab.subtotalCents > 0 ? Math.round((data.marginCents / tab.subtotalCents) * 1000) / 10 : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2.5">
            <SheetTitle>{tab ? `Comanda ${tab.publicCode}` : "Venda"}</SheetTitle>
            {payment ? <StatusBadge tone={payment.status === "CONFIRMED" ? "success" : "neutral"}>{payment.status === "CONFIRMED" ? "Confirmada" : "Cancelada"}</StatusBadge> : null}
          </div>
          <SheetDescription>{payment ? `${tab?.customerName ?? "Sem nome"} · ${formatDateTimeSP(payment.confirmedAt)}` : "Carregando a venda…"}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {isError ? (
            <ErrorState description="Não foi possível carregar a venda." onRetry={() => refetch()} />
          ) : isLoading || !data || !payment || !tab ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <DetailGrid columns={2} className="grid-cols-2">
                <DetailItem label="Método" value={VENUE_PAYMENT_METHOD_LABEL[payment.method] ?? payment.method} />
                <DetailItem label="Valor pago" value={formatBRLCents(payment.amountCents)} />
                {payment.method === "CASH" ? <DetailItem label="Recebido" value={payment.receivedCents === null ? null : formatBRLCents(payment.receivedCents)} /> : null}
                {payment.method === "CASH" ? <DetailItem label="Troco" value={formatBRLCents(payment.changeCents)} /> : null}
                <DetailItem label="Referência" value={payment.externalReference} mono />
                <DetailItem label="Mesa" value={tab.id && payment.tab.tableId !== null ? `Mesa ${payment.tab.tableId}` : null} />
              </DetailGrid>

              <SheetSection title={`Itens da comanda (${tab.items.length})`}>
                {tab.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {tab.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="tnum mr-1.5 text-muted-foreground">{item.quantity}×</span>
                            {item.productNameSnapshot}
                          </p>
                          {item.variantNameSnapshot ? <p className="text-caption text-muted-foreground">{item.variantNameSnapshot}</p> : null}
                        </div>
                        <span className="tnum shrink-0 text-sm text-foreground">{formatBRLCents(item.lineTotalCents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SheetSection>

              <SheetSection title="Totais">
                <SummaryRow label="Subtotal">{formatBRLCents(tab.subtotalCents)}</SummaryRow>
                {tab.discountCents > 0 ? (
                  <SummaryRow label="Desconto">
                    <Money cents={-tab.discountCents} />
                  </SummaryRow>
                ) : null}
                {tab.serviceChargeCents > 0 ? <SummaryRow label="Taxa de serviço">{formatBRLCents(tab.serviceChargeCents)}</SummaryRow> : null}
                <SummaryRow label="Total da comanda" strong>
                  {formatBRLCents(tab.totalCents)}
                </SummaryRow>
                {tab.payments.length > 1 ? <p className="mt-2 text-caption text-muted-foreground">Comanda paga em {tab.payments.length} pagamentos — este é um deles.</p> : null}
              </SheetSection>

              <SheetSection title="Taxa e margem">
                <SummaryRow label="Bruto deste pagamento">{formatBRLCents(snapshot?.grossAmountCents ?? payment.amountCents)}</SummaryRow>
                <SummaryRow label="Taxa estimada">
                  <Money cents={-(snapshot?.estimatedFeeCents ?? 0)} tone={snapshot?.estimatedFeeCents ? "out" : "muted"} />
                </SummaryRow>
                <SummaryRow label="Líquido estimado" strong>
                  {snapshot ? formatBRLCents(snapshot.estimatedNetCents) : "Não calculado"}
                </SummaryRow>
                {snapshot?.expectedSettlementAt ? <p className="mt-2 text-caption text-muted-foreground">Previsão de liquidação: {formatDateTimeSP(snapshot.expectedSettlementAt).split(" · ")[0]}</p> : null}
                <div className="mt-3 border-t border-border pt-3">
                  <SummaryRow label="CMV dos itens">
                    <Money cents={-data.cmvCents} tone={data.cmvCents ? "out" : "muted"} />
                  </SummaryRow>
                  <SummaryRow label={marginPct === null ? "Margem bruta" : `Margem bruta · ${marginPct.toLocaleString("pt-BR")}%`} strong>
                    <Money cents={data.marginCents} />
                  </SummaryRow>
                </div>
              </SheetSection>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
