"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueReservationsApi,
  type CancelWaitlistEntryPayload,
  type CreateVenueWaitlistEntryPayload,
  type SeatWaitlistEntryPayload,
  type UpdateVenueWaitlistEntryPayload,
  type WaitlistQueryParams,
} from "@/services/venue-reservations";
import { resKeys } from "./query-keys";

/** Fila ativa — poll enquanto a aba estiver montada (React Query já pausa em background). */
export function useVenueWaitlist(orgId: number | null, locationId: number | null, params: WaitlistQueryParams = {}) {
  return useQuery({
    queryKey: resKeys.waitlist(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueReservationsApi.listWaitlist(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
    refetchInterval: orgId !== null && locationId !== null ? 15000 : false,
  });
}

export function useVenueWaitlistMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["res", orgId, "waitlist", locationId], exact: false });
  const invalidateSummary = () => qc.invalidateQueries({ queryKey: ["res", orgId, "summary", locationId], exact: false });
  const invalidateAvailability = () => qc.invalidateQueries({ queryKey: ["res", orgId, "availability"], exact: false });
  const invalidateOperation = () => {
    qc.invalidateQueries({ queryKey: ["op", orgId, "tables", locationId], exact: false });
    qc.invalidateQueries({ queryKey: ["op", orgId, "tabs", locationId], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueWaitlistEntryPayload) =>
      venueReservationsApi.createWaitlistEntry(orgId, locationId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
    },
  });

  const update = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload: UpdateVenueWaitlistEntryPayload }) =>
      venueReservationsApi.updateWaitlistEntry(orgId, entryId, payload),
    onSuccess: invalidateList,
  });

  const notify = useMutation({
    mutationFn: (entryId: number) => venueReservationsApi.notifyWaitlistEntry(orgId, entryId),
    onSuccess: invalidateList,
  });

  const markLeft = useMutation({
    mutationFn: (entryId: number) => venueReservationsApi.markWaitlistEntryLeft(orgId, entryId),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
    },
  });

  const cancel = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload: CancelWaitlistEntryPayload }) =>
      venueReservationsApi.cancelWaitlistEntry(orgId, entryId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
    },
  });

  const seat = useMutation({
    mutationFn: ({ entryId, payload }: { entryId: number; payload: SeatWaitlistEntryPayload }) =>
      venueReservationsApi.seatWaitlistEntry(orgId, entryId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
      invalidateAvailability();
      invalidateOperation();
    },
  });

  return { create, update, notify, markLeft, cancel, seat };
}
