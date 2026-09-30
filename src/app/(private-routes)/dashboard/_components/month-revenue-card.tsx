"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCentsBRL } from "@/services/venue-finance";
import { cn } from "@/lib/utils";
import { BlockSkeleton } from "./states/loading-state";

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
export function MonthRevenueCard({
  currentCents,
  previousCents,
  isLoading,
  hideValues = false,
  className,
}: {
  currentCents: number | undefined;
  previousCents: number | undefined;
  isLoading: boolean;
  hideValues?: boolean;
  className?: string;
}) {
  const current = currentCents ?? 0;
  const previous = previousCents ?? 0;
  const delta = formatMonthDelta(current, previous);
  const up = current >= previous;
  const money = cn("font-poppins tabular-nums transition-[filter] duration-200", hideValues && "blur-md select-none");

  return (
    <section aria-labelledby="home-month" className={cn("flex flex-col rounded-[20px] border border-[#ebe8f2] bg-white p-6", className)}>
      <h2 id="home-month" className="text-[17px] font-semibold text-foreground">
        Este mês
      </h2>
      {isLoading ? (
        <BlockSkeleton className="mt-4 h-20" />
      ) : (
        <>
          <p className={cn(money, "mt-4 text-[30px] font-bold leading-none tracking-tight text-foreground")}>{formatCentsBRL(current)}</p>
          {delta ? (
            <p className="mt-3 flex items-center gap-2 text-[13.5px]">
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-0.5 font-poppins text-[13px] font-semibold tabular-nums",
                  up ? "bg-emerald-50 text-emerald-700" : "bg-[#fcf5f6] text-[#9b1c35]",
                )}
              >
                {up ? <TrendingUp size={14} strokeWidth={1.8} /> : <TrendingDown size={14} strokeWidth={1.8} />}
                {delta}
              </span>
              <span className="text-black/60">vs. mês anterior</span>
            </p>
          ) : (
            <p className="mt-3 text-[13.5px] text-black/60">Sem faturamento no mês anterior para comparar.</p>
          )}
          <p className="mt-auto pt-4 text-[13px] text-black/60">
            Mês anterior inteiro: <span className={cn(money, "font-semibold text-black/75")}>{formatCentsBRL(previous)}</span>
          </p>
        </>
      )}
    </section>
  );
}
