"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatPhone } from "@/lib/br-data";
import { toast } from "@/lib/toast";
import { VENUE_RESERVATION_SOURCE_LABEL } from "@/services/venue-reservations";
import { useVenueReservation, useVenueReservationGuestMutations, useVenueReservationGuests, useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone } from "../_lib/timezone";
import { CancelWithReasonDialog } from "./cancel-with-reason-dialog";
import { ReservationFormDialog } from "./reservation-form-dialog";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { SeatReservationDialog } from "./seat-reservation-dialog";

interface LocationTz {
  timezone: string;
  defaultReservationDurationMinutes: number;
}

/** Lista de nomes da reserva (sem conta/QR) com check-in na porta. */
function GuestList({ orgId, reservationId, partySize }: { orgId: number; reservationId: number; partySize: number }) {
  const { data: guests, isLoading } = useVenueReservationGuests(orgId, reservationId);
  const { add, remove, checkIn } = useVenueReservationGuestMutations(orgId, reservationId);
  const [name, setName] = useState("");
  const list = guests ?? [];
  const checkedIn = list.filter((g) => g.checkedInAt).length;

  const handleAdd = () => {
    const value = name.trim();
    if (!value) return;
    add.mutate(
      { name: value },
      {
        onSuccess: () => setName(""),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível adicionar o convidado.")),
      },
    );
  };

  return (
    <SheetSection title={`Convidados${list.length ? ` · ${checkedIn}/${list.length} na casa` : ""}`}>
      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : list.length === 0 ? (
          <p className="text-caption text-muted-foreground">Nenhum nome na lista ainda — a reserva é pra {partySize} {partySize === 1 ? "pessoa" : "pessoas"}.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {list.map((g) => {
              const inHouse = g.checkedInAt !== null;
              return (
                <li key={g.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                  <Icon name={inHouse ? "check-circle" : "circle-outline"} size={15} className={cn("shrink-0", inHouse ? "text-success" : "text-subtle-foreground")} />
                  <span className={cn("min-w-0 flex-1 truncate text-sm", inHouse ? "text-muted-foreground" : "text-foreground")}>{g.name}</span>
                  {inHouse ? (
                    <span className="text-caption text-subtle-foreground tnum">{new Date(g.checkedInAt!).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</span>
                  ) : (
                    <Button size="sm" variant="outline" leftIcon="check" loading={checkIn.isPending && checkIn.variables === g.id} onClick={() => checkIn.mutate(g.id, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível fazer o check-in.")) })}>
                      Check-in
                    </Button>
                  )}
                  <Button size="icon-sm" variant="subtle" aria-label={`Remover ${g.name}`} className="hover:bg-danger-bg hover:text-danger" disabled={remove.isPending} onClick={() => remove.mutate(g.id, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível remover o convidado.")) })}>
                    <Icon name="close" size={12} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do convidado" aria-label="Nome do convidado" />
          <Button type="submit" variant="outline" leftIcon="user-plus" disabled={!name.trim()} loading={add.isPending}>
            Adicionar
          </Button>
        </form>
      </div>
    </SheetSection>
  );
}

export function ReservationDetailSheet({ orgId, locationId, location, reservationId, open, onOpenChange }: { orgId: number; locationId: number; location: LocationTz; reservationId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const isMobile = useIsMobile();
  const { data: reservation, isLoading } = useVenueReservation(orgId, reservationId);
  const { confirm, cancel, noShow, complete } = useVenueReservationMutations(orgId, locationId);
  const [editOpen, setEditOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const router = useRouter();

  const actionable = reservation?.status === "PENDING" || reservation?.status === "CONFIRMED";
  const durationMin = reservation ? Math.round((new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / 60000) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={cn(isMobile ? "h-[92dvh]" : "sm:max-w-lg")}>
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {reservation ? (
              <>
                {reservation.customerName}
                <ReservationStatusBadge status={reservation.status} pulse={reservation.status === "SEATED"} />
              </>
            ) : (
              "Reserva"
            )}
          </SheetTitle>
          <SheetDescription>{reservation ? `Reserva ${reservation.publicCode} · ${formatInTimeZone(reservation.startAt, location.timezone, "ddd, DD/MM [às] HH:mm")} · ${reservation.partySize} ${reservation.partySize === 1 ? "pessoa" : "pessoas"}` : "Carregando a reserva…"}</SheetDescription>
        </SheetHeader>

        <SheetBody>
          {isLoading || !reservation ? (
            <div className="space-y-3">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <>
              {actionable ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" leftIcon="door" onClick={() => setSeatOpen(true)}>
                      Dar entrada
                    </Button>
                    {reservation.status === "PENDING" ? (
                      <Button size="lg" variant="contrast" leftIcon="check" loading={confirm.isPending} onClick={() => confirm.mutate(reservation.id, { onSuccess: () => toast.success("Reserva confirmada."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível confirmar.")) })}>
                        Confirmar
                      </Button>
                    ) : (
                      <Button size="lg" variant="outline" leftIcon="edit" onClick={() => setEditOpen(true)}>
                        Editar
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reservation.status === "PENDING" ? (
                      <Button size="sm" variant="outline" leftIcon="edit" onClick={() => setEditOpen(true)}>
                        Editar
                      </Button>
                    ) : null}
                    {reservation.status === "CONFIRMED" ? (
                      <Button size="sm" variant="outline" leftIcon="eye-slash" loading={noShow.isPending} onClick={() => noShow.mutate({ reservationId: reservation.id, payload: {} }, { onSuccess: () => toast.success("Marcado como no-show."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível marcar no-show.")) })}>
                        No-show
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive-soft" leftIcon="ban" onClick={() => setCancelOpen(true)}>
                      Cancelar reserva
                    </Button>
                  </div>
                </div>
              ) : null}

              {reservation.status === "SEATED" ? (
                <div className="flex flex-wrap gap-2">
                  {reservation.tab ? (
                    <Button leftIcon="receipt" onClick={() => router.push(`/dashboard/operacao?locationId=${locationId}&tabId=${reservation.tab!.id}`)}>
                      Ver comanda {reservation.tab.publicCode}
                    </Button>
                  ) : null}
                  <Button variant="outline" leftIcon="check-double" loading={complete.isPending} onClick={() => complete.mutate(reservation.id, { onSuccess: () => toast.success("Reserva concluída."), onError: (err) => toast.error(getErrorMessage(err, "Não foi possível concluir.")) })}>
                    Concluir reserva
                  </Button>
                </div>
              ) : reservation.tab && reservation.status !== "PENDING" && reservation.status !== "CONFIRMED" ? (
                <Button variant="outline" leftIcon="receipt" className="w-fit" onClick={() => router.push(`/dashboard/operacao?locationId=${locationId}&tabId=${reservation.tab!.id}`)}>
                  Ver comanda {reservation.tab.publicCode}
                </Button>
              ) : null}

              {reservation.cancelReason ? <Callout tone="danger" title="Motivo do cancelamento">{reservation.cancelReason}</Callout> : null}

              <DetailGrid columns={2}>
                <DetailItem label="Telefone" icon="phone">
                  <a href={`tel:${reservation.customerPhone}`} className="text-brand underline-offset-4 hover:underline">
                    {formatPhone(reservation.customerPhone)}
                  </a>
                </DetailItem>
                <DetailItem label="E-mail" icon="mail" value={reservation.customerEmail} />
                <DetailItem label="Horário" icon="clock" value={`${formatInTimeZone(reservation.startAt, location.timezone, "HH:mm")} – ${formatInTimeZone(reservation.endAt, location.timezone, "HH:mm")} · ${durationMin} min`} />
                <DetailItem label="Origem" icon="compass" value={VENUE_RESERVATION_SOURCE_LABEL[reservation.source]} />
                <DetailItem label="Área preferida" icon="map-pin" value={reservation.preferredArea?.nome} />
                <DetailItem label="Mesas" icon="chair" value={reservation.tables.length === 0 ? null : reservation.tables.map((t) => `${t.table.nome}${t.isPrimary && reservation.tables.length > 1 ? " (principal)" : ""}`).join(", ")} />
                {reservation.notes ? <DetailItem label="Observações do cliente" icon="message" value={reservation.notes} span /> : null}
                {reservation.internalNotes ? <DetailItem label="Observações internas" icon="lock" value={reservation.internalNotes} span /> : null}
              </DetailGrid>

              <GuestList orgId={orgId} reservationId={reservation.id} partySize={reservation.partySize} />

              {reservation.status === "NO_SHOW" ? <EmptyState compact icon="eye-slash" title="Cliente não compareceu" description="A reserva foi marcada como no-show." /> : null}
            </>
          )}
        </SheetBody>

        {reservation ? (
          <>
            <ReservationFormDialog orgId={orgId} locationId={locationId} location={location} reservation={reservation} open={editOpen} onOpenChange={setEditOpen} />
            <SeatReservationDialog orgId={orgId} locationId={locationId} reservation={reservation} open={seatOpen} onOpenChange={setSeatOpen} />
            <CancelWithReasonDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              title="Cancelar reserva"
              loading={cancel.isPending}
              onConfirm={(reason) =>
                cancel.mutate(
                  { reservationId: reservation.id, payload: { reason } },
                  {
                    onSuccess: () => {
                      toast.success("Reserva cancelada.");
                      setCancelOpen(false);
                    },
                    onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
                  },
                )
              }
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
