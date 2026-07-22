"use client"

import { useState, useMemo } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Ticket, Plus, Save, Pencil, TicketX, Tag,
  Copy, Trash2, ChevronDown, ChevronUp, Calendar, CheckCircle2,
} from "lucide-react"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import { SectionProps, IngressoLote } from "../types"

// ─── Local augmented type ────────────────────────────────────────────────────

type TicketWithKey = IngressoLote & { _key: string }

function withKey(t: IngressoLote): TicketWithKey {
  return { ...t, _key: t.id ? `db-${t.id}` : `new-${Math.random().toString(36).slice(2)}` }
}

interface LotGroup {
  lotNum: number
  tickets: TicketWithKey[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TIPO_META: Record<number, { label: string; dot: string; badge: string }> = {
  0: { label: "Gratuito",     dot: "bg-green-500",  badge: "bg-green-100 text-green-700 border-green-200" },
  1: { label: "Pago",         dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700 border-blue-200" },
  2: { label: "Inteira",      dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700 border-violet-200" },
  3: { label: "Meia Entrada", dot: "bg-amber-500",  badge: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "VIP",          dot: "bg-rose-500",   badge: "bg-rose-100 text-rose-700 border-rose-200" },
}

const LOT_ACCENT: string[] = [
  "border-l-violet-500",
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
]

function ordinal(n: number) {
  return `${n}º`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByLot(tickets: TicketWithKey[]): LotGroup[] {
  const map: Record<number, TicketWithKey[]> = {}
  tickets.forEach((t) => {
    const k = t.lote ?? 1
    if (!map[k]) map[k] = []
    map[k].push(t)
  })
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([lotNum, ts]) => ({ lotNum: Number(lotNum), tickets: ts }))
}

function getLotCapacity(tickets: TicketWithKey[]) {
  return tickets.reduce((a, t) => a + t.quantidade, 0)
}

function getLotDeadline(tickets: TicketWithKey[]): string | null {
  const dates = tickets.map((t) => t.dataLimite).filter(Boolean) as string[]
  return dates.length ? dates.sort().slice(-1)[0] : null
}

function getLotStatus(tickets: TicketWithKey[]): "ativo" | "pausado" {
  return tickets.some((t) => t.disponivelParaVenda) ? "ativo" : "pausado"
}

function getNextPrice(
  nome: string,
  lotNum: number,
  groups: LotGroup[],
): { valor: number; lotNum: number } | null {
  const next = groups.find((g) => g.lotNum > lotNum)
  if (!next) return null
  const match = next.tickets.find(
    (t) => t.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
  )
  return match ? { valor: match.valor, lotNum: next.lotNum } : null
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

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
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  )
}

const inputCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400",
)

// ─── Ticket Dialog ────────────────────────────────────────────────────────────

interface TicketDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: TicketWithKey
  lotNum: number
  lotDeadline?: string | null
  onConfirm: (t: IngressoLote) => void
}

function TicketDialog({ open, onOpenChange, initial, lotNum, lotDeadline, onConfirm }: TicketDialogProps) {
  const isEditing = !!initial
  const [form, setForm] = useState<IngressoLote>(
    initial ?? {
      nome: "", tipo: 1, lote: lotNum, quantidade: 0, valor: 0,
      disponivelParaVenda: true, dataLimite: lotDeadline ?? null,
    },
  )

  const isGratuito = form.tipo === 0

  const handleConfirm = () => {
    if (!form.nome.trim())               return alert("Nome do tipo de ingresso é obrigatório")
    if (form.quantidade < 1)             return alert("Quantidade deve ser maior que 0")
    if (!isGratuito && form.valor <= 0)  return alert("Preço deve ser maior que 0")
    onConfirm({ ...form, lote: lotNum })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-gray-200/80 shadow-[0_8px_40px_-8px_rgb(0_0_0/0.16)]">
        <div className="h-[3px] bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Ticket className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[14px] font-semibold text-gray-900">
                {isEditing ? "Editar Tipo de Ingresso" : `Novo Tipo — ${ordinal(lotNum)} Lote`}
              </DialogTitle>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isEditing ? "Altere as configurações" : "Configure tipo, preço e disponibilidade"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div>
            <FieldLabel required>Nome do Tipo</FieldLabel>
            <Input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Pista, Front, Camarote, VIP..."
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel required>Categoria</FieldLabel>
            <Select
              value={String(form.tipo)}
              onValueChange={(v) => setForm((p) => ({ ...p, tipo: Number(v) }))}
            >
              <SelectTrigger className={cn(inputCls, "w-full")}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="0">Gratuito</SelectItem>
                <SelectItem value="1">Pago</SelectItem>
                <SelectItem value="2">Inteira</SelectItem>
                <SelectItem value="3">Meia Entrada</SelectItem>
                <SelectItem value="4">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isGratuito && (
            <div>
              <FieldLabel required>Preço unitário</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-medium pointer-events-none">
                  R$
                </span>
                <Input
                  type="number" min={0} step={0.01}
                  value={form.valor}
                  onChange={(e) => setForm((p) => ({ ...p, valor: Number(e.target.value) }))}
                  className={cn(inputCls, "pl-10")}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel required>Quantidade</FieldLabel>
              <Input
                type="number" min={1}
                value={form.quantidade}
                onChange={(e) => setForm((p) => ({ ...p, quantidade: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>Data limite do lote</FieldLabel>
              <Input
                type="date"
                value={form.dataLimite ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, dataLimite: e.target.value || null }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
            form.disponivelParaVenda ? "border-primary/25 bg-primary/5" : "border-gray-200 bg-gray-50/60",
          )}>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Disponível para venda</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {form.disponivelParaVenda
                  ? "Visível para compradores agora"
                  : "Pausado — não aparece para compradores"}
              </p>
            </div>
            <Switch
              checked={form.disponivelParaVenda}
              onCheckedChange={(v) => setForm((p) => ({ ...p, disponivelParaVenda: v }))}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <Button
            onClick={handleConfirm}
            className={cn(
              "w-full h-11 gap-2 rounded-xl text-[13px] font-semibold",
              "bg-primary text-white shadow-sm",
              "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
              "active:scale-[0.98] transition-all duration-150",
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isEditing ? "Salvar alterações" : "Adicionar tipo de ingresso"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

interface TicketRowProps {
  ticket: TicketWithKey
  nextPrice: { valor: number; lotNum: number } | null
  onEdit: () => void
  onRemove: () => void
}

function TicketRow({ ticket, nextPrice, onEdit, onRemove }: TicketRowProps) {
  const meta = TIPO_META[ticket.tipo] ?? { label: "Outro", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200" }
  const isFree = ticket.tipo === 0
  const isNew  = !ticket.id

  return (
    <div className="flex items-center gap-0 px-5 py-3 hover:bg-gray-50/60 transition-colors group border-b border-gray-50 last:border-0">
      {/* Color dot */}
      <div className="w-8 flex items-center">
        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", meta.dot)} />
      </div>

      {/* Name + badge */}
      <div className="w-[160px] shrink-0">
        <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{ticket.nome}</p>
        <Badge className={cn("text-[10px] font-semibold border mt-0.5 px-1.5 py-0 h-4", meta.badge)}>
          {meta.label}
        </Badge>
      </div>

      {/* Price */}
      <div className="w-[110px] shrink-0">
        <p className="text-[13px] font-semibold text-gray-800">
          {isFree ? "Gratuito" : `R$ ${Number(ticket.valor).toFixed(2)}`}
        </p>
      </div>

      {/* Qty */}
      <div className="w-[90px] shrink-0">
        <p className="text-[13px] text-gray-600">{ticket.quantidade}</p>
        <p className="text-[10px] text-gray-400">capacidade</p>
      </div>

      {/* Status */}
      <div className="w-[110px] shrink-0">
        {ticket.disponivelParaVenda ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Pausado
          </span>
        )}
      </div>

      {/* Deadline */}
      <div className="flex-1 min-w-0">
        {ticket.dataLimite ? (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0" />
            {ticket.dataLimite}
          </p>
        ) : (
          <p className="text-[11px] text-gray-300">—</p>
        )}
      </div>

      {/* Next price */}
      <div className="w-[110px] shrink-0 text-right">
        {nextPrice ? (
          <div>
            <p className="text-[12px] font-semibold text-gray-700">
              R$ {Number(nextPrice.valor).toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400">{ordinal(nextPrice.lotNum)} Lote</p>
          </div>
        ) : (
          <p className="text-[11px] text-gray-300">—</p>
        )}
      </div>

      {/* Actions */}
      <div className="w-16 shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {isNew && (
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Lot Card ─────────────────────────────────────────────────────────────────

interface LotCardProps {
  group: LotGroup
  allGroups: LotGroup[]
  accentClass: string
  onAddTicket: (lotNum: number, deadline?: string | null) => void
  onEditTicket: (ticket: TicketWithKey) => void
  onRemoveTicket: (key: string) => void
  onDuplicate: (lotNum: number) => void
  onRemoveLot: (lotNum: number) => void
}

function LotCard({
  group, allGroups, accentClass,
  onAddTicket, onEditTicket, onRemoveTicket, onDuplicate, onRemoveLot,
}: LotCardProps) {
  const [expanded, setExpanded] = useState(true)

  const status   = getLotStatus(group.tickets)
  const capacity = getLotCapacity(group.tickets)
  const deadline = getLotDeadline(group.tickets)
  const canRemoveLot = group.tickets.every((t) => !t.id)

  return (
    <div className={cn(
      "border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm border-l-4",
      accentClass,
    )}>
      {/* Lot header */}
      <div className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
        {/* Number + status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">
            {ordinal(group.lotNum)} Lote
          </span>
          {status === "ativo" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Pausado
            </span>
          )}
        </div>

        {/* Date */}
        {deadline && (
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Até {deadline}</span>
          </div>
        )}

        {/* Capacity pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Ticket className="w-3.5 h-3.5 text-gray-400" />
          <span>{capacity} ingressos</span>
        </div>

        {/* Actions (right) */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => onAddTicket(group.lotNum, deadline)}
            className={cn(
              "flex items-center gap-1 text-[12px] font-semibold text-primary px-2.5 py-1.5 rounded-lg",
              "hover:bg-primary/10 transition-all duration-150",
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Tipo
          </button>
          <button
            onClick={() => onDuplicate(group.lotNum)}
            title="Duplicar lote"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {canRemoveLot && (
            <button
              onClick={() => onRemoveLot(group.lotNum)}
              title="Remover lote"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Column headers */}
      {expanded && (
        <>
          <div className="flex items-center gap-0 px-5 py-2 border-t border-gray-100 bg-gray-50/70">
            <div className="w-8" />
            <div className="w-[160px] shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</p>
            </div>
            <div className="w-[110px] shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preço</p>
            </div>
            <div className="w-[90px] shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacidade</p>
            </div>
            <div className="w-[110px] shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data limite</p>
            </div>
            <div className="w-[110px] shrink-0 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Próx. preço</p>
            </div>
            <div className="w-16 shrink-0" />
          </div>

          {/* Rows */}
          {group.tickets.length === 0 ? (
            <div className="px-5 py-8 text-center border-t border-gray-50">
              <p className="text-[12px] text-gray-400 mb-2">Nenhum tipo de ingresso neste lote.</p>
              <button
                onClick={() => onAddTicket(group.lotNum, deadline)}
                className="text-[12px] text-primary font-semibold hover:underline"
              >
                + Adicionar primeiro tipo
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-50">
              {group.tickets.map((ticket) => (
                <TicketRow
                  key={ticket._key}
                  ticket={ticket}
                  nextPrice={getNextPrice(ticket.nome, group.lotNum, allGroups)}
                  onEdit={() => onEditTicket(ticket)}
                  onRemove={() => onRemoveTicket(ticket._key)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ["lotes", "cupons", "revenda"] as const
type Tab = typeof TABS[number]

export default function SectionIngressos({ event, onRefresh }: SectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>("lotes")
  const [tickets, setTickets] = useState<TicketWithKey[]>(() =>
    (event.ingressos ?? []).map(withKey),
  )
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen]       = useState(false)
  const [dialogLotNum, setDialogLotNum]   = useState(1)
  const [dialogDeadline, setDialogDeadline] = useState<string | null>(null)
  const [editingKey, setEditingKey]       = useState<string | null>(null)

  const groups       = useMemo(() => groupByLot(tickets), [tickets])
  const maxLotNum    = useMemo(() => groups.length > 0 ? Math.max(...groups.map((g) => g.lotNum)) : 0, [groups])
  const totalCapacity = useMemo(() => tickets.reduce((a, t) => a + t.quantidade, 0), [tickets])

  const editingTicket = editingKey ? tickets.find((t) => t._key === editingKey) : undefined

  const openAdd = (lotNum: number, deadline?: string | null) => {
    setEditingKey(null)
    setDialogLotNum(lotNum)
    setDialogDeadline(deadline ?? null)
    setDialogOpen(true)
  }

  const openEdit = (ticket: TicketWithKey) => {
    setEditingKey(ticket._key)
    setDialogLotNum(ticket.lote ?? 1)
    setDialogDeadline(ticket.dataLimite)
    setDialogOpen(true)
  }

  const handleConfirm = (ticketData: IngressoLote) => {
    if (editingKey) {
      setTickets((prev) =>
        prev.map((t) => (t._key === editingKey ? { ...ticketData, _key: editingKey } : t)),
      )
    } else {
      setTickets((prev) => [...prev, withKey(ticketData)])
    }
    setEditingKey(null)
  }

  const handleRemoveTicket = (key: string) => {
    const t = tickets.find((x) => x._key === key)
    if (t?.id) {
      toast.error("Ingressos salvos não podem ser excluídos. Desative-os em vez disso.")
      return
    }
    setTickets((prev) => prev.filter((x) => x._key !== key))
  }

  const handleRemoveLot = (lotNum: number) => {
    const lotTickets = tickets.filter((t) => (t.lote ?? 1) === lotNum)
    if (lotTickets.some((t) => t.id)) {
      toast.error("Este lote possui ingressos já salvos e não pode ser removido.")
      return
    }
    setTickets((prev) => prev.filter((t) => (t.lote ?? 1) !== lotNum))
  }

  const handleDuplicate = (lotNum: number) => {
    const src = groups.find((g) => g.lotNum === lotNum)
    if (!src) return
    const newLot = maxLotNum + 1
    const copies = src.tickets.map((t) =>
      withKey({ ...t, id: undefined, lote: newLot, disponivelParaVenda: false }),
    )
    setTickets((prev) => [...prev, ...copies])
    toast.success(`${ordinal(lotNum)} Lote duplicado como ${ordinal(newLot)} Lote`)
  }

  const handleSave = async () => {
    if (tickets.length === 0) return toast.error("Adicione pelo menos um ingresso")
    setSaving(true)
    try {
      await api.put(`/produtor/eventos/${event.id}`, {
        ingressos: tickets.map(({ _key, ...t }) => ({
          ...(t.id ? { id: t.id } : {}),
          nome:                t.nome,
          tipo:                t.tipo,
          lote:                t.lote ?? 1,
          quantidade:          Number(t.quantidade),
          valor:               Number(t.valor),
          disponivelParaVenda: t.disponivelParaVenda,
          dataLimite:          t.dataLimite || null,
        })),
      })
      toast.success("Ingressos salvos com sucesso!")
      onRefresh()
    } catch (err: any) {
      const msg = err?.response?.data?.message
      toast.error(Array.isArray(msg) ? msg[0] : (msg || "Erro ao salvar ingressos"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <CardShell>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/[0.04] to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Ticket className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-gray-900">Ingressos</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerencie lotes, tipos e disponibilidade</p>
          </div>
        </div>
        {tickets.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/[0.08] border border-primary/20 px-3 py-1.5">
            <Ticket className="w-3.5 h-3.5 text-primary" />
            <span className="text-[13px] font-bold text-primary">{totalCapacity}</span>
            <span className="text-[11px] text-primary/60 hidden sm:inline">ingressos no total</span>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="px-6 pt-3 flex gap-0 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => tab === "lotes" && setActiveTab(tab)}
            disabled={tab !== "lotes"}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium transition-all duration-150",
              activeTab === tab
                ? "text-primary border-b-2 border-primary -mb-px"
                : tab !== "lotes"
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-800",
            )}
          >
            {tab === "lotes" ? "Lotes" : tab === "cupons" ? "Cupons" : "Revenda"}
            {tab !== "lotes" && (
              <span className="ml-1.5 text-[9px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">
                breve
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lotes tab */}
      {activeTab === "lotes" && (
        <div className="p-6 space-y-4">
          {/* Section title + add button */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[14px] font-semibold text-gray-900">Lotes de vendas</h3>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Crie todos os lotes com antecedência. O sistema ativará automaticamente conforme as regras definidas.
              </p>
            </div>
            <Button
              onClick={() => openAdd(maxLotNum + 1, null)}
              className={cn(
                "shrink-0 h-10 px-4 gap-2 rounded-xl text-[13px] font-semibold",
                "bg-primary text-white shadow-sm",
                "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
                "active:scale-[0.97] transition-all duration-200",
              )}
            >
              <Plus className="w-4 h-4" />
              Adicionar lote
            </Button>
          </div>

          {/* Empty state */}
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/30">
              <div className="relative mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <TicketX className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <p className="text-[14px] font-semibold text-gray-800 mb-1">Nenhum lote configurado</p>
              <p className="text-[12px] text-gray-500 mb-5 max-w-[280px] leading-relaxed">
                Crie lotes de ingressos para controlar preços, disponibilidade e progressão automática entre períodos.
              </p>
              <Button
                onClick={() => openAdd(1, null)}
                className={cn(
                  "h-10 px-5 gap-2 rounded-xl text-[13px] font-semibold",
                  "bg-primary text-white shadow-sm",
                  "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
                )}
              >
                <Plus className="w-4 h-4" /> Criar primeiro lote
              </Button>
            </div>
          )}

          {/* Lot cards */}
          {groups.map((group, idx) => (
            <LotCard
              key={group.lotNum}
              group={group}
              allGroups={groups}
              accentClass={LOT_ACCENT[idx % LOT_ACCENT.length]}
              onAddTicket={openAdd}
              onEditTicket={openEdit}
              onRemoveTicket={handleRemoveTicket}
              onDuplicate={handleDuplicate}
              onRemoveLot={handleRemoveLot}
            />
          ))}
        </div>
      )}

      {/* Em breve tabs */}
      {activeTab !== "lotes" && (
        <div className="p-6 flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Tag className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-[14px] font-semibold text-gray-700 mb-1">Em breve</p>
          <p className="text-[12px] text-gray-500">Esta funcionalidade está sendo desenvolvida.</p>
        </div>
      )}

      {/* Dialog */}
      <TicketDialog
        key={`${dialogOpen ? "open" : "closed"}-${editingKey ?? "new"}-${dialogLotNum}`}
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingKey(null) }}
        initial={editingTicket}
        lotNum={dialogLotNum}
        lotDeadline={dialogDeadline}
        onConfirm={handleConfirm}
      />

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
        <p className="text-[12px] text-gray-500">
          {groups.length} {groups.length === 1 ? "lote" : "lotes"} · {totalCapacity} ingressos no total
        </p>
        <Button
          onClick={handleSave}
          disabled={saving || tickets.length === 0}
          className={cn(
            "h-11 px-7 gap-2 rounded-xl text-[13px] font-semibold",
            "bg-primary text-white shadow-sm",
            "hover:bg-primary/90 hover:shadow-[0_6px_20px_-4px_oklch(0.606_0.25_292.717/0.5)]",
            "active:scale-[0.97] transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />Salvando...</>
          ) : (
            <><Save className="w-4 h-4" />Salvar alterações</>
          )}
        </Button>
      </div>
    </CardShell>
  )
}
