"use client";

import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatPhone } from "@/lib/br-data";
import { VENUE_RESERVATION_SOURCE_LABEL, type VenueReservation } from "@/services/venue-reservations";
import { useVenueReservationMutations, useVenueReservations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone } from "../_lib/timezone";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

interface LocationTz {
  timezone: string;
}

export function AgendaTab({
  orgId,
  locationId,
  location,
  date,
  onOpenDetail,
  onSeat,
  onEdit,
  onCancel,
}: {
  orgId: number;
  locationId: number;
  location: LocationTz;
  date: string;
  onOpenDetail: (reservationId: number) => void;
  onSeat: (reservation: VenueReservation) => void;
  onEdit: (reservation: VenueReservation) => void;
  onCancel: (reservation: VenueReservation) => void;
}) {
  const { data, isLoading, isError, refetch } = useVenueReservations(orgId, locationId, { date }, true);
  const { confirm, noShow } = useVenueReservationMutations(orgId, locationId);

  if (isError) return <ErrorState description="Não foi possível carregar a agenda." onRetry={() => refetch()} />;
  if (isLoading) return <TableSkeleton />;

  const reservations = (data?.data ?? []).filter((r) => r.status !== "CANCELED" && r.status !== "NO_SHOW");
  if (reservations.length === 0) {
    return <EmptyState title="Nenhuma reserva neste dia" description="Crie uma nova reserva ou adicione o cliente à fila de espera." />;
  }

  return (
    <div className="space-y-2">
      {reservations.map((r) => (
        <div key={r.id} className="rounded-xl border border-black/10 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <button className="text-left" onClick={() => onOpenDetail(r.id)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{formatInTimeZone(r.startAt, location.timezone, "HH:mm")}</span>
                <span className="text-sm text-gray-900">{r.customerName}</span>
                <ReservationStatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-xs text-black/50">
                {r.partySize} pessoa(s) · {VENUE_RESERVATION_SOURCE_LABEL[r.source]}
                {r.preferredArea ? ` · ${r.preferredArea.nome}` : ""}
                {r.tables.length > 0 ? ` · ${r.tables.map((t) => t.table.nome).join(", ")}` : ""}
              </p>
              <p className="text-xs text-black/40">
                <a href={`tel:${r.customerPhone}`} className="text-violet-600 underline" onClick={(e) => e.stopPropagation()}>
                  {formatPhone(r.customerPhone)}
                </a>
                {r.notes ? ` · ${r.notes}` : ""}
              </p>
            </button>
            {r.status === "PENDING" || r.status === "CONFIRMED" ? (
              <div className="flex flex-wrap gap-1.5">
                {r.status === "PENDING" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      confirm.mutate(r.id, {
                        onSuccess: () => toast.success("Reserva confirmada."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível confirmar.")),
                      })
                    }
                  >
                    Confirmar
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                  Editar
                </Button>
                <Button size="sm" onClick={() => onSeat(r)}>
                  Dar entrada
                </Button>
                {r.status === "CONFIRMED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      noShow.mutate(
                        { reservationId: r.id, payload: {} },
                        {
                          onSuccess: () => toast.success("Marcado como no-show."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível marcar no-show.")),
                        },
                      )
                    }
                  >
                    No-show
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onCancel(r)}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
