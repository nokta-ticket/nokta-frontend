"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CancelPaymentPayload,
  type CreatePaymentPayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenuePaymentMutations(orgId: number, tabId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: opKeys.tab(orgId, tabId) });
    qc.invalidateQueries({ queryKey: opKeys.payments(orgId, tabId) });
    qc.invalidateQueries({ queryKey: ["op", orgId, "cashSession"], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => venueOperationApi.createPayment(orgId, tabId, payload),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: number; payload: CancelPaymentPayload }) =>
      venueOperationApi.cancelPayment(orgId, paymentId, payload),
    onSuccess: invalidate,
  });

  return { create, cancel };
}
