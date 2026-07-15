"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueMenuApi,
  type CreateVenueMenuCategoryPayload,
  type ReorderPayload,
  type UpdateVenueMenuCategoryPayload,
} from "@/services/venue-menu";
import { venueKeys } from "./query-keys";

export function useVenueCategories(orgId: number | null, menuId: number | null) {
  return useQuery({
    queryKey: venueKeys.categories(orgId ?? -1, menuId ?? -1),
    queryFn: () => venueMenuApi.listCategories(orgId as number, menuId as number),
    enabled: orgId !== null && menuId !== null,
  });
}

export function useVenueCategoryMutations(orgId: number, menuId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: venueKeys.categories(orgId, menuId) });

  const create = useMutation({
    mutationFn: (payload: CreateVenueMenuCategoryPayload) =>
      venueMenuApi.createCategory(orgId, menuId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: UpdateVenueMenuCategoryPayload;
    }) => venueMenuApi.updateCategory(orgId, categoryId, payload),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ categoryId, active }: { categoryId: number; active: boolean }) =>
      venueMenuApi.setCategoryActive(orgId, categoryId, active),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (payload: ReorderPayload) => venueMenuApi.reorderCategories(orgId, menuId, payload),
    onSuccess: invalidate,
  });

  return { create, update, setActive, reorder };
}
