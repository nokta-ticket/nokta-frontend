"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueStockApi,
  type CreateManualStockMovementPayload,
  type CreateVenueStockCountPayload,
  type CreateVenueStockTransferPayload,
  type UpdateVenueStockCountItemsPayload,
  type UpdateVenueStockTransferPayload,
  type VenueStockCountStatus,
  type VenueStockMovementQueryParams,
  type VenueStockTransferStatus,
} from "@/services/venue-stock";
import { stockKeys } from "./query-keys";

// ---- Movimentações e lançamentos manuais ----

export function useVenueStockMovements(orgId: number | null, locationId: number | null, params: VenueStockMovementQueryParams = {}) {
  return useQuery({
    queryKey: stockKeys.movements(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueStockApi.listMovements(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

function useInvalidateStockState(orgId: number) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["stock", orgId, "items"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "itemBalances"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "itemMovements"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "movements"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "summary"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "alerts"], exact: false });
  };
}

export function useVenueStockManualMovementMutations(orgId: number, locationId: number) {
  const invalidateStockState = useInvalidateStockState(orgId);

  const registerWaste = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: CreateManualStockMovementPayload }) =>
      venueStockApi.registerWaste(orgId, locationId, itemId, payload),
    onSuccess: invalidateStockState,
  });
  const registerAdjustmentIn = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: CreateManualStockMovementPayload }) =>
      venueStockApi.registerAdjustmentIn(orgId, locationId, itemId, payload),
    onSuccess: invalidateStockState,
  });
  const registerAdjustmentOut = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: CreateManualStockMovementPayload }) =>
      venueStockApi.registerAdjustmentOut(orgId, locationId, itemId, payload),
    onSuccess: invalidateStockState,
  });

  return { registerWaste, registerAdjustmentIn, registerAdjustmentOut };
}

// ---- Inventário / contagem ----

export function useVenueStockCounts(orgId: number | null, locationId: number | null, status?: VenueStockCountStatus) {
  return useQuery({
    queryKey: stockKeys.counts(orgId ?? -1, locationId ?? -1, status),
    queryFn: () => venueStockApi.listCounts(orgId as number, locationId as number, status),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueStockCount(orgId: number | null, countId: number | null) {
  return useQuery({
    queryKey: stockKeys.count(orgId ?? -1, countId ?? -1),
    queryFn: () => venueStockApi.getCount(orgId as number, countId as number),
    enabled: orgId !== null && countId !== null,
  });
}

export function useVenueStockCountMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateStockState = useInvalidateStockState(orgId);
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "counts", locationId], exact: false });
  const invalidateOne = (countId: number) => qc.invalidateQueries({ queryKey: stockKeys.count(orgId, countId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueStockCountPayload) => venueStockApi.createCount(orgId, locationId, payload),
    onSuccess: invalidateList,
  });
  const updateItems = useMutation({
    mutationFn: ({ countId, payload }: { countId: number; payload: UpdateVenueStockCountItemsPayload }) =>
      venueStockApi.updateCountItems(orgId, countId, payload),
    onSuccess: (_d, vars) => invalidateOne(vars.countId),
  });
  const cancel = useMutation({
    mutationFn: (countId: number) => venueStockApi.cancelCount(orgId, countId),
    onSuccess: (_d, countId) => {
      invalidateOne(countId);
      invalidateList();
    },
  });
  const complete = useMutation({
    mutationFn: (countId: number) => venueStockApi.completeCount(orgId, countId),
    onSuccess: (_d, countId) => {
      invalidateOne(countId);
      invalidateList();
      invalidateStockState();
    },
  });

  return { create, updateItems, cancel, complete };
}

// ---- Transferências ----

export function useVenueStockTransfers(orgId: number | null, status?: VenueStockTransferStatus) {
  return useQuery({
    queryKey: stockKeys.transfers(orgId ?? -1, status),
    queryFn: () => venueStockApi.listTransfers(orgId as number, status),
    enabled: orgId !== null,
  });
}

export function useVenueStockTransfer(orgId: number | null, transferId: number | null) {
  return useQuery({
    queryKey: stockKeys.transfer(orgId ?? -1, transferId ?? -1),
    queryFn: () => venueStockApi.getTransfer(orgId as number, transferId as number),
    enabled: orgId !== null && transferId !== null,
  });
}

export function useVenueStockTransferMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateStockState = useInvalidateStockState(orgId);
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "transfers"], exact: false });
  const invalidateOne = (transferId: number) => qc.invalidateQueries({ queryKey: stockKeys.transfer(orgId, transferId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueStockTransferPayload) => venueStockApi.createTransfer(orgId, payload),
    onSuccess: invalidateList,
  });
  const update = useMutation({
    mutationFn: ({ transferId, payload }: { transferId: number; payload: UpdateVenueStockTransferPayload }) =>
      venueStockApi.updateTransfer(orgId, transferId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.transferId);
      invalidateList();
    },
  });
  const cancel = useMutation({
    mutationFn: (transferId: number) => venueStockApi.cancelTransfer(orgId, transferId),
    onSuccess: (_d, transferId) => {
      invalidateOne(transferId);
      invalidateList();
    },
  });
  const send = useMutation({
    mutationFn: (transferId: number) => venueStockApi.sendTransfer(orgId, transferId),
    onSuccess: (_d, transferId) => {
      invalidateOne(transferId);
      invalidateList();
      invalidateStockState();
    },
  });
  const receive = useMutation({
    mutationFn: (transferId: number) => venueStockApi.receiveTransfer(orgId, transferId),
    onSuccess: (_d, transferId) => {
      invalidateOne(transferId);
      invalidateList();
      invalidateStockState();
    },
  });

  return { create, update, cancel, send, receive };
}
