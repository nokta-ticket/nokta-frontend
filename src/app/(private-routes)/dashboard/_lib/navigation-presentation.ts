import type { CapabilityGroup, NavigationItem } from "@/services/platform";

/**
 * Camada de apresentação da navegação unificada (Fase 3) — consome
 * `NavigationItem[]` de GET .../me/navigation (backend já decidiu
 * capacidade ativa × permissão, ver PlatformAccessResolverService/
 * NavigationService). Este arquivo NUNCA decide o que é visível — só como
 * apresentar o que o backend já mandou: em qual grupo visual entra, qual
 * rota real usar quando a rota "oficial" da capacidade ainda não tem
 * página própria no dashboard multi-tenant, e qual ícone mostrar.
 */

export type DisplayGroup = "INICIO" | "EVENTOS" | "RELACIONAMENTO" | "OPERACAO" | "PRODUTOS" | "GESTAO";

export const DISPLAY_GROUP_ORDER: DisplayGroup[] = ["INICIO", "EVENTOS", "RELACIONAMENTO", "OPERACAO", "PRODUTOS", "GESTAO"];

export const DISPLAY_GROUP_LABEL: Record<DisplayGroup, string> = {
  INICIO: "Início",
  EVENTOS: "Eventos",
  RELACIONAMENTO: "Relacionamento",
  OPERACAO: "Operação",
  PRODUTOS: "Produtos",
  GESTAO: "Gestão",
};

/**
 * O grupo "CORE" do backend mistura Início/Equipe/Configurações/Unidades —
 * cada um vai para um lugar diferente na navegação visual. Chaves fora
 * deste mapa caem no fallback por grupo do backend (abaixo).
 */
const DISPLAY_GROUP_BY_KEY: Partial<Record<string, DisplayGroup>> = {
  PLATFORM_HOME: "INICIO",
  TEAM: "GESTAO",
  SETTINGS: "GESTAO",
  // LOCATIONS não entra na navegação principal — já é uma aba dentro de
  // Configurações (ver EXCLUDED_KEYS). Sem entrada aqui de propósito.
};

const DISPLAY_GROUP_BY_BACKEND_GROUP: Record<CapabilityGroup, DisplayGroup | null> = {
  CORE: null, // resolvido por chave (DISPLAY_GROUP_BY_KEY) ou excluído
  EVENTS: "EVENTOS",
  RELATIONSHIP: "RELACIONAMENTO",
  OPERATION: "OPERACAO",
  PRODUCTS: "PRODUTOS",
  MANAGEMENT: "GESTAO",
};

/** Nunca aparece como item de navegação de topo (vive dentro de Configurações). */
const EXCLUDED_KEYS = new Set(["LOCATIONS"]);

/**
 * Sobrescreve a rota de uma capacidade quando ela ainda não tem página
 * própria no dashboard multi-tenant — ver auditoria da Fase 3
 * (docs/platform/unified-navigation.md "Lacunas conhecidas"):
 *
 * - Tipos de ingresso, Lotes, Check-in e Convidados ainda não têm tela
 *   dedicada aqui (hoje, quando existem, vivem no fluxo antigo
 *   `/produtor/*`, fora do escopo desta fase — não organizacional). Até lá,
 *   apontam para Eventos.
 * - Fila de espera é uma aba dentro de Reservas (`?tab=fila`), não uma
 *   página própria.
 * - Preparo e Pagamentos não têm aba própria em Operação — vivem dentro de
 *   Pedidos e Caixa respectivamente.
 * - Produtos/Adicionais são abas de Cardápio; Compras/Fornecedores são
 *   abas de Estoque.
 */
