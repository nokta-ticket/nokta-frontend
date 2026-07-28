"use client";

import { Bell, Gift } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import { OrgSwitcher } from "./org-switcher";
import { PeriodFilter } from "./period-filter";
import { UserMenu } from "./user-menu";

/**
 * Topbar do dashboard. Esquerda: organização + filtro de período quando há
 * uma organização ativa; sem organização (ex.: onboarding, antes de criar o
 * primeiro workspace) mostra a saudação no lugar — o OrgSwitcher não faz
 * sentido pra quem ainda não tem nenhuma. Direita: notificações, indique e
 * ganhe (só visual por enquanto — nenhuma das duas features existe no
 * backend ainda) e usuário.
 */
export function Topbar() {
  const { user, isAuthResolved } = useAuth();
  const { currentOrg, loadingOrgs } = useOrganizations();

  const showGreeting = isAuthResolved && !loadingOrgs && !currentOrg;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/5 px-4 py-3 lg:px-8">
      {showGreeting ? (
        <div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-[#1f1e2e]">Olá, {user?.nome}! 👋</p>
          <p className="mt-0.5 text-xs text-[#898b98]">Bem-vindo à Nokta</p>
        </div>
      ) : (
        <OrgSwitcher />
      )}

      <div className="flex items-center gap-3">
        {!showGreeting && <PeriodFilter />}

        <button
          type="button"
          aria-label="Notificações"
          className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 transition hover:bg-black/5"
        >
          <Bell size={18} />
        </button>

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 sm:flex"
        >
          <Gift size={14} />
          Indique e ganhe
        </button>

        <UserMenu />
      </div>
    </div>
  );
}
