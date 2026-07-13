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
    <Card className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium text-black/60">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
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
          <span className="text-xs text-black/30">—</span>
        )}
      </div>
    </Card>
  );
}
