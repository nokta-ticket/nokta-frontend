"use client";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { VENUE_RESERVATION_SOURCE_LABEL, type VenueReservation } from "@/services/venue-reservations";
import { useVenueReservationMutations, useVenueReservations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone } from "../_lib/timezone";
import { ReservationStatusBadge } from "./reservation-status-badge";

interface LocationTz {
  timezone: string;
}

/**
 * Agenda do dia agrupada por hora. Canceladas e no-show ficam fora (a aba
 * Lista mostra tudo) — aqui é o que a recepção precisa resolver agora.
 */
export function AgendaTab({ orgId, locationId, location, date, onOpenDetail, onSeat, onEdit, onCancel, onAddWaitlist }: { orgId: number; locationId: number; location: LocationTz; date: string; onOpenDetail: (reservationId: number) => void; onSeat: (reservation: VenueReservation) => void; onEdit: (reservation: VenueReservation) => void; onCancel: (reservation: VenueReservation) => void; onAddWaitlist?: () => void }) {
  const { data, isLoading, isError, refetch } = useVenueReservations(orgId, locationId, { date }, true);
  const { confirm, noShow } = useVenueReservationMutations(orgId, locationId);

  if (isError) return <ErrorState title="Não deu pra carregar a agenda" onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={5} className="[&>*]:h-24" />;

  const reservations = (data?.data ?? []).filter((r) => r.status !== "CANCELED" && r.status !== "NO_SHOW");
  if (reservations.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="Nenhuma reserva neste dia"
        description="Crie uma reserva ou coloque o cliente na fila de espera."
        action={
          onAddWaitlist ? (
            <Button variant="outline" leftIcon="user-plus" onClick={onAddWaitlist}>
              Adicionar à fila
            </Button>
          ) : undefined
        }
      />
    );
  }

  const groups = new Map<string, VenueReservation[]>();
  for (const r of reservations) {
    const hour = formatInTimeZone(r.startAt, location.timezone, "HH[h]");
    groups.set(hour, [...(groups.get(hour) ?? []), r]);
  }

  let index = 0;
  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([hour, items]) => (
        <section key={hour} className="space-y-2.5">
          <h3 className="flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
            <span className="tnum">{hour}</span>
            <span className="divider-glow flex-1" aria-hidden />
          </h3>
          {items.map((r) => {
            const actionable = r.status === "PENDING" || r.status === "CONFIRMED";
            const i = index++;
            return (
              <article key={r.id} className={cn("row-in flex flex-col gap-3 rounded-card border bg-surface p-4 shadow-card md:flex-row md:items-center", r.status === "SEATED" ? "border-border" : "border-border")} style={{ ["--i" as string]: i } as never}>
                <button type="button" onClick={() => onOpenDetail(r.id)} className="press flex min-w-0 flex-1 items-start gap-3 text-left">
                  <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-input bg-surface-2 text-sm font-semibold text-foreground tnum">{formatInTimeZone(r.startAt, location.timezone, "HH:mm")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-foreground">{r.customerName}</span>
                      <ReservationStatusBadge status={r.status} pulse={r.status === "SEATED"} />
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-muted-foreground">
                      <span className="inline-flex items-center gap-1 tnum">
                        <Icon name="users" size={10} />
                        {r.partySize}
                      </span>
                      <span>{VENUE_RESERVATION_SOURCE_LABEL[r.source]}</span>
                      {r.preferredArea ? <span>{r.preferredArea.nome}</span> : null}
                      {r.tables.length > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="chair" size={10} />
                          {r.tables.map((t) => t.table.nome).join(", ")}
                        </span>
                      ) : null}
                      <a href={`tel:${r.customerPhone}`} className="inline-flex items-center gap-1 text-brand" onClick={(e) => e.stopPropagation()}>
                        <Icon name="phone" size={10} />
                        {formatPhone(r.customerPhone)}
                      </a>
                    </span>
                    {r.notes ? <span className="mt-1 block truncate text-caption italic text-subtle-foreground">{r.notes}</span> : null}
                  </span>
                </button>

                {actionable ? (
                  <div className="flex flex-wrap items-center gap-1.5 md:shrink-0 md:justify-end">
                    {r.status === "PENDING" ? (
                      <Button size="sm" variant="outline" leftIcon="check" loading={confirm.isPending && confirm.variables === r.id} onClick={() => confirm.mutate(r.id, { onSuccess: () => toast.success("Reserva confirmada."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível confirmar.")) })}>
                        Confirmar
                      </Button>
                    ) : null}
                    <Button size="sm" leftIcon="door" onClick={() => onSeat(r)}>
                      Dar entrada
                    </Button>
                    <Button size="icon-sm" variant="subtle" aria-label="Editar reserva" onClick={() => onEdit(r)}>
                      <Icon name="edit" size={13} />
                    </Button>
                    {r.status === "CONFIRMED" ? (
                      <Button size="icon-sm" variant="subtle" aria-label="Marcar no-show" title="Marcar no-show" loading={noShow.isPending && noShow.variables?.reservationId === r.id} onClick={() => noShow.mutate({ reservationId: r.id, payload: {} }, { onSuccess: () => toast.success("Marcado como no-show."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível marcar no-show.")) })}>
                        <Icon name="eye-slash" size={13} />
                      </Button>
                    ) : null}
                    <Button size="icon-sm" variant="subtle" aria-label="Cancelar reserva" title="Cancelar reserva" className="hover:bg-danger-bg hover:text-danger" onClick={() => onCancel(r)}>
                      <Icon name="ban" size={13} />
                    </Button>
                  </div>
                ) : r.tab ? (
                  <span className="text-caption text-muted-foreground md:shrink-0">Comanda {r.tab.publicCode}</span>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
