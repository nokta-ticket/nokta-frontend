"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, Calendar, Ticket } from "lucide-react"
import { EventoData } from "./types"
import { formatarDataCurta } from "@/lib/formatarData"
import { cn } from "@/lib/utils"

const STATUS_BADGE: Record<number, { label: string; className: string }> = {
  1: { label: "Rascunho",   className: "bg-gray-100 text-gray-600 border-gray-200" },
  2: { label: "Ativo",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  3: { label: "Cancelado",  className: "bg-red-50 text-red-600 border-red-200" },
  4: { label: "Finalizado", className: "bg-blue-50 text-blue-600 border-blue-200" },
}

interface Props {
  event: EventoData
}

export function EventoEditorHeader({ event }: Props) {
  const badge = STATUS_BADGE[event.status] ?? { label: "Desconhecido", className: "bg-gray-100 text-gray-500 border-gray-200" }
  const totalCapacity = event.ingressos?.reduce((acc, t) => acc + t.quantidade, 0) ?? 0

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/produtor/eventos"
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Meus Eventos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-[13px] text-gray-700 font-medium truncate max-w-[300px]">
          {event.nome || "Evento sem nome"}
        </span>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[17px] font-semibold text-gray-900 leading-tight">
                {event.nome || "Evento sem nome"}
              </h1>
              <Badge className={cn("text-[11px] font-semibold border px-2.5 py-0.5", badge.className)}>
                {badge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{event.data ? formatarDataCurta(event.data) : "Data não definida"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <Ticket className="w-3.5 h-3.5" />
                <span>
                  {totalCapacity} {totalCapacity === 1 ? "ingresso disponível" : "ingressos disponíveis"}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link href={`/eventos/${event.id}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-[13px] border-gray-200 hover:border-gray-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visualizar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
