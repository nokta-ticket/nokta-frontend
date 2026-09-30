"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCentsBRL } from "@/services/venue-finance";
import { ChartCard } from "./chart-card";
import { BlockSkeleton } from "./states/loading-state";
import { EmptyState } from "./states/empty-state";

export interface FinanceTimelinePoint {
  date: string;
  revenueCents: number;
  resultCents: number;
}

function timelineConfig(resultLabel: string): ChartConfig {
  return {
    revenueCents: { label: "Faturamento", color: "var(--primary)" },
    resultCents: { label: resultLabel, color: "var(--color-chart-3)" },
  };
}

const HIDDEN_VALUE = "R$ •••";

/** "2026-09-30" → "30/09". */
function formatDayMonth(date: string): string {
  const [, m, d] = date.split("-");
  return d && m ? `${d}/${m}` : date;
}

/**
 * Sem vendas no período, desenha a linha reta no zero sobre os dias do
 * período (`zeroDates`) em vez de um estado vazio. Um dia só vira dois
 * pontos no mesmo dia — uma área precisa de dois pontos para aparecer.
 */
function zeroSeries(dates: string[]): FinanceTimelinePoint[] {
  const points = dates.map((date) => ({ date, revenueCents: 0, resultCents: 0 }));
  return points.length === 1 ? [points[0], { ...points[0], date: `${points[0].date}​` }] : points;
}

/** Gráfico de faturamento/resultado ao longo do tempo — reaproveitado por Venue e Tickets. */
export function FinanceTimelineChart({
  data,
  isLoading,
  title = "Desempenho Financeiro",
  description = "Faturamento e resultado nos últimos 7 dias",
  className,
  showResult = true,
  resultLabel = "Resultado",
  zeroDates,
  hideValues = false,
}: {
  data: FinanceTimelinePoint[] | undefined;
  isLoading: boolean;
  title?: string;
  description?: string;
  className?: string;
  /** Linha tracejada de resultado. */
  showResult?: boolean;
  /** Nome da linha tracejada na legenda e no tooltip. */
  resultLabel?: string;
  /** Dias do período: com eles, período sem vendas vira linha reta no zero. */
  zeroDates?: string[];
  /** "Ocultar valores": esconde os valores em dinheiro do eixo e do tooltip. */
  hideValues?: boolean;
}) {
  const isEmpty = !data || data.length === 0;
  const points = isEmpty && zeroDates && zeroDates.length > 0 ? zeroSeries(zeroDates) : data;
  const formatMoney = (v: number) => (hideValues ? HIDDEN_VALUE : formatCentsBRL(v));
  const config = timelineConfig(resultLabel);

  return (
    <ChartCard title={title} description={description} className={className}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !points || points.length === 0 ? (
        <EmptyState title="Sem dados no período" description="Vendas e resultado aparecerão aqui conforme o movimento do período." />
      ) : (
        <ChartContainer config={config} className="max-h-72 w-full">
          <AreaChart data={points} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="financeRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) => formatDayMonth(v.replace("​", ""))}
              ticks={points.length === 2 && points[1].date.endsWith("​") ? [points[0].date] : undefined}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatMoney}
              width={90}
              domain={isEmpty ? [0, 100_000] : undefined}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v) => formatDayMonth(String(v).replace("​", ""))}
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span>
                      <span className="font-mono font-medium tabular-nums">{formatMoney(Number(value))}</span>
                    </span>
                  )}
                />
              }
            />
            {showResult ? <ChartLegend content={<ChartLegendContent />} /> : null}
            <Area
              dataKey="revenueCents"
              type="monotone"
              stroke="var(--color-revenueCents)"
              strokeWidth={3}
              fill="url(#financeRevenueFill)"
              dot={points.length === 1}
              isAnimationActive={false}
            />
            {showResult ? (
              <Area
                dataKey="resultCents"
                type="monotone"
                stroke="var(--color-resultCents)"
                strokeWidth={2}
                fill="none"
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
