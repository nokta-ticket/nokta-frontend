"use client";

import { useQuery } from "@tanstack/react-query";
import { venueHomeApi } from "@/services/venue-home";

export function useVenueHome(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: ["home", orgId ?? -1, locationId ?? "default"],
    queryFn: () => venueHomeApi.get(orgId as number, locationId ? { locationId } : {}),
    enabled: orgId !== null,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
