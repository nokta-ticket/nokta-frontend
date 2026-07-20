"use client";

import { formatCentsBRL, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsFinance } from "../../_hooks/use-venue-insights";
import { InsightsHorizontalMoneyBarChart } from "../insights-charts";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function FinanceiroTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsFinance(orgId, params);

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicator label="Faturamento" value={formatCentsBRL(data.overview.grossRevenueCents)} />
        <Indicator label="Receita líquida estimada" value={formatCentsBRL(data.overview.netRevenueCents)} />
        <Indicator label="Despesas" value={formatCentsBRL(data.overview.expensesCents)} />
        <Indicator
          label="Resultado operacional estimado"
          value={formatCentsBRL(data.overview.operationalResultCents)}
          tone={data.overview.operationalResultCents < 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicator label="CMV" value={formatCentsBRL(data.overview.cmvCents)} />
        <Indicator label="Margem bruta" value={formatCentsBRL(data.overview.grossMarginCents)} />
        <Indicator label="Contas a pagar em aberto" value={String(data.overview.payablesOpenCount)} />
        <Indicator label="Contas vencidas" value={String(data.overview.payablesOverdueCount)} tone={data.overview.payablesOverdueCount > 0 ? "danger" : "neutral"} />
      </div>

      <InsightsHorizontalMoneyBarChart
        data={data.expensesByCategory}
        isLoading={isLoading}
        title="Despesas por categoria"
        dataKey="amountCents"
        labelKey="nome"
        emptyTitle="Sem despesas no período"
        emptyDescription="As despesas pagas ou incorridas aparecerão aqui por categoria."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Divergência de caixa</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{data.cashDivergence.sessionsCount}</p>
          <p className="text-xs text-black/50">fechamento(s) com diferença no período</p>
          {data.cashDivergence.sessionsCount > 0 ? (
            <p className="mt-1 text-sm font-medium text-amber-700">{formatCentsBRL(data.cashDivergence.totalDifferenceCents)} de diferença acumulada</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h3 className="text-sm font-medium">Conciliação de pagamentos</h3>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {data.reconciliation.divergentCount} <span className="text-sm font-normal text-black/50">/ {data.reconciliation.totalCount}</span>
          </p>
          <p className="text-xs text-black/50">dia(s)/método(s) divergentes no período</p>
        </div>
      </div>

      <p className="text-xs text-black/40">{data.overview.disclaimer}</p>
    </div>
  );
}

function Indicator({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "danger" }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
