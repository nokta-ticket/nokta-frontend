"use client";

import { useQuery } from "@tanstack/react-query";
import { myPromoterApi } from "@/services/promoters";
import { isAxiosError } from "axios";

const myPromoterKeys = {
  profile: ["my-promoter", "profile"] as const,
  organizations: ["my-promoter", "organizations"] as const,
  events: ["my-promoter", "events"] as const,
  sales: (eventId?: number) => ["my-promoter", "sales", eventId ?? "all"] as const,
  analytics: (eventId?: number) => ["my-promoter", "analytics", eventId ?? "all"] as const,
  settlements: ["my-promoter", "settlements"] as const,
};

/** 404 (usuário nunca foi convidado como promoter) é um estado válido, nunca um erro — `data: null` nesse caso. */
export function useMyPromoterProfile() {
  return useQuery({
    queryKey: myPromoterKeys.profile,
    queryFn: async () => {
      try {
        return await myPromoterApi.getProfile();
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

export function useMyPromoterOrganizations(enabled: boolean) {
  return useQuery({ queryKey: myPromoterKeys.organizations, queryFn: () => myPromoterApi.listOrganizations(), enabled });
}

export function useMyPromoterEvents(enabled: boolean) {
  return useQuery({ queryKey: myPromoterKeys.events, queryFn: () => myPromoterApi.listEvents(), enabled });
}

export function useMyPromoterSales(enabled: boolean, eventId?: number) {
  return useQuery({ queryKey: myPromoterKeys.sales(eventId), queryFn: () => myPromoterApi.listSales({ eventId }), enabled });
}

export function useMyPromoterAnalytics(enabled: boolean, eventId?: number) {
  return useQuery({ queryKey: myPromoterKeys.analytics(eventId), queryFn: () => myPromoterApi.getAnalytics(eventId), enabled });
}

export function useMyPromoterSettlements(enabled: boolean) {
  return useQuery({ queryKey: myPromoterKeys.settlements, queryFn: () => myPromoterApi.listSettlements(), enabled });
}
