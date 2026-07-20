"use client";

import { formatCentsBRL, formatDurationMs, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsOperation } from "../../_hooks/use-venue-insights";
import { InsightsCountByWeekdayChart } from "../insights-charts";
import { InsightsRankingTable } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function OperacaoTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsOperation(orgId, params);

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  const byHourRows = data.byHour.map((h) => ({ label: `${String(h.hour).padStart(2, "0")}h`, ordersCount: h.ordersCount }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicator label="Comandas abertas" value={String(data.summary.openedTabsCount)} />
        <Indicator label="Comandas fechadas" value={String(data.summary.closedTabsCount)} />
        <Indicator label="Tempo médio de comanda" value={formatDurationMs(data.summary.averageTabDurationMs)} />
        <Indicator label="Tempo até 1º pedido" value={formatDurationMs(data.summary.averageTimeToFirstOrderMs)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicator label="Tempo médio de preparo" value={formatDurationMs(data.summary.averagePreparationTimeMs)} />
        <Indicator label="Tempo até entrega" value={formatDurationMs(data.summary.averageTimeToDeliveryMs)} />
        <Indicator label="Pedidos cancelados" value={String(data.summary.canceledOrdersCount)} />
        <Indicator label="Itens cancelados" value={String(data.summary.canceledItemsCount)} />
        <Indicator label="Desconto médio" value={data.summary.averageDiscountCents !== null ? formatCentsBRL(data.summary.averageDiscountCents) : "—"} />
        <Indicator
          label="Taxa de serviço média"
          value={data.summary.averageServiceChargeRateBps !== null ? `${(data.summary.averageServiceChargeRateBps / 100).toFixed(1)}%` : "—"}
        />
      </div>

      <InsightsCountByWeekdayChart data={byHourRows} isLoading={isLoading} title="Pedidos por horário" dataKey="ordersCount" />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Por estação de preparo</h3>
        <InsightsRankingTable
          rows={data.byStation}
          keyExtractor={(r, i) => r.stationId ?? `none-${i}`}
          emptyTitle="Sem itens no período"
          emptyDescription="A distribuição por estação de preparo aparecerá aqui conforme os pedidos forem lançados."
          columns={[
            { header: "Estação", render: (r) => r.nome },
            { header: "Itens", align: "right", mobileLabel: "Itens", render: (r) => String(r.itemCount) },
            { header: "Tempo médio de preparo", align: "right", mobileLabel: "Tempo médio", render: (r) => formatDurationMs(r.averagePreparationTimeMs) },
          ]}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Por operador</h3>
        <p className="text-xs text-black/40">Contagens operacionais neutras — não é um ranking de desempenho.</p>
        <InsightsRankingTable
          rows={data.byOperator}
          keyExtractor={(r) => r.userId}
          emptyTitle="Sem movimento no período"
          emptyDescription="As contagens por operador aparecerão aqui conforme comandas forem abertas e pedidos lançados."
          columns={[
            { header: "Operador", render: (r) => `Usuário #${r.userId}` },
            { header: "Comandas abertas", align: "right", mobileLabel: "Comandas abertas", render: (r) => String(r.openedTabs) },
            { header: "Pedidos lançados", align: "right", mobileLabel: "Pedidos lançados", render: (r) => String(r.createdOrders) },
          ]}
        />
      </div>
    </div>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
