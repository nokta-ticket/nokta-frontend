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

const timelineConfig: ChartConfig = {
  revenueCents: { label: "Faturamento", color: "var(--primary)" },
  resultCents: { label: "Resultado", color: "var(--color-chart-3)" },
};

/** Gráfico de faturamento/resultado ao longo do tempo — reaproveitado por Venue e Tickets. */
export function FinanceTimelineChart({
  data,
  isLoading,
  title = "Desempenho Financeiro",
  description = "Faturamento e resultado nos últimos 7 dias",
  className,
}: {
  data: FinanceTimelinePoint[] | undefined;
  isLoading: boolean;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <ChartCard title={title} description={description} className={className}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sem dados no período" description="Vendas e resultado aparecerão aqui conforme o movimento do período." />
      ) : (
        <ChartContainer config={timelineConfig} className="max-h-72 w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="financeRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCentsBRL(v)} width={90} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="revenueCents"
              type="monotone"
              stroke="var(--color-revenueCents)"
              strokeWidth={3}
              fill="url(#financeRevenueFill)"
              dot={false}
            />
            <Area dataKey="resultCents" type="monotone" stroke="var(--color-resultCents)" strokeWidth={2} fill="none" strokeDasharray="5 5" dot={false} />
          </AreaChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
