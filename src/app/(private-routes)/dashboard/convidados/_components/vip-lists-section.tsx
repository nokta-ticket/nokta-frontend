"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getPublicTicketsUrl } from "@/lib/surfaces";
import { vipListsApi, type VipListPayload, type VipListSummary, type VipListsResponse } from "@/services/vip-lists";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyField } from "@/components/ui/copy-field";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { SwitchRow } from "@/components/ui/switch-row";

// Lista VIP: o produtor divulga o link no story, a pessoa coloca o nome e
// recebe o ingresso com QR na conta. Aqui ele cria a lista, copia o link e
// vê quem já está nela.

const BRT = "America/Sao_Paulo";

function splitBrt(iso: string): { date: string; time: string } {
  const text = new Intl.DateTimeFormat("sv-SE", { timeZone: BRT, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  const [date, time] = text.split(" ");
  return { date, time: time.slice(0, 5) };
}

/** O produtor digita horário de Brasília; o servidor guarda o instante real. */
function toInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

function formatMoment(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("pt-BR", { timeZone: BRT, day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("pt-BR", { timeZone: BRT, hour: "2-digit", minute: "2-digit" });
  return `${day} às ${time}`;
}

function listState(list: VipListSummary): { label: string; tone: Tone } {
  if (!list.ativa) return { label: "Pausada", tone: "neutral" };
  if (list.vipAte && new Date(list.vipAte).getTime() < Date.now()) return { label: "Encerrada", tone: "neutral" };
  if (list.naLista >= list.total) return { label: "Esgotada", tone: "warning" };
  return { label: "Aberta", tone: "success" };
}

function VipListDialog({ open, onOpenChange, initial, eventDate, saving, onSubmit }: { open: boolean; onOpenChange: (v: boolean) => void; initial?: VipListSummary; eventDate?: string; saving: boolean; onSubmit: (payload: VipListPayload) => void }) {
  const start = initial?.vipAte ? splitBrt(initial.vipAte) : { date: (eventDate ?? "").slice(0, 10), time: "23:00" };
  const [nome, setNome] = useState(initial?.nome ?? "Lista VIP");
  const [total, setTotal] = useState(String(initial?.total ?? 100));
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [ativa, setAtiva] = useState(initial?.ativa ?? true);

  const handleSubmit = () => {
    const totalNumber = Number(total);
    if (!nome.trim()) return toast.error("Dê um nome para a lista.");
    if (!Number.isInteger(totalNumber) || totalNumber < 1) return toast.error("Informe quantos nomes cabem na lista.");
    if (!date || !time) return toast.error("Informe até quando dá para colocar o nome.");
    onSubmit({ nome: nome.trim(), total: totalNumber, vipAte: toInstant(date, time), ativa });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar lista VIP" : "Nova lista VIP"}</DialogTitle>
          <DialogDescription>Entrada gratuita por link. A pessoa abre o link, coloca o nome e o ingresso com QR code fica na conta dela. Um nome por pessoa.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label="Nome da lista" htmlFor="vip-nome" hint="Aparece na página do evento para quem abre o link.">
            <Input id="vip-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: VIP até 23h" />
          </Field>
          <Field label="Quantos nomes cabem" htmlFor="vip-total" hint={initial && initial.naLista > 0 ? `Já há ${initial.naLista} nomes na lista.` : undefined}>
            <Input id="vip-total" type="number" min={1} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Field>
          <Field label="Aberta até" hint="Horário de Brasília. Depois disso ninguém mais entra na lista; quem já está nela entra no evento normalmente.">
            <FieldGroup columns={2} className="gap-2">
              <Input aria-label="Data limite" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input aria-label="Hora limite" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FieldGroup>
          </Field>
          <SwitchRow label="Lista aberta" description={ativa ? "O link está recebendo nomes" : "Pausada: desligue para pausar sem excluir"} checked={ativa} onCheckedChange={setAtiva} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button leftIcon={initial ? "save" : "link"} loading={saving} onClick={handleSubmit}>
            {initial ? "Salvar lista" : "Criar lista e gerar link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VipListsSection({ eventId, eventDate }: { eventId: number; eventDate?: string }) {
  const [data, setData] = useState<VipListsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; editing?: VipListSummary }>({ open: false });
  const [removing, setRemoving] = useState<VipListSummary | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    vipListsApi
      .get(eventId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) toast.error(getErrorMessage(err, "Não foi possível carregar a lista VIP."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  const listas = useMemo(() => data?.listas ?? [], [data]);
  const nomes = data?.nomes ?? [];
  const stats = useMemo(() => ({ naLista: listas.reduce((a, l) => a + l.naLista, 0), total: listas.reduce((a, l) => a + l.total, 0), entraram: listas.reduce((a, l) => a + l.entraram, 0) }), [listas]);

  const submit = async (payload: VipListPayload) => {
    setSaving(true);
    try {
      const editing = dialog.editing;
      setData(editing ? await vipListsApi.update(eventId, editing.id, payload) : await vipListsApi.create(eventId, payload));
      toast.success(editing ? "Lista VIP atualizada" : "Lista VIP criada. O link já pode ser divulgado.");
      setDialog({ open: false });
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar a lista VIP."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (list: VipListSummary) => {
    try {
      await vipListsApi.remove(eventId, list.id);
      setData(await vipListsApi.get(eventId));
      toast.success("Lista VIP excluída");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir a lista VIP."));
    }
  };

  const openCreate = () => setDialog({ open: true });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  const url = data ? getPublicTicketsUrl(`/vip/${data.link}`) : "";
  const listName = new Map(listas.map((l) => [l.id, l.nome || "Lista VIP"]));

  const dialogNode = <VipListDialog key={`${dialog.open ? "open" : "closed"}-${dialog.editing?.id ?? "new"}`} open={dialog.open} onOpenChange={(open) => setDialog((prev) => (open ? prev : { open: false }))} initial={dialog.editing} eventDate={eventDate} saving={saving} onSubmit={submit} />;

  if (listas.length === 0) {
    return (
      <>
        <EmptyState
          icon="crown"
          title="Nenhuma lista VIP neste evento"
          description="Crie uma lista, divulgue o link nos stories e veja aqui quem colocou o nome. Cada pessoa recebe o ingresso com QR code na conta."
          action={
            <Button leftIcon="plus" onClick={openCreate}>
              Criar lista VIP
            </Button>
          }
        />
        {dialogNode}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Nomes na lista" icon="users" value={stats.naLista} hint={`de ${stats.total.toLocaleString("pt-BR")} vagas`} />
        <StatCard label="Já entraram" icon="check-circle" value={stats.entraram} hint={stats.naLista > 0 ? `${Math.round((stats.entraram / stats.naLista) * 100)}% da lista` : "Ninguém validou ainda"} />
        <StatCard label="Listas" icon="crown" value={listas.length} hint={`${listas.filter((l) => listState(l).label === "Aberta").length} abertas agora`} />
      </div>

      <div className="card-glow flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center">
        <div className="min-w-0 sm:w-48 sm:shrink-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon name="link" size={13} className="text-brand" />
            Link para divulgar
          </p>
          <p className="mt-0.5 text-caption text-muted-foreground">Cole no story ou na bio.</p>
        </div>
        <CopyField value={url} label="Copiar link" className="min-w-0 flex-1" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Listas</h2>
          <Button variant="outline" size="sm" leftIcon="plus" onClick={openCreate}>
            Nova lista
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {listas.map((list) => {
            const state = listState(list);
            return (
              <article key={list.id} className="card-glow flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{list.nome || "Lista VIP"}</p>
                    <p className="mt-0.5 text-caption text-muted-foreground">{list.vipAte ? `Aberta até ${formatMoment(list.vipAte)}` : "Sem prazo definido"}</p>
                  </div>
                  <StatusBadge tone={state.tone} pulse={state.tone === "success"}>
                    {state.label}
                  </StatusBadge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-caption text-muted-foreground">
                    <span>
                      <span className="text-base font-semibold tabular-nums text-foreground">
                        {list.naLista}/{list.total}
                      </span>{" "}
                      nomes
                    </span>
                    <span className="tabular-nums">{list.entraram} já entraram</span>
                  </div>
                  <ProgressBar value={list.naLista} max={Math.max(list.total, 1)} tone={state.tone === "warning" ? "warning" : "brand"} label={`${list.naLista} de ${list.total} nomes`} />
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
                  <Button variant="subtle" size="icon-sm" aria-label="Editar lista VIP" title="Editar" onClick={() => setDialog({ open: true, editing: list })}>
                    <Icon name="edit" size={13} />
                  </Button>
                  <Button variant="subtle" size="icon-sm" aria-label="Excluir lista VIP" title="Excluir" className="hover:bg-danger-bg hover:text-danger" onClick={() => setRemoving(list)}>
                    <Icon name="trash" size={13} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Quem está na lista</h2>
        {nomes.length === 0 ? (
          <EmptyState compact icon="users" title="Ninguém colocou o nome ainda" description="Divulgue o link para começar." />
        ) : (
          <DataTableShell
            table={
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeadCell>Nome</DataTableHeadCell>
                    <DataTableHeadCell>E-mail</DataTableHeadCell>
                    {listas.length > 1 ? <DataTableHeadCell>Lista</DataTableHeadCell> : null}
                    <DataTableHeadCell>Situação</DataTableHeadCell>
                    <DataTableHeadCell>Entrou na lista</DataTableHeadCell>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {nomes.map((n, i) => (
                    <DataTableRow key={n.id} index={i}>
                      <DataTableCell className="font-semibold">{n.nome || "Sem nome"}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">{n.email}</DataTableCell>
                      {listas.length > 1 ? <DataTableCell>{listName.get(n.listaId) ?? "Lista VIP"}</DataTableCell> : null}
                      <DataTableCell>
                        <StatusBadge tone={n.entrou ? "success" : "warning"}>{n.entrou ? "Compareceu" : "Na lista"}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell className="tnum">{formatMoment(n.em)}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            }
            mobile={
              <MobileCardList>
                {nomes.map((n, i) => (
                  <MobileCard
                    key={n.id}
                    index={i}
                    title={n.nome || "Sem nome"}
                    subtitle={n.email}
                    badge={<StatusBadge tone={n.entrou ? "success" : "warning"}>{n.entrou ? "Compareceu" : "Na lista"}</StatusBadge>}
                    meta={[...(listas.length > 1 ? [{ label: "Lista", value: listName.get(n.listaId) ?? "Lista VIP" }] : []), { label: "Entrou na lista", value: formatMoment(n.em), num: true }]}
                  />
                ))}
              </MobileCardList>
            }
          />
        )}
      </section>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => (!o ? setRemoving(null) : null)}
        danger
        icon="crown"
        title="Excluir esta lista VIP?"
        description="Ninguém mais consegue colocar o nome nela. Quem já está na lista continua com o ingresso e entra normalmente."
        confirmLabel="Excluir lista"
        onConfirm={() => (removing ? remove(removing) : undefined)}
      />

      {dialogNode}
    </div>
  );
}
