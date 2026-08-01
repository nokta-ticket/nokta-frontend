import api from "@/lib/axios";

export type TicketsFinanceQuickPeriod = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH";

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
