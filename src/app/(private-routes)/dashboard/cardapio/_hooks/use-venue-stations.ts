"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenuePreparationStationPayload,
  type ReorderPayload,
  type UpdateVenuePreparationStationPayload,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueStations(orgId: number | null) {
  return useQuery({
    queryKey: venueKeys.stations(orgId ?? -1),
    queryFn: () => venueMenuApi.listStations(orgId as number),
    enabled: orgId !== null,
  });
}

export function useVenueStationMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: venueKeys.stations(orgId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenuePreparationStationPayload) =>
      venueMenuApi.createStation(orgId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      stationId,
      payload,
    }: {
      stationId: number;
      payload: UpdateVenuePreparationStationPayload;
    }) => venueMenuApi.updateStation(orgId, stationId, payload),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ stationId, active }: { stationId: number; active: boolean }) =>
      venueMenuApi.setStationActive(orgId, stationId, active),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderStations(orgId, payload),
    onSuccess: invalidate,
  });

  return { create, update, setActive, reorder };
}
