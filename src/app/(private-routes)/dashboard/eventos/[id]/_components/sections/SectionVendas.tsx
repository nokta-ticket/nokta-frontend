"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { ORDER_STATUS_META, ordinal } from "../../../_lib/event-meta";
import type { SectionProps } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendasData {
  faturamentoBruto: number;
  totalDesconto: number;
  ingressosVendidos: number;
  taxasEstimadas: number;
  valorLiquido: number;
  feePercent: number;
  vendasPorLote: { lote: number; quantidade: number; valor: number }[];
  vendasPorTipo: { nome: string; quantidade: number; valor: number }[];
  vendasPorDia: { data: string; pedidos: number }[];
  pedidosRecentes: {
    id: number;
    code: string;
    status: number;
    totalValue: number;
    desconto: number;
    codigoCupom: string | null;
    quantidade: number;
    comprador: string;
    email: string;
    criadoEm: string;
  }[];
}

function OrdersTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="scale-in rounded-xl border border-border bg-surface px-3 py-2 text-caption shadow-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground tnum">
        {payload[0].value} {payload[0].value === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionVendas({ event }: SectionProps) {
  const [data, setData] = useState<VendasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<VendasData>(`/produtor/eventos/${event.id}/vendas`)
      .then((res) => setData(res.data))
      .catch((err) => {
        const msg = getErrorMessage(err, "Não foi possível carregar as vendas.");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  if (error || !data) return <ErrorState title="Não deu pra carregar as vendas" description={error ?? undefined} onRetry={load} />;

  const paidOrders = data.pedidosRecentes.filter((p) => p.status === 2).length;
  const hasDaily = data.vendasPorDia.length > 0;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Faturamento bruto" icon="chart-line" format="currency" value={data.faturamentoBruto} hint={data.totalDesconto > 0 ? `−${formatBRL(data.totalDesconto)} em cupons` : "Sem descontos aplicados"} />
        <StatCard label="Você recebe" icon="sack-dollar" format="currency" value={data.valorLiquido} hint="Valor integral; as taxas são do comprador" />
        <StatCard label="Ingressos vendidos" icon="ticket" value={data.ingressosVendidos} />
        <StatCard label="Pedidos pagos" icon="receipt" value={paidOrders} hint="Entre os últimos pedidos" />
      </div>

      <Card className="fade-up">
        <CardHeader>
          <div>
            <CardTitle>Pedidos por dia</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {hasDaily ? (
            <div className="h-56 w-full sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.vendasPorDia} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vendas-dia-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="data" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={28} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={30} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }} content={<OrdersTooltip />} />
                  <Area type="monotone" dataKey="pedidos" stroke="var(--chart-1)" strokeWidth={2} fill="url(#vendas-dia-fill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--chart-1)" }} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState compact icon="chart-line" title="Sem pedidos nos últimos 30 dias" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="Vendas por lote" rows={data.vendasPorLote.map((r) => ({ key: String(r.lote), label: `${ordinal(r.lote)} lote`, quantidade: r.quantidade, valor: r.valor }))} empty="Nenhuma venda por lote ainda." />
        <BreakdownCard title="Vendas por tipo de ingresso" rows={data.vendasPorTipo.map((r) => ({ key: r.nome, label: r.nome, quantidade: r.quantidade, valor: r.valor }))} empty="Nenhuma venda por tipo ainda." />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pedidos recentes</h3>
        {data.pedidosRecentes.length === 0 ? (
          <EmptyState compact icon="receipt" title="Nenhum pedido ainda" description="Os pedidos aparecem aqui assim que alguém comprar." />
        ) : (
          <DataTableShell
            maxHeight="none"
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Pedido</DataTableHeadCell>
                    <DataTableHeadCell>Comprador</DataTableHeadCell>
                    <DataTableHeadCell>Cupom</DataTableHeadCell>
                    <DataTableHeadCell align="right">Ingressos</DataTableHeadCell>
                    <DataTableHeadCell align="right">Total</DataTableHeadCell>
                    <DataTableHeadCell>Status</DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {data.pedidosRecentes.map((p, i) => {
                    const st = ORDER_STATUS_META[p.status] ?? { label: "Desconhecido", tone: "neutral" as const };
                    return (
                      <DataTableRow key={p.id} index={i}>
                        <DataTableCell>
                          <span className="font-mono text-caption text-muted-foreground">{p.code}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <p className="font-semibold">{p.comprador}</p>
                          <p className="text-caption text-muted-foreground">{p.email}</p>
                        </DataTableCell>
                        <DataTableCell className={cn(!p.codigoCupom && "text-subtle-foreground")}>{p.codigoCupom ? <span className="rounded-md bg-brand-soft px-1.5 py-0.5 font-mono text-caption font-semibold text-brand">{p.codigoCupom}</span> : "—"}</DataTableCell>
                        <DataTableCell num>{p.quantidade}</DataTableCell>
                        <DataTableCell num className="font-semibold">
                          {formatBRL(p.totalValue)}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {data.pedidosRecentes.map((p, i) => {
                  const st = ORDER_STATUS_META[p.status] ?? { label: "Desconhecido", tone: "neutral" as const };
                  return <MobileCard key={p.id} index={i} title={p.comprador} subtitle={`${p.code} · ${p.email}`} badge={<StatusBadge tone={st.tone}>{st.label}</StatusBadge>} meta={[{ label: "Total", value: formatBRL(p.totalValue), num: true }, { label: "Ingressos", value: p.quantidade, num: true }, ...(p.codigoCupom ? [{ label: "Cupom", value: p.codigoCupom }] : [])]} />;
                })}
              </MobileCardList>
            }
          />
        )}
      </section>
    </div>
  );
}

function BreakdownCard({ title, rows, empty }: { title: string; rows: { key: string; label: string; quantidade: number; valor: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.valor));
  return (
    <Card className="fade-up">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-foreground">{r.label}</span>
                  <span className="shrink-0 text-muted-foreground tnum">
                    {r.quantidade.toLocaleString("pt-BR")} · <span className="font-semibold text-foreground">{formatBRL(r.valor)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-surface-3">
                  <div className="h-full rounded-pill bg-gradient-to-r from-brand-from to-brand-to transition-[width] duration-500 ease-out-soft" style={{ width: `${Math.round((r.valor / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
