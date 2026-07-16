"use client";

import { useQuery } from "@tanstack/react-query";
import { venueFinanceApi, type VenueCashSessionReportQueryParams } from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceCashSessions(orgId: number | null, locationId: number | null, params: VenueCashSessionReportQueryParams = {}) {
  return useQuery({
    queryKey: financeKeys.cashSessions(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.listCashSessions(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueFinanceCashSessionReport(orgId: number | null, sessionId: number | null) {
  return useQuery({
    queryKey: financeKeys.cashSessionReport(orgId ?? -1, sessionId ?? -1),
    queryFn: () => venueFinanceApi.getCashSessionReport(orgId as number, sessionId as number),
    enabled: orgId !== null && sessionId !== null,
  });
}
