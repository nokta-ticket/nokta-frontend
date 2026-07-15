"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CancelTabPayload,
  type CreateVenueTabPayload,
  type SetTabDiscountPayload,
  type SetTabServiceChargePayload,
  type TransferTabTablePayload,
  type UpdateVenueTabPayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

interface TabFilters {
  status?: string;
  type?: string;
  search?: string;
}

/** Lista de comandas — polling só enquanto a aba está montada (comandas abertas mudam com frequência). */
export function useVenueTabs(orgId: number | null, locationId: number | null, filters: TabFilters = {}) {
  return useQuery({
    queryKey: opKeys.tabs(orgId ?? -1, locationId ?? -1, filters as Record<string, unknown>),
    queryFn: () => venueOperationApi.listTabs(orgId as number, locationId as number, filters),
    enabled: orgId !== null && locationId !== null,
    refetchInterval: orgId !== null && locationId !== null ? 8000 : false,
  });
}

/** Detalhe da comanda — polling enquanto o Sheet está aberto. */
export function useVenueTab(orgId: number | null, tabId: number | null) {
  return useQuery({
    queryKey: opKeys.tab(orgId ?? -1, tabId ?? -1),
    queryFn: () => venueOperationApi.getTab(orgId as number, tabId as number),
    enabled: orgId !== null && tabId !== null,
    refetchInterval: orgId !== null && tabId !== null ? 6000 : false,
  });
}

export function useVenueTabMutations(orgId: number, locationId: number) {
  const qc = useQueryClient();
  const invalidateList = () =>
    qc.invalidateQueries({ queryKey: ["op", orgId, "tabs", locationId], exact: false });
  const invalidateTab = (tabId: number) => qc.invalidateQueries({ queryKey: opKeys.tab(orgId, tabId) });
  const invalidateTables = () =>
    qc.invalidateQueries({ queryKey: ["op", orgId, "tables", locationId], exact: false });

  const create = useMutation({
    mutationFn: (payload: CreateVenueTabPayload) => venueOperationApi.createTab(orgId, locationId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateTables();
    },
  });

  const update = useMutation({
    mutationFn: ({ tabId, payload }: { tabId: number; payload: UpdateVenueTabPayload }) =>
      venueOperationApi.updateTab(orgId, tabId, payload),
    onSuccess: (_d, vars) => invalidateTab(vars.tabId),
  });

  const transferTable = useMutation({
    mutationFn: ({ tabId, payload }: { tabId: number; payload: TransferTabTablePayload }) =>
      venueOperationApi.transferTabTable(orgId, tabId, payload),
    onSuccess: (_d, vars) => {
      invalidateTab(vars.tabId);
      invalidateTables();
      invalidateList();
    },
  });

  const setDiscount = useMutation({
    mutationFn: ({ tabId, payload }: { tabId: number; payload: SetTabDiscountPayload }) =>
      venueOperationApi.setTabDiscount(orgId, tabId, payload),
    onSuccess: (_d, vars) => invalidateTab(vars.tabId),
  });

  const setServiceCharge = useMutation({
    mutationFn: ({ tabId, payload }: { tabId: number; payload: SetTabServiceChargePayload }) =>
      venueOperationApi.setTabServiceCharge(orgId, tabId, payload),
    onSuccess: (_d, vars) => invalidateTab(vars.tabId),
  });

  const cancel = useMutation({
    mutationFn: ({ tabId, payload }: { tabId: number; payload: CancelTabPayload }) =>
      venueOperationApi.cancelTab(orgId, tabId, payload),
    onSuccess: (_d, vars) => {
      invalidateTab(vars.tabId);
      invalidateList();
      invalidateTables();
    },
  });

  const close = useMutation({
    mutationFn: (tabId: number) => venueOperationApi.closeTab(orgId, tabId),
    onSuccess: (_d, tabId) => {
      invalidateTab(tabId);
      invalidateList();
      invalidateTables();
    },
  });

  return { create, update, transferTable, setDiscount, setServiceCharge, cancel, close };
}
