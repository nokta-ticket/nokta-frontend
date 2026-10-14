"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import type { VenueWaitlistEntry } from "@/services/venue-reservations";
import { useVenueWaitlist, useVenueWaitlistMutations } from "../_hooks/use-venue-waitlist";
import { CancelWithReasonDialog } from "./cancel-with-reason-dialog";
import { WaitlistStatusBadge } from "./reservation-status-badge";
import { WaitlistSeatDialog } from "./waitlist-seat-dialog";

function minutesSince(iso: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60000));
}

/** Fila de espera: quem está aguardando (em ordem de chegada) e o histórico do dia. */
export function FilaTab({ orgId, locationId, onAdd }: { orgId: number; locationId: number; onAdd?: () => void }) {
  const { data, isLoading, isError, refetch } = useVenueWaitlist(orgId, locationId, { status: undefined });
  const { notify, markLeft, cancel } = useVenueWaitlistMutations(orgId, locationId);
  const [seatEntry, setSeatEntry] = useState<VenueWaitlistEntry | null>(null);
  const [cancelEntry, setCancelEntry] = useState<VenueWaitlistEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (isError) return <ErrorState title="Não deu pra carregar a fila" onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={4} className="[&>*]:h-24" />;

  const entries = data?.data ?? [];
  const active = entries.filter((e) => e.status === "WAITING" || e.status === "NOTIFIED");
  const rest = entries.filter((e) => e.status !== "WAITING" && e.status !== "NOTIFIED");

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="Fila vazia"
        description="Clientes sem reserva aparecem aqui enquanto aguardam mesa."
        action={
          onAdd ? (
            <Button leftIcon="user-plus" onClick={onAdd}>
              Adicionar à fila
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {active.length === 0 ? (
        <EmptyState compact icon="users" title="Ninguém esperando agora" description="Todo mundo da fila já foi atendido." />
      ) : (
        <div className="space-y-2.5">
          {active.map((entry, idx) => {
            const waiting = minutesSince(entry.createdAt, nowMs);
            const late = entry.estimatedWaitMinutes !== null && waiting > entry.estimatedWaitMinutes;
            return (
              <article key={entry.id} className="row-in flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card md:flex-row md:items-center" style={{ ["--i" as string]: idx } as never}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-foreground tnum">{idx + 1}º</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-foreground">{entry.customerName}</span>
                      <WaitlistStatusBadge status={entry.status} pulse={entry.status === "NOTIFIED"} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-muted-foreground">
                      <span className="inline-flex items-center gap-1 tnum">
                        <Icon name="users" size={10} />
                        {entry.partySize}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 tnum", late && "font-semibold text-warning")}>
                        <Icon name="clock" size={10} />
                        esperando há {waiting} min{entry.estimatedWaitMinutes ? ` · previsão ${entry.estimatedWaitMinutes} min` : ""}
                      </span>
                      {entry.preferredArea ? <span>{entry.preferredArea.nome}</span> : null}
                      <a href={`tel:${entry.customerPhone}`} className="inline-flex items-center gap-1 text-brand">
                        <Icon name="phone" size={10} />
                        {formatPhone(entry.customerPhone)}
                      </a>
                    </div>
                    {entry.notes ? <p className="mt-1 truncate text-caption italic text-subtle-foreground">{entry.notes}</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:shrink-0 md:justify-end">
                  {entry.status === "WAITING" ? (
                    <Button size="sm" variant="outline" leftIcon="bell" loading={notify.isPending && notify.variables === entry.id} onClick={() => notify.mutate(entry.id, { onSuccess: () => toast.success("Cliente avisado."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível avisar.")) })}>
                      Avisar
                    </Button>
                  ) : null}
                  <Button size="sm" leftIcon="door" onClick={() => setSeatEntry(entry)}>
                    Sentar
                  </Button>
                  <Button size="icon-sm" variant="subtle" aria-label="Cliente desistiu" title="Cliente desistiu" loading={markLeft.isPending && markLeft.variables === entry.id} onClick={() => markLeft.mutate(entry.id, { onSuccess: () => toast.success("Registrado como desistência."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível registrar.")) })}>
                    <Icon name="logout" size={13} />
                  </Button>
                  <Button size="icon-sm" variant="subtle" aria-label="Cancelar entrada" title="Cancelar entrada" className="hover:bg-danger-bg hover:text-danger" onClick={() => setCancelEntry(entry)}>
                    <Icon name="ban" size={13} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {rest.length > 0 ? (
        <section className="space-y-2">
          <button type="button" onClick={() => setHistoryOpen((v) => !v)} aria-expanded={historyOpen} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <Icon name={historyOpen ? "chevron-down" : "chevron-right"} size={11} />
            Histórico da fila ({rest.length})
          </button>
          {historyOpen ? (
            <ul className="divide-y divide-border rounded-card border border-border bg-surface shadow-card">
              {rest.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">
                    {entry.customerName}
                    <span className="ml-2 text-caption text-muted-foreground tnum">
                      {entry.publicCode} · {entry.partySize} {entry.partySize === 1 ? "pessoa" : "pessoas"}
                    </span>
                  </span>
                  <WaitlistStatusBadge status={entry.status} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <WaitlistSeatDialog orgId={orgId} locationId={locationId} entry={seatEntry} open={seatEntry !== null} onOpenChange={(v) => !v && setSeatEntry(null)} />
      <CancelWithReasonDialog
        open={cancelEntry !== null}
        onOpenChange={(v) => !v && setCancelEntry(null)}
        title="Cancelar entrada na fila"
        loading={cancel.isPending}
        onConfirm={(reason) =>
          cancelEntry &&
          cancel.mutate(
            { entryId: cancelEntry.id, payload: { reason } },
            {
              onSuccess: () => {
                toast.success("Entrada cancelada.");
                setCancelEntry(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
            },
          )
        }
      />
    </div>
  );
}
