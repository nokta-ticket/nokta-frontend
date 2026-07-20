"use client";

import { useQuery } from "@tanstack/react-query";
import { venueFinanceApi, type VenueFinancePeriodParams } from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceOverview(orgId: number | null, locationId: number | null, params: VenueFinancePeriodParams, live = false) {
  const enabled = orgId !== null && locationId !== null;
  return useQuery({
    queryKey: financeKeys.overview(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.getOverview(orgId as number, locationId as number, params),
    enabled,
    refetchInterval: live && enabled ? 30000 : false,
  });
}

export function useVenueFinanceTimeline(orgId: number | null, locationId: number | null, params: VenueFinancePeriodParams) {
  return useQuery({
    queryKey: financeKeys.timeline(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.getTimeline(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueFinancePaymentMethods(orgId: number | null, locationId: number | null, params: VenueFinancePeriodParams) {
  return useQuery({
    queryKey: financeKeys.paymentMethods(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.getPaymentMethods(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueFinanceExpensesByCategory(orgId: number | null, locationId: number | null, params: VenueFinancePeriodParams) {
  return useQuery({
    queryKey: financeKeys.expensesByCategory(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.getExpensesByCategory(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueFinanceCompareLocations(orgId: number | null, params: VenueFinancePeriodParams, enabled: boolean) {
  return useQuery({
    queryKey: financeKeys.compareLocations(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.compareLocations(orgId as number, params),
    enabled: orgId !== null && enabled,
  });
}
