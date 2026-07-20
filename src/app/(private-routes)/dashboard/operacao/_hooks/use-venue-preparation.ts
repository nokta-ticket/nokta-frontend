"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueOperationApi, type SetOrderItemStatusPayload } from "@/services/venue-operation";
import { opKeys } from "./query-keys";

interface PreparationFilters {
  preparationStationId?: number;
  status?: string;
}

/** Fila de preparo — polling enquanto a aba está aberta (5-10s). */
export function useVenuePreparationItems(
  orgId: number | null,
  locationId: number | null,
  filters: PreparationFilters = {},
) {
  return useQuery({
    queryKey: opKeys.preparationItems(orgId ?? -1, locationId ?? -1, filters as Record<string, unknown>),
    queryFn: () => venueOperationApi.listPreparationItems(orgId as number, locationId as number, filters),
    enabled: orgId !== null && locationId !== null,
    refetchInterval: orgId !== null && locationId !== null ? 7000 : false,
  });
}

export function useVenuePreparationMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["op", orgId, "preparationItems", locationId], exact: false });
    qc.invalidateQueries({ queryKey: ["op", orgId, "tab"], exact: false });
    qc.invalidateQueries({ queryKey: ["op", orgId, "orders"], exact: false });
  };

  const setStatus = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: SetOrderItemStatusPayload }) =>
      venueOperationApi.setPreparationStatus(orgId, itemId, payload),
    onSuccess: invalidate,
  });

  return { setStatus };
}
