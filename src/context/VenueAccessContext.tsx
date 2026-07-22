"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function VenueAccessProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrganizations();
  const [access, setAccess] = useState<VenueMeAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!currentOrg) {
      setAccess(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get<VenueMeAccess>(`/organizations/${currentOrg.id}/me/access`);
        if (active) setAccess(res.data);
      } catch {
        if (active) setAccess(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg, version]);

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
        refetch: () => setVersion((v) => v + 1),
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
