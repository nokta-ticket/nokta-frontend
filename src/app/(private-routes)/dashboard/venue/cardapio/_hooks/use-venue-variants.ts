"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueProductVariantPayload,
  type ReorderPayload,
  type UpdateVenueProductVariantPayload,
  type VenueAvailabilityStatus,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueVariants(orgId: number | null, productId: number | null) {
  return useQuery({
    queryKey: venueKeys.variants(orgId ?? -1, productId ?? -1),
    queryFn: () => venueMenuApi.listVariants(orgId as number, productId as number),
    enabled: orgId !== null && productId !== null,
  });
}

export function useVenueVariantMutations(orgId: number, productId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: venueKeys.variants(orgId, productId) });
    qc.invalidateQueries({ queryKey: venueKeys.product(orgId, productId) });
    qc.invalidateQueries({ queryKey: ["venue", orgId, "products"], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueProductVariantPayload) =>
      venueMenuApi.createVariant(orgId, productId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: number;
      payload: UpdateVenueProductVariantPayload;
    }) => venueMenuApi.updateVariant(orgId, variantId, payload),
    onSuccess: invalidate,
  });

  const setDefault = useMutation({
    mutationFn: (variantId: number) => venueMenuApi.setDefaultVariant(orgId, variantId),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (variantId: number) => venueMenuApi.archiveVariant(orgId, variantId),
    onSuccess: invalidate,
  });

  const setAvailability = useMutation({
    mutationFn: ({ variantId, status }: { variantId: number; status: VenueAvailabilityStatus }) =>
      venueMenuApi.setVariantAvailability(orgId, variantId, status),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderVariants(orgId, productId, payload),
    onSuccess: invalidate,
  });

  return { create, update, setDefault, archive, setAvailability, reorder };
}
