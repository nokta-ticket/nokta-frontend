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
export const handlers: MockHandler[] = [...publicHandlers, ...checkoutHandlers, ...accountHandlers, ...dashboardHandlers, ...eventsAdminHandlers, ...venueHandlers, ...adminHandlers];
