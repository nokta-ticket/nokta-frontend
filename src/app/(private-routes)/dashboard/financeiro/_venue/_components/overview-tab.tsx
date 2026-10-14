"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { VENUE_PAYMENT_METHOD_LABEL, type VenueCashSessionReportQueryParams, type VenueFinancePeriodParams } from "@/services/venue-finance";
import { useVenueFinanceCashSessions } from "../_hooks/use-venue-finance-cash-reports";
import { useVenueFinanceExpensesByCategory, useVenueFinancePaymentMethods, useVenueFinanceTimeline } from "../_hooks/use-venue-finance-overview";
import { CashDifference, METHOD_ICON, ShareBar, formatDateTimeSP, formatTimeSP, type CashSessionRow } from "./finance-shared";
import { VenueTimelineChart } from "./venue-timeline-chart";

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Visão geral: linha do tempo, como pagaram, despesas por categoria e os
 * últimos fechamentos de caixa do período.
 */
export function OverviewTab({ orgId, locationId, params, days, periodLabel, sessionRange, onOpenCashTab, onOpenSession }: { orgId: number; locationId: number; params: VenueFinancePeriodParams; days: string[]; periodLabel: string; sessionRange: VenueCashSessionReportQueryParams; onOpenCashTab: () => void; onOpenSession: (id: number) => void }) {
  const timeline = useVenueFinanceTimeline(orgId, locationId, params);
  const methods = useVenueFinancePaymentMethods(orgId, locationId, params);
  const expenses = useVenueFinanceExpensesByCategory(orgId, locationId, params);
  const sessions = useVenueFinanceCashSessions(orgId, locationId, sessionRange);

  const methodRows = (methods.data ?? []).filter((m) => m.grossCents > 0).sort((a, b) => b.grossCents - a.grossCents);
  const methodTotal = methodRows.reduce((s, m) => s + m.grossCents, 0);
  const methodCount = methodRows.reduce((s, m) => s + m.count, 0);
  const feeTotal = methodRows.reduce((s, m) => s + m.feeCents, 0);

  const expenseRows = (expenses.data ?? []).filter((e) => e.amountCents > 0);
  const expenseTotal = expenseRows.reduce((s, e) => s + e.amountCents, 0);

  const sessionRows = ((sessions.data ?? []) as CashSessionRow[]).slice(0, 5);
  const label = periodLabel.toLowerCase();

  return (
    <div className="space-y-5">
      <VenueTimelineChart data={timeline.data} isLoading={timeline.isLoading} isFetching={timeline.isFetching} isError={timeline.isError} onRetry={() => timeline.refetch()} zeroDates={days} periodLabel={periodLabel} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Como pagaram</CardTitle>
              <CardDescription>{methodRows.length ? `${methodCount.toLocaleString("pt-BR")} pagamentos · taxas estimadas ${formatBRLCents(feeTotal)}` : `Nenhum pagamento em ${label}`}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {methods.isLoading ? (
              <ListSkeleton />
            ) : methods.isError ? (
              <ErrorState description="Não foi possível carregar os métodos." onRetry={() => methods.refetch()} className="py-6" />
            ) : methodRows.length === 0 ? (
              <EmptyState compact icon="credit-card" title="Nada recebido ainda" description="Os métodos de pagamento aparecem aqui conforme as comandas fecham." />
            ) : (
              <ul className="space-y-3.5">
                {methodRows.map((m) => {
                  const ratio = methodTotal ? m.grossCents / methodTotal : 0;
                  return (
                    <li key={m.method} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-foreground">
                          <Icon name={METHOD_ICON[m.method]} size={13} className="text-muted-foreground" fw />
                          <span className="truncate">{VENUE_PAYMENT_METHOD_LABEL[m.method] ?? m.method}</span>
                          <span className="tnum text-caption text-subtle-foreground">{m.count}</span>
                        </span>
                        <span className="tnum flex shrink-0 items-baseline gap-2.5">
                          <span className="text-caption text-muted-foreground">{Math.round(ratio * 100)}%</span>
                          <span className="font-semibold text-foreground">{formatBRLCents(m.grossCents)}</span>
                        </span>
                      </div>
                      <ShareBar ratio={ratio} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Despesas por categoria</CardTitle>
              <CardDescription>{expenseRows.length ? `${formatBRLCents(expenseTotal)} em ${label}` : `Nenhuma despesa lançada em ${label}`}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.isLoading ? (
              <ListSkeleton />
            ) : expenses.isError ? (
              <ErrorState description="Não foi possível carregar as despesas." onRetry={() => expenses.refetch()} className="py-6" />
            ) : expenseRows.length === 0 ? (
              <EmptyState compact icon="receipt" title="Sem despesas no período" description="Lance contas a pagar para acompanhar pra onde o dinheiro vai." />
            ) : (
              <ul className="space-y-3.5">
                {expenseRows.map((e) => {
                  const ratio = expenseTotal ? e.amountCents / expenseTotal : 0;
                  return (
                    <li key={e.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-foreground">{e.nome}</span>
                        <span className="tnum flex shrink-0 items-baseline gap-2.5">
                          <span className="text-caption text-muted-foreground">{Math.round(ratio * 100)}%</span>
                          <span className="font-semibold text-foreground">{formatBRLCents(e.amountCents)}</span>
                        </span>
                      </div>
                      <ShareBar ratio={ratio} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Fechamentos de caixa</CardTitle>
            <CardDescription>O contado na gaveta contra o que o sistema esperava.</CardDescription>
          </div>
          <CardAction>
            <Button variant="subtle" size="sm" rightIcon="chevron-right" onClick={onOpenCashTab}>
              Ver todos
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="pt-3">
          {sessions.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : sessions.isError ? (
            <ErrorState description="Não foi possível carregar os fechamentos." onRetry={() => sessions.refetch()} className="py-6" />
          ) : sessionRows.length === 0 ? (
            <EmptyState compact icon="wallet" title="Nenhum caixa no período" description="Quando um caixa for aberto na operação, o fechamento aparece aqui." />
          ) : (
            <ul className="divide-y divide-border">
              {sessionRows.map((s, i) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onOpenSession(s.id)} className={cn("row-in press flex w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-left transition-colors hover:bg-surface-2/70")} style={{ ["--i" as string]: i } as never}>
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2", s.status === "OPEN" ? "text-warning" : "text-muted-foreground")}>
                        <Icon name="wallet" size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {s.cashRegister.nome}
                          {s.operatorName ? <span className="font-normal text-muted-foreground"> · {s.operatorName}</span> : null}
                        </span>
                        <span className="tnum block text-caption text-muted-foreground">
                          {formatDateTimeSP(s.openedAt)}
                          {s.closedAt ? ` às ${formatTimeSP(s.closedAt)}` : " · aberto"}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      <CashDifference cents={s.differenceCents} open={s.status === "OPEN"} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
