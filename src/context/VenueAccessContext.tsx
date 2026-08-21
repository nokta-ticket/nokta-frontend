"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useOrganizations } from "./OrganizationContext";
import type { VenueMeAccess, VenueRoleKey } from "@/services/venue-team";

interface VenueAccessContextType {
  access: VenueMeAccess | null;
  loading: boolean;
  /** Papel do usuário no Venue desta organização — null se não tiver acesso. */
  venueRole: VenueRoleKey | null;
  /** Rota inicial recomendada pelo backend para o papel atual (só sugestão — o backend continua sendo a autoridade). */
  defaultRoute: string | null;
  /** Confere se o usuário tem a permissão granular — nunca a única linha de defesa, o backend sempre confere de novo. */
  can: (permission: string) => boolean;
  refetch: () => void;
}

const VenueAccessContext = createContext<VenueAccessContextType | undefined>(undefined);

const venueAccessQueryKey = (orgId: number) => ["organizations", orgId, "me", "access"] as const;

export function VenueAccessProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrganizations();
  const queryClient = useQueryClient();

  // Achado de performance mobile (2026-08-21): ver comentário equivalente
  // em OrganizationContext.tsx — cacheado via useQuery em vez de
  // useState/useEffect cru, pra não refazer esta chamada em toda
  // navegação do dashboard.
  const query = useQuery({
    queryKey: venueAccessQueryKey(currentOrg?.id ?? -1),
    queryFn: async () => {
      const res = await api.get<VenueMeAccess>(`/organizations/${currentOrg!.id}/me/access`);
      return res.data;
    },
    enabled: currentOrg !== null,
  });

  const access = currentOrg ? (query.data ?? null) : null;
  const loading = currentOrg !== null && query.isLoading;

  const venueModule = access?.modules.venue ?? null;
  const permissions = new Set([...(venueModule?.permissions ?? []), ...(access?.organizationPermissions ?? [])]);

  return (
    <VenueAccessContext.Provider
      value={{
        access,
        loading,
        venueRole: venueModule?.role ?? null,
        defaultRoute: venueModule?.defaultRoute ?? null,
        can: (permission: string) => permissions.has(permission),
        refetch: () => {
          if (currentOrg) {
            void queryClient.invalidateQueries({ queryKey: venueAccessQueryKey(currentOrg.id) });
          }
        },
      }}
    >
      {children}
    </VenueAccessContext.Provider>
  );
}

export const useVenueAccess = () => {
  const ctx = useContext(VenueAccessContext);
  if (!ctx) throw new Error("useVenueAccess must be used within a VenueAccessProvider");
  return ctx;
};

/** Atalho para checar uma permissão sem desestruturar o contexto inteiro. */
export function useCan(permission: string): boolean {
  const { can } = useVenueAccess();
  return can(permission);
}
