"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueFinanceApi,
  type CreateVenuePaymentFeeRulePayload,
  type UpdateVenuePaymentFeeRulePayload,
} from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinanceFeeRules(orgId: number | null, locationId?: number) {
  return useQuery({
    queryKey: financeKeys.feeRules(orgId ?? -1, locationId),
    queryFn: () => venueFinanceApi.listFeeRules(orgId as number, locationId),
    enabled: orgId !== null,
  });
}

export function useVenueFinanceFeeRuleMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["finance", orgId, "feeRules"], exact: false });

  const create = useMutation({
    mutationFn: (payload: CreateVenuePaymentFeeRulePayload) => venueFinanceApi.createFeeRule(orgId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: UpdateVenuePaymentFeeRulePayload }) =>
      venueFinanceApi.updateFeeRule(orgId, ruleId, payload),
    onSuccess: invalidate,
  });
  const deactivate = useMutation({
    mutationFn: (ruleId: number) => venueFinanceApi.deactivateFeeRule(orgId, ruleId),
    onSuccess: invalidate,
  });

  return { create, update, deactivate };
}
