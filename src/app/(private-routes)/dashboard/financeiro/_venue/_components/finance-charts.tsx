"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartCard } from "../../../_components/chart-card";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { EmptyState } from "../../../_components/states/empty-state";
import {
  formatCentsBRL,
  VENUE_PAYMENT_METHOD_LABEL,
  type VenueFinanceExpenseByCategory,
  type VenueFinanceLocationComparison,
  type VenueFinancePaymentMethodBucket,
} from "@/services/venue-finance";

export { FinanceTimelineChart } from "../../../_components/finance-timeline-chart";

const paymentMethodsConfig: ChartConfig = {
  netCents: { label: "Líquido estimado", color: "var(--chart-1)" },
};

export function FinancePaymentMethodsChart({ data, isLoading }: { data: VenueFinancePaymentMethodBucket[] | undefined; isLoading: boolean }) {
  const rows = (data ?? []).map((d) => ({ ...d, label: VENUE_PAYMENT_METHOD_LABEL[d.method] }));
  return (
    <ChartCard title="Vendas por forma de pagamento" description="Valor líquido estimado por método">
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState title="Sem vendas no período" description="As formas de pagamento aparecerão aqui conforme os pagamentos forem confirmados." />
      ) : (
        <ChartContainer config={paymentMethodsConfig} className="max-h-72 w-full">
          <BarChart data={rows} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => formatCentsBRL(v)} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={90} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <Bar dataKey="netCents" fill="var(--color-netCents)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const expensesConfig: ChartConfig = {
  amountCents: { label: "Valor", color: "var(--chart-5)" },
};

export function FinanceExpensesByCategoryChart({ data, isLoading }: { data: VenueFinanceExpenseByCategory[] | undefined; isLoading: boolean }) {
  return (
    <ChartCard title="Despesas por categoria" description="Distribuição das despesas no período">
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sem despesas no período" description="As despesas pagas ou incorridas aparecerão aqui por categoria." />
      ) : (
        <ChartContainer config={expensesConfig} className="max-h-72 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={(v: number) => formatCentsBRL(v)} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={110} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCentsBRL(Number(value))} />} />
            <Bar dataKey="amountCents" fill="var(--color-amountCents)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}

const comparisonConfig: ChartConfig = {
  operationalResultCents: { label: "Resultado estimado", color: "var(--chart-2)" },
};

export function FinanceLocationComparisonChart({ data, isLoading }: { data: VenueFinanceLocationComparison[] | undefined; isLoading: boolean }) {
  if (!data || data.length < 2) return null;
  return (
    <ChartCard title="Comparação entre unidades" description="Resultado operacional estimado por unidade, no mesmo período">
      {isLoading ? (
        <BlockSkeleton className="h-64" />
      ) : (
        <ChartContainer config={comparisonConfig} className="max-h-72 w-full">
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
