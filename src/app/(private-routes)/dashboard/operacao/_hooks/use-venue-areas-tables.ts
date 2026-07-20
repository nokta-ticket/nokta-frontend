"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CreateVenueAreaPayload,
  type CreateVenueTablePayload,
  type UpdateVenueAreaPayload,
  type UpdateVenueTablePayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenueAreas(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: opKeys.areas(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueOperationApi.listAreas(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

/** Mesas, com polling — ocupação pode mudar por ação de outro usuário. */
export function useVenueTables(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: opKeys.tables(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueOperationApi.listTables(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
    refetchInterval: orgId !== null && locationId !== null ? 8000 : false,
  });
}

export function useVenueAreaMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: opKeys.areas(orgId, locationId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueAreaPayload) => venueOperationApi.createArea(orgId, locationId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ areaId, payload }: { areaId: number; payload: UpdateVenueAreaPayload }) =>
      venueOperationApi.updateArea(orgId, areaId, payload),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: ({ areaId, active }: { areaId: number; active: boolean }) =>
      venueOperationApi.setAreaActive(orgId, areaId, active),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (items: { id: number; displayOrder: number }[]) =>
      venueOperationApi.reorderAreas(orgId, locationId, items),
    onSuccess: invalidate,
  });

  return { create, update, setActive, reorder };
}

export function useVenueTableMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: opKeys.tables(orgId, locationId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueTablePayload) =>
      venueOperationApi.createTable(orgId, locationId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ tableId, payload }: { tableId: number; payload: UpdateVenueTablePayload }) =>
      venueOperationApi.updateTable(orgId, tableId, payload),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: ({ tableId, active }: { tableId: number; active: boolean }) =>
      venueOperationApi.setTableActive(orgId, tableId, active),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (items: { id: number; displayOrder: number }[]) =>
      venueOperationApi.reorderTables(orgId, locationId, items),
    onSuccess: invalidate,
  });

  return { create, update, setActive, reorder };
}
