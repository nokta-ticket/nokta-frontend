"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/cn";
import type { VenueInsightsComparisonValue } from "@/services/venue-insights";

type Format = "number" | "currency" | "percent";
type Tone = "default" | "warning" | "danger";

const TONE_TEXT: Record<Tone, string> = { default: "text-foreground", warning: "text-warning", danger: "text-danger" };

/** Grade dos 4 KPIs principais — 1 coluna no celular (o número grande não cabe em meia tela). */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

/** Grade dos indicadores secundários (caixas rebaixadas, número menor). */
export function MiniStatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>;
}

/** Pill de tendência no vocabulário do StatCard, pra quando o tom não segue o sinal. */
export function TrendPill({ percent, tone }: { percent: number; tone: "success" | "danger" | "neutral" }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-micro font-semibold tabular-nums", tone === "success" && "bg-success-bg text-success", tone === "danger" && "bg-danger-bg text-danger", tone === "neutral" && "bg-neutral-bg text-neutral")}>
      <Icon name={percent > 0 ? "trend-up" : percent < 0 ? "trend-down" : "minus"} size={10} />
      {Math.abs(percent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

/**
 * KPI com tendência vinda do `VenueInsightsComparisonValue`. O StatCard colore
 * o pill pelo sinal da variação; quando a semântica da API discorda do sinal
 * (ex.: no-show subiu = ruim), o pill é desenhado aqui com o tom certo e
 * entra como dica, abaixo do número. Sem base de comparação → sem pill.
 * `currency` recebe centavos e converte pra reais (o StatCard espera reais).
 */
export function InsightsStatCard({
  label,
  comparison,
  format = "number",
  icon,
  hint,
  className,
}: {
  label: string;
  comparison: VenueInsightsComparisonValue | null | undefined;
  format?: Format;
  icon?: IconName;
  hint?: ReactNode;
  className?: string;
}) {
  const value = comparison ? (format === "currency" ? comparison.current / 100 : comparison.current) : null;
  const pct = comparison?.hasBase ? comparison.percentDiff : null;
  const semantic = comparison?.semantic ?? "neutral";
  const signAgrees = pct === null || pct === 0 || semantic === "neutral" || (pct > 0 && semantic === "positive") || (pct < 0 && semantic === "negative");
  const inverted = pct !== null && !signAgrees;
  const resolvedHint = inverted ? (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <TrendPill percent={pct} tone={semantic === "negative" ? "danger" : "success"} />
      {hint}
    </span>
  ) : (
    hint
  );

  return <StatCard label={label} value={value} format={format} icon={icon} trend={inverted ? null : pct} hint={resolvedHint} className={className} />;
}

/**
 * Mesmo desenho do StatCard, mas com um texto já formatado — durações
 * ("1h 34min"), taxas com "—" e contagens que precisam de tom semântico.
 */
export function TextStatCard({ label, value, icon, hint, tone = "default", className }: { label: string; value: string; icon?: IconName; hint?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <Card className={cn("gap-3 p-5", className)}>
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon ? <Icon name={icon} size={14} /> : null}
        {label}
      </p>
      <div className={cn("break-words text-stat font-medium tabular-nums leading-none tracking-tight", TONE_TEXT[tone])}>{value}</div>
      {hint ? <p className="text-caption text-subtle-foreground">{hint}</p> : null}
    </Card>
  );
}

/** Indicador secundário: caixa rebaixada, rótulo em micro caps, número médio. */
export function MiniStat({ label, value, note, tone = "default", icon, className }: { label: string; value: string; note?: ReactNode; tone?: Tone; icon?: IconName; className?: string }) {
  return (
    <div className={cn("surface-inset min-w-0 rounded-xl px-3.5 py-3", className)}>
      <p className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
        {icon ? <Icon name={icon} size={11} /> : null}
        {label}
      </p>
      <p className={cn("mt-1 break-words text-lg font-medium tabular-nums leading-tight", TONE_TEXT[tone])}>{value}</p>
      {note ? <p className="mt-1 text-caption text-muted-foreground">{note}</p> : null}
    </div>
  );
}
