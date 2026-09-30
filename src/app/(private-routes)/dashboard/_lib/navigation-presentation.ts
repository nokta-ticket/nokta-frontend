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
 * - Tipos de ingresso e Lotes ainda não têm tela dedicada própria — apontam
 *   para Eventos (são uma aba dentro do editor de evento, SectionIngressos).
 *   Check-in ganhou rota própria na Fase 5 (`/dashboard/check-in`, migrado
 *   de `/produtor/validar`) — sem override, usa a rota que o backend manda.
 * - Convidados (GUEST_LISTS) também ganhou rota própria (`/dashboard/convidados`)
 *   — sem override aqui, usa a rota que o backend já manda (mesmo padrão do
 *   Check-in). Cobre só cortesia de evento por enquanto; convidado de
 *   reserva/mesa (Venue) é escopo futuro, ver playful-jingling-wall.md.
 * - Fila de espera é uma aba dentro de Reservas (`?tab=fila`), não uma
 *   página própria.
 * - Preparo e Pagamentos não têm aba própria em Operação — vivem dentro de
 *   Pedidos e Caixa respectivamente.
 * - Produtos/Adicionais são abas de Cardápio; Compras/Fornecedores são
 *   abas de Estoque.
 * - Mesas e Comandas deixaram de ser abas separadas — a página de Operação
 *   virou uma única tela unificada (mesa + comanda + balcão, abertos e
 *   encerrados) para resolver comandas de balcão "sumindo" do dashboard
 *   (fecham sozinhas assim que quitadas, então nunca apareciam na aba
 *   "Comandas", que filtrava por status=OPEN por padrão). TABLES/TABS
 *   apontam para a mesma rota raiz agora; o dedupe por rota em
 *   `buildUnifiedNavigation` garante um único item de menu.
 */
const ROUTE_OVERRIDE_BY_KEY: Partial<Record<string, string>> = {
  TICKETING: "/dashboard/eventos",
  TICKET_TYPES: "/dashboard/eventos",
  LOTS: "/dashboard/eventos",
  WAITLIST: "/dashboard/reservas?tab=fila",
  TABLES: "/dashboard/operacao",
  TABS: "/dashboard/operacao",
  ORDERS: "/dashboard/operacao/pedidos",
  PREPARATION: "/dashboard/operacao/pedidos",
  CASH_REGISTER: "/dashboard/operacao/caixa",
  VENUE_PAYMENTS: "/dashboard/operacao/caixa",
  PRODUCTS: "/dashboard/cardapio",
  MODIFIERS: "/dashboard/cardapio",
  PURCHASES: "/dashboard/estoque",
  SUPPLIERS: "/dashboard/estoque",
};

/**
 * Nome do item de menu = nome da PÁGINA que ele abre, nunca da capacidade.
 * Várias capacidades caem na mesma rota (ver ROUTE_OVERRIDE_BY_KEY) e o
 * dedupe mantém a primeira que chegou — sem este mapa, o nome variava por
 * organização conforme o que estava ativo (quem tinha Pagamentos sem Caixa
 * via um item "Pagamentos" abrindo a página do Caixa; Produtos sem
 * Cardápios via "Produtos" abrindo o Cardápio). Cada nome aqui é igual ao
 * título da própria página.
 */
const LABEL_BY_ROUTE: Partial<Record<string, string>> = {
  "/dashboard/eventos": "Eventos",
  "/dashboard/operacao": "Mesas e comandas",
  "/dashboard/operacao/pedidos": "Pedidos",
  "/dashboard/operacao/caixa": "Caixa",
  "/dashboard/cardapio": "Cardápio",
  "/dashboard/estoque": "Estoque",
};

/**
 * Ordem fixa dos itens dentro de cada seção (antes dependia da ordem em que o
 * backend devolvia as capacidades — Equipe/Configurações, que são CORE,
 * vinham antes de Financeiro). Rota fora da lista vai para o fim, estável.
 */
const ROUTE_ORDER = [
  "/dashboard/inicio",
  "/dashboard/eventos",
  "/dashboard/check-in",
  "/dashboard/promotores",
  "/dashboard/reservas",
  "/dashboard/reservas?tab=fila",
  "/dashboard/convidados",
  "/dashboard/avaliacoes",
  "/dashboard/operacao",
  "/dashboard/operacao/pedidos",
  "/dashboard/operacao/caixa",
  "/dashboard/cardapio",
  "/dashboard/estoque",
  "/dashboard/financeiro",
  "/dashboard/insights",
  "/dashboard/configuracoes/exportacoes",
  "/dashboard/equipe",
  "/dashboard/configuracoes",
];

