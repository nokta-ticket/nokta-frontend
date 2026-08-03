"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueMenuApi, type SetVenueAmenityItemPayload, type VenueAmenityItem } from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueAmenities(orgId: number | null) {
  return useQuery({
    queryKey: venueKeys.amenities(orgId ?? -1),
    queryFn: () => venueMenuApi.getAmenities(orgId as number),
    enabled: orgId !== null,
  });
}

export function useUpdateVenueAmenities(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: SetVenueAmenityItemPayload[]) => venueMenuApi.updateAmenities(orgId, items),
    // Optimistic update — mesmo padrão de use-venue-public-profile.ts: sem
    // isso, o toggle/valor editado pisca de volta pro estado antigo até o
    // PUT ir e voltar da rede.
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: venueKeys.amenities(orgId) });
      const previous = qc.getQueryData<VenueAmenityItem[]>(venueKeys.amenities(orgId));
      qc.setQueryData<VenueAmenityItem[]>(venueKeys.amenities(orgId), (current) =>
        current?.map((item) => {
          const update = items.find((i) => i.key === item.key);
          return update ? { ...item, enabled: update.enabled, value: update.value ?? null } : item;
        }),
      );
      return { previous };
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        qc.setQueryData(venueKeys.amenities(orgId), context.previous);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: venueKeys.amenities(orgId) }),
  });
}
