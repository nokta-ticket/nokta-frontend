"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueFinanceApi, type VenuePaymentMethod } from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceReconciliations(orgId: number | null, locationId: number | null, params: { startDate?: string; endDate?: string; status?: string } = {}) {
  return useQuery({
    queryKey: financeKeys.reconciliations(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.listReconciliations(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useSetVenueFinanceReconciliation(orgId: number, locationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, method, actualNetCents, notes }: { date: string; method: VenuePaymentMethod; actualNetCents: number; notes?: string }) =>
      venueFinanceApi.setReconciliation(orgId, locationId, date, method, actualNetCents, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance", orgId, "reconciliations"], exact: false }),
  });
}