const ROUTE_OVERRIDE_BY_KEY: Partial<Record<string, string>> = {
  TICKETING: "/dashboard/eventos",
  TICKET_TYPES: "/dashboard/eventos",
  LOTS: "/dashboard/eventos",
  CHECK_IN: "/dashboard/eventos",
  GUEST_LISTS: "/dashboard/eventos",
  WAITLIST: "/dashboard/reservas?tab=fila",
  TABLES: "/dashboard/operacao/mesas",
  TABS: "/dashboard/operacao/comandas",
  ORDERS: "/dashboard/operacao/pedidos",
  PREPARATION: "/dashboard/operacao/pedidos",
  CASH_REGISTER: "/dashboard/operacao/caixa",
  VENUE_PAYMENTS: "/dashboard/operacao/caixa",
  PRODUCTS: "/dashboard/cardapio",
  MODIFIERS: "/dashboard/cardapio",
  PURCHASES: "/dashboard/estoque",
  SUPPLIERS: "/dashboard/estoque",
};

export type IconKey =
  | "home"
  | "calendar"
  | "clock"
  | "grid"
  | "utensils"
  | "boxes"
  | "dollar"
  | "chart"
  | "users"
  | "settings";

const ICON_BY_KEY: Partial<Record<string, IconKey>> = {
  PLATFORM_HOME: "home",
  EVENTS: "calendar",
  RESERVATIONS: "clock",
  WAITLIST: "clock",
  TABLES: "grid",
  TABS: "grid",
  ORDERS: "grid",
  CASH_REGISTER: "grid",
  MENUS: "utensils",
  INVENTORY: "boxes",
  FINANCE: "dollar",
  INSIGHTS: "chart",
  TEAM: "users",
  SETTINGS: "settings",
};
const ICON_BY_GROUP: Record<CapabilityGroup, IconKey> = {
  CORE: "home",
  EVENTS: "calendar",
  RELATIONSHIP: "clock",
  OPERATION: "grid",
  PRODUCTS: "boxes",
  MANAGEMENT: "dollar",
};

export interface UnifiedNavItem {
  key: string;
  label: string;
  route: string;
  iconKey: IconKey;
}

export interface UnifiedNavGroup {
  group: DisplayGroup;
  groupLabel: string;
  items: UnifiedNavItem[];
}

function resolveDisplayGroup(item: NavigationItem): DisplayGroup | null {
  return DISPLAY_GROUP_BY_KEY[item.key] ?? DISPLAY_GROUP_BY_BACKEND_GROUP[item.group];
}

function resolveRoute(item: NavigationItem): string {
  return ROUTE_OVERRIDE_BY_KEY[item.key] ?? item.route;
}

/**
 * Agrupa e ordena os itens que o backend mandou (`GET .../me/navigation`)
 * para exibição. Deduplica por rota final (várias capacidades podem cair
 * na mesma tela ainda-não-desmembrada — ver ROUTE_OVERRIDE_BY_KEY) mantendo
 * só a primeira ocorrência, preservando a ordem em que o backend as
 * retornou (que já reflete o catálogo — CORE primeiro, depois por grupo).
 * Grupos sem nenhum item não aparecem no resultado.
 */
export function buildUnifiedNavigation(items: NavigationItem[]): UnifiedNavGroup[] {
  const seenRoutes = new Set<string>();
  const byGroup = new Map<DisplayGroup, UnifiedNavItem[]>();

  for (const item of items) {
    if (EXCLUDED_KEYS.has(item.key)) continue;

    const displayGroup = resolveDisplayGroup(item);
    if (!displayGroup) continue;

    const route = resolveRoute(item);
    if (seenRoutes.has(route)) continue;
    seenRoutes.add(route);

    const iconKey = ICON_BY_KEY[item.key] ?? ICON_BY_GROUP[item.group];
    const list = byGroup.get(displayGroup) ?? [];
    list.push({ key: item.key, label: item.label, route, iconKey });
    byGroup.set(displayGroup, list);
  }

  return DISPLAY_GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => ({
    group,
    groupLabel: DISPLAY_GROUP_LABEL[group],
    items: byGroup.get(group)!,
  }));
}
