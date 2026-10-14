"use client";

import { useState } from "react";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { SelectInput } from "@/components/ui/select-input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { formatPhone } from "@/lib/br-data";
import { VENUE_RESERVATION_SOURCE_LABEL, VENUE_RESERVATION_STATUS_LABEL, type VenueReservation, type VenueReservationSource, type VenueReservationStatus } from "@/services/venue-reservations";
import { useVenueReservations } from "../_hooks/use-venue-reservations";
import { formatInTimeZone } from "../_lib/timezone";
import { ReservationStatusBadge } from "./reservation-status-badge";

interface LocationTz {
  timezone: string;
}

const PER_PAGE = 20;
const STATUS_OPTIONS = [{ value: "ALL", label: "Todos os status" }, ...(Object.keys(VENUE_RESERVATION_STATUS_LABEL) as VenueReservationStatus[]).map((v) => ({ value: v, label: VENUE_RESERVATION_STATUS_LABEL[v] }))];
const SOURCE_OPTIONS = [{ value: "ALL", label: "Todas as origens" }, ...(Object.keys(VENUE_RESERVATION_SOURCE_LABEL) as VenueReservationSource[]).map((v) => ({ value: v, label: VENUE_RESERVATION_SOURCE_LABEL[v] }))];

/** Histórico completo de reservas (todas as datas e status), com busca e paginação. */
export function ListaTab({ orgId, locationId, location, onOpenDetail }: { orgId: number; locationId: number; location: LocationTz; onOpenDetail: (reservationId: number) => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState<VenueReservationStatus | "ALL">("ALL");
  const [source, setSource] = useState<VenueReservationSource | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useVenueReservations(orgId, locationId, {
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    source: source === "ALL" ? undefined : source,
    page,
    limit: PER_PAGE,
  });

  const reservations: VenueReservation[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const tablesLabel = (r: VenueReservation) => (r.tables.length === 0 ? null : r.tables.map((t) => t.table.nome).join(", "));

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Nome, telefone ou código…"
          className="w-full flex-1 md:max-w-xl"
        />
        <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto">
          <SelectInput
            value={status}
            onValueChange={(v) => {
              setStatus(v as VenueReservationStatus | "ALL");
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            className="md:w-44"
          />
          <SelectInput
            value={source}
            onValueChange={(v) => {
              setSource(v as VenueReservationSource | "ALL");
              setPage(1);
            }}
            options={SOURCE_OPTIONS}
            className="md:w-44"
          />
        </div>
      </DataTableToolbar>

      {isError ? (
        <ErrorState title="Não deu pra carregar as reservas" onRetry={() => refetch()} />
      ) : isLoading ? (
        <RowsSkeleton rows={6} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Quando</DataTableHeadCell>
                  <DataTableHeadCell>Cliente</DataTableHeadCell>
                  <DataTableHeadCell align="right">Pessoas</DataTableHeadCell>
                  <DataTableHeadCell>Origem</DataTableHeadCell>
                  <DataTableHeadCell>Mesas</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {reservations.length === 0 ? (
                  <DataTableEmpty colSpan={6} icon="calendar" title="Nenhuma reserva encontrada" description="Ajuste os filtros ou crie uma nova reserva." />
                ) : (
                  reservations.map((r, i) => (
                    <DataTableRow key={r.id} index={i} onClick={() => onOpenDetail(r.id)}>
                      <DataTableCell className="tnum">
                        <span className="font-semibold">{formatInTimeZone(r.startAt, location.timezone, "DD/MM")}</span>
                        <span className="ml-1.5 text-muted-foreground">{formatInTimeZone(r.startAt, location.timezone, "HH:mm")}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="font-semibold">{r.customerName}</span>
                        <span className="block text-caption text-muted-foreground tnum">
                          {r.publicCode} · {formatPhone(r.customerPhone)}
                        </span>
                      </DataTableCell>
                      <DataTableCell num>{r.partySize}</DataTableCell>
                      <DataTableCell>{VENUE_RESERVATION_SOURCE_LABEL[r.source]}</DataTableCell>
                      <DataTableCell className={tablesLabel(r) ? undefined : "text-subtle-foreground"}>{tablesLabel(r) ?? "Sem mesa"}</DataTableCell>
                      <DataTableCell>
                        <ReservationStatusBadge status={r.status} />
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            reservations.length === 0 ? (
              <EmptyState compact icon="calendar" title="Nenhuma reserva encontrada" description="Ajuste os filtros ou crie uma nova reserva." />
            ) : (
              <MobileCardList>
                {reservations.map((r, i) => (
                  <MobileCard
                    key={r.id}
                    index={i}
                    onClick={() => onOpenDetail(r.id)}
                    title={r.customerName}
                    subtitle={`${formatInTimeZone(r.startAt, location.timezone, "DD/MM [às] HH:mm")} · ${r.publicCode}`}
                    badge={<ReservationStatusBadge status={r.status} />}
                    meta={[
                      { label: "Pessoas", value: r.partySize, num: true },
                      { label: "Origem", value: VENUE_RESERVATION_SOURCE_LABEL[r.source] },
                      { label: "Mesas", value: tablesLabel(r) ?? "Sem mesa" },
                      { label: "Telefone", value: formatPhone(r.customerPhone), num: true },
                    ]}
                  />
                ))}
              </MobileCardList>
            )
          }
          footer={total > PER_PAGE ? <DataTablePagination page={page} lastPage={lastPage} total={total} perPage={PER_PAGE} noun="reservas" onPageChange={setPage} /> : undefined}
        />
      )}
    </div>
  );
}
