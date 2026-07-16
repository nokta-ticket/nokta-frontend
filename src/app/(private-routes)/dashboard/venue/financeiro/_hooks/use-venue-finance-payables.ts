"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  venueFinanceApi,
  type CreateVenuePayablePaymentPayload,
  type CreateVenuePayablePayload,
  type UpdateVenuePayablePayload,
  type VenuePayableQueryParams,
} from "@/services/venue-finance";
import { financeKeys } from "./query-keys";

export function useVenueFinancePayables(orgId: number | null, params: VenuePayableQueryParams) {
  return useQuery({
    queryKey: financeKeys.payables(orgId ?? -1, params as Record<string, unknown>),
    queryFn: () => venueFinanceApi.listPayables(orgId as number, params),
    enabled: orgId !== null,
  });
}

export function useVenueFinancePayable(orgId: number | null, payableId: number | null) {
  return useQuery({
    queryKey: financeKeys.payable(orgId ?? -1, payableId ?? -1),
    queryFn: () => venueFinanceApi.getPayable(orgId as number, payableId as number),
    enabled: orgId !== null && payableId !== null,
  });
}

export function useVenueFinancePayablePayments(orgId: number | null, payableId: number | null) {
  return useQuery({
    queryKey: financeKeys.payablePayments(orgId ?? -1, payableId ?? -1),
    queryFn: () => venueFinanceApi.listPayablePayments(orgId as number, payableId as number),
    enabled: orgId !== null && payableId !== null,
  });
}

export function useVenueFinancePayableMutations(orgId: number) {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["finance", orgId, "payables"], exact: false });
  const invalidateOverview = () => {
    qc.invalidateQueries({ queryKey: ["finance", orgId, "overview"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "timeline"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "expensesByCategory"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "cashSessions"], exact: false });
    qc.invalidateQueries({ queryKey: ["finance", orgId, "cashSessionReport"], exact: false });
  };
  const invalidateOne = (payableId: number) => {
    qc.invalidateQueries({ queryKey: financeKeys.payable(orgId, payableId) });
    qc.invalidateQueries({ queryKey: financeKeys.payablePayments(orgId, payableId) });
  };

  const create = useMutation({
    mutationFn: (payload: CreateVenuePayablePayload) => venueFinanceApi.createPayable(orgId, payload),
    onSuccess: () => {
      invalidateList();
      invalidateOverview();
    },
  });
  const update = useMutation({
    mutationFn: ({ payableId, payload }: { payableId: number; payload: UpdateVenuePayablePayload }) =>
      venueFinanceApi.updatePayable(orgId, payableId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.payableId);
      invalidateList();
    },
  });
  const cancel = useMutation({
    mutationFn: ({ payableId, reason }: { payableId: number; reason?: string }) => venueFinanceApi.cancelPayable(orgId, payableId, reason),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.payableId);
      invalidateList();
    },
  });
  const registerPayment = useMutation({
    mutationFn: ({ payableId, payload }: { payableId: number; payload: CreateVenuePayablePaymentPayload }) =>
      venueFinanceApi.registerPayablePayment(orgId, payableId, payload),
    onSuccess: (_d, vars) => {
      invalidateOne(vars.payableId);
      invalidateList();
      invalidateOverview();
    },
  });
  const cancelPayment = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) => venueFinanceApi.cancelPayablePayment(orgId, paymentId, reason),
    onSuccess: () => {
      invalidateList();
      invalidateOverview();
      qc.invalidateQueries({ queryKey: ["finance", orgId, "payablePayments"], exact: false });
      qc.invalidateQueries({ queryKey: ["finance", orgId, "payable"], exact: false });
    },
  });

  return { create, update, cancel, registerPayment, cancelPayment };
}
