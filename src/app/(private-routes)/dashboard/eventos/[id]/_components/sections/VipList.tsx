"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { getPublicTicketsUrl } from "@/lib/surfaces";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { SwitchRow } from "@/components/ui/switch-row";
import type { IngressoLote } from "../types";

// Lista VIP: lote gratuito divulgado por link (story). Não aparece na página
// do evento, cada pessoa retira um e a retirada vale até o horário definido.
// Na portaria é um ingresso comum daquele evento.

type VipTicket = IngressoLote & { _key: string };

const BRT = "America/Sao_Paulo";

/** Data e hora de Brasília de um instante, no formato dos campos do formulário. */
function splitBrt(iso: string): { date: string; time: string } {
  const text = new Intl.DateTimeFormat("sv-SE", { timeZone: BRT, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  const [date, time] = text.split(" ");
  return { date, time: time.slice(0, 5) };
}

/** O produtor digita horário de Brasília; o servidor guarda o instante real. */
function toInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

export function formatVipDeadline(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-BR", { timeZone: BRT, weekday: "short", day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: BRT, hour: "2-digit", minute: "2-digit" });
  return `${day} às ${time}`;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface VipListDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: VipTicket;
  /** Data do evento (AAAA-MM-DD ou ISO): sugestão para o dia do prazo. */
  eventDate: string;
  onConfirm: (t: IngressoLote) => void;
}

export function VipListDialog({ open, onOpenChange, initial, eventDate, onConfirm }: VipListDialogProps) {
  const isEditing = !!initial;
  const start = initial?.vipAte ? splitBrt(initial.vipAte) : { date: (eventDate ?? "").slice(0, 10), time: "23:00" };

  const [nome, setNome] = useState(initial?.nome ?? "Lista VIP");
  const [quantidade, setQuantidade] = useState(initial?.quantidade ?? 100);
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [ativa, setAtiva] = useState(initial?.disponivelParaVenda ?? true);

  const handleConfirm = () => {
    if (!nome.trim()) return toast.error("Dê um nome para a lista VIP");
    if (quantidade < 0 || (!isEditing && quantidade < 1)) return toast.error("Informe quantos VIPs podem ser retirados");
    if (!date || !time) return toast.error("Informe até quando o VIP pode ser retirado");
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
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar lista VIP" : "Nova lista VIP"}</DialogTitle>
          <DialogDescription>Entrada gratuita por link. A pessoa abre o link, entra na conta e o ingresso com QR code fica em Meus ingressos. Um por pessoa.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome" htmlFor="vip-nome">
            <Input id="vip-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: VIP até 23h" />
          </Field>
          <Field label={isEditing ? "VIPs que ainda podem ser retirados" : "Quantidade de VIPs"} htmlFor="vip-qtd">
            <Input id="vip-qtd" type="number" min={0} inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
          </Field>
          <Field label="Pode ser retirado até" hint="Horário de Brasília. Depois disso o link para de entregar VIP; quem já retirou entra normalmente.">
            <FieldGroup columns={2} className="gap-2">
              <Input aria-label="Data limite" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input aria-label="Hora limite" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FieldGroup>
          </Field>
          <SwitchRow label="Lista aberta" description={ativa ? "O link está entregando VIP" : "Pausada: o link não entrega VIP"} checked={ativa} onCheckedChange={setAtiva} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button leftIcon={isEditing ? "save" : "link"} onClick={handleConfirm}>
            {isEditing ? "Salvar lista VIP" : "Criar lista e gerar link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface VipListCardProps {
  /** Endereço do evento (slug ou id): o link é /vip/<endereço>. */
  eventKey: string;
  lists: VipTicket[];
  onCreate: () => void;
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
}

export function VipListCard({ eventKey, lists, onCreate, onEdit, onRemove }: VipListCardProps) {
  const vipUrl = getPublicTicketsUrl(`/vip/${eventKey}`);
  const [removing, setRemoving] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon name="crown" size={14} className="text-brand" />
            Listas VIP
          </h3>
          <p className="mt-0.5 text-caption text-muted-foreground">Entrada gratuita por link, pra divulgar nos stories. Não aparece na página do evento.</p>
        </div>
        <Button variant="outline" size="sm" leftIcon="plus" onClick={onCreate} className="shrink-0">
          Nova lista
        </Button>
      </div>

      {lists.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {lists.map((list) => {
            // O link é o do evento; só vale depois que a lista está gravada.
            const link = list.id ? vipUrl : null;
            const paused = !list.disponivelParaVenda;
            return (
              <article key={list._key} className="card-glow flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{list.nome}</p>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      {list.vipAte ? `Retirada até ${formatVipDeadline(list.vipAte)}` : "Sem prazo definido"} · {list.quantidade.toLocaleString("pt-BR")} {list.quantidade === 1 ? "disponível" : "disponíveis"}
                    </p>
                  </div>
                  <StatusBadge tone={paused ? "neutral" : "success"}>{paused ? "Pausada" : "Aberta"}</StatusBadge>
                </div>
                {link ? <CopyField value={link} label="Copiar link" size="sm" /> : <p className="text-caption text-subtle-foreground">O link aparece assim que a lista for salva.</p>}
                <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
                  <Button variant="subtle" size="icon-sm" aria-label="Editar lista VIP" title="Editar" onClick={() => onEdit(list._key)}>
                    <Icon name="edit" size={13} />
                  </Button>
                  <Button variant="subtle" size="icon-sm" aria-label="Excluir lista VIP" title="Excluir" className="hover:bg-danger-bg hover:text-danger" onClick={() => setRemoving(list._key)}>
                    <Icon name="trash" size={13} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => (!o ? setRemoving(null) : null)}
        danger
        icon="crown"
        title="Excluir esta lista VIP?"
        description="O link para de entregar este VIP. Quem já retirou continua com o ingresso e entra normalmente."
        confirmLabel="Excluir lista"
        onConfirm={() => {
          if (removing) onRemove(removing);
        }}
      />
    </section>
  );
}
