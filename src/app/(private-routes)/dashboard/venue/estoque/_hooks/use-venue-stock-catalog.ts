"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueStockApi,
  type CreateVenueInventoryCategoryPayload,
  type CreateVenueInventoryItemPayload,
  type CreateVenueSupplierPayload,
  type SetInventoryItemThresholdsPayload,
  type UpdateVenueInventoryCategoryPayload,
  type UpdateVenueInventoryItemPayload,
  type UpdateVenueStockSettingsPayload,
  type UpdateVenueSupplierPayload,
  type VenueInventoryItemQueryParams,
} from "@/services/venue-stock";
import { stockKeys } from "./query-keys";

// ---- Configurações da unidade ----

export function useVenueStockSettings(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: stockKeys.settings(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueStockApi.getSettings(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueStockSettingsMutation(orgId: number, locationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVenueStockSettingsPayload) => venueStockApi.updateSettings(orgId, locationId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: stockKeys.settings(orgId, locationId) }),
  });
}

// ---- Categorias ----

export function useVenueStockCategories(orgId: number | null, includeArchived = false) {
  return useQuery({
    queryKey: stockKeys.categories(orgId ?? -1, includeArchived),
    queryFn: () => venueStockApi.listCategories(orgId as number, includeArchived),
    enabled: orgId !== null,
  });
}

export function useVenueStockCategoryMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "categories"], exact: false });

  const create = useMutation({
    mutationFn: (payload: CreateVenueInventoryCategoryPayload) => venueStockApi.createCategory(orgId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: number; payload: UpdateVenueInventoryCategoryPayload }) =>
      venueStockApi.updateCategory(orgId, categoryId, payload),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (categoryId: number) => venueStockApi.archiveCategory(orgId, categoryId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (items: { id: number; displayOrder: number }[]) => venueStockApi.reorderCategories(orgId, items),
    onSuccess: invalidate,
  });

  return { create, update, archive, reorder };
}

// ---- Itens de estoque ----

export function useVenueStockItems(orgId: number | null, params: VenueInventoryItemQueryParams = {}) {
  return useQuery({
    queryKey: stockKeys.items(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueStockApi.listItems(orgId as number, params),
    enabled: orgId !== null,
  });
}

export function useVenueStockItem(orgId: number | null, itemId: number | null) {
  return useQuery({
    queryKey: stockKeys.item(orgId ?? -1, itemId ?? -1),
    queryFn: () => venueStockApi.getItem(orgId as number, itemId as number),
    enabled: orgId !== null && itemId !== null,
  });
}

export function useVenueStockItemBalances(orgId: number | null, itemId: number | null) {
  return useQuery({
    queryKey: stockKeys.itemBalances(orgId ?? -1, itemId ?? -1),
    queryFn: () => venueStockApi.getItemBalances(orgId as number, itemId as number),
    enabled: orgId !== null && itemId !== null,
  });
}

export function useVenueStockItemMovements(orgId: number | null, itemId: number | null) {
  return useQuery({
    queryKey: stockKeys.itemMovements(orgId ?? -1, itemId ?? -1),
    queryFn: () => venueStockApi.getItemMovements(orgId as number, itemId as number),
    enabled: orgId !== null && itemId !== null,
  });
}

export function useVenueStockItemMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "items"], exact: false });
  const invalidateSummary = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "summary"], exact: false });
  const invalidateAlerts = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "alerts"], exact: false });
  const invalidateOne = (itemId: number) => {
    qc.invalidateQueries({ queryKey: stockKeys.item(orgId, itemId) });
    qc.invalidateQueries({ queryKey: stockKeys.itemBalances(orgId, itemId) });
    qc.invalidateQueries({ queryKey: stockKeys.itemMovements(orgId, itemId) });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueInventoryItemPayload) => venueStockApi.createItem(orgId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateSummary();
      invalidateAlerts();
    },
  });
  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: UpdateVenueInventoryItemPayload }) =>
      venueStockApi.updateItem(orgId, itemId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.itemId);
      invalidateList();
    },
  });
  const archive = useMutation({
    mutationFn: (itemId: number) => venueStockApi.archiveItem(orgId, itemId),
    onSuccess: (_d, itemId) => {
      invalidateOne(itemId);
      invalidateList();
      invalidateSummary();
      invalidateAlerts();
    },
  });
  const setThresholds = useMutation({
    mutationFn: ({
      locationId,
      itemId,
      payload,
    }: {
      locationId: number;
      itemId: number;
      payload: SetInventoryItemThresholdsPayload;
    }) => venueStockApi.setItemThresholds(orgId, locationId, itemId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.itemId);
      invalidateSummary();
      invalidateAlerts();
    },
  });

  return { create, update, archive, setThresholds };
}

// ---- Fornecedores ----

export function useVenueStockSuppliers(orgId: number | null, includeArchived = false) {
  return useQuery({
    queryKey: stockKeys.suppliers(orgId ?? -1, includeArchived),
    queryFn: () => venueStockApi.listSuppliers(orgId as number, includeArchived),
    enabled: orgId !== null,
  });
}

export function useVenueStockSupplier(orgId: number | null, supplierId: number | null) {
  return useQuery({
    queryKey: stockKeys.supplier(orgId ?? -1, supplierId ?? -1),
    queryFn: () => venueStockApi.getSupplier(orgId as number, supplierId as number),
    enabled: orgId !== null && supplierId !== null,
  });
}

export function useVenueStockSupplierMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["stock", orgId, "suppliers"], exact: false });

  const create = useMutation({
    mutationFn: (payload: CreateVenueSupplierPayload) => venueStockApi.createSupplier(orgId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: number; payload: UpdateVenueSupplierPayload }) =>
      venueStockApi.updateSupplier(orgId, supplierId, payload),
    onSuccess: (_d, vars) => {
      invalidate();
      qc.invalidateQueries({ queryKey: stockKeys.supplier(orgId, vars.supplierId) });
    },
  });
  const archive = useMutation({
    mutationFn: (supplierId: number) => venueStockApi.archiveSupplier(orgId, supplierId),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}

// ---- Resumo e alertas ----

export function useVenueStockSummary(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: stockKeys.summary(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueStockApi.getSummary(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}

export function useVenueStockAlerts(orgId: number | null, locationId: number | null) {
  return useQuery({
    queryKey: stockKeys.alerts(orgId ?? -1, locationId ?? -1),
    queryFn: () => venueStockApi.getAlerts(orgId as number, locationId as number),
    enabled: orgId !== null && locationId !== null,
  });
}
