import {
  Home,
  CalendarDays,
  DollarSign,
  BarChart3,
  UtensilsCrossed,
  CalendarClock,
  LayoutGrid,
  Boxes,
  Users,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ProductContextKey } from "@/context/ProductContext";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  href: string;
  /**
   * Permissão(ões) necessária(s) para o item aparecer — basta ter UMA
   * delas (OR). Sem este campo, o item é visível para qualquer papel com
   * acesso ao Venue. Checado contra `useVenueAccess().can(...)` em
   * `dashboard-sidebar.tsx` — nunca a única defesa, o backend confere de
   * novo em cada endpoint.
   */
  requiredPermissions?: string[];
}

// Menu de cada contexto de produto. Financeiro e Insights vivem DENTRO de cada
// contexto (isolados) — nunca somam dados entre produtos.
const CONTEXT_MENUS: Record<ProductContextKey, MenuItem[]> = {
  tickets: [
    { label: "Início", icon: <Home size={16} />, href: "/dashboard/tickets/inicio" },
    { label: "Eventos", icon: <CalendarDays size={16} />, href: "/dashboard/tickets/eventos" },
    { label: "Financeiro", icon: <DollarSign size={16} />, href: "/dashboard/tickets/financeiro" },
    { label: "Insights", icon: <BarChart3 size={16} />, href: "/dashboard/tickets/insights" },
  ],
  // Jornada operacional do estabelecimento: reserva → operação → cardápio →
  // estoque → resultado financeiro → análise. Cada item só aparece para
  // quem tem a permissão correspondente (RECEPTION não vê Estoque/Financeiro,
  // KITCHEN_BAR só vê Operação, etc.).
  venue: [
    { label: "Início", icon: <Home size={16} />, href: "/dashboard/venue/inicio", requiredPermissions: ["venue.dashboard.view"] },
    { label: "Reservas", icon: <CalendarClock size={16} />, href: "/dashboard/venue/reservas", requiredPermissions: ["venue.reservations.view"] },
    {
      label: "Operação",
      icon: <LayoutGrid size={16} />,
      href: "/dashboard/venue/operacao",
      requiredPermissions: [
        "venue.operation.tables.view",
        "venue.operation.tabs.view",
        "venue.operation.orders.view",
        "venue.operation.preparation.view",
        "venue.operation.cash.manage",
      ],
    },
    { label: "Cardápio", icon: <UtensilsCrossed size={16} />, href: "/dashboard/venue/cardapio", requiredPermissions: ["venue.menu.view"] },
    { label: "Estoque", icon: <Boxes size={16} />, href: "/dashboard/venue/estoque", requiredPermissions: ["venue.stock.view"] },
    { label: "Financeiro", icon: <DollarSign size={16} />, href: "/dashboard/venue/financeiro", requiredPermissions: ["venue.finance.view"] },
    { label: "Insights", icon: <BarChart3 size={16} />, href: "/dashboard/venue/insights", requiredPermissions: ["venue.insights.view"] },
  ],
};

// Seção global (da organização, não do produto) — sempre visível, abaixo.
export const GLOBAL_MENU: MenuItem[] = [
  { label: "Equipe", icon: <Users size={16} />, href: "/dashboard/equipe", requiredPermissions: ["organization.team.view"] },
  { label: "Configurações", icon: <Settings size={16} />, href: "/dashboard/configuracoes", requiredPermissions: ["organization.settings.view"] },
];

export function contextMenu(context: ProductContextKey): MenuItem[] {
  return CONTEXT_MENUS[context];
}

/**
 * Filtra os itens do contexto Venue pelo que o papel atual pode ver. Só se
 * aplica ao Venue — o Tickets ainda não tem RBAC por papel, então seus itens
 * (sem `requiredPermissions`) passam direto, sem checagem alguma.
 */
export function filterMenuByAccess(items: MenuItem[], can: (permission: string) => boolean): MenuItem[] {
  return items.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    return item.requiredPermissions.some((p) => can(p));
  });
}
