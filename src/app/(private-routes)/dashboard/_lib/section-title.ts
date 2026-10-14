/**
 * Título da seção mostrado na topbar (desktop) a partir da rota. Rotas que
 * já têm item de menu usam o MESMO nome do item (ver LABEL_BY_ROUTE em
 * navigation-presentation.ts); as demais são telas do shell.
 */
const SECTION_TITLE_BY_PREFIX: [string, string][] = [
  ["/dashboard/inicio", "Início"],
  ["/dashboard/onboarding", "Boas-vindas"],
  ["/dashboard/explorar", "Explore a Nokta"],
  ["/dashboard/eventos", "Eventos"],
  ["/dashboard/check-in", "Check-in"],
  ["/dashboard/promotores", "Promotores"],
  ["/dashboard/promotor", "Meu painel de promotor"],
  ["/dashboard/crm", "CRM"],
  ["/dashboard/reservas", "Reservas"],
  ["/dashboard/convidados", "Convidados"],
  ["/dashboard/avaliacoes", "Avaliações"],
  ["/dashboard/operacao/pedidos", "Pedidos"],
  ["/dashboard/operacao/caixa", "Caixa"],
  ["/dashboard/operacao/terminais", "Terminais"],
  ["/dashboard/operacao", "Mesas e comandas"],
  ["/dashboard/cardapio", "Cardápio"],
  ["/dashboard/estoque", "Estoque"],
  ["/dashboard/financeiro", "Financeiro"],
  ["/dashboard/insights", "Insights"],
  ["/dashboard/equipe", "Equipe"],
  ["/dashboard/configuracoes/exportacoes", "Exportações"],
  ["/dashboard/configuracoes", "Configurações"],
  ["/dashboard/venue", "Venue"],
  ["/dashboard/tickets", "Ingressos"],
];

export function resolveSectionTitle(pathname: string): string {
  const hit = SECTION_TITLE_BY_PREFIX.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit?.[1] ?? "Painel";
}

/** Telas que leem o PeriodContext — só nelas o seletor de período aparece na topbar. */
const PERIOD_ROUTES = ["/dashboard/inicio", "/dashboard/financeiro"];

export function routeUsesPeriod(pathname: string): boolean {
  return PERIOD_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
