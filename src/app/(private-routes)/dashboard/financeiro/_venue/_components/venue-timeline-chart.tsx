"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis, type TooltipProps } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import type { VenueFinanceTimelinePoint } from "@/services/venue-finance";
import { formatCompactBRL, formatDayLong, formatDayMonth } from "./finance-shared";

/** Sufixo invisível pra duplicar um dia só (uma área precisa de dois pontos). */
const DUP = "​";

interface Point {
  date: string;
  revenueCents: number;
  resultCents: number;
}

const CONFIG: ChartConfig = {
  revenueCents: { label: "Receita", color: "var(--chart-1)" },
  resultCents: { label: "Resultado", color: "var(--chart-2)" },
};

function buildPoints(data: VenueFinanceTimelinePoint[] | undefined, zeroDates: string[]): { points: Point[]; empty: boolean } {
  const hasSales = Boolean(data && data.some((p) => p.revenueCents !== 0 || p.resultCents !== 0));
  const base: Point[] = hasSales && data ? data.map((p) => ({ date: p.date, revenueCents: p.revenueCents, resultCents: p.resultCents })) : zeroDates.map((date) => ({ date, revenueCents: 0, resultCents: 0 }));
  const points = base.length === 1 ? [base[0], { ...base[0], date: `${base[0].date}${DUP}` }] : base;
  return { points, empty: !hasSales };
}

function TimelineTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const day = String(label ?? "").replace(DUP, "");
  return (
    <div className="min-w-[11rem] rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-2">
      <p className="text-caption font-medium text-muted-foreground">{formatDayLong(day)}</p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey);
          const dashed = key === "resultCents";
          return (
            <li key={key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-caption text-muted-foreground">
                <span aria-hidden className={cn("inline-block h-0 w-3.5 border-t-2", dashed ? "border-dashed" : "border-solid")} style={{ borderColor: item.color }} />
                {CONFIG[key]?.label ?? item.name}
              </span>
              <span className="tnum text-sm font-semibold text-foreground">{formatBRLCents(Number(item.value ?? 0))}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Receita (área, `--chart-1`) e resultado (linha tracejada, `--chart-2`) por
 * dia. Sem vendas no período, desenha a linha reta no zero sobre `zeroDates`
 * em vez de um estado vazio. Um dia só vira dois pontos no mesmo dia.
 */
export function VenueTimelineChart({ data, isLoading, isFetching, isError, onRetry, zeroDates, periodLabel }: { data: VenueFinanceTimelinePoint[] | undefined; isLoading: boolean; isFetching?: boolean; isError?: boolean; onRetry?: () => void; zeroDates: string[]; periodLabel: string }) {
  const { points, empty } = useMemo(() => buildPoints(data, zeroDates), [data, zeroDates]);
  const singleDay = points.length === 2 && points[1].date.endsWith(DUP);
  const hasNegative = points.some((p) => p.resultCents < 0);
  const totals = useMemo(() => {
    const src = singleDay ? [points[0]] : points;
    return { revenue: src.reduce((s, p) => s + p.revenueCents, 0), result: src.reduce((s, p) => s + p.resultCents, 0) };
  }, [points, singleDay]);

  return (
    <Card>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <CardTitle>Receita e resultado por dia</CardTitle>
          <CardDescription>{empty ? `Sem vendas em ${periodLabel.toLowerCase()}` : `Resultado = receita − taxas − CMV − despesas, em ${periodLabel.toLowerCase()}`}</CardDescription>
        </div>
        <ul className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1.5 text-caption text-muted-foreground" aria-label="Legenda">
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-solid" style={{ borderColor: "var(--chart-1)" }} />
            Receita <span className="tnum font-semibold text-foreground">{formatBRLCents(totals.revenue)}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--chart-2)" }} />
            Resultado <span className={cn("tnum font-semibold", totals.result < 0 ? "text-money-out" : "text-foreground")}>{formatBRLCents(totals.result)}</span>
          </li>
        </ul>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-56 w-full sm:h-64" />
        ) : isError ? (
          <ErrorState description="Não foi possível carregar a linha do tempo." onRetry={onRetry} className="py-8" />
        ) : (
          <ChartContainer config={CONFIG} className={cn("aspect-auto h-56 w-full transition-opacity duration-300 sm:h-64", isFetching && "opacity-60")}>
            <AreaChart data={points} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="venueFinanceRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 6" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={28}
                interval="preserveStartEnd"
                tickFormatter={(v: string) => formatDayMonth(v.replace(DUP, ""))}
                ticks={singleDay ? [points[0].date] : undefined}
              />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => formatCompactBRL(v)} domain={empty ? [0, 100_000] : hasNegative ? ["auto", "auto"] : [0, "auto"]} />
              {hasNegative ? <ReferenceLine y={0} stroke="var(--border-strong)" /> : null}
              <ChartTooltip cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} content={<TimelineTooltip />} />
              <Area dataKey="revenueCents" type="monotone" stroke="var(--chart-1)" strokeWidth={2} fill="url(#venueFinanceRevenueFill)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} isAnimationActive={false} />
              <Area dataKey="resultCents" type="monotone" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
