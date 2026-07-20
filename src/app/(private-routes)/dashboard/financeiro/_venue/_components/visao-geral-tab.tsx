"use client";

import { AlertTriangle } from "lucide-react";
import { formatCentsBRL, VENUE_PAYABLE_STATUS_LABEL, type VenueFinancePeriodParams } from "@/services/venue-finance";
import { useVenueFinanceCompareLocations, useVenueFinanceExpensesByCategory, useVenueFinanceOverview, useVenueFinancePaymentMethods, useVenueFinanceTimeline } from "../_hooks/use-venue-finance-overview";
import { useVenueFinanceReceivablesAgenda } from "../_hooks/use-venue-finance-sales";
import { useVenueFinancePayables } from "../_hooks/use-venue-finance-payables";
import { useVenueFinanceCashSessions } from "../_hooks/use-venue-finance-cash-reports";
import { FinanceSummaryCards, FinanceSecondaryIndicators } from "./finance-summary-cards";
import { FinanceExpensesByCategoryChart, FinanceLocationComparisonChart, FinancePaymentMethodsChart, FinanceTimelineChart } from "./finance-charts";
import { EmptyState } from "../../../_components/states/empty-state";
import { GenericStatusBadge } from "../../../estoque/_components/stock-status-badge";

export function VisaoGeralTab({
  orgId,
  locationId,
  period,
  hasMultipleLocations,
}: {
  orgId: number;
  locationId: number;
  period: VenueFinancePeriodParams;
  hasMultipleLocations: boolean;
}) {
  const { data: overview, isLoading: loadingOverview } = useVenueFinanceOverview(orgId, locationId, period, true);
  const { data: timeline, isLoading: loadingTimeline } = useVenueFinanceTimeline(orgId, locationId, period);
  const { data: methods, isLoading: loadingMethods } = useVenueFinancePaymentMethods(orgId, locationId, period);
  const { data: expensesByCategory, isLoading: loadingExpenses } = useVenueFinanceExpensesByCategory(orgId, locationId, period);
  const { data: comparison } = useVenueFinanceCompareLocations(orgId, period, hasMultipleLocations);
  const { data: agenda } = useVenueFinanceReceivablesAgenda(orgId, locationId);
  const { data: dueSoon } = useVenueFinancePayables(orgId, { locationId, status: "PENDING", limit: 5 });
  const { data: overdue } = useVenueFinancePayables(orgId, { locationId, status: "OVERDUE", limit: 5 });
  const { data: cashSessions } = useVenueFinanceCashSessions(orgId, locationId, { onlyDivergent: true });

  return (
    <div className="space-y-6">
      <FinanceSummaryCards overview={overview} isLoading={loadingOverview} />
      <FinanceSecondaryIndicators overview={overview} />

      <FinanceTimelineChart data={timeline} isLoading={loadingTimeline} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FinancePaymentMethodsChart data={methods} isLoading={loadingMethods} />
        <FinanceExpensesByCategoryChart data={expensesByCategory} isLoading={loadingExpenses} />
      </div>

      <FinanceLocationComparisonChart data={comparison} isLoading={false} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Contas próximas do vencimento</h3>
          {(dueSoon?.data.length ?? 0) === 0 ? (
            <p className="text-sm text-black/50">Nenhuma conta pendente nesta unidade.</p>
          ) : (
            <ul className="space-y-2">
              {dueSoon!.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.publicCode} · {p.description}</span>
                  <span className="text-black/60">{formatCentsBRL(p.totalAmountCents - p.paidAmountCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertTriangle size={14} /> Contas vencidas
          </h3>
          {(overdue?.data.length ?? 0) === 0 ? (
            <p className="text-sm text-black/50">Nenhuma conta vencida — tudo em dia.</p>
          ) : (
            <ul className="space-y-2">
              {overdue!.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.publicCode} · {p.description}</span>
                  <span className="font-medium text-red-700">{formatCentsBRL(p.totalAmountCents - p.paidAmountCents)}</span>
                  <GenericStatusBadge label={VENUE_PAYABLE_STATUS_LABEL[p.status]} tone="danger" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Agenda estimada de recebimentos</h3>
          {agenda ? (
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-black/50">Hoje</p><p className="font-medium">{formatCentsBRL(agenda.todayCents)}</p></div>
              <div><p className="text-black/50">Amanhã</p><p className="font-medium">{formatCentsBRL(agenda.tomorrowCents)}</p></div>
              <div><p className="text-black/50">7 dias</p><p className="font-medium">{formatCentsBRL(agenda.next7DaysCents)}</p></div>
              <div><p className="text-black/50">30 dias</p><p className="font-medium">{formatCentsBRL(agenda.next30DaysCents)}</p></div>
            </div>
          ) : null}
          <p className="text-xs text-black/40">{agenda?.disclaimer}</p>
        </div>

        <div className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Fechamentos com divergência</h3>
          {(cashSessions?.length ?? 0) === 0 ? (
            <p className="text-sm text-black/50">Nenhum fechamento com diferença nesta unidade.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(cashSessions as { id: number; differenceCents: number | null; openedAt: string }[]).map((s) => (
                <li key={s.id} className="flex items-center justify-between">
                  <span>{new Date(s.openedAt).toLocaleDateString("pt-BR")}</span>
                  <span className="font-medium text-amber-700">{formatCentsBRL(s.differenceCents ?? 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!overview && !loadingOverview ? <EmptyState title="Sem dados" description="Ainda não há movimento financeiro registrado." /> : null}
    </div>
  );
}
