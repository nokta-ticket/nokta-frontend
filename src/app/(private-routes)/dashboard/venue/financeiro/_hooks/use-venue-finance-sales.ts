"use client";

import { useQuery } from "@tanstack/react-query";
import { venueFinanceApi, type VenueFinancePeriodParams, type VenuePaymentMethod, type VenuePaymentStatus } from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export interface VenueSalesFilters extends VenueFinancePeriodParams {
  method?: VenuePaymentMethod;
  status?: VenuePaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function useVenueFinanceSales(orgId: number | null, locationId: number | null, filters: VenueSalesFilters) {
  return useQuery({
    queryKey: financeKeys.sales(orgId ?? -1, locationId ?? -1, filters as Record<string, unknown>),
    queryFn: () => venueFinanceApi.listSales(orgId as number, locationId as number, filters),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueFinanceSaleDetail(orgId: number | null, paymentId: number | null) {
  return useQuery({
    queryKey: financeKeys.saleDetail(orgId ?? -1, paymentId ?? -1),
    queryFn: () => venueFinanceApi.getSaleDetail(orgId as number, paymentId as number),
    enabled: orgId !== null && paymentId !== null,
  });
}

export function useVenueFinanceReceivablesAgenda(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: financeKeys.receivables(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueFinanceApi.getReceivablesAgenda(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}
