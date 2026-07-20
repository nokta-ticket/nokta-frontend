"use client";

import { useQuery } from "@tanstack/react-query";
import { venueInsightsApi, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { insightsKeys } from "./query-keys";

// Dados analíticos, não operacionais em tempo real — staleTime de 1 minuto
// evita refetch a cada troca de aba sem deixar o dashboard desatualizado.
const STALE_TIME_MS = 60_000;

export function useVenueInsightsOverview(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.overview(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getOverview(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsAlerts(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.alerts(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getAlerts(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsSales(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.sales(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getSales(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsOperation(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.operation(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getOperation(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsProducts(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.products(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getProducts(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsProductDetail(orgId: number | null, productId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.productDetail(orgId ?? -1, productId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getProductDetail(orgId as number, productId as number, params),
    enabled: orgId !== null && productId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsReservations(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.reservations(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getReservations(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsStock(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.stock(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getStock(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsFinance(orgId: number | null, params: VenueInsightsFilterParams) {
  return useQuery({
    queryKey: insightsKeys.finance(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getFinance(orgId as number, params),
    enabled: orgId !== null,
    staleTime: STALE_TIME_MS,
  });
}

export function useVenueInsightsLocationsComparison(orgId: number | null, params: VenueInsightsFilterParams, enabled: boolean) {
  return useQuery({
    queryKey: insightsKeys.locationsComparison(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueInsightsApi.getLocationsComparison(orgId as number, params),
    enabled: orgId !== null && enabled,
    staleTime: STALE_TIME_MS,
  });
}
