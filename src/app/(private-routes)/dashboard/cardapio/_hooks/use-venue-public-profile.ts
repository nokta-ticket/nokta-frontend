"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueMenuApi, type UpdateVenuePublicProfilePayload } from "@/services/venue-menu";
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
    onSuccess: () => qc.invalidateQueries({ queryKey: venueKeys.publicProfile(orgId) }),
  });
}
