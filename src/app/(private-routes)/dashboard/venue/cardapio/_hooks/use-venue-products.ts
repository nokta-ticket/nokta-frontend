"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueProductPayload,
  type UpdateVenueProductPayload,
  type VenueAvailabilityStatus,
  type VenueProductQuery,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueProducts(orgId: number | null, query: VenueProductQuery) {
  return useQuery({
    queryKey: venueKeys.products(orgId ?? -1, query as Record<string, unknown>),
    queryFn: () => venueMenuApi.listProducts(orgId as number, query),
    enabled: orgId !== null,
    placeholderData: (previous) => previous, // evita flash de skeleton ao trocar página/filtro
  });
}

export function useVenueProduct(orgId: number | null, productId: number | null) {
  return useQuery({
    queryKey: venueKeys.product(orgId ?? -1, productId ?? -1),
    queryFn: () => venueMenuApi.getProduct(orgId as number, productId as number),
    enabled: orgId !== null && productId !== null,
  });
}

export function useVenueProductMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateList = () =>
    qc.invalidateQueries({ queryKey: ["venue", orgId, "products"], exact: false });
  const invalidateDetail = (productId: number) =>
    qc.invalidateQueries({ queryKey: venueKeys.product(orgId, productId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueProductPayload) => venueMenuApi.createProduct(orgId, payload),
    onSuccess: invalidateList,
  });

  const update = useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: UpdateVenueProductPayload }) =>
      venueMenuApi.updateProduct(orgId, productId, payload),
    onSuccess: (_data, vars) => {
      invalidateList();
      invalidateDetail(vars.productId);
    },
  });

  const archive = useMutation({
    mutationFn: (productId: number) => venueMenuApi.archiveProduct(orgId, productId),
    onSuccess: (_data, productId) => {
      invalidateList();
      invalidateDetail(productId);
    },
  });

  const setAvailability = useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: VenueAvailabilityStatus }) =>
      venueMenuApi.setProductAvailability(orgId, productId, status),
    onSuccess: (_data, vars) => {
      invalidateList();
      invalidateDetail(vars.productId);
    },
  });

  return { create, update, archive, setAvailability };
}
