"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";

/**
 * Stat de dinheiro da Início — mesma anatomia do StatCard, mas sem count-up e
 * com "ocultar valores" (o gerente abre a tela no salão, de frente pra
 * clientes e equipe). Centavos na entrada, como toda API de venue.
 */
export function HomeMoneyStat({ label, icon, cents, hidden, loading, hint, trend, className }: { label: string; icon?: IconName; cents: number | null; hidden: boolean; loading?: boolean; hint?: ReactNode; trend?: { pct: number; label: string } | null; className?: string }) {
  const money = cn("tnum transition-[filter] duration-200", hidden && "select-none blur-md");
  return (
    <Card className={cn("gap-3 p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon ? <Icon name={icon} size={14} /> : null}
          {label}
        </p>
        {trend ? (
          <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-semibold tabular-nums", trend.pct > 0 ? "bg-success-bg text-success" : trend.pct < 0 ? "bg-danger-bg text-danger" : "bg-neutral-bg text-neutral")}>
            <Icon name={trend.pct > 0 ? "trend-up" : trend.pct < 0 ? "trend-down" : "minus"} size={10} />
            {Math.abs(trend.pct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% {trend.label}
          </span>
        ) : null}
      </div>
      <div className="text-stat font-medium leading-none tracking-tight text-foreground">{loading || cents === null ? <span className="skeleton-shimmer inline-block h-7 w-28 rounded-md" /> : <span className={money}>{formatBRLCents(cents)}</span>}</div>
      {hint ? <p className={cn("text-caption text-subtle-foreground", hidden && "select-none blur-sm")}>{hint}</p> : null}
    </Card>
  );
}
