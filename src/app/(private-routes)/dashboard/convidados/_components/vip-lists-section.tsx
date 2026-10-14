"use client";

import { useEffect, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getPublicTicketsUrl } from "@/lib/surfaces";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { vipListsApi, type VipListSummary, type VipListsResponse } from "@/services/vip-lists";

// Lista VIP: o produtor divulga o link no story, a pessoa coloca o nome e
// recebe o ingresso com QR na conta. Aqui ele cria a lista, copia o link e
// vê quem já está nela.

const BRT = "America/Sao_Paulo";

function splitBrt(iso: string): { date: string; time: string } {
  const text = new Intl.DateTimeFormat("sv-SE", {
    timeZone: BRT, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
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

function listState(list: VipListSummary): { label: string; className: string } {
  if (!list.ativa) return { label: "Pausada", className: "bg-gray-100 text-gray-700" };
  if (list.vipAte && new Date(list.vipAte).getTime() < Date.now()) return { label: "Encerrada", className: "bg-gray-100 text-gray-700" };
  if (list.naLista >= list.total) return { label: "Esgotada", className: "bg-amber-100 text-amber-800" };
  return { label: "Aberta", className: "bg-emerald-100 text-emerald-800" };
}

function VipListDialog({
  open,
  onOpenChange,
  initial,
  eventDate,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: VipListSummary;
  eventDate?: string;
  saving: boolean;
  onSubmit: (payload: { nome: string; total: number; vipAte: string; ativa: boolean }) => void;
}) {
  const start = initial?.vipAte ? splitBrt(initial.vipAte) : { date: (eventDate ?? "").slice(0, 10), time: "23:00" };
  const [nome, setNome] = useState(initial?.nome ?? "Lista VIP");
  const [total, setTotal] = useState(String(initial?.total ?? 100));
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [ativa, setAtiva] = useState(initial?.ativa ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totalNumber = Number(total);
    if (!nome.trim()) return toast.error("Dê um nome para a lista.");
    if (!Number.isInteger(totalNumber) || totalNumber < 1) return toast.error("Informe quantos nomes cabem na lista.");
    if (!date || !time) return toast.error("Informe até quando dá para colocar o nome.");
    onSubmit({ nome: nome.trim(), total: totalNumber, vipAte: toInstant(date, time), ativa });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar lista VIP" : "Nova lista VIP"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vip-nome">Nome da lista</Label>
            <Input id="vip-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: VIP até 23h" />
            <p className="text-xs text-muted-foreground">Aparece na página do evento para quem abre o link.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vip-total">Quantos nomes cabem</Label>
            <Input id="vip-total" type="number" min={1} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} />
            {initial && initial.naLista > 0 ? (
              <p className="text-xs text-muted-foreground">Já há {initial.naLista} nomes na lista.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vip-data">Aberta até</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input id="vip-data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input aria-label="Horário" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Horário de Brasília. Depois disso ninguém mais entra na lista; quem já está nela entra no evento normalmente.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Lista aberta</p>
              <p className="text-xs text-muted-foreground">Desligue para pausar sem excluir.</p>
            </div>
            <Switch checked={ativa} onCheckedChange={setAtiva} aria-label="Lista aberta" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : initial ? "Salvar" : "Criar lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VipListsSection({ eventId, eventDate }: { eventId: number; eventDate?: string }) {
  const [data, setData] = useState<VipListsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; editing?: VipListSummary }>({ open: false });

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

  const submit = async (payload: { nome: string; total: number; vipAte: string; ativa: boolean }) => {
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

  if (loading) return <BlockSkeleton className="h-64" />;

  const listas = data?.listas ?? [];
  const nomes = data?.nomes ?? [];
  const url = data ? getPublicTicketsUrl(`/vip/${data.link}`) : "";
  const listName = new Map(listas.map((l) => [l.id, l.nome || "Lista VIP"]));

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const dialogNode = (
    <VipListDialog
      key={`${dialog.open ? "open" : "closed"}-${dialog.editing?.id ?? "new"}`}
      open={dialog.open}
      onOpenChange={(open) => setDialog((prev) => (open ? prev : { open: false }))}
      initial={dialog.editing}
      eventDate={eventDate}
      saving={saving}
      onSubmit={submit}
    />
  );

  if (listas.length === 0) {
    return (
      <>
        <EmptyState
          title="Nenhuma lista VIP neste evento"
          description="Crie uma lista, divulgue o link nos stories e veja aqui quem colocou o nome. Cada pessoa recebe o ingresso com QR code na conta."
          actionLabel="Criar lista VIP"
          onAction={openCreate}
        />
        {dialogNode}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 px-1">
          <p className="text-xs text-muted-foreground">Link para divulgar</p>
          <p className="truncate text-sm font-medium">{url}</p>
        </div>
        <Button onClick={copyLink} className="shrink-0">
          <Copy size={16} /> Copiar link
        </Button>
      </div>

      <div className="divide-y rounded-xl border bg-card">
        {listas.map((list) => {
          const state = listState(list);
          return (
            <div key={list.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{list.nome || "Lista VIP"}</p>
                  <Badge className={state.className}>{state.label}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {list.vipAte ? `Aberta até ${formatMoment(list.vipAte)}` : "Sem prazo definido"}
                </p>
              </div>
              <p className="text-sm">
                <span className="text-base font-semibold tabular-nums">
                  {list.naLista}/{list.total}
                </span>{" "}
                <span className="text-muted-foreground">nomes · {list.entraram} já entraram</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Editar lista VIP" onClick={() => setDialog({ open: true, editing: list })}>
                  <Pencil size={16} />
                </Button>
                <ConfirmDialog
                  title="Excluir esta lista VIP?"
                  description="Ninguém mais consegue colocar o nome nela. Quem já está na lista continua com o ingresso e entra normalmente."
                  onConfirm={() => remove(list)}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Excluir lista VIP">
                      <Trash2 size={16} />
                    </Button>
                  }
                />
              </div>
            </div>
          );
        })}
        <div className="px-4 py-2.5">
          <Button variant="ghost" size="sm" onClick={openCreate}>
            <Plus size={16} /> Nova lista VIP
          </Button>
        </div>
      </div>

      {nomes.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Ninguém colocou o nome ainda. Divulgue o link para começar.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              {listas.length > 1 ? <TableHead>Lista</TableHead> : null}
              <TableHead>Situação</TableHead>
              <TableHead>Entrou na lista</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nomes.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.nome || "—"}</TableCell>
                <TableCell>{n.email}</TableCell>
                {listas.length > 1 ? <TableCell>{listName.get(n.listaId) ?? "—"}</TableCell> : null}
                <TableCell>
                  <Badge className={n.entrou ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                    {n.entrou ? "Compareceu" : "Na lista"}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{formatMoment(n.em)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {dialogNode}
    </div>
  );
}
