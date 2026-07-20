"use client";

import { formatCentsBRL, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsStock } from "../../_hooks/use-venue-insights";
import { InsightsHorizontalMoneyBarChart } from "../insights-charts";
import { InsightsRankingTable } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function EstoqueTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsStock(orgId, params);

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicator label="Valor estimado do estoque" value={formatCentsBRL(data.summary.estimatedValueCents)} />
        <Indicator label="Itens sem estoque" value={String(data.summary.outOfStockCount)} tone={data.summary.outOfStockCount > 0 ? "danger" : "neutral"} />
        <Indicator label="Itens com estoque baixo" value={String(data.summary.lowStockCount)} tone={data.summary.lowStockCount > 0 ? "warning" : "neutral"} />
        <Indicator label="Compras no período" value={formatCentsBRL(data.summary.purchasesTotalCents)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicator label="Perdas no período" value={formatCentsBRL(data.summary.lossCents)} />
        <Indicator label="Consumo por vendas" value={formatCentsBRL(data.summary.consumptionCents)} />
        <Indicator label="Itens com saldo negativo" value={String(data.summary.negativeCount)} tone={data.summary.negativeCount > 0 ? "danger" : "neutral"} />
        <Indicator label="Ajustes de contagem" value={String(data.summary.countAdjustmentsCount)} />
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-3">
        <p className="text-xs text-black/50">Giro de estoque estimado</p>
        <p className="text-lg font-semibold text-gray-900">{data.summary.estimatedTurnover !== null ? data.summary.estimatedTurnover.toFixed(2) : "—"}</p>
        <p className="mt-1 text-xs text-black/40">{data.summary.turnoverLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightsHorizontalMoneyBarChart
          data={data.lossByReason}
          isLoading={isLoading}
          title="Perdas por motivo"
          dataKey="amountCents"
          labelKey="reason"
          emptyTitle="Sem perdas no período"
          emptyDescription="As perdas registradas aparecerão aqui, agrupadas por motivo."
        />
        <InsightsHorizontalMoneyBarChart
          data={data.costByCategory}
          isLoading={isLoading}
          title="Valor de estoque por categoria"
          dataKey="valueCents"
          labelKey="nome"
          emptyTitle="Sem itens em estoque"
          emptyDescription="O valor estimado por categoria aparecerá aqui conforme houver saldo em estoque."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Compras por fornecedor</h3>
          <InsightsRankingTable
            rows={data.purchasesBySupplier}
            keyExtractor={(r, i) => r.supplierId ?? `none-${i}`}
            emptyTitle="Sem compras no período"
            emptyDescription="As compras por fornecedor aparecerão aqui conforme forem recebidas."
            columns={[
              { header: "Fornecedor", render: (r) => r.nome },
              { header: "Compras", align: "right", mobileLabel: "Compras", render: (r) => String(r.count) },
              { header: "Total", align: "right", mobileLabel: "Total", render: (r) => formatCentsBRL(r.totalCents) },
            ]}
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Itens com maior valor em estoque</h3>
          <InsightsRankingTable
            rows={data.highestValueItems}
            keyExtractor={(r) => r.itemId}
            emptyTitle="Sem itens em estoque"
            emptyDescription="Os itens com maior valor parado aparecerão aqui conforme houver saldo."
            columns={[
              { header: "Item", render: (r) => r.nome },
              { header: "Saldo", align: "right", mobileLabel: "Saldo", render: (r) => String(r.quantityOnHand) },
              { header: "Valor", align: "right", mobileLabel: "Valor", render: (r) => formatCentsBRL(r.valueCents) },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Itens mais consumidos</h3>
        <InsightsRankingTable
          rows={data.mostConsumedItems}
          keyExtractor={(r) => r.itemId}
          emptyTitle="Sem consumo no período"
          emptyDescription="Os itens mais consumidos por vendas aparecerão aqui conforme houver movimento."
          columns={[
            { header: "Item", render: (r) => r.nome },
            { header: "Quantidade consumida", align: "right", mobileLabel: "Consumido", render: (r) => r.consumedQuantity.toFixed(2) },
          ]}
        />
      </div>
    </div>
  );
}

function Indicator({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" | "danger" }) {
  const toneClass = tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-700" : "text-gray-900";
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
