import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VenueInsightsComparisonValue } from "@/services/venue-insights";

/**
 * Card de KPI com tendência semântica — a cor vem de `semantic`
 * (positive/negative/neutral), nunca do sinal bruto da variação. Faturamento
 * subindo é verde; no-show subindo é vermelho — a seta indica só a direção
 * (sobe/desce/estável), nunca "bom" ou "ruim" por si só.
 */
export function InsightsMetricCard({
  label,
  value,
  icon,
  comparison,
  extra,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  comparison?: VenueInsightsComparisonValue | null;
  extra?: ReactNode;
}) {
  return (
    <Card className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-black/60">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
        <TrendBadge comparison={comparison} />
      </div>
      {extra ? <div className="mt-2">{extra}</div> : null}
    </Card>
  );
}

export function TrendBadge({ comparison }: { comparison?: VenueInsightsComparisonValue | null }) {
  if (!comparison) return null;

  if (!comparison.hasBase) {
    return <span className="text-xs text-black/30">Sem base de comparação.</span>;
  }

  const Icon = comparison.direction === "UP" ? ArrowUpRight : comparison.direction === "DOWN" ? ArrowDownRight : Minus;
  const tone =
    comparison.semantic === "positive" ? "text-emerald-600" : comparison.semantic === "negative" ? "text-red-600" : "text-black/40";

  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", tone)}>
      <Icon size={14} />
      {comparison.percentDiff !== null ? `${Math.abs(comparison.percentDiff).toFixed(1)}%` : "—"}
    </span>
  );
}
