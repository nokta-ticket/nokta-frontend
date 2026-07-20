/**
 * Decide quais blocos de origem (Tickets/Venue) mostrar nas páginas
 * canônicas de Financeiro e Insights — nunca soma/mistura as duas origens
 * (ver docs/platform/unified-navigation.md "Separação financeira"). Função
 * pura só pra ficar testável sem montar os componentes de página.
 */
export type FinanceDispatch = "both" | "venue" | "tickets" | "none";

export function selectFinanceDispatch(activeModuleKeys: string[]): FinanceDispatch {
  const hasTickets = activeModuleKeys.includes("tickets");
  const hasVenue = activeModuleKeys.includes("venue");
  if (hasTickets && hasVenue) return "both";
  if (hasVenue) return "venue";
  if (hasTickets) return "tickets";
  return "none";
}
