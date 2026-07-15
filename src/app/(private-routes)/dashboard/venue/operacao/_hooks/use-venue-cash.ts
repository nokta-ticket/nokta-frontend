"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CloseCashSessionPayload,
  type CreateCashMovementPayload,
  type CreateVenueCashRegisterPayload,
  type OpenCashSessionPayload,
  type UpdateVenueCashRegisterPayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenueCashRegisters(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: opKeys.cashRegisters(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueOperationApi.listCashRegisters(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueCashRegisterMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: opKeys.cashRegisters(orgId, locationId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueCashRegisterPayload) =>
      venueOperationApi.createCashRegister(orgId, locationId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({
      registerId,
      payload,
    }: {
      registerId: number;
      payload: UpdateVenueCashRegisterPayload;
    }) => venueOperationApi.updateCashRegister(orgId, registerId, payload),
    onSuccess: invalidate,
  });

  return { create, update };
}

export function useVenueCashSessions(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: opKeys.cashSessions(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueOperationApi.listCashSessions(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

/** Detalhe da sessão de caixa, com polling enquanto ela está sendo acompanhada. */
export function useVenueCashSession(orgId: number | null, sessionId: number | null) {
  return useQuery({
    queryKey: opKeys.cashSession(orgId ?? -1, sessionId ?? -1),
    queryFn: () => venueOperationApi.getCashSession(orgId as number, sessionId as number),
    enabled: orgId !== null && sessionId !== null,
    refetchInterval: orgId !== null && sessionId !== null ? 8000 : false,
  });
}

export function useVenueCashSessionMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: opKeys.cashRegisters(orgId, locationId) });
    qc.invalidateQueries({ queryKey: opKeys.cashSessions(orgId, locationId) });
  };

  const open = useMutation({
    mutationFn: ({ registerId, payload }: { registerId: number; payload: OpenCashSessionPayload }) =>
      venueOperationApi.openCashSession(orgId, registerId, payload),
    onSuccess: invalidateAll,
  });

  const addMovement = useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: number; payload: CreateCashMovementPayload }) =>
      venueOperationApi.addCashMovement(orgId, sessionId, payload),
    onSuccess: (_data, vars) => {
      invalidateAll();
      qc.invalidateQueries({ queryKey: opKeys.cashSession(orgId, vars.sessionId) });
    },
  });

  const close = useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: number; payload: CloseCashSessionPayload }) =>
      venueOperationApi.closeCashSession(orgId, sessionId, payload),
    onSuccess: (_data, vars) => {
      invalidateAll();
      qc.invalidateQueries({ queryKey: opKeys.cashSession(orgId, vars.sessionId) });
    },
  });

  return { open, addMovement, close };
}
