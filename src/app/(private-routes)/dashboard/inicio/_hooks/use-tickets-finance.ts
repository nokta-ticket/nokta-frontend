"use client";

import { useQuery } from "@tanstack/react-query";
import { ticketsFinanceApi, type TicketsFinancePeriodParams } from "@/services/tickets-finance";

export function useTicketsFinanceTimeline(orgId: number | null, params: TicketsFinancePeriodParams) {
  return useQuery({
    queryKey: ["tickets-finance", orgId ?? -1, "timeline", params],
    queryFn: () => ticketsFinanceApi.getTimeline(orgId as number, params),
    enabled: orgId !== null,
  });
}
