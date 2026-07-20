"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/br-data";
import {
  VENUE_RESERVATION_SOURCE_LABEL,
  VENUE_RESERVATION_STATUS_LABEL,
  type VenueReservation,
  type VenueReservationSource,
  type VenueReservationStatus,
} from "@/services/venue-reservations";
import { useVenueReservations } from "../_hooks/use-venue-reservations";
import { useDebounce } from "../../cardapio/_hooks/use-debounce";
import { formatInTimeZone } from "../_lib/timezone";
import { ReservationStatusBadge } from "./reservation-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

interface LocationTz {
  timezone: string;
}

export function ListaTab({
  orgId,
  locationId,
  location,
  onOpenDetail,
}: {
  orgId: number;
  locationId: number;
  location: LocationTz;
  onOpenDetail: (reservationId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState<VenueReservationStatus | "ALL">("ALL");
  const [source, setSource] = useState<VenueReservationSource | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useVenueReservations(orgId, locationId, {
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    source: source === "ALL" ? undefined : source,
    page,
    limit: 20,
  });

  const reservations: VenueReservation[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/40" size={16} />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, telefone ou código…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as VenueReservationStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            {Object.entries(VENUE_RESERVATION_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={(v) => { setSource(v as VenueReservationSource | "ALL"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as origens</SelectItem>
            {Object.entries(VENUE_RESERVATION_SOURCE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as reservas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : reservations.length === 0 ? (
        <EmptyState title="Nenhuma reserva encontrada" description="Ajuste os filtros ou crie uma nova reserva." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reservations.map((r) => (
              <button
                key={r.id}
                onClick={() => onOpenDetail(r.id)}
                className="rounded-xl border border-black/10 bg-white p-3 text-left hover:border-violet-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{r.publicCode}</span>
                  <ReservationStatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-sm text-gray-900">{r.customerName}</p>
                <p className="text-xs text-black/50">
                  {formatInTimeZone(r.startAt, location.timezone, "DD/MM/YYYY HH:mm")} · {r.partySize} pessoa(s)
                </p>
                <p className="text-xs text-black/40">
                  {formatPhone(r.customerPhone)} · {VENUE_RESERVATION_SOURCE_LABEL[r.source]}
                  {r.tables.length > 0 ? ` · ${r.tables.map((t) => t.table.nome).join(", ")}` : ""}
                </p>
              </button>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/50">Página {page} de {totalPages} · {total} reserva(s)</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
