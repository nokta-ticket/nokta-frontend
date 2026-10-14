import { unauthorized, type MockHandler } from "./types";

/** Sessão e área do comprador (frente C edita aqui). */
export const accountHandlers: MockHandler[] = [{ test: /\/auth\/me$/, handle: () => unauthorized() }];
