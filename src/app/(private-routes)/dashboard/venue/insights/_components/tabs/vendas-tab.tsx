"use client";

import { formatCentsBRL, VENUE_INSIGHTS_ORIGIN_LABEL, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsSales } from "../../_hooks/use-venue-insights";
import { InsightsMetricCard } from "../insights-metric-card";
import { InsightsAmountByHourChart, InsightsCountByWeekdayChart, InsightsTimelineChart } from "../insights-charts";
import { InsightsRankingTable } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function VendasTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsSales(orgId, params);

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  const timelineForResult = data.timeline.map((p) => ({ date: p.date, revenueCents: p.amountCents, resultCents: p.amountCents }));
  const weekdayRows = data.byWeekday.map((w) => ({ label: w.label.slice(0, 3), amountCents: w.amountCents }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightsMetricCard label="Faturamento" value={formatCentsBRL(data.summary.grossRevenueCents.current)} comparison={data.summary.grossRevenueCents} />
        <InsightsMetricCard label="Ticket médio" value={formatCentsBRL(data.summary.averageTicketCents.current)} comparison={data.summary.averageTicketCents} />
        <InsightsMetricCard label="Pagamentos confirmados" value={String(data.summary.paymentsCount)} />
        <InsightsMetricCard label="Receita líquida estimada" value={formatCentsBRL(data.summary.netRevenueCents)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecondaryIndicator label="Desconto médio" value={data.summary.averageDiscountCents !== null ? formatCentsBRL(data.summary.averageDiscountCents) : "—"} />
        <SecondaryIndicator label="Total em descontos" value={formatCentsBRL(data.summary.totalDiscountCents)} />
        <SecondaryIndicator label="Taxa de serviço" value={formatCentsBRL(data.summary.totalServiceChargeCents)} />
        <SecondaryIndicator label="Comandas canceladas" value={String(data.summary.canceledTabsCount)} />
      </div>

      <InsightsTimelineChart
        data={timelineForResult.map(({ date, revenueCents }) => ({ date, revenueCents, resultCents: revenueCents }))}
        isLoading={isLoading}
        title="Faturamento ao longo do período"
        description="Vendas confirmadas por período selecionado"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightsAmountByHourChart data={data.byHour} isLoading={isLoading} title="Vendas por horário" />
        <InsightsCountByWeekdayChart data={weekdayRows} isLoading={isLoading} title="Vendas por dia da semana" dataKey="amountCents" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Por forma de pagamento</h3>
          <InsightsRankingTable
            rows={data.byPaymentMethod}
            keyExtractor={(r) => r.method}
            emptyTitle="Sem vendas no período"
            emptyDescription="As formas de pagamento aparecerão aqui conforme os pagamentos forem confirmados."
            columns={[
              { header: "Método", render: (r) => r.method },
              { header: "Quantidade", align: "right", mobileLabel: "Quantidade", render: (r) => String(r.count) },
              { header: "Valor bruto", align: "right", mobileLabel: "Valor bruto", render: (r) => formatCentsBRL(r.grossCents) },
            ]}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Por origem da comanda</h3>
          <InsightsRankingTable
            rows={data.byOrigin}
            keyExtractor={(r) => r.origin}
            emptyTitle="Sem comandas fechadas no período"
            emptyDescription="A origem das comandas aparecerá aqui conforme forem fechadas."
            columns={[
              { header: "Origem", render: (r) => VENUE_INSIGHTS_ORIGIN_LABEL[r.origin] ?? r.origin },
              { header: "Quantidade", align: "right", mobileLabel: "Quantidade", render: (r) => String(r.count) },
              { header: "Total", align: "right", mobileLabel: "Total", render: (r) => formatCentsBRL(r.totalCents) },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Maiores comandas</h3>
          <InsightsRankingTable
            rows={data.topTabsByTotal}
            keyExtractor={(r) => r.id}
            emptyTitle="Sem comandas fechadas no período"
            emptyDescription="As maiores comandas aparecerão aqui conforme forem fechadas."
            columns={[
              { header: "Comanda", render: (r) => `${r.publicCode}${r.customerName ? ` · ${r.customerName}` : ""}` },
              { header: "Total", align: "right", mobileLabel: "Total", render: (r) => formatCentsBRL(r.totalCents) },
            ]}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Maiores descontos</h3>
          <InsightsRankingTable
            rows={data.topTabsByDiscount}
            keyExtractor={(r) => r.id}
            emptyTitle="Sem descontos no período"
            emptyDescription="Comandas com desconto aparecerão aqui conforme forem fechadas."
            columns={[
              { header: "Comanda", render: (r) => `${r.publicCode}${r.customerName ? ` · ${r.customerName}` : ""}` },
              { header: "Desconto", align: "right", mobileLabel: "Desconto", render: (r) => formatCentsBRL(r.discountCents) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SecondaryIndicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
