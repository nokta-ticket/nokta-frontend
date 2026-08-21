"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsAccessApi, type TicketsMeAccess, type TicketsRoleKey } from "@/services/promoters";
import { useOrganizations } from "./OrganizationContext";

interface TicketsAccessContextType {
  access: TicketsMeAccess | null;
  loading: boolean;
  /** Papel do usuário no módulo Tickets desta organização — null se não tiver acesso. */
  ticketsRole: TicketsRoleKey | null;
  /** Confere se o usuário tem a permissão granular — nunca a única linha de defesa, o backend sempre confere de novo. */
  can: (permission: string) => boolean;
  refetch: () => void;
}

const TicketsAccessContext = createContext<TicketsAccessContextType | undefined>(undefined);

const ticketsAccessQueryKey = (orgId: number) => ["organizations", orgId, "tickets", "access"] as const;

export function TicketsAccessProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrganizations();
  const queryClient = useQueryClient();

  // Achado de performance mobile (2026-08-21): ver comentário equivalente
  // em OrganizationContext.tsx — cacheado via useQuery em vez de
  // useState/useEffect cru, pra não refazer esta chamada em toda
  // navegação do dashboard.
  const query = useQuery({
    queryKey: ticketsAccessQueryKey(currentOrg?.id ?? -1),
    queryFn: () => ticketsAccessApi.getAccess(currentOrg!.id),
    enabled: currentOrg !== null,
  });

  const access = currentOrg ? (query.data ?? null) : null;
  const loading = currentOrg !== null && query.isLoading;

  const ticketsModule = access?.modules.tickets ?? null;
  const permissions = new Set(ticketsModule?.permissions ?? []);

  return (
    <TicketsAccessContext.Provider
      value={{
        access,
        loading,
        ticketsRole: ticketsModule?.role ?? null,
        can: (permission: string) => permissions.has(permission),
        refetch: () => {
          if (currentOrg) {
            void queryClient.invalidateQueries({ queryKey: ticketsAccessQueryKey(currentOrg.id) });
          }
        },
      }}
    >
      {children}
    </TicketsAccessContext.Provider>
  );
}

export const useTicketsAccess = () => {
  const ctx = useContext(TicketsAccessContext);
  if (!ctx) throw new Error("useTicketsAccess must be used within a TicketsAccessProvider");
  return ctx;
};
