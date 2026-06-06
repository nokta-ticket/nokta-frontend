"use client"

import { useEffect, useState } from "react"
import {
  BarChart2, TrendingUp, Ticket, DollarSign,
  ShoppingBag, Percent, CheckCircle2, Clock, XCircle,
} from "lucide-react"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { SectionProps } from "../types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendasData {
  faturamentoBruto:   number
  totalDesconto:      number
  ingressosVendidos:  number
  taxasEstimadas:     number
  valorLiquido:       number
  feePercent:         number
  vendasPorLote:      { lote: number; quantidade: number; valor: number }[]
  vendasPorTipo:      { nome: string; quantidade: number; valor: number }[]
  vendasPorDia:       { data: string; pedidos: number }[]
  pedidosRecentes:    {
    id: number; code: string; status: number; totalValue: number
    desconto: number; codigoCupom: string | null; quantidade: number
    comprador: string; email: string; criadoEm: string
  }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<number, { label: string; icon: React.ElementType; cls: string }> = {
  1: { label: "Pendente",  icon: Clock,         cls: "text-amber-600 bg-amber-50 border-amber-200"  },
  2: { label: "Pago",      icon: CheckCircle2,  cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  3: { label: "Cancelado", icon: XCircle,       cls: "text-red-600 bg-red-50 border-red-200"        },
  4: { label: "Falhou",    icon: XCircle,       cls: "text-gray-500 bg-gray-100 border-gray-200"    },
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
      {children}
    </div>
  )
}

function MetricCard({
  icon: Icon, label, value, sub, accent = false,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4 flex items-start gap-3",
      accent
        ? "border-primary/20 bg-primary/[0.04]"
        : "border-gray-200/80 bg-white",
    )}>
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
        accent ? "bg-primary/10" : "bg-gray-100",
      )}>
        <Icon className={cn("w-4 h-4", accent ? "text-primary" : "text-gray-500")} />
      </div>
      <div>
        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={cn("text-[18px] font-bold mt-0.5", accent ? "text-primary" : "text-gray-900")}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-3">{children}</p>
  )
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: { data: string; pedidos: number }[] }) {
  const max = Math.max(...data.map((d) => d.pedidos), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => (
        <div key={d.data} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t-sm bg-primary/70 group-hover:bg-primary transition-colors"
            style={{ height: `${Math.max(4, (d.pedidos / max) * 80)}px` }}
          />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
            {d.data}: {d.pedidos}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionVendas({ event }: SectionProps) {
  const [data,    setData]    = useState<VendasData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<VendasData>(`/produtor/eventos/${event.id}/vendas`)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Erro ao carregar dados de vendas"))
      .finally(() => setLoading(false))
  }, [event.id])

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <BarChart2 className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Vendas</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Desempenho comercial deste evento</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="py-16 text-center text-[13px] text-gray-400">
          Não foi possível carregar os dados.
        </div>
      ) : (
        <div className="p-6 space-y-7">

          {/* ── Métricas principais ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              accent
              icon={TrendingUp}
              label="Faturamento bruto"
              value={fmt(data.faturamentoBruto)}
              sub={data.totalDesconto > 0 ? `−${fmt(data.totalDesconto)} em cupons` : undefined}
            />
            <MetricCard
              icon={DollarSign}
              label="Valor líquido est."
              value={fmt(data.valorLiquido)}
              sub={`Taxa plataforma: ${data.feePercent}%`}
            />
            <MetricCard
              icon={Ticket}
              label="Ingressos vendidos"
              value={String(data.ingressosVendidos)}
            />
            <MetricCard
              icon={Percent}
              label="Taxas estimadas"
              value={fmt(data.taxasEstimadas)}
            />
            <MetricCard
              icon={ShoppingBag}
              label="Pedidos pagos"
              value={String(data.pedidosRecentes.filter((p) => p.status === 2).length)}
            />
          </div>

          {/* ── Gráfico de vendas por dia ── */}
          {data.vendasPorDia.length > 0 && (
            <div>
              <SectionTitle>Pedidos por dia (últimos 30 dias)</SectionTitle>
              <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 pt-8 pb-3">
                <MiniBarChart data={data.vendasPorDia} />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-gray-400">{data.vendasPorDia[0]?.data}</p>
                  <p className="text-[10px] text-gray-400">{data.vendasPorDia[data.vendasPorDia.length - 1]?.data}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Vendas por lote ── */}
          {data.vendasPorLote.length > 0 && (
            <div>
              <SectionTitle>Vendas por lote</SectionTitle>
              <div className="rounded-xl border border-gray-200/80 overflow-hidden">
                <div className="flex px-4 py-2 bg-gray-50/70 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Lote</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-28">Ingressos</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1 text-right">Valor</p>
                </div>
                {data.vendasPorLote.map((row) => (
                  <div key={row.lote} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <p className="text-[13px] font-semibold text-gray-800 w-24">{row.lote}º Lote</p>
                    <p className="text-[13px] text-gray-600 w-28">{row.quantidade}</p>
                    <p className="text-[13px] font-semibold text-gray-800 flex-1 text-right">{fmt(row.valor)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Vendas por tipo ── */}
          {data.vendasPorTipo.length > 0 && (
            <div>
              <SectionTitle>Vendas por tipo de ingresso</SectionTitle>
              <div className="rounded-xl border border-gray-200/80 overflow-hidden">
                <div className="flex px-4 py-2 bg-gray-50/70 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">Tipo</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-28">Ingressos</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-28 text-right">Valor</p>
                </div>
                {data.vendasPorTipo.map((row) => (
                  <div key={row.nome} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <p className="text-[13px] font-semibold text-gray-800 flex-1 truncate">{row.nome}</p>
                    <p className="text-[13px] text-gray-600 w-28">{row.quantidade}</p>
                    <p className="text-[13px] font-semibold text-gray-800 w-28 text-right">{fmt(row.valor)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pedidos recentes ── */}
          <div>
            <SectionTitle>Pedidos recentes</SectionTitle>
            {data.pedidosRecentes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <p className="text-[13px] text-gray-400">Nenhum pedido ainda.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200/80 overflow-hidden">
                <div className="flex px-4 py-2 bg-gray-50/70 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-28">Código</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex-1">Comprador</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24">Cupom</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-right">Total</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-24 text-right">Status</p>
                </div>
                {data.pedidosRecentes.map((pedido) => {
                  const st = ORDER_STATUS[pedido.status] ?? { label: "?", icon: Clock, cls: "text-gray-400 bg-gray-50 border-gray-200" }
                  const StatusIcon = st.icon
                  return (
                    <div key={pedido.id} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 gap-0">
                      <p className="text-[12px] font-mono text-gray-500 w-28 truncate">{pedido.code.slice(0, 8)}…</p>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{pedido.comprador}</p>
                        <p className="text-[11px] text-gray-400 truncate">{pedido.email}</p>
                      </div>
                      <div className="w-24">
                        {pedido.codigoCupom ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg">
                            {pedido.codigoCupom}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </div>
                      <p className="text-[13px] font-semibold text-gray-800 w-24 text-right">
                        {pedido.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <div className="w-24 flex justify-end">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 rounded-lg",
                          st.cls,
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </CardShell>
  )
}
