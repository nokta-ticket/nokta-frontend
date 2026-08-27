"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueOperationApi, type CreateVenueDevicePairingCodePayload } from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenueDevices(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: opKeys.devices(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueOperationApi.listDevices(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
    // Terminal físico pode cair a qualquer momento sem avisar o backend —
    // sem revalidar, "Online"/"Desconectado" só atualizaria ao reabrir a aba.
    refetchInterval: 30_000,
  });
}

export function useVenueDeviceMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: opKeys.devices(orgId, locationId) });

  const createPairingCode = useMutation({
    mutationFn: (payload: CreateVenueDevicePairingCodePayload) =>
      venueOperationApi.createDevicePairingCode(orgId, payload),
    onSuccess: invalidate,
  });

  const revoke = useMutation({
    mutationFn: (deviceId: number) => venueOperationApi.revokeDevice(orgId, deviceId),
    onSuccess: invalidate,
  });

  const regeneratePairingCode = useMutation({
    mutationFn: (deviceId: number) => venueOperationApi.regenerateDevicePairingCode(orgId, deviceId),
    onSuccess: invalidate,
  });

  const deleteDevice = useMutation({
    mutationFn: (deviceId: number) => venueOperationApi.deleteDevice(orgId, deviceId),
    onSuccess: invalidate,
  });

  return { createPairingCode, revoke, regeneratePairingCode, deleteDevice };
}
