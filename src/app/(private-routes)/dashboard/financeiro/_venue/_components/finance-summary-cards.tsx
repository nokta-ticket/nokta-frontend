import { AlertTriangle, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { MetricCard } from "../../../_components/metric-card";
import { MetricsSkeleton } from "../../../_components/states/loading-state";
import { formatCentsBRL, type VenueFinanceOverview } from "@/services/venue-finance";

export function FinanceSummaryCards({ overview, isLoading }: { overview: VenueFinanceOverview | undefined; isLoading: boolean }) {
  if (isLoading || !overview) {
    return <MetricsSkeleton count={4} />;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Faturamento" value={formatCentsBRL(overview.grossRevenueCents)} icon={<DollarSign size={18} />} />
      <MetricCard label="Receita líquida estimada" value={formatCentsBRL(overview.netRevenueCents)} icon={<TrendingUp size={18} />} />
      <MetricCard label="Despesas" value={formatCentsBRL(overview.expensesCents)} icon={<TrendingDown size={18} />} />
      <MetricCard
        label="Resultado estimado"
        value={formatCentsBRL(overview.operationalResultCents)}
        icon={overview.operationalResultCents < 0 ? <AlertTriangle size={18} /> : <TrendingUp size={18} />}
      />
    </div>
  );
}

export function FinanceSecondaryIndicators({ overview }: { overview: VenueFinanceOverview | undefined }) {
  if (!overview) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SecondaryIndicator label="CMV" value={formatCentsBRL(overview.cmvCents)} />
      <SecondaryIndicator label="Margem bruta" value={formatCentsBRL(overview.grossMarginCents)} />
      <SecondaryIndicator label="Contas a pagar" value={String(overview.payablesOpenCount)} />
      <SecondaryIndicator label="Contas vencidas" value={String(overview.payablesOverdueCount)} tone={overview.payablesOverdueCount > 0 ? "danger" : "neutral"} />
    </div>
  );
}

function SecondaryIndicator({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "danger" }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
