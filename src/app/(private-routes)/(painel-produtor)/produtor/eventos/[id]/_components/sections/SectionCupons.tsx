"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Calendar, Users, Hash, Percent, DollarSign, AlertCircle, X,
} from "lucide-react"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { SectionProps } from "../types"

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoCupom = "PERCENTUAL" | "FIXO"
type AplicacaoCupom = "EVENTO" | "LOTE" | "TIPO_INGRESSO"

interface Cupom {
  id: number
  eventoId: number
  codigo: string
  tipo: TipoCupom
  desconto: number
  maxDesconto: number | null
  valorMinimoCompra: number | null
  aplicacao: AplicacaoCupom
  loteNumero: number | null
  tipoIngressoId: number | null
  inicio: string | null
  fim: string | null
  limiteUso: number | null
  limitePorUsuario: number | null
  totalUsado: number
  ativo: boolean
  descricao: string | null
  deletedAt: string | null
  createdAt: string
}

interface CupomForm {
  codigo: string
  tipo: TipoCupom
  desconto: string
  maxDesconto: string
  valorMinimoCompra: string
  aplicacao: AplicacaoCupom
  loteNumero: string
  tipoIngressoId: string
  inicio: string
  fim: string
  limiteUso: string
  limitePorUsuario: string
  ativo: boolean
  descricao: string
}

const FORM_EMPTY: CupomForm = {
  codigo: "", tipo: "PERCENTUAL", desconto: "",
  maxDesconto: "", valorMinimoCompra: "",
  aplicacao: "EVENTO", loteNumero: "", tipoIngressoId: "",
  inicio: "", fim: "", limiteUso: "", limitePorUsuario: "",
  ativo: true, descricao: "",
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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

const inputCls = cn(
  "h-11 px-4 text-[13px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400",
)

// ─── Cupom Dialog ─────────────────────────────────────────────────────────────

interface CupomDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Cupom
  eventoId: number
  onSaved: () => void
}

