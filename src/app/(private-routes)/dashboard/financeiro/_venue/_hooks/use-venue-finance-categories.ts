"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueFinanceApi,
  type CreateVenueFinancialCategoryPayload,
  type UpdateVenueFinancialCategoryPayload,
  type VenueFinancialCategoryType,
} from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceCategories(orgId: number | null, type?: VenueFinancialCategoryType, includeArchived = false) {
  return useQuery({
    queryKey: financeKeys.categories(orgId ?? -1, type, includeArchived),
    queryFn: () => venueFinanceApi.listCategories(orgId as number, type, includeArchived),
    enabled: orgId !== null,
  });
}

export function useVenueFinanceCategoryMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["finance", orgId, "categories"], exact: false });

  const create = useMutation({
    mutationFn: (payload: CreateVenueFinancialCategoryPayload) => venueFinanceApi.createCategory(orgId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: number; payload: UpdateVenueFinancialCategoryPayload }) =>
      venueFinanceApi.updateCategory(orgId, categoryId, payload),
    onSuccess: invalidate,
  });
  const archive = useMutation({
    mutationFn: (categoryId: number) => venueFinanceApi.archiveCategory(orgId, categoryId),
    onSuccess: invalidate,
  });

  return { create, update, archive };
}
