import api from "@/lib/axios";

export type TicketsFinanceQuickPeriod = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "LAST_MONTH";

export interface TicketsFinanceTimelinePoint {
  date: string;
  revenueCents: number;
  resultCents: number;
}

export interface TicketsFinancePeriodParams {
  quickPeriod?: TicketsFinanceQuickPeriod;
  startDate?: string;
  endDate?: string;
}

const base = (organizationId: number) => `/organizations/${organizationId}/tickets/finance`;

export const ticketsFinanceApi = {
  getTimeline: (orgId: number, params: TicketsFinancePeriodParams = {}) =>
    api.get<TicketsFinanceTimelinePoint[]>(`${base(orgId)}/timeline`, { params }).then((r) => r.data),
};

// ==================== Financeiro de Ingressos (saldo, extrato) ====================

export type StatementRowType = "SALE" | "REFUND" | "CHARGEBACK" | "WITHDRAWAL";
export type StatementRowStatus = "CUSTODY" | "RELEASED" | "COMPLETED" | "IN_PROGRESS" | "DEBITED" | "FAILED";

export interface TicketsEventBalance {
  eventId: number;
  eventName: string;
  eventDate: string;
  commissionPercent: number;
  releaseAt: string;
  released: boolean;
  salesCents: number;
  commissionCents: number;
  refundsCents: number;
  chargebacksCents: number;
  netCents: number;
  withdrawnCents: number;
  inTransitCents: number;
  custodyCents: number;
  availableCents: number;
}

export interface TicketsFinanceOverview {
  events: TicketsEventBalance[];
  totals: { availableCents: number; custodyCents: number; inTransitCents: number; custodyEventCount: number; nextReleaseAt: string | null };
  activeWithdrawal: { id: number; amountCents: number; status: string; requestedAt: string; eventId: number; eventName: string } | null;
  chargebacks: { count: number; totalCents: number };
}

export interface StatementFees {
  commissionCents: number;
  commissionPercent: number;
  buyerServiceFeeCents: number;
  buyerGatewayFeeCents: number;
  producerGatewayFeeCents: number;
}

export interface StatementRow {
  key: string;
  type: StatementRowType;
  occurredAt: string;
  eventId: number;
  eventName: string;
  reference: string;
  quantity: number | null;
  buyerName: string | null;
  grossCents: number;
  feeCents: number;
  netCents: number;
  status: StatementRowStatus;
  fees: StatementFees;
  reason: string | null;
  releaseAt: string | null;
}

export interface TicketsStatementSummary {
  inCents: number;
  outCents: number;
  feeCents: number;
  netCents: number;
  fees: { commissionCents: number; producerGatewayFeeCents: number; buyerServiceFeeCents: number; buyerGatewayFeeCents: number };
}

export interface TicketsStatement {
  rows: StatementRow[];
  total: number;
  page: number;
  perPage: number;
  summary: TicketsStatementSummary;
}

export interface TicketsStatementParams extends TicketsFinancePeriodParams {
  eventId?: number;
  allTime?: boolean;
  type?: StatementRowType;
  status?: StatementRowStatus;
  search?: string;
  page?: number;
  perPage?: number;
  sort?: "date" | "gross" | "net";
  dir?: "asc" | "desc";
}

export const ticketsStatementApi = {
  getOverview: (orgId: number, params: TicketsFinancePeriodParams & { eventId?: number }) =>
    api.get<TicketsFinanceOverview>(`${base(orgId)}/overview`, { params }).then((r) => r.data),
  getStatement: (orgId: number, params: TicketsStatementParams) =>
    api.get<TicketsStatement>(`${base(orgId)}/statement`, { params }).then((r) => r.data),
};
