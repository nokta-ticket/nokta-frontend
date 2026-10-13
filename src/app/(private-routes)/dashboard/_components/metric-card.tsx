import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Card de métrica: valor grande + label + variação % opcional.
 * delta null/undefined → mostra "—" (sem inventar dado).
 */
export function MetricCard({
  label,
  value,
  icon,
  delta,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  delta?: number | null;
}) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="min-w-0 rounded-xl bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-black/60 sm:text-sm">
        <span className="min-w-0 truncate">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex flex-col items-start gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <span className="min-w-0 text-[19px] leading-tight font-semibold tabular-nums text-gray-900 sm:text-3xl">{value}</span>
        {hasDelta ? (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              positive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(delta as number).toFixed(1)}%
          </span>
        ) : (
          <span className="hidden text-xs text-black/30 sm:inline">—</span>
        )}
      </div>
    </Card>
  );
}
