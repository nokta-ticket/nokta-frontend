"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const organizationsQueryKey = ["me", "organizations"] as const;
const modulesQueryKey = (orgId: number) => ["organizations", orgId, "modules"] as const;

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Achado de performance mobile (2026-08-21): OrganizationContext,
  // VenueAccessContext e TicketsAccessContext refaziam suas chamadas de API
  // do zero (useState/useEffect cru, sem cache) toda vez que o dashboard
  // montava — em 4G, com ~200-400ms de latência por requisição, a cascata
  // (/me/organizations → depois, em paralelo, /organizations/:id/modules +
  // /me/access + tickets access) ficava bem visível a cada navegação.
  // Migrado para useQuery (DashboardQueryProvider já existia no layout, mas
  // nenhum destes 3 contexts o usava) — staleTime de 60s faz revisitar uma
  // aba já carregada aparecer na hora, com revalidação silenciosa atrás.
  const organizationsQuery = useQuery({
    queryKey: organizationsQueryKey,
    queryFn: async () => {
      const res = await api.get<Organization[]>("/me/organizations");
      return res.data ?? [];
    },
  });

  const organizations = organizationsQuery.data ?? [];
  const loadingOrgs = organizationsQuery.isLoading;

  // currentOrg é estado local (não deriva puramente do cache): o usuário
  // pode trocar de organização manualmente (selectOrg), e isso precisa
  // sobreviver a uma revalidação silenciosa de organizationsQuery em
  // segundo plano. Sincroniza só quando ainda não há seleção, ou quando a
  // seleção atual sumiu da lista (organização removida/perdeu acesso).
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const currentOrg =
    organizations.find((o) => o.id === selectedOrgId) ??
    organizations[0] ??
    null;

  const modulesQuery = useQuery({
    queryKey: modulesQueryKey(currentOrg?.id ?? -1),
    queryFn: async () => {
      const res = await api.get<{ organizationId: number; modules: OrgModule[] }>(
        `/organizations/${currentOrg!.id}/modules`,
      );
      return res.data?.modules ?? [];
    },
    enabled: currentOrg !== null,
  });

  const modules = modulesQuery.data ?? [];
  // Mesma garantia que já existia (ver comit b27d8d2, InicioDispatcher —
  // race condition): loadingModules nunca é um boolean solto desconectado
  // de QUAL organização ele descreve. Com useQuery isso vem de graça — a
  // queryKey muda com currentOrg.id, então trocar de org SEMPRE volta pra
  // isLoading=true daquela chave nova antes de expor dado da anterior.
  const loadingModules = currentOrg !== null && modulesQuery.isLoading;

  const selectOrg = (id: number) => {
    if (organizations.some((o) => o.id === id)) setSelectedOrgId(id);
  };

  const refreshOrganizations = async () => {
    await queryClient.invalidateQueries({ queryKey: organizationsQueryKey });
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
        refreshOrganizations,
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
