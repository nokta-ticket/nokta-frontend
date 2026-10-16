"use client";

import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { formatBRL, formatDateBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/badge";
import { SwitchRow } from "@/components/ui/switch-row";
import { TIPO_INGRESSO_META, TIPO_INGRESSO_OPTIONS, ordinal } from "../../../_lib/event-meta";
import { SaveBar, SectionCard } from "../section-ui";
import type { IngressoLote, SectionProps } from "../types";

// ─── Local augmented type ────────────────────────────────────────────────────

type TicketWithKey = IngressoLote & { _key: string };

function withKey(t: IngressoLote): TicketWithKey {
  return { ...t, _key: t.id ? `db-${t.id}` : `new-${Math.random().toString(36).slice(2)}` };
}

interface LotGroup {
  lotNum: number;
  tickets: TicketWithKey[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupByLot(tickets: TicketWithKey[]): LotGroup[] {
  const map: Record<number, TicketWithKey[]> = {};
  tickets.forEach((t) => {
    const k = t.lote ?? 1;
    if (!map[k]) map[k] = [];
    map[k].push(t);
  });
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([lotNum, ts]) => ({ lotNum: Number(lotNum), tickets: ts }));
}

const getLotCapacity = (tickets: TicketWithKey[]) => tickets.reduce((a, t) => a + t.quantidade, 0);
const getLotDeadline = (tickets: TicketWithKey[]): string | null => {
  const dates = tickets.map((t) => t.dataLimite).filter(Boolean) as string[];
  return dates.length ? dates.sort().slice(-1)[0] : null;
};
const getLotStatus = (tickets: TicketWithKey[]): "ativo" | "pausado" => (tickets.some((t) => t.disponivelParaVenda) ? "ativo" : "pausado");

function getNextPrice(nome: string, lotNum: number, groups: LotGroup[]): { valor: number; lotNum: number } | null {
  const next = groups.find((g) => g.lotNum > lotNum);
  if (!next) return null;
  const match = next.tickets.find((t) => t.nome.trim().toLowerCase() === nome.trim().toLowerCase());
  return match ? { valor: match.valor, lotNum: next.lotNum } : null;
}

const price = (t: IngressoLote) => (t.tipo === 0 ? "Gratuito" : formatBRL(Number(t.valor)));

// ─── Ticket Sheet ─────────────────────────────────────────────────────────────

interface TicketSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: TicketWithKey;
  lotNum: number;
  lotDeadline?: string | null;
  onConfirm: (t: IngressoLote) => void;
}

function TicketSheet({ open, onOpenChange, initial, lotNum, lotDeadline, onConfirm }: TicketSheetProps) {
  const isEditing = !!initial;
  const [form, setForm] = useState<IngressoLote>(initial ?? { nome: "", tipo: 1, lote: lotNum, quantidade: 0, valor: 0, disponivelParaVenda: true, dataLimite: lotDeadline ?? null });
  const isGratuito = form.tipo === 0;

  const handleConfirm = () => {
    if (!form.nome.trim()) return toast.error("Dê um nome pro tipo de ingresso (ex.: Pista, Camarote).");
    if (form.quantidade < 1) return toast.error("A quantidade precisa ser maior que zero.");
    if (!isGratuito && form.valor <= 0) return toast.error("Informe um preço maior que zero (ou marque como gratuito).");
    onConfirm({ ...form, lote: lotNum });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar tipo de ingresso" : `Novo tipo — ${ordinal(lotNum)} lote`}</SheetTitle>
          <SheetDescription>{isEditing ? "Altere nome, preço, quantidade e disponibilidade." : "Configure o tipo, o preço e a disponibilidade."}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Field label="Nome do tipo" htmlFor="tk-nome" required>
            <Input id="tk-nome" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Pista, Front, Camarote, VIP…" autoFocus />
          </Field>
          <Field label="Categoria" htmlFor="tk-tipo" required>
            <SelectInput id="tk-tipo" value={String(form.tipo)} onValueChange={(v) => setForm((p) => ({ ...p, tipo: Number(v) }))} options={TIPO_INGRESSO_OPTIONS} />
          </Field>
          {!isGratuito ? (
            <Field label="Preço unitário" htmlFor="tk-valor" required>
              <CurrencyInput id="tk-valor" value={Number(form.valor) || 0} onValueChange={(valor) => setForm((p) => ({ ...p, valor }))} />
            </Field>
          ) : null}
          <FieldGroup columns={2}>
            <Field label="Quantidade" htmlFor="tk-qtd" required>
              <Input id="tk-qtd" type="number" min={1} inputMode="numeric" placeholder="0" value={form.quantidade || ""} onChange={(e) => setForm((p) => ({ ...p, quantidade: Number(e.target.value) }))} />
            </Field>
            <Field label="Data limite do lote" htmlFor="tk-limite" optional>
              <Input id="tk-limite" type="date" value={form.dataLimite ?? ""} onChange={(e) => setForm((p) => ({ ...p, dataLimite: e.target.value || null }))} />
            </Field>
          </FieldGroup>
          <SwitchRow label="Disponível para venda" description={form.disponivelParaVenda ? "Visível pra quem compra agora" : "Pausado — não aparece na bilheteria"} checked={form.disponivelParaVenda} onCheckedChange={(v) => setForm((p) => ({ ...p, disponivelParaVenda: v }))} />
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button leftIcon={isEditing ? "save" : "plus"} onClick={handleConfirm}>
            {isEditing ? "Salvar alterações" : "Adicionar tipo"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Lot group ────────────────────────────────────────────────────────────────

interface LotGroupProps {
  group: LotGroup;
  allGroups: LotGroup[];
  onAddTicket: (lotNum: number, deadline?: string | null) => void;
  onEditTicket: (ticket: TicketWithKey) => void;
  onRemoveTicket: (key: string) => void;
  onDuplicate: (lotNum: number) => void;
  onRemoveLot: (lotNum: number) => void;
}

function LotGroupBlock({ group, allGroups, onAddTicket, onEditTicket, onRemoveTicket, onDuplicate, onRemoveLot }: LotGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const status = getLotStatus(group.tickets);
  const capacity = getLotCapacity(group.tickets);
  const deadline = getLotDeadline(group.tickets);
  const canRemoveLot = group.tickets.every((t) => !t.id);

  const rowActions = (t: TicketWithKey) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label="Editar tipo" title="Editar" onClick={() => onEditTicket(t)}>
        <Icon name="edit" size={13} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label="Remover tipo" title={t.id ? "Ingresso salvo não pode ser excluído — desative-o" : "Remover"} disabled={Boolean(t.id)} className={cn(t.id ? "opacity-40" : "hover:bg-danger-bg hover:text-danger")} onClick={() => onRemoveTicket(t._key)}>
        <Icon name="trash" size={13} />
      </Button>
    </>
  );

  return (
    <section className="fade-up overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <button type="button" onClick={() => setExpanded((p) => !p)} aria-expanded={expanded} className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon name="chevron-down" size={11} className={cn("text-muted-foreground transition-transform", !expanded && "-rotate-90")} />
          {ordinal(group.lotNum)} lote
        </button>
        <StatusBadge tone={status === "ativo" ? "success" : "neutral"}>{status === "ativo" ? "Ativo" : "Pausado"}</StatusBadge>
        <span className="hidden items-center gap-1.5 text-caption text-muted-foreground tnum sm:inline-flex">
          <Icon name="ticket" size={11} />
          {capacity.toLocaleString("pt-BR")} ingressos
        </span>
        {deadline ? (
          <span className="hidden items-center gap-1.5 text-caption text-muted-foreground sm:inline-flex">
            <Icon name="calendar" size={11} />
            Até {formatDateBR(deadline)}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="subtle" size="sm" leftIcon="plus" onClick={() => onAddTicket(group.lotNum, deadline)}>
            Tipo
          </Button>
          <Button variant="subtle" size="icon-sm" aria-label="Duplicar lote" title="Duplicar lote" onClick={() => onDuplicate(group.lotNum)}>
            <Icon name="copy" size={13} />
          </Button>
          <Button variant="subtle" size="icon-sm" aria-label="Remover lote" title={canRemoveLot ? "Remover lote" : "Lote com ingressos salvos não pode ser removido"} disabled={!canRemoveLot} className={cn(canRemoveLot ? "hover:bg-danger-bg hover:text-danger" : "opacity-40")} onClick={() => onRemoveLot(group.lotNum)}>
            <Icon name="trash" size={13} />
          </Button>
        </div>
      </header>

      {expanded ? (
        group.tickets.length === 0 ? (
          <div className="border-t border-border px-4 py-6 text-center">
            <p className="text-caption text-muted-foreground">Nenhum tipo de ingresso neste lote.</p>
            <Button variant="link" size="sm" onClick={() => onAddTicket(group.lotNum, deadline)}>
              Adicionar o primeiro tipo
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden border-t border-border md:block">
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Tipo</DataTableHeadCell>
                    <DataTableHeadCell align="right">Preço</DataTableHeadCell>
                    <DataTableHeadCell align="right">Capacidade</DataTableHeadCell>
                    <DataTableHeadCell>Status</DataTableHeadCell>
                    <DataTableHeadCell>Data limite</DataTableHeadCell>
                    <DataTableHeadCell align="right">Próx. preço</DataTableHeadCell>
                    <DataTableHeadCell align="right" width={96}>
                      <span className="sr-only">Ações</span>
                    </DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {group.tickets.map((t, i) => {
                    const meta = TIPO_INGRESSO_META[t.tipo] ?? { label: "Outro", tone: "neutral" as const };
                    const next = getNextPrice(t.nome, group.lotNum, allGroups);
                    return (
                      <DataTableRow key={t._key} index={i}>
                        <DataTableCell>
                          <p className="font-semibold">{t.nome}</p>
                          <p className="text-caption text-muted-foreground">{meta.label}{!t.id ? " · não salvo" : ""}</p>
                        </DataTableCell>
                        <DataTableCell num>{price(t)}</DataTableCell>
                        <DataTableCell num>{t.quantidade.toLocaleString("pt-BR")}</DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={t.disponivelParaVenda ? "success" : "neutral"}>{t.disponivelParaVenda ? "Ativo" : "Pausado"}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell className={cn(!t.dataLimite && "text-subtle-foreground")}>{t.dataLimite ? formatDateBR(t.dataLimite) : "Sem limite"}</DataTableCell>
                        <DataTableCell num className={cn(!next && "text-subtle-foreground")}>
                          {next ? (
                            <>
                              {formatBRL(Number(next.valor))}
                              <span className="block text-caption text-muted-foreground">{ordinal(next.lotNum)} lote</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </DataTableCell>
                        <DataTableCell align="right">
                          <div className="flex justify-end gap-0.5">{rowActions(t)}</div>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            </div>
            <div className="border-t border-border p-3 md:hidden">
              <MobileCardList>
                {group.tickets.map((t, i) => {
                  const meta = TIPO_INGRESSO_META[t.tipo] ?? { label: "Outro", tone: "neutral" as const };
                  return (
                    <MobileCard
                      key={t._key}
                      index={i}
                      title={t.nome}
                      subtitle={meta.label}
                      badge={<StatusBadge tone={t.disponivelParaVenda ? "success" : "neutral"}>{t.disponivelParaVenda ? "Ativo" : "Pausado"}</StatusBadge>}
                      meta={[
                        { label: "Preço", value: price(t), num: true },
                        { label: "Capacidade", value: t.quantidade.toLocaleString("pt-BR"), num: true },
                        { label: "Data limite", value: t.dataLimite ? formatDateBR(t.dataLimite) : "Sem limite" },
                      ]}
                      actions={rowActions(t)}
                    />
                  );
                })}
              </MobileCardList>
            </div>
          </>
        )
      ) : null}
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionIngressos({ event, onRefresh }: SectionProps) {
  const [tickets, setTickets] = useState<TicketWithKey[]>(() => (event.ingressos ?? []).filter((t) => !t.vip).map(withKey));
  const [saving, setSaving] = useState(false);

  // Depois de salvar, o evento é recarregado: a lista local precisa pegar
  // os ids e o link da lista VIP que o servidor acabou de gerar.
  useEffect(() => {
    setTickets((event.ingressos ?? []).filter((t) => !t.vip).map(withKey));
  }, [event.ingressos]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLotNum, setSheetLotNum] = useState(1);
  const [sheetDeadline, setSheetDeadline] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Lista VIP não é ingresso à venda: é criada e acompanhada em Convidados.
  const groups = useMemo(() => groupByLot(tickets), [tickets]);
  const maxLotNum = useMemo(() => (groups.length > 0 ? Math.max(...groups.map((g) => g.lotNum)) : 0), [groups]);
  const totalCapacity = useMemo(() => tickets.reduce((a, t) => a + t.quantidade, 0), [tickets]);
  const hasUnsaved = useMemo(() => tickets.some((t) => !t.id), [tickets]);


  const saveTickets = async (list: TicketWithKey[], successMessage: string) => {
    setSaving(true);
    try {
      await api.put(`/produtor/eventos/${event.id}`, {
        ingressos: list.map(({ _key, ...t }) => {
          void _key;
          return {
            ...(t.id ? { id: t.id } : {}),
            nome: t.nome,
            tipo: t.tipo,
            lote: t.lote ?? 1,
            quantidade: Number(t.quantidade),
            valor: Number(t.valor),
            disponivelParaVenda: t.disponivelParaVenda,
            dataLimite: t.dataLimite || null,
          };
        }),
      });
      toast.success(successMessage);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar os ingressos."));
    } finally {
      setSaving(false);
    }
  };

  const editingTicket = editingKey ? tickets.find((t) => t._key === editingKey) : undefined;

  const openAdd = (lotNum: number, deadline?: string | null) => {
    setEditingKey(null);
    setSheetLotNum(lotNum);
    setSheetDeadline(deadline ?? null);
    setSheetOpen(true);
  };

  const openEdit = (ticket: TicketWithKey) => {
    setEditingKey(ticket._key);
    setSheetLotNum(ticket.lote ?? 1);
    setSheetDeadline(ticket.dataLimite);
    setSheetOpen(true);
  };

  const handleConfirm = (ticketData: IngressoLote) => {
    if (editingKey) {
      setTickets((prev) => prev.map((t) => (t._key === editingKey ? { ...ticketData, _key: editingKey } : t)));
    } else {
      setTickets((prev) => [...prev, withKey(ticketData)]);
    }
    setEditingKey(null);
  };

  const handleRemoveTicket = (key: string) => {
    const t = tickets.find((x) => x._key === key);
    if (t?.id) {
      toast.error("Ingressos salvos não podem ser excluídos. Desative-os em vez disso.");
      return;
    }
    setTickets((prev) => prev.filter((x) => x._key !== key));
  };

  const handleRemoveLot = (lotNum: number) => {
    const lotTickets = tickets.filter((t) => (t.lote ?? 1) === lotNum);
    if (lotTickets.some((t) => t.id)) {
      toast.error("Este lote possui ingressos já salvos e não pode ser removido.");
      return;
    }
    setTickets((prev) => prev.filter((t) => (t.lote ?? 1) !== lotNum));
  };

  const handleDuplicate = (lotNum: number) => {
    const src = groups.find((g) => g.lotNum === lotNum);
    if (!src) return;
    const newLot = maxLotNum + 1;
    const copies = src.tickets.map((t) => withKey({ ...t, id: undefined, lote: newLot, disponivelParaVenda: false }));
    setTickets((prev) => [...prev, ...copies]);
    toast.success(`${ordinal(lotNum)} lote duplicado como ${ordinal(newLot)} lote`);
  };

  const handleSave = () => {
    if (tickets.length === 0) return toast.error("Adicione pelo menos um ingresso");
    return saveTickets(tickets, "Ingressos salvos");
  };

  return (
    <>
      <SectionCard
        title="Lotes de venda"
        description="Crie todos os lotes com antecedência: cada um ativa sozinho quando o anterior esgota ou vence."
        action={
          <Button leftIcon="plus" size="sm" onClick={() => openAdd(maxLotNum + 1, null)}>
            Adicionar lote
          </Button>
        }
        footer={<SaveBar onSave={handleSave} saving={saving} disabled={tickets.length === 0} hint={`${groups.length} ${groups.length === 1 ? "lote" : "lotes"} · ${totalCapacity.toLocaleString("pt-BR")} ingressos${hasUnsaved ? " · alterações não salvas" : ""}`} />}
      >
        {groups.length === 0 ? (
          <EmptyState icon="ticket" title="Nenhum lote ainda" description="Crie lotes pra controlar preço, quantidade e a virada automática entre eles." action={<Button leftIcon="plus" onClick={() => openAdd(1, null)}>Criar primeiro lote</Button>} />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <LotGroupBlock key={group.lotNum} group={group} allGroups={groups} onAddTicket={openAdd} onEditTicket={openEdit} onRemoveTicket={handleRemoveTicket} onDuplicate={handleDuplicate} onRemoveLot={handleRemoveLot} />
            ))}
          </div>
        )}
      </SectionCard>

      <TicketSheet
        key={`${sheetOpen ? "open" : "closed"}-${editingKey ?? "new"}-${sheetLotNum}`}
        open={sheetOpen}
        onOpenChange={(v) => {
          setSheetOpen(v);
          if (!v) setEditingKey(null);
        }}
        initial={editingTicket}
        lotNum={sheetLotNum}
        lotDeadline={sheetDeadline}
        onConfirm={handleConfirm}
      />

    </>
  );
}
