/**
 * Chaves de consulta dos dados de base do dashboard (organizações, módulos e
 * acessos). Ficam fora dos contexts para que o pré-carregamento da abertura
 * (dashboard/_lib/boot-prefetch.ts) use exatamente as mesmas chaves, sem
 * importar os contexts de volta (ciclo).
 */
export const organizationsQueryKey = ["me", "organizations"] as const;
export const modulesQueryKey = (orgId: number) => ["organizations", orgId, "modules"] as const;
export const venueAccessQueryKey = (orgId: number) => ["organizations", orgId, "me", "access"] as const;
export const ticketsAccessQueryKey = (orgId: number) => ["organizations", orgId, "tickets", "access"] as const;
