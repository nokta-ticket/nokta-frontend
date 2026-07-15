"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueMenuItemPayload,
  type ReorderPayload,
  type UpdateVenueMenuItemPayload,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueMenuItems(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: venueKeys.menuItems(orgId ?? -1, menuId ?? -1),
    queryFn: () => venueMenuApi.listMenuItems(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
  });
}

export function useVenueMenuItemMutations(orgId: number, menuId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: venueKeys.menuItems(orgId, menuId) });
    qc.invalidateQueries({ queryKey: ["venue", orgId, "products"], exact: false });
    qc.invalidateQueries({ queryKey: ["venue", orgId, "product"], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueMenuItemPayload) => venueMenuApi.createMenuItem(orgId, menuId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      menuItemId,
      payload,
    }: {
      menuItemId: number;
      payload: UpdateVenueMenuItemPayload;
    }) => venueMenuApi.updateMenuItem(orgId, menuItemId, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (menuItemId: number) => venueMenuApi.removeMenuItem(orgId, menuItemId),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderMenuItems(orgId, menuId, payload),
    onSuccess: invalidate,
  });

  const setVariantPrice = useMutation({
    mutationFn: ({
      menuItemId,
      variantId,
      priceCents,
    }: {
      menuItemId: number;
      variantId: number;
      priceCents: number;
    }) => venueMenuApi.setMenuItemVariantPrice(orgId, menuItemId, variantId, priceCents),
    onSuccess: invalidate,
  });

  const removeVariantPrice = useMutation({
    mutationFn: ({ menuItemId, variantId }: { menuItemId: number; variantId: number }) =>
      venueMenuApi.removeMenuItemVariantPrice(orgId, menuItemId, variantId),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder, setVariantPrice, removeVariantPrice };
}
