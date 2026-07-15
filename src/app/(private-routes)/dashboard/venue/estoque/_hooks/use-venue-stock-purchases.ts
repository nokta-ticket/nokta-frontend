"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueStockApi,
  type CreateVenuePurchasePayload,
  type UpdateVenuePurchasePayload,
  type VenuePurchaseQueryParams,
} from "@/services/venue-stock";
import { stockKeys } from "./query-keys";

export function useVenueStockPurchases(orgId: number | null, locationId: number | null, params: VenuePurchaseQueryParams = {}) {
  return useQuery({
    queryKey: stockKeys.purchases(orgId ?? -1, locationId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueStockApi.listPurchases(orgId as number, locationId as number, params),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueStockPurchase(orgId: number | null, purchaseId: number | null) {
  return useQuery({
    queryKey: stockKeys.purchase(orgId ?? -1, purchaseId ?? -1),
    queryFn: () => venueStockApi.getPurchase(orgId as number, purchaseId as number),
    enabled: orgId !== null && purchaseId !== null,
  });
}

export function useVenueStockPurchaseMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "purchases", locationId], exact: false });
  const invalidateStockState = () => {
    qc.invalidateQueries({ queryKey: ["stock", orgId, "items"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "itemBalances"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "itemMovements"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "movements"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "summary"], exact: false });
    qc.invalidateQueries({ queryKey: ["stock", orgId, "alerts"], exact: false });
  };
  const invalidateOne = (purchaseId: number) =>
    qc.invalidateQueries({ queryKey: stockKeys.purchase(orgId, purchaseId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenuePurchasePayload) => venueStockApi.createPurchase(orgId, locationId, payload),
    onSuccess: invalidateList,
  });
  const update = useMutation({
    mutationFn: ({ purchaseId, payload }: { purchaseId: number; payload: UpdateVenuePurchasePayload }) =>
      venueStockApi.updatePurchase(orgId, purchaseId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.purchaseId);
      invalidateList();
    },
  });
  const cancel = useMutation({
    mutationFn: ({ purchaseId, reason }: { purchaseId: number; reason?: string }) =>
      venueStockApi.cancelPurchase(orgId, purchaseId, reason),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.purchaseId);
      invalidateList();
    },
  });
  const receive = useMutation({
    mutationFn: (purchaseId: number) => venueStockApi.receivePurchase(orgId, purchaseId),
    onSuccess: (_d, purchaseId) => {
      invalidateOne(purchaseId);
      invalidateList();
      invalidateStockState();
    },
  });

  return { create, update, cancel, receive };
}
