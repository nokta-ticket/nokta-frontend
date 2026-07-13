import {
  Home,
  Ticket,
  Store,
  DollarSign,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";

export interface DashboardMenuItem {
  label: string;
  icon: ReactNode;
  href: string;
}

/**
 * Monta o menu da sidebar a partir dos módulos ativos da org.
 * Regras:
 *  - Início, Financeiro, Insights, Equipe, Configurações: SEMPRE.
 *  - Tickets: só se o módulo "tickets" estiver ativo.
 *  - Venue: só se o módulo "venue" estiver ativo.
 */
export function buildMenu(activeModules: string[]): DashboardMenuItem[] {
  const has = (m: string) => activeModules.includes(m);

  const items: DashboardMenuItem[] = [
    { label: "Início", icon: <Home size={16} />, href: "/dashboard/inicio" },
  ];

  if (has("tickets")) {
    items.push({ label: "Tickets", icon: <Ticket size={16} />, href: "/dashboard/tickets" });
  }
  if (has("venue")) {
    items.push({ label: "Venue", icon: <Store size={16} />, href: "/dashboard/venue" });
  }

  items.push(
    { label: "Financeiro", icon: <DollarSign size={16} />, href: "/dashboard/financeiro" },
    { label: "Insights", icon: <BarChart3 size={16} />, href: "/dashboard/insights" },
    { label: "Equipe", icon: <Users size={16} />, href: "/dashboard/equipe" },
    { label: "Configurações", icon: <Settings size={16} />, href: "/dashboard/configuracoes" },
  );

  return items;
}
