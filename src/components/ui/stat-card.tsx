"use client";

import type { ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";

type Format = "number" | "currency" | "percent";

/**
 * Número grande do painel. Fonte `font-medium tabular-nums`, nunca bold.
 * Tendência vem em pill pequeno ao lado. Ícone inline no rótulo, na cor
 * do texto — sem caixa colorida atrás.
 * `currency` recebe reais (não centavos); `percent` recebe fração (0.12).
 */
export function StatCard({ label, value, format = "number", icon, trend, trendLabel, hint, loading, className, children }: { label: string; value: number | null | undefined; format?: Format; icon?: IconName; trend?: number | null; trendLabel?: string; hint?: ReactNode; loading?: boolean; className?: string; children?: ReactNode }) {
  const numberFormat: React.ComponentProps<typeof NumberFlow>["format"] =
    format === "currency" ? { style: "currency", currency: "BRL", maximumFractionDigits: 2 } : format === "percent" ? { style: "percent", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 };

  const trendTone = trend == null ? null : trend > 0 ? "success" : trend < 0 ? "danger" : "neutral";

  return (
    <Card className={cn("gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon ? <Icon name={icon} size={14} /> : null}
          {label}
        </p>
        {trendTone ? (
          <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-semibold tabular-nums", trendTone === "success" && "bg-success-bg text-success", trendTone === "danger" && "bg-danger-bg text-danger", trendTone === "neutral" && "bg-neutral-bg text-neutral")}>
            <Icon name={trend! > 0 ? "trend-up" : trend! < 0 ? "trend-down" : "minus"} size={10} />
            {Math.abs(trend!).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%{trendLabel ? ` ${trendLabel}` : ""}
          </span>
        ) : null}
      </div>
      <div className="text-stat font-medium tabular-nums leading-none tracking-tight text-foreground">
        {loading || value == null ? <span className="skeleton-shimmer inline-block h-7 w-28 rounded-md" /> : <NumberFlow value={value} format={numberFormat} locales="pt-BR" />}
      </div>
      {hint ? <p className="text-caption text-subtle-foreground">{hint}</p> : null}
      {children}
    </Card>
  );
}
