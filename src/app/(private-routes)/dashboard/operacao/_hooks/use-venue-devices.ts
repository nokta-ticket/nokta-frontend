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
    // 10s (não 30s) para acompanhar de perto a janela de 60s de
    // ONLINE_THRESHOLD_MS em terminais-tab.tsx — as duas mudam juntas.
    refetchInterval: 10_000,
    // Por padrão o React Query pausa refetchInterval com a aba em segundo
    // plano (throttle de document.visibilityState) — um painel operacional
    // que o gerente deixa aberto numa tela secundária enquanto faz outra
    // coisa não pode ficar "congelado" até ele voltar o foco manualmente.
    refetchIntervalInBackground: true,
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
