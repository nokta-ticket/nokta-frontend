"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { venueFinanceApi, type CreateVenueOtherIncomePayload } from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceOtherIncome(orgId: number | null, params: { locationId?: number; startDate?: string; endDate?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: financeKeys.otherIncome(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.listOtherIncome(orgId as number, params),
    enabled: orgId !== null,
  });
}

export function useVenueFinanceOtherIncomeMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["finance", orgId, "otherIncome"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "overview"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "timeline"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "cashSessions"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "cashSessionReport"], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenueOtherIncomePayload) => venueFinanceApi.createOtherIncome(orgId, payload),
    onSuccess: invalidate,
  });
  const cancel = useMutation({
    mutationFn: ({ incomeId, reason }: { incomeId: number; reason: string }) => venueFinanceApi.cancelOtherIncome(orgId, incomeId, reason),
    onSuccess: invalidate,
  });

  return { create, cancel };
}
