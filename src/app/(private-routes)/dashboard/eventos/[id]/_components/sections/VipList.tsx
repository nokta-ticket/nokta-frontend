"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { CheckCircle2, Copy, Crown, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { getPublicTicketsUrl } from "@/lib/surfaces"
import { IngressoLote } from "../types"

// Lista VIP: lote gratuito divulgado por link (story). Não aparece na página
// do evento, cada pessoa retira um e a retirada vale até o horário definido.
// Na portaria é um ingresso comum daquele evento.

type VipTicket = IngressoLote & { _key: string }

const BRT = "America/Sao_Paulo"

/** Data e hora de Brasília de um instante, no formato dos campos do formulário. */
function splitBrt(iso: string): { date: string; time: string } {
  const text = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BRT, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso))
  const [date, time] = text.split(" ")
  return { date, time: time.slice(0, 5) }
}

/** O produtor digita horário de Brasília; o servidor guarda o instante real. */
function toInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString()
}

export function formatVipDeadline(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString("pt-BR", { timeZone: BRT, weekday: "short", day: "2-digit", month: "2-digit" })
  const time = d.toLocaleTimeString("pt-BR", { timeZone: BRT, hour: "2-digit", minute: "2-digit" })
  return `${day} às ${time}`
}

const inputCls = cn(
  "h-12 px-4 text-[14px] rounded-xl border-gray-200 bg-white",
  "hover:border-gray-300 transition-all duration-150",
  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
  "placeholder:text-gray-400",
)

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5 tracking-wide uppercase">
      {children}
    </label>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface VipListDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: VipTicket
  /** Data do evento (AAAA-MM-DD ou ISO): sugestão para o dia do prazo. */
  eventDate: string
  onConfirm: (t: IngressoLote) => void
}

export function VipListDialog({ open, onOpenChange, initial, eventDate, onConfirm }: VipListDialogProps) {
  const isEditing = !!initial
  const start = initial?.vipAte
    ? splitBrt(initial.vipAte)
    : { date: (eventDate ?? "").slice(0, 10), time: "23:00" }

  const [nome, setNome] = useState(initial?.nome ?? "Lista VIP")
  const [quantidade, setQuantidade] = useState(initial?.quantidade ?? 100)
  const [date, setDate] = useState(start.date)
  const [time, setTime] = useState(start.time)
  const [ativa, setAtiva] = useState(initial?.disponivelParaVenda ?? true)

  const handleConfirm = () => {
    if (!nome.trim()) return toast.error("Dê um nome para a lista VIP")
    if (quantidade < 0 || (!isEditing && quantidade < 1)) return toast.error("Informe quantos VIPs podem ser retirados")
    if (!date || !time) return toast.error("Informe até quando o VIP pode ser retirado")
    onConfirm({
      ...(initial?.id ? { id: initial.id } : {}),
      nome: nome.trim(),
      tipo: 3,
      lote: initial?.lote ?? 1,
      quantidade: Number(quantidade),
      valor: 0,
      disponivelParaVenda: ativa,
      dataLimite: null,
      vip: true,
      vipAte: toInstant(date, time),
      vipToken: initial?.vipToken ?? null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border-gray-200/80">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-[15px] font-semibold text-gray-900">
            {isEditing ? "Editar lista VIP" : "Nova lista VIP"}
          </DialogTitle>
          <p className="text-[12px] text-gray-500 mt-1 text-left">
            Entrada gratuita por link. A pessoa abre o link, entra na conta e o ingresso com QR code fica em
            Meus ingressos. Um por pessoa.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: VIP até 23h" className={inputCls} />
          </div>

          <div>
            <FieldLabel>{isEditing ? "VIPs que ainda podem ser retirados" : "Quantidade de VIPs"}</FieldLabel>
            <Input
              type="number" min={0} inputMode="numeric"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className={inputCls}
            />
          </div>

          <div>
            <FieldLabel>Pode ser retirado até</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Horário de Brasília. Depois desse horário o link para de entregar VIP. Quem já retirou entra
              normalmente.
            </p>
          </div>

          <div className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3",
            ativa ? "border-primary/25 bg-primary/5" : "border-gray-200 bg-gray-50/60",
          )}>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Lista aberta</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {ativa ? "O link está entregando VIP" : "Pausada: o link não entrega VIP"}
              </p>
            </div>
            <Switch checked={ativa} onCheckedChange={setAtiva} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
          <Button onClick={handleConfirm} className="w-full h-11 gap-2 rounded-xl text-[13px] font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            {isEditing ? "Salvar lista VIP" : "Criar lista VIP e gerar link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface VipListCardProps {
  lists: VipTicket[]
  onCreate: () => void
  onEdit: (key: string) => void
  onRemove: (key: string) => void
}

export function VipListCard({ lists, onCreate, onEdit, onRemove }: VipListCardProps) {
  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(getPublicTicketsUrl(`/vip/${token}`))
      toast.success("Link copiado")
    } catch {
      toast.error("Não foi possível copiar o link")
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
            <Crown className="w-4 h-4 text-primary" />
            Lista VIP
          </h3>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Entrada gratuita por link, para divulgar nos stories. Não aparece na página do evento.
          </p>
        </div>
        <Button onClick={onCreate} variant="outline" className="shrink-0 h-10 gap-1.5 rounded-xl text-[13px] font-semibold">
          <Plus className="w-4 h-4" />
          Criar
        </Button>
      </div>

      {lists.map((list) => {
        const link = list.vipToken ? getPublicTicketsUrl(`/vip/${list.vipToken}`) : null
        return (
          <div key={list._key} className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">{list.nome}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {list.vipAte ? `Retirada até ${formatVipDeadline(list.vipAte)}` : "Sem prazo definido"}
                  {" · "}
                  {list.quantidade} {list.quantidade === 1 ? "disponível" : "disponíveis"}
                  {!list.disponivelParaVenda && " · Pausada"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onEdit(list._key)}
                  aria-label="Editar lista VIP"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {!list.id && (
                  <button
                    onClick={() => onRemove(list._key)}
                    aria-label="Remover lista VIP"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {link && list.vipToken ? (
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/60 pl-3 pr-1.5 py-1.5">
                <p className="min-w-0 flex-1 truncate text-[12px] text-gray-700">{link}</p>
                <Button
                  onClick={() => copyLink(list.vipToken as string)}
                  className="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-[12px] font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar link
                </Button>
              </div>
            ) : (
              <p className="text-[12px] text-gray-500">
                O link aparece assim que a lista for salva.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
