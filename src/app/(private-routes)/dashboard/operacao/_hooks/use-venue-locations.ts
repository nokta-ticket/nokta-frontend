"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CreateVenueLocationPayload,
  type UpdateVenueLocationPayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenueLocations(orgId: number | null) {
  return useQuery({
    queryKey: opKeys.locations(orgId ?? -1),
    queryFn: () => venueOperationApi.listLocations(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueLocationMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: opKeys.locations(orgId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueLocationPayload) => venueOperationApi.createLocation(orgId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      locationId,
      payload,
    }: {
      locationId: number;
      payload: UpdateVenueLocationPayload;
    }) => venueOperationApi.updateLocation(orgId, locationId, payload),
    onSuccess: invalidate,
  });

  const setMain = useMutation({
    mutationFn: (locationId: number) => venueOperationApi.setMainLocation(orgId, locationId),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (locationId: number) => venueOperationApi.archiveLocation(orgId, locationId),
    onSuccess: invalidate,
  });

  return { create, update, setMain, archive };
}
