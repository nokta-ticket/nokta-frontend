"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, Trash2, XCircle, ShieldAlert } from "lucide-react"
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

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description: string
  confirmLabel: string
  confirmClass?: string
  onConfirm: () => void
  loading?: boolean
}

function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel, confirmClass, onConfirm, loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 gap-0 overflow-hidden border-gray-200/80">
        <div className="h-[3px] bg-gradient-to-r from-destructive via-destructive/80 to-destructive/30" />
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-[15px] font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">{description}</p>
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-xl text-[13px]"
          >
            Voltar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn("h-10 px-5 rounded-xl text-[13px] font-semibold text-white", confirmClass)}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin mr-2" />Aguarde...</>
            ) : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SectionConfiguracoes({ event, onRefresh }: SectionProps) {
  const router = useRouter()
  const [cancelOpen,  setCancelOpen]  = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  const isDraft     = event.status === 1
  const isPublished = event.status === 2
  const isTerminal  = event.status === 3 || event.status === 4

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.patch(`/produtor/eventos/${event.id}/cancelar`)
      toast.success("Evento cancelado.")
      setCancelOpen(false)
      onRefresh()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao cancelar evento"))
    } finally {
      setCancelling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/produtor/eventos/${event.id}`)
      toast.success("Evento excluído.")
      router.push("/dashboard/eventos")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao excluir evento"))
      setDeleting(false)
    }
  }

  return (
    <CardShell>
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Settings className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-gray-900">Configurações</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Ações avançadas e zona de perigo</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="rounded-xl border border-red-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-red-50 border-b border-red-100">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Zona de Perigo</p>
          </div>

          <div className="px-5 py-4 space-y-5">
            {/* Cancelar */}
            {(isDraft || isPublished) && (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-gray-900">Cancelar Evento</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 max-w-sm">
                    O evento será marcado como Cancelado e não aparecerá mais para o público.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  className={cn(
                    "shrink-0 h-10 px-5 gap-2 rounded-xl text-[13px] font-semibold",
                    "border-orange-200 text-orange-600",
                    "hover:bg-orange-50 hover:border-orange-300",
                    "active:scale-[0.97] transition-all duration-150"
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Evento
                </Button>
              </div>
            )}

            {/* Excluir */}
            {isDraft && (
              <>
                {(isDraft || isPublished) && <div className="border-t border-red-100" />}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-gray-900">Excluir Evento</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 max-w-sm">
                      Remove permanentemente o evento e todas suas imagens.
                      Disponível apenas para rascunhos sem pedidos vinculados.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(true)}
                    className={cn(
                      "shrink-0 h-10 px-5 gap-2 rounded-xl text-[13px] font-semibold",
                      "border-red-200 text-red-600",
                      "hover:bg-red-50 hover:border-red-300",
                      "active:scale-[0.97] transition-all duration-150"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Evento
                  </Button>
                </div>
              </>
            )}

            {isTerminal && (
              <div className="py-4 text-center">
                <p className="text-[13px] text-gray-500">
                  Nenhuma ação disponível para eventos cancelados ou finalizados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diálogos de confirmação */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancelar "${event.nome}"?`}
        description="O evento será marcado como Cancelado e ficará invisível para novos compradores. Esta ação não pode ser desfeita."
        confirmLabel="Confirmar cancelamento"
        confirmClass="bg-orange-500 hover:bg-orange-600"
        onConfirm={handleCancel}
        loading={cancelling}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${event.nome}" permanentemente?`}
        description="Esta ação é irreversível. O evento, imagens e todos os dados associados serão removidos definitivamente."
        confirmLabel="Sim, excluir definitivamente"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </CardShell>
  )
}
