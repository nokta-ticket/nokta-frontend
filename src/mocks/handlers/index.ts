import type { MockHandler } from "./types";
import { publicHandlers } from "./public";
import { checkoutHandlers } from "./checkout";
import { accountHandlers } from "./account";
import { dashboardHandlers } from "./dashboard";
import { eventsAdminHandlers } from "./events-admin";
import { venueHandlers } from "./venue";
import { adminHandlers } from "./admin";

/**
 * Um arquivo por área (cada frente de trabalho edita só o seu). Ordem
 * importa: o primeiro handler cujo `test` casa responde.
 */
// eventsAdminHandlers vem antes dos públicos: `/produtor/eventos` e
// `/produtor/eventos/:id` seriam engolidos por `/\/eventos$/` e
// `/\/eventos\/[^/]+$/` de public.ts (que não checam o prefixo). Todos os
// testes de events-admin.ts são específicos, então nada público muda.
export const handlers: MockHandler[] = [...eventsAdminHandlers, ...publicHandlers, ...checkoutHandlers, ...accountHandlers, ...dashboardHandlers, ...venueHandlers, ...adminHandlers];
