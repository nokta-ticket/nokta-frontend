"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  venueOperationApi,
  type CancelOrderItemPayload,
  type CreateOrderPayload,
  type SetOrderItemStatusPayload,
  type UpdateOrderPayload,
} from "@/services/venue-operation";
import { opKeys } from "./query-keys";

export function useVenueOrderMutations(orgId: number, tabId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: opKeys.tab(orgId, tabId) });
    qc.invalidateQueries({ queryKey: opKeys.orders(orgId, tabId) });
    qc.invalidateQueries({ queryKey: ["op", orgId, "preparationItems"], exact: false });
  };

  const create = useMutation({
    mutationFn: (payload: CreateOrderPayload) => venueOperationApi.createOrder(orgId, tabId, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: UpdateOrderPayload }) =>
      venueOperationApi.updateOrder(orgId, orderId, payload),
    onSuccess: invalidate,
  });

  const send = useMutation({
    mutationFn: (orderId: number) => venueOperationApi.sendOrder(orgId, orderId),
    onSuccess: invalidate,
  });

  const cancelItem = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: CancelOrderItemPayload }) =>
      venueOperationApi.cancelOrderItem(orgId, itemId, payload),
    onSuccess: invalidate,
  });

  const setItemStatus = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: SetOrderItemStatusPayload }) =>
      venueOperationApi.setOrderItemStatus(orgId, itemId, payload),
    onSuccess: invalidate,
  });

  return { create, update, send, cancelItem, setItemStatus };
}
