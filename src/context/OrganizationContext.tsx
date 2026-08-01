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
  /** Slug único usado na URL pública do cardápio (cardapio.nokta.live/{slug}). */
  slug: string | null;
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
  // Id da org para a qual `modules` (acima) já reflete uma resposta real da
  // API (ou null, se currentOrg é null) — nunca "true/false" solto. Comparar
  // contra currentOrg?.id na hora de derivar loadingModules (abaixo, fora de
  // qualquer efeito) fecha a janela de um render em que loadingOrgs já virou
  // false e currentOrg já existe, mas o efeito de módulos ainda não rodou:
  // nesse render intermediário modules ainda seria [] com um loadingModules
  // baseado em useState ficaria false (default), e InicioDispatcher
  // (dashboard/inicio/page.tsx) lia isso como "org sem nenhum módulo ativo",
  // redirecionando pra /dashboard/onboarding SEMPRE (não só às vezes — é
  // ordem de commit/efeito do React, não race de rede) mesmo pra quem já
  // tinha concluído o onboarding.
  const [modulesResolvedForOrgId, setModulesResolvedForOrgId] = useState<number | null>(null);
  const loadingModules = currentOrg !== null && modulesResolvedForOrgId !== currentOrg.id;

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
    (async () => {
      try {
        const res = await api.get<{ organizationId: number; modules: OrgModule[] }>(
          `/organizations/${currentOrg.id}/modules`,
        );
        if (active) setModules(res.data?.modules ?? []);
      } catch {
        if (active) setModules([]);
      } finally {
        if (active) setModulesResolvedForOrgId(currentOrg.id);
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
