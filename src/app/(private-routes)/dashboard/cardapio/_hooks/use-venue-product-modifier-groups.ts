"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueProductModifierGroupPayload,
  type ReorderPayload,
  type UpdateVenueProductModifierGroupPayload,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueProductModifierGroups(orgId: number | null, productId: number | null) {
  return useQuery({
    queryKey: venueKeys.productModifierGroups(orgId ?? -1, productId ?? -1),
    queryFn: () => venueMenuApi.listProductModifierGroups(orgId as number, productId as number),
    enabled: orgId !== null && productId !== null,
  });
}

export function useVenueProductModifierGroupMutations(orgId: number, productId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: venueKeys.productModifierGroups(orgId, productId) });
    qc.invalidateQueries({ queryKey: venueKeys.product(orgId, productId) });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueProductModifierGroupPayload) =>
      venueMenuApi.createProductModifierGroup(orgId, productId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      linkId,
      payload,
    }: {
      linkId: number;
      payload: UpdateVenueProductModifierGroupPayload;
    }) => venueMenuApi.updateProductModifierGroup(orgId, linkId, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (linkId: number) => venueMenuApi.removeProductModifierGroup(orgId, linkId),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) =>
      venueMenuApi.reorderProductModifierGroups(orgId, productId, payload),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}