function CupomDialog({ open, onOpenChange, initial, eventoId, onSaved }: CupomDialogProps) {
  const isEditing = !!initial
  const [form, setForm] = useState<CupomForm>(FORM_EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          codigo:           initial.codigo,
          tipo:             initial.tipo,
          desconto:         String(initial.desconto),
          maxDesconto:      initial.maxDesconto != null ? String(initial.maxDesconto) : "",
          valorMinimoCompra: initial.valorMinimoCompra != null ? String(initial.valorMinimoCompra) : "",
          aplicacao:        initial.aplicacao,
          loteNumero:       initial.loteNumero != null ? String(initial.loteNumero) : "",
          tipoIngressoId:   initial.tipoIngressoId != null ? String(initial.tipoIngressoId) : "",
          inicio:           initial.inicio ? initial.inicio.split("T")[0] : "",
          fim:              initial.fim    ? initial.fim.split("T")[0]    : "",
          limiteUso:        initial.limiteUso != null ? String(initial.limiteUso) : "",
          limitePorUsuario: initial.limitePorUsuario != null ? String(initial.limitePorUsuario) : "",
          ativo:            initial.ativo,
          descricao:        initial.descricao ?? "",
        })
      } else {
        setForm(FORM_EMPTY)
      }
    }
  }, [open, initial])

  const f = (k: keyof CupomForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.codigo.trim()) return toast.error("Código do cupom é obrigatório")
    if (!form.desconto || Number(form.desconto) <= 0) return toast.error("Valor do desconto deve ser maior que 0")
    if (form.tipo === "PERCENTUAL" && Number(form.desconto) > 100) {
      return toast.error("Desconto percentual não pode exceder 100%")
    }

    const payload: Record<string, any> = {
      codigo:           form.codigo,
      tipo:             form.tipo,
      desconto:         Number(form.desconto),
      aplicacao:        form.aplicacao,
      ativo:            form.ativo,
      maxDesconto:      form.maxDesconto      ? Number(form.maxDesconto)      : undefined,
      valorMinimoCompra: form.valorMinimoCompra ? Number(form.valorMinimoCompra) : undefined,
      loteNumero:       form.loteNumero       ? Number(form.loteNumero)       : undefined,
      tipoIngressoId:   form.tipoIngressoId   ? Number(form.tipoIngressoId)   : undefined,
      inicio:           form.inicio || undefined,
      fim:              form.fim    || undefined,
      limiteUso:        form.limiteUso        ? Number(form.limiteUso)        : undefined,
      limitePorUsuario: form.limitePorUsuario ? Number(form.limitePorUsuario) : undefined,
      descricao:        form.descricao || undefined,
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/produtor/eventos/${eventoId}/cupons/${initial!.id}`, payload)
        toast.success("Cupom atualizado!")
      } else {
        await api.post(`/produtor/eventos/${eventoId}/cupons`, payload)
        toast.success("Cupom criado!")
      }
      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao salvar cupom"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[540px] p-0 gap-0 rounded-2xl border-gray-200/80 shadow-[0_8px_40px_-8px_rgb(0_0_0/0.16)] overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Tag className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-[14px] font-semibold text-gray-900">
                {isEditing ? "Editar Cupom" : "Novo Cupom"}
              </DialogTitle>
              <p className="text-[11px] text-gray-500 mt-0.5">Configure o desconto e as regras de uso</p>
            </div>
            <DialogClose className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0">
              <X className="w-4 h-4" />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Código */}
          <div>
            <FieldLabel required>Código do cupom</FieldLabel>
            <Input
              value={form.codigo}
              onChange={f("codigo")}
              placeholder="Ex: NOKTA10, VIPFEST"
              className={inputCls}
              style={{ textTransform: "uppercase" }}
            />
            <p className="text-[11px] text-gray-400 mt-1">Salvo automaticamente em MAIÚSCULAS</p>
          </div>

          {/* Tipo + Desconto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Tipo de desconto</FieldLabel>
              <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as TipoCupom }))}>
                <SelectTrigger className={cn(inputCls, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                  <SelectItem value="FIXO">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel required>Valor do desconto</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 pointer-events-none">
                  {form.tipo === "PERCENTUAL" ? "%" : "R$"}
                </span>
                <Input type="number" min={0} step={0.01}
                  value={form.desconto} onChange={f("desconto")}
                  className={cn(inputCls, "pl-9")} placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* maxDesconto + valorMinimo */}
          <div className="grid grid-cols-2 gap-3">
            {form.tipo === "PERCENTUAL" && (
              <div>
                <FieldLabel>Desconto máximo (R$)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 pointer-events-none">R$</span>
                  <Input type="number" min={0} step={0.01}
                    value={form.maxDesconto} onChange={f("maxDesconto")}
                    className={cn(inputCls, "pl-9")} placeholder="Sem limite"
                  />
                </div>
              </div>
            )}
            <div>
              <FieldLabel>Compra mínima (R$)</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 pointer-events-none">R$</span>
                <Input type="number" min={0} step={0.01}
                  value={form.valorMinimoCompra} onChange={f("valorMinimoCompra")}
                  className={cn(inputCls, "pl-9")} placeholder="Sem mínimo"
                />
              </div>
            </div>
          </div>

          {/* Aplicação */}
          <div>
            <FieldLabel>Aplicação</FieldLabel>
            <Select value={form.aplicacao} onValueChange={(v) => setForm((p) => ({ ...p, aplicacao: v as AplicacaoCupom }))}>
              <SelectTrigger className={cn(inputCls, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="EVENTO">Evento inteiro</SelectItem>
                <SelectItem value="LOTE">Lote específico</SelectItem>
                <SelectItem value="TIPO_INGRESSO">Tipo de ingresso específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.aplicacao === "LOTE" && (
            <div>
              <FieldLabel required>Número do lote</FieldLabel>
              <Input type="number" min={1} value={form.loteNumero} onChange={f("loteNumero")}
                className={inputCls} placeholder="Ex: 1" />
            </div>
          )}
          {form.aplicacao === "TIPO_INGRESSO" && (
            <div>
              <FieldLabel required>ID do tipo de ingresso</FieldLabel>
              <Input type="number" min={1} value={form.tipoIngressoId} onChange={f("tipoIngressoId")}
                className={inputCls} placeholder="ID do ingresso" />
            </div>
          )}

          {/* Validade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Início da validade</FieldLabel>
              <Input type="date" value={form.inicio} onChange={f("inicio")} className={inputCls} />
            </div>
            <div>
              <FieldLabel>Fim da validade</FieldLabel>
              <Input type="date" value={form.fim} onChange={f("fim")} className={inputCls} />
            </div>
          </div>

          {/* Limites */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Limite total de usos</FieldLabel>
              <Input type="number" min={1} value={form.limiteUso} onChange={f("limiteUso")}
                className={inputCls} placeholder="Ilimitado" />
            </div>
            <div>
              <FieldLabel>Limite por usuário</FieldLabel>
              <Input type="number" min={1} value={form.limitePorUsuario} onChange={f("limitePorUsuario")}
                className={inputCls} placeholder="Ilimitado" />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <FieldLabel>Descrição interna (opcional)</FieldLabel>
            <Input value={form.descricao} onChange={f("descricao")}
              className={inputCls} placeholder="Nota para uso interno" />
          </div>

          {/* Ativo toggle */}
          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 transition-all",
            form.ativo ? "border-primary/25 bg-primary/5" : "border-gray-200 bg-gray-50/60",
          )}>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Ativo</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {form.ativo ? "Cupom válido para uso no checkout" : "Cupom desativado"}
              </p>
            </div>
            <Switch checked={form.ativo} onCheckedChange={(v) => setForm((p) => ({ ...p, ativo: v }))} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-full h-11 gap-2 rounded-xl text-[13px] font-semibold",
              "bg-primary text-white shadow-sm",
              "hover:bg-primary/90 active:scale-[0.98] transition-all duration-150",
            )}
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />Salvando...</>
              : isEditing ? "Salvar alterações" : "Criar cupom"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  open, onOpenChange, cupom, eventoId, onDeleted,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  cupom: Cupom; eventoId: number; onDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)
  const handleDelete = async () => {
    setLoading(true)
    try {
      await api.delete(`/produtor/eventos/${eventoId}/cupons/${cupom.id}`)
      toast.success("Cupom removido.")
      onDeleted()
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao remover cupom"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 gap-0 overflow-hidden border-gray-200/80">
        <div className="h-[3px] bg-gradient-to-r from-destructive via-destructive/80 to-destructive/30" />
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-[15px] font-semibold text-gray-900">
            Remover cupom "{cupom.codigo}"?
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          {cupom.totalUsado > 0 ? (
            <div className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700">
                Este cupom já foi usado {cupom.totalUsado} vez(es). Ele será <strong>arquivado</strong> (soft delete) para preservar o histórico de pedidos.
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-gray-600">
              O cupom será excluído permanentemente. Esta ação não pode ser desfeita.
            </p>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="h-10 px-5 rounded-xl text-[13px]">
            Cancelar
          </Button>
          <Button onClick={handleDelete} disabled={loading}
            className="h-10 px-5 rounded-xl text-[13px] font-semibold bg-red-600 hover:bg-red-700 text-white">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              : cupom.totalUsado > 0 ? "Arquivar" : "Excluir"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Cupom Row ────────────────────────────────────────────────────────────────

function CupomRow({
  cupom, eventoId, onEdit, onToggle, onDelete,
}: {
  cupom: Cupom; eventoId: number
  onEdit: () => void; onToggle: () => void; onDelete: () => void
}) {
  const isExpired = cupom.fim && new Date(cupom.fim) < new Date()
  const esgotado  = cupom.limiteUso !== null && cupom.totalUsado >= cupom.limiteUso

  const statusCls = !cupom.ativo
    ? "text-gray-500 bg-gray-100 border-gray-200"
    : esgotado
      ? "text-red-600 bg-red-50 border-red-200"
      : isExpired
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-emerald-700 bg-emerald-50 border-emerald-200"

  const statusLabel = !cupom.ativo ? "Inativo" : esgotado ? "Esgotado" : isExpired ? "Expirado" : "Ativo"

  return (
    <div className="flex items-center gap-0 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
      {/* Código */}
      <div className="w-[140px] shrink-0">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary bg-primary/8 border border-primary/20 px-2.5 py-1 rounded-lg font-mono tracking-wide">
          <Hash className="w-3 h-3" />
          {cupom.codigo}
        </span>
      </div>

      {/* Desconto */}
      <div className="w-[120px] shrink-0">
        <p className="text-[13px] font-semibold text-gray-800 flex items-center gap-1">
          {cupom.tipo === "PERCENTUAL"
            ? <><Percent className="w-3.5 h-3.5 text-gray-400" />{Number(cupom.desconto)}%</>
            : <><DollarSign className="w-3.5 h-3.5 text-gray-400" />R$ {Number(cupom.desconto).toFixed(2)}</>
          }
        </p>
        {cupom.maxDesconto != null && (
          <p className="text-[10px] text-gray-400 mt-0.5">máx R$ {Number(cupom.maxDesconto).toFixed(2)}</p>
        )}
      </div>

      {/* Usos */}
      <div className="w-[110px] shrink-0">
        <p className="text-[13px] text-gray-600 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {cupom.totalUsado}{cupom.limiteUso != null ? ` / ${cupom.limiteUso}` : ""}
        </p>
        {cupom.limitePorUsuario != null && (
          <p className="text-[10px] text-gray-400 mt-0.5">{cupom.limitePorUsuario}x por usuário</p>
        )}
      </div>

      {/* Validade */}
      <div className="flex-1 min-w-0">
        {(cupom.inicio || cupom.fim) ? (
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0 text-gray-400" />
            {cupom.inicio ? cupom.inicio.split("T")[0] : "—"}
            {" → "}
            {cupom.fim ? cupom.fim.split("T")[0] : "sem fim"}
          </p>
        ) : (
          <p className="text-[11px] text-gray-300">Sem validade</p>
        )}
        {cupom.valorMinimoCompra != null && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Mín. R$ {Number(cupom.valorMinimoCompra).toFixed(2)}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="w-[90px] shrink-0">
        <span className={cn("text-[10px] font-bold border px-2 py-0.5 rounded-lg", statusCls)}>
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="w-20 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          title={cupom.ativo ? "Desativar" : "Ativar"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
        >
          {cupom.ativo
            ? <ToggleRight className="w-4 h-4 text-primary" />
            : <ToggleLeft className="w-4 h-4" />
          }
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionCupons({ event }: SectionProps) {
  const [cupons,  setCupons]  = useState<Cupom[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen,    setDialogOpen]    = useState(false)
  const [editingCupom,  setEditingCupom]  = useState<Cupom | undefined>(undefined)
  const [deleteTarget,  setDeleteTarget]  = useState<Cupom | undefined>(undefined)

  const fetchCupons = async () => {
    try {
      const res = await api.get<Cupom[]>(`/produtor/eventos/${event.id}/cupons`)
      setCupons(res.data)
    } catch {
      toast.error("Erro ao carregar cupons")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCupons() }, [event.id])

  const handleToggle = async (cupom: Cupom) => {
    try {
      const updated = await api.patch<Cupom>(`/produtor/eventos/${event.id}/cupons/${cupom.id}/toggle`)
      setCupons((prev) => prev.map((c) => c.id === cupom.id ? updated.data : c))
      toast.success(updated.data.ativo ? "Cupom ativado." : "Cupom desativado.")
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao alterar status"))
    }
  }

  const openEdit = (cupom: Cupom) => { setEditingCupom(cupom); setDialogOpen(true) }
  const openNew  = () => { setEditingCupom(undefined); setDialogOpen(true) }

  const ativos   = cupons.filter((c) => c.ativo && !c.deletedAt)
  const inativos = cupons.filter((c) => !c.ativo && !c.deletedAt)

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Tag className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Cupons</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerencie descontos e promoções deste evento</p>
          </div>
        </div>
        {cupons.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/[0.08] border border-primary/20 px-3 py-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-bold text-primary">{ativos.length}</span>
            <span className="text-[11px] text-primary/60 hidden sm:inline">ativos</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900">Cupons do evento</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Crie cupons de desconto percentual ou valor fixo com regras avançadas.
            </p>
          </div>
          <Button
            onClick={openNew}
            className={cn(
              "shrink-0 h-10 px-4 gap-2 rounded-xl text-[13px] font-semibold",
              "bg-primary text-white shadow-sm",
              "hover:bg-primary/90 active:scale-[0.97] transition-all duration-200",
            )}
          >
            <Plus className="w-4 h-4" />
            Novo cupom
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/30">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Tag className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-[14px] font-semibold text-gray-800 mb-1">Nenhum cupom criado</p>
            <p className="text-[12px] text-gray-500 mb-5 max-w-[280px] leading-relaxed">
              Crie cupons de desconto para incentivar vendas com promoções e regras personalizadas.
            </p>
            <Button
              onClick={openNew}
              className={cn(
                "h-10 px-5 gap-2 rounded-xl text-[13px] font-semibold",
                "bg-primary text-white shadow-sm hover:bg-primary/90",
              )}
            >
              <Plus className="w-4 h-4" /> Criar primeiro cupom
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200/80 overflow-hidden">
            {/* Column headers */}
            <div className="flex items-center gap-0 px-5 py-2 border-b border-gray-100 bg-gray-50/70">
              <div className="w-[140px] shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código</p>
              </div>
              <div className="w-[120px] shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desconto</p>
              </div>
              <div className="w-[110px] shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usos</p>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Validade</p>
              </div>
              <div className="w-[90px] shrink-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
              </div>
              <div className="w-20 shrink-0" />
            </div>

            {/* Active */}
            {ativos.map((c) => (
              <CupomRow
                key={c.id} cupom={c} eventoId={event.id}
                onEdit={() => openEdit(c)}
                onToggle={() => handleToggle(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            ))}

            {/* Inactive separator */}
            {inativos.length > 0 && ativos.length > 0 && (
              <div className="px-5 py-2 bg-gray-50/50 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inativos</p>
              </div>
            )}
            {inativos.map((c) => (
              <CupomRow
                key={c.id} cupom={c} eventoId={event.id}
                onEdit={() => openEdit(c)}
                onToggle={() => handleToggle(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CupomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingCupom}
        eventoId={event.id}
        onSaved={fetchCupons}
      />

      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          onOpenChange={(v) => { if (!v) setDeleteTarget(undefined) }}
          cupom={deleteTarget}
          eventoId={event.id}
          onDeleted={fetchCupons}
        />
      )}
    </CardShell>
  )
}
