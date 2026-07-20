"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatPhone } from "@/lib/br-data";
import { VENUE_RESERVATION_SOURCE_LABEL } from "@/services/venue-reservations";
import { useVenueReservation, useVenueReservationMutations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone } from "../_lib/timezone";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { ReservationFormDialog } from "./reservation-form-dialog";
import { SeatReservationDialog } from "./seat-reservation-dialog";
import { CancelWithReasonDialog } from "./cancel-with-reason-dialog";
import { BlockSkeleton } from "../../_components/states/loading-state";

interface LocationTz {
  timezone: string;
  defaultReservationDurationMinutes: number;
}

export function ReservationDetailSheet({
  orgId,
  locationId,
  location,
  reservationId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  location: LocationTz;
  reservationId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: reservation, isLoading } = useVenueReservation(orgId, reservationId);
  const { confirm, cancel, noShow, complete } = useVenueReservationMutations(orgId, locationId);
  const [editOpen, setEditOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {reservation ? (
              <>
                Reserva {reservation.publicCode}
                <ReservationStatusBadge status={reservation.status} />
              </>
            ) : (
              "Reserva"
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading || !reservation ? (
          <div className="px-4"><BlockSkeleton className="h-72" /></div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">
              <div className="grid grid-cols-2 gap-1.5 text-black/70">
                <span>Cliente</span><span className="text-right font-medium text-gray-900">{reservation.customerName}</span>
                <span>Telefone</span>
                <span className="text-right">
                  <a href={`tel:${reservation.customerPhone}`} className="text-violet-600 underline">
                    {formatPhone(reservation.customerPhone)}
                  </a>
                </span>
                {reservation.customerEmail ? (
                  <>
                    <span>E-mail</span><span className="text-right">{reservation.customerEmail}</span>
                  </>
                ) : null}
                <span>Data/horário</span>
                <span className="text-right">{formatInTimeZone(reservation.startAt, location.timezone, "DD/MM/YYYY HH:mm")}</span>
                <span>Duração</span>
                <span className="text-right">
                  {Math.round((new Date(reservation.endAt).getTime() - new Date(reservation.startAt).getTime()) / 60000)} min
                </span>
                <span>Pessoas</span><span className="text-right">{reservation.partySize}</span>
                <span>Origem</span><span className="text-right">{VENUE_RESERVATION_SOURCE_LABEL[reservation.source]}</span>
                <span>Área preferida</span><span className="text-right">{reservation.preferredArea?.nome ?? "—"}</span>
                <span>Mesas</span>
                <span className="text-right">
                  {reservation.tables.length === 0
                    ? "—"
                    : reservation.tables.map((t) => `${t.table.nome}${t.isPrimary ? " (principal)" : ""}`).join(", ")}
                </span>
              </div>
              {reservation.notes ? (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs text-black/60">Obs.: {reservation.notes}</p>
              ) : null}
              {reservation.internalNotes ? (
                <p className="mt-1 text-xs text-black/40 italic">Interno: {reservation.internalNotes}</p>
              ) : null}
              {reservation.cancelReason ? (
                <p className="mt-2 border-t border-black/5 pt-2 text-xs text-red-600">Motivo: {reservation.cancelReason}</p>
              ) : null}
            </div>

            {reservation.tab ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/operacao?locationId=${locationId}&tabId=${reservation.tab!.id}`)}
              >
                Ver comanda {reservation.tab.publicCode}
              </Button>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {reservation.status === "PENDING" || reservation.status === "CONFIRMED" ? (
                <>
                  {reservation.status === "PENDING" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        confirm.mutate(reservation.id, {
                          onSuccess: () => toast.success("Reserva confirmada."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível confirmar.")),
                        })
                      }
                      disabled={confirm.isPending}
                    >
                      Confirmar
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSeatOpen(true)}>
                    Dar entrada
                  </Button>
                  {reservation.status === "CONFIRMED" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        noShow.mutate(
                          { reservationId: reservation.id, payload: {} },
                          {
                            onSuccess: () => toast.success("Marcado como no-show."),
                            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível marcar no-show.")),
                          },
                        )
                      }
                      disabled={noShow.isPending}
                    >
                      No-show
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelOpen(true)}>
                    Cancelar
                  </Button>
                </>
              ) : null}

              {reservation.status === "SEATED" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    complete.mutate(reservation.id, {
                      onSuccess: () => toast.success("Reserva concluída."),
                      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível concluir.")),
                    })
                  }
                  disabled={complete.isPending}
                >
                  Concluir manualmente
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {reservation ? (
          <>
            <ReservationFormDialog
              orgId={orgId}
              locationId={locationId}
              location={location}
              reservation={reservation}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
            <SeatReservationDialog
              orgId={orgId}
              locationId={locationId}
              reservation={reservation}
              open={seatOpen}
              onOpenChange={setSeatOpen}
            />
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
