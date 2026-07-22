"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PageState } from "@/components/ui/page-state";
import api, { getErrorMessage } from "@/lib/axios";

type LinhaAPI = { mes: string; total: number };

const chartConfig: ChartConfig = {
  total: {
    label: "Ingressos vendidos",
    color: "var(--chart-2)",
  },
};

export function ChartAreaIngressos({ organizationId }: { organizationId: number }) {
  const [data, setData] = useState<LinhaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function getMonthlyData() {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/produtor/vendas-mensais", { params: { organizationId } });
      const months: Record<string, number> = res.data.months;
      const monthsData = Object.keys(months).map((label) => ({
        mes: label,
        total: months[label],
      }));

      setData(monthsData);
    } catch (err) {
      setData([]);
      setError(
        getErrorMessage(
          err,
          "Nao foi possivel carregar a evolucao de ingressos."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const footerRange = () => {
    if (data.length === 0) return "--";
    return `${data[0].mes} - ${data[data.length - 1].mes}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolucao de ingressos vendidos</CardTitle>
        <CardDescription>
          Total de ingressos vendidos nos ultimos 6 meses
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-64 animate-pulse rounded bg-muted" />
        ) : error ? (
          <PageState
            title="Nao foi possivel carregar o grafico"
            description={error}
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
            actionLabel="Tentar novamente"
            onAction={() => void getMonthlyData()}
          />
        ) : data.length === 0 ? (
          <PageState
            title="Sem vendas suficientes"
            description="Os ingressos vendidos por mes aparecerao aqui quando houver pedidos confirmados."
          />
        ) : (
          <>
            <ChartContainer config={chartConfig}>
              <AreaChart data={data} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="mes"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Area
                  dataKey="total"
                  type="linear"
                  fill="var(--color-total)"
                  fillOpacity={0.4}
                  stroke="var(--color-total)"
                />
              </AreaChart>
            </ChartContainer>
            <div className="mt-4 text-sm text-muted-foreground">
              {footerRange()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
