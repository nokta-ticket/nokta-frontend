import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { formatStockQuantity, type VenueInventoryBalanceStatus, type VenueInventoryUnit } from "@/services/venue-stock";

/* Peças visuais só do Estoque: barra de nível, quantidade com sinal e
 * formatadores curtos de data. Tudo por token — nada de cor crua. */

export type LevelTone = "success" | "warning" | "danger" | "neutral" | "brand";

const FILL: Record<LevelTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
  brand: "bg-brand",
};

/** Sufixo curto da unidade-base: un / g / ml. */
export const UNIT_SHORT: Record<VenueInventoryUnit, string> = { UNIT: "un", GRAM: "g", MILLILITER: "ml" };

export function levelTone(status: VenueInventoryBalanceStatus): LevelTone {
  return status === "OK" ? "success" : status === "LOW_STOCK" ? "warning" : "danger";
}

/**
 * Barra fina de nível (saldo/alvo). Feita só de `span` pra poder viver dentro
 * de um `<p>` (subtítulo do MobileCard). Trilho `surface-3`, preenchimento
 * no tom do status.
 */
export function LevelBar({ value, max, tone = "brand", className, label }: { value: number; max: number; tone?: LevelTone; className?: string; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : value > 0 ? 100 : 0;
  return (
    <span role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className={cn("block h-1.5 w-full overflow-hidden rounded-pill bg-surface-3", className)}>
      <span className={cn("block h-full rounded-pill transition-[width] duration-500 ease-out-soft", FILL[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Saldo atual com a barra e o alvo embaixo: "32.000 ml ··· alvo 150.000 ml". */
export function StockLevel({ onHand, target, status, unit, className }: { onHand: string | number; target: string | number; status: VenueInventoryBalanceStatus; unit: VenueInventoryUnit; className?: string }) {
  return (
    <span className={cn("block min-w-0", className)}>
      <span className="flex items-baseline justify-between gap-2 text-caption tnum">
        <span className="font-medium text-foreground">{formatStockQuantity(onHand, unit)}</span>
        <span className="truncate text-subtle-foreground">alvo {formatStockQuantity(target, unit)}</span>
      </span>
      <LevelBar value={Number(onHand)} max={Number(target)} tone={levelTone(status)} className="mt-1.5" label="Nível do estoque" />
    </span>
  );
}

/** Quantidade com sinal e cor de entrada (verde) / saída (vermelho). */
export function MovementDelta({ delta, unit, className, size = "sm" }: { delta: string | number; unit: VenueInventoryUnit; className?: string; size?: "sm" | "md" }) {
  const n = Number(delta);
  const positive = n > 0;
  const zero = n === 0;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap font-semibold tnum", size === "md" ? "text-[15px]" : "text-sm", zero ? "text-muted-foreground" : positive ? "text-money-in" : "text-money-out", className)}>
      {zero ? null : <Icon name={positive ? "arrow-up" : "arrow-down"} size={11} />}
      {positive ? "+" : zero ? "" : "−"}
      {formatStockQuantity(Math.abs(n), unit)}
    </span>
  );
}

/** "14 out · 21:33" (acrescenta o ano quando não é o atual). */
export function formatShortDateTime(iso: string | null | undefined): string {
  const date = formatShortDate(iso);
  if (!date) return "";
  const d = new Date(iso as string);
  return `${date} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "14 out" ou "14 out 2025". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

/** "1 item" / "3 itens" — contagem sempre com substantivo. */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? singular : pluralForm}`;
}
