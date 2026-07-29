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
  /** Etapa "Operação" do onboarding já concluída (ao menos uma capacidade ativada por ela) — vem do backend, não depende de localStorage. */
  onboardingCompleted: boolean;
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
  /** Rebusca /me/organizations — usar após criar/renomear uma org pra refletir no header/menu sem precisar de F5. */
  refreshOrganizations: () => Promise<void>;
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

  const fetchOrganizations = async () => {
    try {
      const res = await api.get<Organization[]>("/me/organizations");
      setOrganizations(res.data ?? []);
      setCurrentOrg((prev) => res.data?.find((o) => o.id === prev?.id) ?? res.data?.[0] ?? null);
    } catch {
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Carrega as organizations do usuário logado.
  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        refreshOrganizations: fetchOrganizations,
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
