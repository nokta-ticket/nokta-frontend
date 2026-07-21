"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function TicketsAccessProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrganizations();
  const [access, setAccess] = useState<TicketsMeAccess | null>(null);
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
        const res = await ticketsAccessApi.getAccess(currentOrg.id);
        if (active) setAccess(res);
      } catch {
        if (active) setAccess(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentOrg, version]);

  const ticketsModule = access?.modules.tickets ?? null;
  const permissions = new Set(ticketsModule?.permissions ?? []);

  return (
    <TicketsAccessContext.Provider
      value={{
        access,
        loading,
        ticketsRole: ticketsModule?.role ?? null,
        can: (permission: string) => permissions.has(permission),
        refetch: () => setVersion((v) => v + 1),
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
