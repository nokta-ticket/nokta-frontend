import type { MockHandler } from "./types";
import { f2MenuHandlers } from "./venue-f2-menu";
import { f2StockHandlers } from "./venue-f2-stock";
import { f2FinanceHandlers, f2InsightsHandlers } from "./venue-f2-finance";

/**
 * F2 — cardápio, estoque, financeiro e insights do venue. Entra em
 * venue.ts como um spread só (um arquivo por domínio aqui evita edição
 * concorrente com a F1 no mesmo arquivo).
 */
export const f2Handlers: MockHandler[] = [...f2MenuHandlers, ...f2StockHandlers, ...f2FinanceHandlers, ...f2InsightsHandlers];
