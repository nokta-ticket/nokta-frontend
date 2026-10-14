"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "@/lib/axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type LinhaAPI = { mes: string; total: number };

function MonthTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="scale-in rounded-xl border border-border bg-surface px-3 py-2 text-caption shadow-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground tnum">{(payload[0].value ?? 0).toLocaleString("pt-BR")} ingressos</p>
    </div>
  );
}

/** Ingressos vendidos por mês (últimos 6 meses) — série única na cor da marca. */
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
      setData(Object.keys(months).map((label) => ({ mes: label, total: months[label] })));
    } catch (err) {
      setData([]);
      setError(getErrorMessage(err, "Não foi possível carregar a evolução de ingressos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const total = data.reduce((s, d) => s + d.total, 0);
  const range = data.length ? `${data[0].mes} – ${data[data.length - 1].mes}` : "";

  return (
    <Card className="fade-up">
      <CardHeader>
        <div>
          <CardTitle>Ingressos vendidos por mês</CardTitle>
          <CardDescription>{data.length ? `${total.toLocaleString("pt-BR")} ingressos · ${range}` : "Últimos 6 meses"}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : error ? (
          <ErrorState title="Não foi possível carregar o gráfico" description={error} onRetry={() => void getMonthlyData()} className="border-0" />
        ) : data.length === 0 ? (
          <EmptyState compact icon="chart-line" title="Sem vendas suficientes" description="Os ingressos vendidos por mês aparecem aqui quando houver pedidos confirmados." className="border-0" />
        ) : (
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="insights-ingressos-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => value.slice(0, 3)} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} content={<MonthTooltip />} />
                <Area type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} fill="url(#insights-ingressos-fill)" dot={{ r: 3, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--chart-1)" }} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--chart-1)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
