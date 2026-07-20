"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueReservationsApi,
  type CancelReservationPayload,
  type CreateVenueReservationPayload,
  type NoShowReservationPayload,
  type ReservationQueryParams,
  type SeatReservationPayload,
  type SetReservationTablesPayload,
  type UpdateVenueReservationPayload,
} from "@/services/venue-reservations";
import { resKeys } from "./query-keys";

/**
 * Lista de reservas. `live` liga o polling (agenda do dia / próximas) —
 * histórico (status terminal, períodos passados) nunca faz polling.
 */
export function useVenueReservations(
  orgId: number | null,
  locationId: number | null,
  params: ReservationQueryParams = {},
  live = false,
) {
  return useQuery({
    queryKey: resKeys.reservations(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueReservationsApi.list(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
    refetchInterval: live && orgId !== null && locationId !== null ? 20000 : false,
  });
}

export function useVenueReservation(orgId: number | null, reservationId: number | null) {
  return useQuery({
    queryKey: resKeys.reservation(orgId ?? -1, reservationId ?? -1),
    queryFn: () => venueReservationsApi.getOne(orgId as number, reservationId as number),
    enabled: orgId !== null && reservationId !== null,
  });
}

export function useVenueReservationsSummary(orgId: number | null, locationId: number | null, date: string) {
  const enabled = orgId !== null && locationId !== null && date !== "";
  return useQuery({
    queryKey: resKeys.summary(orgId ?? -1, locationId ?? -1, date),
    queryFn: () => venueReservationsApi.summary(orgId as number, locationId as number, date),
    enabled,
    refetchInterval: enabled ? 20000 : false,
  });
}

export function useVenueReservationMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["res", orgId, "reservations", locationId], exact: false });
  const invalidateOne = (reservationId: number) =>
    qc.invalidateQueries({ queryKey: resKeys.reservation(orgId, reservationId) });
  const invalidateSummary = () => qc.invalidateQueries({ queryKey: ["res", orgId, "summary", locationId], exact: false });
  const invalidateAvailability = () => qc.invalidateQueries({ queryKey: ["res", orgId, "availability"], exact: false });
  const invalidateOperation = () => {
    qc.invalidateQueries({ queryKey: ["op", orgId, "tables", locationId], exact: false });
    qc.invalidateQueries({ queryKey: ["op", orgId, "tabs", locationId], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueReservationPayload) => venueReservationsApi.create(orgId, locationId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
      invalidateAvailability();
    },
  });

  const update = useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: number; payload: UpdateVenueReservationPayload }) =>
      venueReservationsApi.update(orgId, reservationId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.reservationId);
      invalidateList();
      invalidateAvailability();
    },
  });

  const setTables = useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: number; payload: SetReservationTablesPayload }) =>
      venueReservationsApi.setTables(orgId, reservationId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.reservationId);
      invalidateList();
      invalidateAvailability();
    },
  });

  const confirm = useMutation({
    mutationFn: (reservationId: number) => venueReservationsApi.confirm(orgId, reservationId),
    onSuccess: (_d, reservationId) => {
      invalidateOne(reservationId);
      invalidateList();
      invalidateSummary();
    },
  });

  const cancel = useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: number; payload: CancelReservationPayload }) =>
      venueReservationsApi.cancel(orgId, reservationId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.reservationId);
      invalidateList();
      invalidateSummary();
      invalidateAvailability();
    },
  });

  const noShow = useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: number; payload: NoShowReservationPayload }) =>
      venueReservationsApi.noShow(orgId, reservationId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.reservationId);
      invalidateList();
      invalidateSummary();
      invalidateAvailability();
    },
  });

  const complete = useMutation({
    mutationFn: (reservationId: number) => venueReservationsApi.complete(orgId, reservationId),
    onSuccess: (_d, reservationId) => {
      invalidateOne(reservationId);
      invalidateList();
      invalidateSummary();
    },
  });

  // Dar entrada afeta reservas, mesas, comandas e a Operação inteira — invalida tudo.
  const seat = useMutation({
    mutationFn: ({ reservationId, payload }: { reservationId: number; payload: SeatReservationPayload }) =>
      venueReservationsApi.seat(orgId, reservationId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.reservationId);
      invalidateList();
      invalidateSummary();
      invalidateAvailability();
      invalidateOperation();
    },
  });

  return { create, update, setTables, confirm, cancel, noShow, complete, seat };
}
