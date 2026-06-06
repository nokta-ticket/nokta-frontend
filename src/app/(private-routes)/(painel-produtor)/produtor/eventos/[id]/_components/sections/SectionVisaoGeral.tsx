"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, MapPin, Ticket, ImageIcon, Globe, FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { SectionProps } from "../types"
import { formatarDataCurta } from "@/lib/formatarData"
import { cn } from "@/lib/utils"

const STATUS_BADGE: Record<number, { label: string; className: string; dot: string }> = {
  1: { label: "Rascunho",   className: "bg-gray-100 text-gray-600",      dot: "bg-gray-400" },
  2: { label: "Ativo",      className: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  3: { label: "Cancelado",  className: "bg-red-100 text-red-600",        dot: "bg-red-500" },
  4: { label: "Finalizado", className: "bg-blue-100 text-blue-600",      dot: "bg-blue-500" },
}

export default function SectionVisaoGeral({ event, onRefresh }: SectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const badge = STATUS_BADGE[event.status] ?? { label: "Desconhecido", className: "bg-gray-100 text-gray-500", dot: "bg-gray-400" }

  const totalCapacity = event.ingressos?.reduce((acc, t) => acc + t.quantidade, 0) ?? 0
  const hasImages   = (event.thumbnails?.length ?? 0) > 0
  const hasTickets  = (event.ingressos?.length ?? 0) > 0
  const hasDate     = !!event.data
  const hasAddress  = !!event.endereco?.logradouro

  const checklist = [
    { label: "Data e horário configurados",      done: hasDate },
    { label: "Endereço do evento preenchido",     done: hasAddress },
    { label: "Ingressos criados",                done: hasTickets },
    { label: "Imagens adicionadas",              done: hasImages },
    { label: event.status === 2 ? "Evento publicado e ativo" : "Evento publicado", done: event.status === 2 },
  ]

  const doneCt = checklist.filter((i) => i.done).length

  const goTo = (tab: string) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set("tab", tab)
    router.push(`?${p.toString()}`, { scroll: false })
  }

  const quickNav = [
    {
      key: "informacoes",
      label: "Informações",
      icon: FileText,
      desc: event.nome ? `"${event.nome.slice(0, 30)}${event.nome.length > 30 ? "…" : ""}"` : "Sem nome definido",
    },
    {
      key: "ingressos",
      label: "Ingressos",
      icon: Ticket,
      desc: hasTickets
        ? `${event.ingressos.length} lote${event.ingressos.length > 1 ? "s" : ""} · ${totalCapacity} ingressos`
        : "Nenhum lote criado",
    },
    {
      key: "imagens",
      label: "Imagens",
      icon: ImageIcon,
      desc: `${event.thumbnails?.length ?? 0} de 3 imagens adicionadas`,
    },
    {
      key: "publicacao",
      label: "Publicação",
      icon: Globe,
      desc: event.status === 2 ? "Publicado e visível ao público" : event.status === 1 ? "Rascunho — não visível" : badge.label,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-gray-900">Status do Evento</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Progresso de configuração</p>
            </div>
            <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold", badge.className)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
              {badge.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-500">Configuração completa</span>
              <span className="text-[11px] font-semibold text-gray-700">{doneCt}/{checklist.length}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(doneCt / checklist.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                )}
                <span className={cn("text-[12px]", item.done ? "text-gray-600" : "text-amber-600 font-medium")}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Data",     value: event.data    ? formatarDataCurta(event.data) : "–" },
          { label: "Horário",  value: event.horario ? event.horario.slice(0, 5) : "–" },
          { label: "Ingressos", value: String(totalCapacity) },
          { label: "Lotes",    value: String(event.ingressos?.length ?? 0) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
            <p className="text-[11px] text-gray-500 font-medium mb-1">{stat.label}</p>
            <p className="text-[15px] font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickNav.map((qs) => {
          const Icon = qs.icon
          return (
            <button
              key={qs.key}
              onClick={() => goTo(qs.key)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border border-gray-200/80 bg-white",
                "text-left shadow-sm hover:shadow-md hover:-translate-y-[1px]",
                "transition-all duration-200 group"
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">{qs.label}</p>
                <p className="text-[11px] text-gray-500 truncate">{qs.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary/60 transition-colors shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Address */}
      {hasAddress && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Localização</p>
          </div>
          <p className="text-[13px] text-gray-800 font-medium">
            {event.endereco?.logradouro}, {event.endereco?.numero}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {event.endereco.bairro} – {event.endereco.localidade}/{event.endereco.uf}
          </p>
        </div>
      )}
    </div>
  )
}