function routeRank(route: string): number {
  const index = ROUTE_ORDER.indexOf(route);
  return index === -1 ? ROUTE_ORDER.length : index;
}

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
  | "settings"
  | "star"
  | "tablet";

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
  REVIEWS: "star",
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
    const label = LABEL_BY_ROUTE[route] ?? item.label;
    const list = byGroup.get(displayGroup) ?? [];
    list.push({ key: item.key, label, route, iconKey });
    byGroup.set(displayGroup, list);
  }

  return DISPLAY_GROUP_ORDER.filter((g) => byGroup.has(g)).map((group) => {
    return {
      group,
      groupLabel: DISPLAY_GROUP_LABEL[group],
      items: [...byGroup.get(group)!].sort((a, b) => routeRank(a.route) - routeRank(b.route)),
    };
  });
}

/**
 * Espelha CAPABILITY_CATALOG (nokta-api/src/core/platform/common/
 * capability-catalog.ts) — todas as capacidades reais, exceto as marcadas
 * `future: true` no backend (revenda de ingressos, clientes: ainda não
 * implementáveis, nunca ativáveis de verdade). Usado só como preview
 * estático "como se tudo estivesse ativo" para quem ainda não tem
 * organização (ex.: onboarding) — GET .../me/navigation não tem o que
 * retornar nesse momento. Mudou o catálogo real? Atualize aqui também.
 */
const FULL_CATALOG_PREVIEW: NavigationItem[] = [
  { key: "PLATFORM_HOME", label: "Início", route: "/dashboard/inicio", group: "CORE" },
  { key: "EVENTS", label: "Eventos", route: "/dashboard/eventos", group: "EVENTS" },
  { key: "TICKETING", label: "Eventos e ingressos", route: "/dashboard/ingressos", group: "EVENTS" },
  { key: "TICKET_TYPES", label: "Tipos de ingresso", route: "/dashboard/ingressos/tipos", group: "EVENTS" },
  { key: "LOTS", label: "Lotes", route: "/dashboard/ingressos/lotes", group: "EVENTS" },
  { key: "CHECK_IN", label: "Check-in", route: "/dashboard/check-in", group: "EVENTS" },
  { key: "PROMOTERS", label: "Promotores", route: "/dashboard/promotores", group: "EVENTS" },
  { key: "RESERVATIONS", label: "Reservas", route: "/dashboard/reservas", group: "RELATIONSHIP" },
  { key: "WAITLIST", label: "Fila de espera", route: "/dashboard/reservas?tab=fila", group: "RELATIONSHIP" },
  { key: "GUEST_LISTS", label: "Convidados", route: "/dashboard/convidados", group: "RELATIONSHIP" },
  { key: "REVIEWS", label: "Avaliações", route: "/dashboard/avaliacoes", group: "RELATIONSHIP" },
  { key: "TABLES", label: "Mesas", route: "/dashboard/operacao", group: "OPERATION" },
  { key: "TABS", label: "Comandas", route: "/dashboard/operacao", group: "OPERATION" },
  { key: "ORDERS", label: "Pedidos", route: "/dashboard/operacao/pedidos", group: "OPERATION" },
  { key: "PREPARATION", label: "Preparo", route: "/dashboard/operacao/pedidos", group: "OPERATION" },
  { key: "CASH_REGISTER", label: "Caixa", route: "/dashboard/operacao/caixa", group: "OPERATION" },
  { key: "VENUE_PAYMENTS", label: "Pagamentos", route: "/dashboard/operacao/caixa", group: "OPERATION" },
  { key: "MENUS", label: "Cardápios", route: "/dashboard/cardapio", group: "PRODUCTS" },
  { key: "PRODUCTS", label: "Produtos", route: "/dashboard/cardapio?tab=produtos", group: "PRODUCTS" },
  { key: "MODIFIERS", label: "Adicionais", route: "/dashboard/cardapio?tab=adicionais", group: "PRODUCTS" },
  { key: "INVENTORY", label: "Estoque", route: "/dashboard/estoque", group: "PRODUCTS" },
  { key: "PURCHASES", label: "Compras", route: "/dashboard/estoque?tab=compras", group: "PRODUCTS" },
  { key: "SUPPLIERS", label: "Fornecedores", route: "/dashboard/estoque?tab=fornecedores", group: "PRODUCTS" },
  { key: "TEAM", label: "Equipe", route: "/dashboard/equipe", group: "CORE" },
  { key: "FINANCE", label: "Financeiro", route: "/dashboard/financeiro", group: "MANAGEMENT" },
  { key: "INSIGHTS", label: "Insights", route: "/dashboard/insights", group: "MANAGEMENT" },
  { key: "EXPORTS", label: "Exportações", route: "/dashboard/configuracoes/exportacoes", group: "MANAGEMENT" },
  { key: "SETTINGS", label: "Configurações", route: "/dashboard/configuracoes", group: "CORE" },
];

/** Navegação completa "como se tudo estivesse ativo" — ver FULL_CATALOG_PREVIEW. */
export function buildFullCatalogPreview(): UnifiedNavGroup[] {
  return buildUnifiedNavigation(FULL_CATALOG_PREVIEW);
}
