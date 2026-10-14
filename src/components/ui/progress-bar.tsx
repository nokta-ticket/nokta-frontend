import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const FILL: Record<Tone, string> = {
  brand: "bg-gradient-to-r from-brand-from to-brand-to",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

/**
 * Barra de progresso fina (vendas de um evento, checklist de configuração).
 * `value` é fração 0–1 ou, com `max`, um valor absoluto. Degradê suave da
 * marca por padrão; `tone` semântico quando o número tem um estado.
 */
export function ProgressBar({ value, max = 1, tone = "brand", size = "sm", className, label }: { value: number; max?: number; tone?: Tone; size?: "xs" | "sm" | "md"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("w-full overflow-hidden rounded-pill bg-surface-3", size === "xs" ? "h-1" : size === "sm" ? "h-1.5" : "h-2.5", className)}>
      <div className={cn("h-full rounded-pill transition-[width] duration-500 ease-out-soft", FILL[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
