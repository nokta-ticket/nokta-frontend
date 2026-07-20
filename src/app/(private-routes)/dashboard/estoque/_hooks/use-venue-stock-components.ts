"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueStockApi, type SetModifierComponentPayload, type SetVariantComponentPayload } from "@/services/venue-stock";
import { stockKeys } from "./query-keys";

export function useVenueVariantComponents(orgId: number | null, variantId: number | null) {
  return useQuery({
    queryKey: stockKeys.variantComponents(orgId ?? -1, variantId ?? -1),
    queryFn: () => venueStockApi.getVariantComponents(orgId as number, variantId as number),
    enabled: orgId !== null && variantId !== null,
  });
}

export function useSetVariantComponents(orgId: number, variantId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (components: SetVariantComponentPayload[]) =>
      venueStockApi.setVariantComponents(orgId, variantId, components),
    onSuccess: () => qc.invalidateQueries({ queryKey: stockKeys.variantComponents(orgId, variantId) }),
  });
}

export function useVenueModifierComponents(orgId: number | null, modifierOptionId: number | null) {
  return useQuery({
    queryKey: stockKeys.modifierComponents(orgId ?? -1, modifierOptionId ?? -1),
    queryFn: () => venueStockApi.getModifierComponents(orgId as number, modifierOptionId as number),
    enabled: orgId !== null && modifierOptionId !== null,
  });
}

export function useSetModifierComponents(orgId: number, modifierOptionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (components: SetModifierComponentPayload[]) =>
      venueStockApi.setModifierComponents(orgId, modifierOptionId, components),
    onSuccess: () => qc.invalidateQueries({ queryKey: stockKeys.modifierComponents(orgId, modifierOptionId) }),
  });
}
