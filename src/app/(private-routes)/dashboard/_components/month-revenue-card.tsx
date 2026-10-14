"use client";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCentsBRL } from "@/services/venue-finance";
import { cn } from "@/lib/cn";

/** Variação do mês corrente sobre o mês anterior inteiro, com uma casa decimal ("+19,6%"). Sem teto: passar de 100% aparece. */
export function formatMonthDelta(currentCents: number, previousCents: number): string | null {
  if (previousCents <= 0) return null;
  const pct = ((currentCents - previousCents) / previousCents) * 100;
  const text = Math.abs(pct).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${pct >= 0 ? "+" : "−"}${text}%`;
}

/**
 * Faturamento do mês corrente comparado ao mês anterior inteiro — substitui
 * o antigo anel de progresso, que limitava tudo a 100% e escondia quando o
 * mês já tinha passado o anterior.
 */
export function MonthRevenueCard({ currentCents, previousCents, isLoading, hideValues = false, className }: { currentCents: number | undefined; previousCents: number | undefined; isLoading: boolean; hideValues?: boolean; className?: string }) {
  const current = currentCents ?? 0;
  const previous = previousCents ?? 0;
  const delta = formatMonthDelta(current, previous);
  const up = current >= previous;
  const money = cn("tabular-nums transition-[filter] duration-200", hideValues && "blur-md select-none");

  return (
    <Card accent className={cn("gap-3 p-5", className)} aria-labelledby="home-month">
      <h2 id="home-month" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon name="calendar" size={14} />
        Este mês
      </h2>
      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : (
        <>
          <p className={cn(money, "text-stat font-medium leading-none tracking-tight text-foreground")}>{formatCentsBRL(current)}</p>
          {delta ? (
            <p className="flex items-center gap-2 text-caption text-muted-foreground">
              <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-semibold tabular-nums", up ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}>
                <Icon name={up ? "trend-up" : "trend-down"} size={10} />
                {delta}
              </span>
              vs. mês anterior
            </p>
          ) : (
            <p className="text-caption text-muted-foreground">Sem faturamento no mês anterior para comparar.</p>
          )}
          <p className="mt-auto pt-2 text-caption text-subtle-foreground">
            Mês anterior inteiro: <span className={cn(money, "font-semibold text-muted-foreground")}>{formatCentsBRL(previous)}</span>
          </p>
        </>
      )}
    </Card>
  );
}
