"use client";

import { AlertTriangle, DollarSign, PackageX, TrendingUp, Users } from "lucide-react";
import { formatCentsBRL, formatDurationMs, formatRate, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsAlerts, useVenueInsightsLocationsComparison, useVenueInsightsOverview } from "../../_hooks/use-venue-insights";
import { InsightsMetricCard } from "../insights-metric-card";
import { InsightsTimelineChart, InsightsAmountByHourChart, InsightsLocationComparisonChart } from "../insights-charts";
import { InsightsRankingTable } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function VisaoGeralTab({ orgId, params, hasMultipleLocations }: { orgId: number; params: VenueInsightsFilterParams; hasMultipleLocations: boolean }) {
  const { data: overview, isLoading } = useVenueInsightsOverview(orgId, params);
  const { data: alerts } = useVenueInsightsAlerts(orgId, params);
  const { data: comparison } = useVenueInsightsLocationsComparison(orgId, params, hasMultipleLocations && params.locationId === undefined);

  if (isLoading || !overview) {
    return <MetricsSkeleton count={4} />;
  }

  const hasAlerts =
    alerts &&
    (alerts.outOfStockItems.length > 0 ||
      alerts.lowStockItems.length > 0 ||
      alerts.overduePayables.length > 0 ||
      alerts.divergentCashSessions.length > 0 ||
      alerts.elevatedNoShow !== null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightsMetricCard label="Faturamento" value={formatCentsBRL(overview.cards.revenueCents.current)} icon={<DollarSign size={18} />} comparison={overview.cards.revenueCents} />
        <InsightsMetricCard label="Resultado operacional estimado" value={formatCentsBRL(overview.cards.operationalResultCents.current)} icon={<TrendingUp size={18} />} comparison={overview.cards.operationalResultCents} />
        <InsightsMetricCard label="Ticket médio" value={formatCentsBRL(overview.cards.averageTicketCents.current)} comparison={overview.cards.averageTicketCents} />
        <InsightsMetricCard
          label="Clientes atendidos"
          value={String(overview.cards.guestsServed.current)}
          icon={<Users size={18} />}
          comparison={overview.cards.guestsServed}
          extra={
            overview.cards.guestsServed.coverage !== null && overview.cards.guestsServed.coverage < 1 ? (
              <p className="text-xs text-black/40">Cobertura: {formatRate(overview.cards.guestsServed.coverage)} das comandas com contagem de clientes.</p>
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecondaryIndicator label="Margem bruta" value={formatCentsBRL(overview.secondary.grossMarginCents)} />
        <SecondaryIndicator label="CMV" value={formatCentsBRL(overview.secondary.cmvCents)} />
        <SecondaryIndicator label="Tempo médio de comanda" value={formatDurationMs(overview.secondary.averageTabDurationMs)} />
        <SecondaryIndicator label="Taxa de no-show" value={formatRate(overview.secondary.noShowRate)} />
        <SecondaryIndicator
          label="Ocupação"
          value={overview.secondary.occupancyRate !== null ? formatRate(overview.secondary.occupancyRate) : "—"}
          note={overview.secondary.occupancyRate === null ? overview.secondary.occupancyMessage ?? undefined : undefined}
        />
        <SecondaryIndicator label="Perdas de estoque" value={formatCentsBRL(overview.secondary.lossCents)} />
        <SecondaryIndicator label="Comandas fechadas" value={String(overview.secondary.closedTabsCount)} />
        <SecondaryIndicator
          label="Fechamentos divergentes"
          value={String(overview.secondary.divergentCashSessionsCount)}
          tone={overview.secondary.divergentCashSessionsCount > 0 ? "warning" : "neutral"}
        />
      </div>

      {hasAlerts ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle size={16} /> Pontos de atenção
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {alerts!.outOfStockItems.length > 0 ? <li>{alerts!.outOfStockItems.length} item(ns) de estoque zerados.</li> : null}
            {alerts!.lowStockItems.length > 0 ? <li>{alerts!.lowStockItems.length} item(ns) com estoque baixo.</li> : null}
            {alerts!.overduePayables.length > 0 ? <li>{alerts!.overduePayables.length} conta(s) a pagar vencida(s).</li> : null}
            {alerts!.divergentCashSessions.length > 0 ? <li>{alerts!.divergentCashSessions.length} fechamento(s) de caixa com divergência no período.</li> : null}
            {alerts!.elevatedNoShow ? <li>Taxa de no-show elevada no período: {formatRate(alerts!.elevatedNoShow.rate)}.</li> : null}
          </ul>
        </div>
      ) : null}

      <InsightsTimelineChart data={overview.timeline} isLoading={isLoading} />

      <InsightsAmountByHourChart data={overview.salesByHour} isLoading={isLoading} title="Vendas por horário" description="Faturamento por hora do dia, no timezone da unidade" />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Produtos mais vendidos (por faturamento)</h3>
        <InsightsRankingTable
          rows={overview.topProducts}
          keyExtractor={(r) => r.productId}
          emptyTitle="Sem vendas no período"
          emptyDescription="Os produtos mais vendidos aparecerão aqui conforme o movimento do período."
          columns={[
            { header: "Produto", render: (r) => r.nome },
            { header: "Faturamento", align: "right", mobileLabel: "Faturamento", render: (r) => formatCentsBRL(r.revenueCents) },
          ]}
        />
      </div>

      <InsightsLocationComparisonChart data={comparison?.locations} isLoading={false} />

      <p className="text-xs text-black/40">{overview.disclaimer}</p>
    </div>
  );
}

function SecondaryIndicator({ label, value, tone = "neutral", note }: { label: string; value: string; tone?: "neutral" | "warning"; note?: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${tone === "warning" ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
      {note ? (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-black/40">
          <PackageX size={11} /> {note}
        </p>
      ) : null}
    </div>
  );
}
