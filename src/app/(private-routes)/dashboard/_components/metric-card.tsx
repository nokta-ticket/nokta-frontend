import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Card de métrica: valor já formatado + rótulo + variação % opcional.
 * delta null/undefined → sem pill (nunca inventa dado).
 * @deprecated Use `StatCard` de `@/components/ui/stat-card` (count-up, formato
 * numérico tipado). Este mantém a assinatura antiga (`value: string`).
 */
export function MetricCard({ label, value, icon, delta }: { label: string; value: string; icon?: ReactNode; delta?: number | null }) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="min-w-0 gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon ? <span className="shrink-0 [&_svg]:size-3.5">{icon}</span> : null}
          <span className="truncate">{label}</span>
        </p>
        {hasDelta ? (
          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-semibold tabular-nums", positive ? "bg-success-bg text-success" : "bg-danger-bg text-danger")}>
            <Icon name={positive ? "trend-up" : "trend-down"} size={10} />
            {Math.abs(delta as number).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </span>
        ) : null}
      </div>
      <p className="truncate text-stat font-medium tabular-nums leading-none tracking-tight text-foreground">{value}</p>
    </Card>
  );
}
