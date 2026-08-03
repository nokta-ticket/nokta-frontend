"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueMenuApi, type UpdateVenuePublicProfilePayload, type VenuePublicProfile } from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenuePublicProfile(orgId: number | null) {
  return useQuery({
    queryKey: venueKeys.publicProfile(orgId ?? -1),
    queryFn: () => venueMenuApi.getPublicProfile(orgId as number),
    enabled: orgId !== null,
  });
}

export function useUpdateVenuePublicProfile(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVenuePublicProfilePayload) => venueMenuApi.updatePublicProfile(orgId, payload),
    // Optimistic update — campos editados direto no cabeçalho (logo, banner,
    // Instagram, WhatsApp) salvam no blur; sem isso o valor exibido volta
    // pro antigo até invalidateQueries refazer o GET pela rede e "pisca"
    // de volta pro novo quando a resposta chega.
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: venueKeys.publicProfile(orgId) });
      const previous = qc.getQueryData<VenuePublicProfile>(venueKeys.publicProfile(orgId));
      qc.setQueryData<VenuePublicProfile>(venueKeys.publicProfile(orgId), (current) =>
        current ? { ...current, ...payload } : current,
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        qc.setQueryData(venueKeys.publicProfile(orgId), context.previous);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: venueKeys.publicProfile(orgId) }),
  });
}
