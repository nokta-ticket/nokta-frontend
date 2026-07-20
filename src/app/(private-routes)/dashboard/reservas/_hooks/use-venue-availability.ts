"use client";

import { useQuery } from "@tanstack/react-query";
import { venueReservationsApi, type AvailabilityQueryParams } from "@/services/venue-reservations";
import { resKeys } from "./query-keys";

/** Só consulta quando os campos mínimos (unidade/horário/pessoas) estão preenchidos. */
export function useVenueAvailability(orgId: number | null, params: AvailabilityQueryParams | null) {
  return useQuery({
    queryKey: resKeys.availability(orgId ?? -1, (params ?? {}) as Record<string, unknown>),
    queryFn: () => venueReservationsApi.availability(orgId as number, params as AvailabilityQueryParams),
    enabled: orgId !== null && params !== null && !!params.startAt && !!params.partySize,
  });
}
