"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api from "@/lib/axios";

export interface Organization {
  id: number;
  nome: string;
  tipo: string;
  status: string;
  role: string;
}

export interface OrgModule {
  module: string;
  status: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  currentOrg: Organization | null;
  modules: OrgModule[];
  /** Chaves dos módulos ativos (ex.: ["tickets", "finance", "insights"]). */
  activeModuleKeys: string[];
  loadingOrgs: boolean;
  loadingModules: boolean;
  selectOrg: (id: number) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [modules, setModules] = useState<OrgModule[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);

  // Carrega as organizations do usuário logado.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<Organization[]>("/me/organizations");
        if (!active) return;
        setOrganizations(res.data ?? []);
        setCurrentOrg(res.data?.[0] ?? null);
      } catch {
        if (active) setOrganizations([]);
      } finally {
        if (active) setLoadingOrgs(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Carrega os módulos da org atual — refaz sempre que troca de org.
  useEffect(() => {
    if (!currentOrg) {
      setModules([]);
      return;
    }
    let active = true;
    setLoadingModules(true);
    (async () => {
      try {
        const res = await api.get<{ organizationId: number; modules: OrgModule[] }>(
          `/organizations/${currentOrg.id}/modules`,
        );
        if (active) setModules(res.data?.modules ?? []);
      } catch {
        if (active) setModules([]);
      } finally {
        if (active) setLoadingModules(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentOrg]);

  const selectOrg = (id: number) => {
    const found = organizations.find((o) => o.id === id);
    if (found) setCurrentOrg(found);
  };

  const activeModuleKeys = modules
    .filter((m) => m.status === "ACTIVE")
    .map((m) => m.module);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrg,
        modules,
        activeModuleKeys,
        loadingOrgs,
        loadingModules,
        selectOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganizations = () => {
  const ctx = useContext(OrganizationContext);
  if (!ctx)
    throw new Error("useOrganizations must be used within an OrganizationProvider");
  return ctx;
};
