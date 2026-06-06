"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Globe, EyeOff, CheckCircle2, AlertCircle, Ban, Clock } from "lucide-react"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { SectionProps } from "../types"

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-[0_4px_24px_-6px_rgb(0_0_0/0.10),_0_2px_8px_-3px_rgb(0_0_0/0.06)]">
      <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
      {children}
    </div>
  )
}

const STATUS_INFO: Record<number, { icon: any; label: string; desc: string; color: string; bg: string }> = {
  1: {
    icon: EyeOff,
    label: "Rascunho",
    desc: "O evento está oculto e não pode ser encontrado pelo público.",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
  2: {
    icon: CheckCircle2,
    label: "Publicado e Ativo",
    desc: "O evento está visível ao público e recebendo vendas.",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  3: {
    icon: Ban,
    label: "Cancelado",
    desc: "O evento foi cancelado e não pode ser reativado.",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  4: {
    icon: Clock,
    label: "Finalizado",
    desc: "O evento foi encerrado automaticamente pelo sistema.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
}

export default function SectionPublicacao({ event, onRefresh }: SectionProps) {
  const [loading, setLoading] = useState(false)

  const isDraft     = event.status === 1
  const isPublished = event.status === 2
  const isTerminal  = event.status === 3 || event.status === 4

  const statusInfo = STATUS_INFO[event.status] ?? STATUS_INFO[1]
  const StatusIcon = statusInfo.icon

  const hasImages  = (event.thumbnails?.length ?? 0) > 0
  const hasTickets = (event.ingressos?.length ?? 0) > 0
  const canPublish = hasImages && hasTickets

  const publish = async () => {
    setLoading(true)
    try {
      await api.patch(`/produtor/eventos/${event.id}/publicar`)
      toast.success("Evento publicado com sucesso!")
      onRefresh()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao publicar evento"))
    } finally {
      setLoading(false)
    }
  }

  const unpublish = async () => {
    setLoading(true)
    try {
      await api.patch(`/produtor/eventos/${event.id}/despublicar`)
      toast.success("Evento despublicado. Agora está como Rascunho.")
      onRefresh()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao despublicar evento"))
    } finally {
      setLoading(false)
    }
  }

  const checklist = [
    { label: "Ao menos 1 imagem adicionada", done: hasImages, tab: "imagens" },
    { label: "Ao menos 1 lote de ingressos criado", done: hasTickets, tab: "ingressos" },
  ]

  return (
    <CardShell>
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Globe className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Publicação</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Controle a visibilidade do evento na plataforma</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Status atual */}
        <div className={cn("flex items-start gap-3 rounded-xl border px-5 py-4", statusInfo.bg)}>
          <StatusIcon className={cn("w-5 h-5 mt-0.5 shrink-0", statusInfo.color)} />
          <div>
            <p className={cn("text-[13px] font-semibold", statusInfo.color)}>{statusInfo.label}</p>
            <p className="text-[12px] text-gray-600 mt-0.5">{statusInfo.desc}</p>
          </div>
        </div>

        {/* Requisitos para publicação (somente quando rascunho) */}
        {isDraft && (
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-5 py-4 space-y-3">
            <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">
              Requisitos para publicação
            </p>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.tab} className="flex items-center gap-2.5">
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
        )}

        {/* Ações */}
        {!isTerminal && (
          <div className="space-y-3">
            {isDraft && (
              <Button
                onClick={publish}
                disabled={loading || !canPublish}
                className={cn(
                  "w-full h-12 gap-2.5 rounded-xl text-[14px] font-bold",
                  "bg-primary text-white",
                  "hover:bg-primary/90 hover:shadow-[0_8px_28px_-4px_oklch(0.606_0.25_292.717/0.55)]",
                  "hover:scale-[1.01] active:scale-[0.98] transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                )}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />Publicando...</>
                ) : (
                  <><Globe className="w-4 h-4" />Publicar evento</>
                )}
              </Button>
            )}

            {isPublished && (
              <div className="space-y-2">
                <p className="text-[12px] text-gray-500 text-center">
                  Despublicar move o evento para Rascunho. Só é possível se não houver pedidos confirmados.
                </p>
                <Button
                  onClick={unpublish}
                  disabled={loading}
                  variant="outline"
                  className={cn(
                    "w-full h-11 gap-2 rounded-xl text-[13px] font-semibold",
                    "border-gray-200 text-gray-700",
                    "hover:bg-gray-50 hover:border-gray-300",
                    "active:scale-[0.98] transition-all duration-150",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-gray-400/60 border-t-gray-500 rounded-full animate-spin" />Processando...</>
                  ) : (
                    <><EyeOff className="w-4 h-4" />Despublicar evento</>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {isTerminal && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-5 py-4 text-center">
            <p className="text-[13px] text-gray-500">
              Nenhuma ação disponível para eventos cancelados ou finalizados.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  )
}
