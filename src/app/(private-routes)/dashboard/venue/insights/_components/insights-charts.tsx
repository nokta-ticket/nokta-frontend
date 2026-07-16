"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartCard } from "../../../_components/chart-card";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { EmptyState } from "../../../_components/states/empty-state";
import { formatCentsBRL } from "@/services/venue-insights";

const timelineConfig: ChartConfig = {
  revenueCents: { label: "Faturamento", color: "var(--chart-1)" },
  resultCents: { label: "Resultado", color: "var(--chart-2)" },
};

export function InsightsTimelineChart({
  data,
  isLoading,
  title = "Faturamento e resultado",
  description = "Evolução ao longo do período selecionado",
}: {
  data: { date: string; revenueCents: number; resultCents: number }[] | undefined;
  isLoading: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sem dados no período" description="Vendas e resultado aparecerão aqui conforme o movimento do período." />
      ) : (
        <ChartContainer config={timelineConfig} className="max-h-72 w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCentsBRL(v)} width={90} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="revenueCents" type="monotone" stroke="var(--color-revenueCents)" strokeWidth={2} dot={false} />
            <Line dataKey="resultCents" type="monotone" stroke="var(--color-resultCents)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const amountByBucketConfig: ChartConfig = {
  amountCents: { label: "Valor", color: "var(--chart-1)" },
};

export function InsightsAmountByHourChart({
  data,
  isLoading,
  title,
  description,
}: {
  data: { hour: number; amountCents: number }[] | undefined;
  isLoading: boolean;
  title: string;
  description?: string;
}) {
  const rows = (data ?? []).map((d) => ({ ...d, label: `${String(d.hour).padStart(2, "0")}h` }));
  return (
    <ChartCard title={title} description={description}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : rows.every((r) => r.amountCents === 0) ? (
        <EmptyState title="Sem dados no período" description="A distribuição por horário aparecerá aqui conforme o movimento do período." />
      ) : (
        <ChartContainer config={amountByBucketConfig} className="max-h-72 w-full">
          <BarChart data={rows} margin={{ left: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2} />
            <YAxis tickFormatter={(v: number) => formatCentsBRL(v)} tickLine={false} axisLine={false} width={90} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <Bar dataKey="amountCents" fill="var(--color-amountCents)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const countByBucketConfig: ChartConfig = {
  count: { label: "Quantidade", color: "var(--chart-3)" },
};

export function InsightsCountByWeekdayChart({
  data,
  isLoading,
  title,
  description,
  dataKey = "count",
}: {
  data: { label: string; [key: string]: number | string }[] | undefined;
  isLoading: boolean;
  title: string;
  description?: string;
  dataKey?: string;
}) {
  return (
    <ChartCard title={title} description={description}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !data || data.every((r) => Number(r[dataKey]) === 0) ? (
        <EmptyState title="Sem dados no período" description="A distribuição por dia da semana aparecerá aqui conforme o movimento do período." />
      ) : (
        <ChartContainer config={countByBucketConfig} className="max-h-72 w-full">
          <BarChart data={data} margin={{ left: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={50} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={dataKey} fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

export function InsightsHorizontalMoneyBarChart({
  data,
  isLoading,
  title,
  description,
  dataKey,
  labelKey,
  emptyTitle = "Sem dados no período",
  emptyDescription = "Os dados aparecerão aqui conforme o movimento do período.",
}: {
  data: Record<string, unknown>[] | undefined;
  isLoading: boolean;
  title: string;
  description?: string;
  dataKey: string;
  labelKey: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const config: ChartConfig = { [dataKey]: { label: "Valor", color: "var(--chart-4)" } };
  return (
    <ChartCard title={title} description={description}>
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !data || data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ChartContainer config={config} className="max-h-72 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => formatCentsBRL(v)} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey={labelKey} tickLine={false} axisLine={false} width={110} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

export function InsightsLocationComparisonChart({
  data,
  isLoading,
}: {
  data: { nome: string; operationalResultCents: number }[] | undefined;
  isLoading: boolean;
}) {
  if (!data || data.length < 2) return null;
  const config: ChartConfig = { operationalResultCents: { label: "Resultado estimado", color: "var(--chart-2)" } };
  return (
    <ChartCard title="Comparação entre unidades" description="Resultado operacional estimado por unidade, no mesmo período">
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : (
        <ChartContainer config={config} className="max-h-72 w-full">
          <BarChart data={data} margin={{ left: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="nome" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v: number) => formatCentsBRL(v)} tickLine={false} axisLine={false} width={90} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <Bar dataKey="operationalResultCents" fill="var(--color-operationalResultCents)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
