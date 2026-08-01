"use client";

import { formatCentsBRL } from "@/services/venue-finance";
import { Card } from "@/components/ui/card";
import { BlockSkeleton } from "./states/loading-state";

/** Donut de progresso do faturamento do mês corrente frente ao mês anterior — sem meta manual configurável, 100% dado real. */
export function GoalProgressCard({
  currentCents,
  previousCents,
  isLoading,
}: {
  currentCents: number | undefined;
  previousCents: number | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="rounded-[22px] p-6">
        <BlockSkeleton className="h-64" />
      </Card>
    );
  }

  const current = currentCents ?? 0;
  const previous = previousCents ?? 0;
  const pct = previous > 0 ? Math.min(100, Math.round((current / previous) * 100)) : current > 0 ? 100 : 0;
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <Card className="flex flex-col items-center rounded-[22px] p-6 text-center">
      <h3 className="mb-4 self-start text-lg font-semibold text-foreground">Progresso do Mês</h3>
      <p className="mb-1 self-start text-sm text-muted-foreground">
        <span className="font-poppins text-2xl font-bold text-foreground">{pct}%</span> do mês anterior
      </p>

      <div className="relative my-2 h-[150px] w-[150px]">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <g transform="rotate(-90 75 75)" fill="none" strokeLinecap="round">
            <circle cx="75" cy="75" r="60" stroke="var(--color-chart-1)" strokeOpacity="0.15" strokeWidth="14" />
            <circle
              cx="75"
              cy="75"
              r="60"
              stroke="var(--primary)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-poppins text-2xl font-bold text-foreground">{pct}%</div>
      </div>

      <p className="mb-4 text-xs text-black/50">
        {previous > 0 ? `Mês anterior: ${formatCentsBRL(previous)}` : "Sem dados do mês anterior ainda"}
      </p>

      <div className="mt-auto w-full text-sm text-muted-foreground">
        Faturado até agora: <span className="font-semibold text-foreground">{formatCentsBRL(current)}</span>
      </div>
    </Card>
  );
}
