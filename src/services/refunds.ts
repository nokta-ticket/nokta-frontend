import api from "@/lib/axios";

export type RefundPolicy = "BUYER_REGRET_7_DAYS" | "PRODUCER_FAULT_OR_EVENT_CANCELED" | "ADMIN_DISCRETIONARY";
export type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REJECTED";

export interface RefundItem {
  userTicketId: number;
  ticketFaceValueRefundedCents: number;
}

export interface Refund {
  id: number;
  orderId: number;
  policy: RefundPolicy;
  status: RefundStatus;
  requestedAmountCents: number;
  sentAmountCents: number | null;
  createdAt: string;
  completedAt: string | null;
  items: RefundItem[];
}

export interface CreateRefundPayload {
  userTicketIds: number[];
  policy: RefundPolicy;
  reason?: string;
}

const base = (orderId: number) => `/orders/${orderId}/refunds`;

export const refundsApi = {
  list: (orderId: number) => api.get<Refund[]>(base(orderId)).then((r) => r.data),
  create: (orderId: number, payload: CreateRefundPayload) => api.post<Refund>(base(orderId), payload).then((r) => r.data),
};
