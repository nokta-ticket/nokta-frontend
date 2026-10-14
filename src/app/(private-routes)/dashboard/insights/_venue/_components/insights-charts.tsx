"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconName } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";

/* ---------- formatadores de eixo ---------- */

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "R$ 12 mil" — curto o bastante pra caber no eixo Y. */
export function formatAxisBRL(cents: number): string {
  const reais = cents / 100;
  const abs = Math.abs(reais);
  if (abs >= 1_000_000) return `R$ ${(reais / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1000) return `R$ ${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${reais.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export function formatAxisCount(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/** "2026-10-14" → "14/10" · "2026-10" → "out/26" · "19h" fica "19h". */
export function formatBucketLabel(value: string): string {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!m) return value;
  if (!m[3]) return `${MONTHS_SHORT[Number(m[2]) - 1]}/${m[1].slice(2)}`;
  return `${m[3]}/${m[2]}`;
}

export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}h`;

export function formatShare(share: number): string {
  return `${(share * 100).toLocaleString("pt-BR", { maximumFractionDigits: share < 0.1 ? 1 : 0 })}%`;
}

/* ---------- painel ---------- */

/**
 * Card de gráfico/lista: título + descrição, estado de carregamento
 * (skeleton do tamanho do gráfico) e vazio (EmptyState compacto).
 */
export function InsightsPanel({
  title,
  description,
  action,
  loading,
  empty,
  emptyTitle = "Sem dados no período",
  emptyDescription,
  emptyIcon = "chart-bar",
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: IconName;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("pt-4", bodyClassName)}>{loading ? <Skeleton className="h-56 w-full rounded-xl" /> : empty ? <EmptyState compact icon={emptyIcon} title={emptyTitle} description={emptyDescription} /> : children}</CardContent>
    </Card>
  );
}

/* ---------- tooltip ---------- */

function TooltipRow({ label, value, color }: { label: ReactNode; value: string; color?: string }) {
  return (
    <span className="flex w-full items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {color ? <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: color }} /> : null}
        {label}
      </span>
      <span className="tnum font-medium text-foreground">{value}</span>
    </span>
  );
}

const ZW = "​";
const stripZw = (v: unknown) => String(v).replace(ZW, "");

/* ---------- linha do tempo ---------- */

export interface TimelinePoint {
  date: string;
  revenueCents: number;
  resultCents?: number;
}

/**
 * Área de faturamento (`--chart-1`, degradê suave) e, opcional, linha
 * tracejada de resultado (`--chart-2`). Um ponto só vira uma linha reta com
 * marcador — uma área precisa de dois pontos pra aparecer.
 */
export function InsightsTimelineChart({
  data,
  loading,
  title,
  description,
  showResult = false,
  resultLabel = "Resultado",
  className,
}: {
  data: TimelinePoint[] | undefined;
  loading: boolean;
  title: string;
  description?: string;
  showResult?: boolean;
  resultLabel?: string;
  className?: string;
}) {
  const gradientId = `insights-fill-${useId().replace(/:/g, "")}`;
  const config: ChartConfig = {
    revenueCents: { label: "Faturamento", color: "var(--chart-1)" },
    resultCents: { label: resultLabel, color: "var(--chart-2)" },
  };
  const hasValues = Boolean(data?.some((p) => p.revenueCents !== 0 || (p.resultCents ?? 0) !== 0));
  const single = data?.length === 1;
  const points = single && data ? [data[0], { ...data[0], date: `${data[0].date}${ZW}` }] : (data ?? []);
  const dot = { r: 4, strokeWidth: 2, stroke: "var(--surface)" };

  return (
    <InsightsPanel title={title} description={description} loading={loading} empty={!hasValues} emptyIcon="chart-line" emptyDescription="Vendas aparecem aqui conforme o movimento do período." className={className}>
      <ChartContainer config={config} className="aspect-auto h-60 w-full sm:h-72">
        <AreaChart data={points} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} tickFormatter={(v: string) => formatBucketLabel(stripZw(v))} ticks={single ? [points[0].date] : undefined} />
          <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => formatAxisBRL(v)} />
          <ChartTooltip
            cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
            content={<ChartTooltipContent labelFormatter={(v) => formatBucketLabel(stripZw(v))} formatter={(value, name, item) => <TooltipRow color={String(item.color)} label={config[String(name)]?.label ?? String(name)} value={formatBRLCents(Number(value))} />} />}
          />
          {showResult ? <ChartLegend content={<ChartLegendContent />} /> : null}
          <Area dataKey="revenueCents" type="monotone" stroke="var(--color-revenueCents)" strokeWidth={2} fill={`url(#${gradientId})`} dot={single ? { ...dot, fill: "var(--chart-1)" } : false} activeDot={{ ...dot, r: 5 }} isAnimationActive={false} />
          {showResult ? <Area dataKey="resultCents" type="monotone" stroke="var(--color-resultCents)" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={single ? { ...dot, fill: "var(--chart-2)" } : false} activeDot={{ ...dot, r: 5 }} isAnimationActive={false} /> : null}
        </AreaChart>
      </ChartContainer>
    </InsightsPanel>
  );
}

/* ---------- barras verticais (por hora, por dia da semana) ---------- */

export interface BucketPoint {
  label: string;
  value: number;
}

export function InsightsBarChart({
  data,
  loading,
  title,
  description,
  kind = "count",
  seriesLabel,
  color = "var(--chart-1)",
  className,
  emptyDescription,
}: {
  data: BucketPoint[] | undefined;
  loading: boolean;
  title: string;
  description?: string;
  kind?: "money" | "count";
  seriesLabel: string;
  color?: string;
  className?: string;
  emptyDescription?: string;
}) {
  const config: ChartConfig = { value: { label: seriesLabel, color } };
  const format = kind === "money" ? (v: number) => formatBRLCents(v) : (v: number) => v.toLocaleString("pt-BR");
  const empty = !data || data.length === 0 || data.every((d) => d.value === 0);

  return (
    <InsightsPanel title={title} description={description} loading={loading} empty={empty} emptyDescription={emptyDescription ?? "A distribuição aparece aqui conforme o movimento do período."} className={className}>
      <ChartContainer config={config} className="aspect-auto h-56 w-full sm:h-64">
        <BarChart data={data} margin={{ left: 0, right: 4, top: 8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={18} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} width={kind === "money" ? 64 : 36} allowDecimals={false} tickFormatter={(v: number) => (kind === "money" ? formatAxisBRL(v) : formatAxisCount(v))} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => <TooltipRow label={seriesLabel} value={format(Number(value))} />} />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </InsightsPanel>
  );
}

/* ---------- barras finas horizontais ---------- */

export interface ProportionRow {
  key: string | number;
  label: ReactNode;
  value: number;
  display: string;
  hint?: ReactNode;
  color?: string;
}

/**
 * Lista com barra fina proporcional (trilho `bg-surface-2`, preenchimento
 * `--chart-*`). `scale="total"` mostra a fatia de cada linha no todo (formas
 * de pagamento); `"max"` compara com o maior (ranking).
 */
export function ProportionBars({ rows, total, scale = "total", showShare = scale === "total", color = "var(--chart-1)", className }: { rows: ProportionRow[]; total?: number; scale?: "total" | "max"; showShare?: boolean; color?: string; className?: string }) {
  const sum = total ?? rows.reduce((acc, r) => acc + Math.max(0, r.value), 0);
  const max = rows.reduce((acc, r) => Math.max(acc, Math.abs(r.value)), 0);
  const base = scale === "total" ? sum : max;

  return (
    <ul className={cn("space-y-3.5", className)}>
      {rows.map((r, i) => {
        const share = sum > 0 ? Math.max(0, r.value) / sum : 0;
        const width = base > 0 ? Math.min(100, (Math.max(0, r.value) / base) * 100) : 0;
        return (
          <li key={r.key} className="fade-up min-w-0" style={{ ["--i" as string]: i } as CSSProperties}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{r.label}</span>
              <span className="tnum shrink-0 font-medium text-foreground">
                {r.display}
                {showShare ? <span className="ml-1.5 text-caption font-normal text-muted-foreground">{formatShare(share)}</span> : null}
              </span>
            </div>
            {r.hint ? <p className="mt-0.5 text-caption text-muted-foreground">{r.hint}</p> : null}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
              <div className="h-full rounded-pill" style={{ width: `${width}%`, background: r.color ?? color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- ranking numerado ---------- */

export interface RankRow {
  key: string | number;
  label: ReactNode;
  sublabel?: ReactNode;
  value: number;
  display: string;
  meta?: ReactNode;
}

/** Ranking com posição, nome, valor e barra fina relativa ao primeiro. */
export function RankList({ rows, color = "var(--chart-1)", className }: { rows: RankRow[]; color?: string; className?: string }) {
  const max = rows.reduce((acc, r) => Math.max(acc, r.value), 0);
  return (
    <ol className={cn("space-y-3.5", className)}>
      {rows.map((r, i) => (
        <li key={r.key} className="fade-up flex items-start gap-3" style={{ ["--i" as string]: i } as CSSProperties}>
          <span className="tnum mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-caption font-semibold text-muted-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">
                {r.label}
                {r.sublabel ? <span className="ml-1.5 font-normal text-muted-foreground">{r.sublabel}</span> : null}
              </p>
              <p className="tnum shrink-0 text-sm font-medium text-foreground">{r.display}</p>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-surface-2">
              <div className="h-full rounded-pill" style={{ width: `${max > 0 ? (Math.max(0, r.value) / max) * 100 : 0}%`, background: color }} />
            </div>
            {r.meta ? <p className="mt-1 text-caption text-muted-foreground">{r.meta}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
