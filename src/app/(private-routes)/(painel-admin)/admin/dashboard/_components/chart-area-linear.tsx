"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import api, { getErrorMessage } from "@/lib/axios";
import { RefreshButton } from "../../_components/refresh-button";

type Ponto = { mes: string; total: number };

function ChartTip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-caption shadow-2">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <span className="size-2 rounded-full bg-chart-1" aria-hidden />
        {value.toLocaleString("pt-BR")} {value === 1 ? "evento criado" : "eventos criados"}
      </p>
    </div>
  );
}

/** Eventos criados por mês (`GET /admin/dashboard/eventos-mensais` → `{ months: { [mês]: total } }`). */
export function ChartAreaLinear() {
  const [data, setData] = useState<Ponto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const res = await api.get<{ months: Record<string, number> }>("/admin/dashboard/eventos-mensais");
      const months = res.data.months ?? {};
      setData(Object.keys(months).map((mes) => ({ mes, total: months[mes] })));
    } catch (err) {
      setData([]);
      setError(getErrorMessage(err, "Não foi possível carregar a evolução de eventos."));
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.reduce((acc, p) => acc + p.total, 0) ?? 0;
  const range = data && data.length > 0 ? `${data[0].mes} – ${data[data.length - 1].mes}` : null;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Eventos criados por mês</CardTitle>
          <CardDescription>
            {range ? `${range} · ${total.toLocaleString("pt-BR")} no período` : "Últimos 6 meses"}
          </CardDescription>
        </div>
        <RefreshButton onClick={() => void load()} pending={pending} />
      </CardHeader>
      <CardContent className="pt-3">
        {data === null ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : error ? (
          <ErrorState title="Não deu pra carregar o gráfico" description={error} onRetry={() => void load()} />
        ) : data.length === 0 ? (
          <EmptyState compact icon="chart-line" title="Sem dados suficientes" description="Os eventos por mês aparecem aqui conforme a plataforma receber novos cadastros." />
        ) : (
          <div className="h-64 w-full text-caption">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-eventos-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v: string) => v.slice(0, 3)} />
                <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }} />
                <Tooltip cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} content={<ChartTip />} />
                <Area dataKey="total" type="monotone" stroke="var(--chart-1)" strokeWidth={2} fill="url(#admin-eventos-fill)" activeDot={{ r: 5, fill: "var(--chart-1)", stroke: "var(--surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
