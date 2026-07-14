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

/**
 * Cargos operacionais previstos para o Venue. Ainda NÃO há verificação de
 * permissão em lugar nenhum — este tipo existe só para o menu já nascer
 * preparado para filtragem por cargo no futuro (ver `MenuItem.roles`), sem
 * precisar reescrever a sidebar depois. Nada aqui é aplicado nesta etapa.
 */
export type VenueRole =
  | "OWNER"
  | "MANAGER"
  | "RECEPCAO"
  | "GARCOM"
  | "CAIXA"
  | "COZINHA_BAR";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  href: string;
  /**
   * Cargos que enxergam o item. Quando ausente, o item é visível a todos.
   * Reservado para o filtro por permissão que virá — hoje ninguém lê este
   * campo (o menu mostra a visão completa de OWNER / MANAGER).
   */
  roles?: VenueRole[];
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
  // estoque → resultado financeiro → análise.
  venue: [
    { label: "Início", icon: <Home size={16} />, href: "/dashboard/venue/inicio" },
    { label: "Reservas", icon: <CalendarClock size={16} />, href: "/dashboard/venue/reservas" },
    { label: "Operação", icon: <LayoutGrid size={16} />, href: "/dashboard/venue/operacao" },
    { label: "Cardápio", icon: <UtensilsCrossed size={16} />, href: "/dashboard/venue/cardapio" },
    { label: "Estoque", icon: <Boxes size={16} />, href: "/dashboard/venue/estoque" },
    { label: "Financeiro", icon: <DollarSign size={16} />, href: "/dashboard/venue/financeiro" },
    { label: "Insights", icon: <BarChart3 size={16} />, href: "/dashboard/venue/insights" },
  ],
};

// Seção global (da organização, não do produto) — sempre visível, abaixo.
export const GLOBAL_MENU: MenuItem[] = [
  { label: "Equipe", icon: <Users size={16} />, href: "/dashboard/equipe" },
  { label: "Configurações", icon: <Settings size={16} />, href: "/dashboard/configuracoes" },
];

export function contextMenu(context: ProductContextKey): MenuItem[] {
  return CONTEXT_MENUS[context];
}
