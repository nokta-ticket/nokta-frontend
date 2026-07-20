/** Query keys do domínio Operação — sempre incluem organizationId/locationId (isolamento de cache). */
export const opKeys = {
  locations: (orgId: number) => ["op", orgId, "locations"] as const,
  areas: (orgId: number, locationId: number) => ["op", orgId, "areas", locationId] as const,
  tables: (orgId: number, locationId: number) => ["op", orgId, "tables", locationId] as const,
  cashRegisters: (orgId: number, locationId: number) => ["op", orgId, "cashRegisters", locationId] as const,
  cashSessions: (orgId: number, locationId: number) => ["op", orgId, "cashSessions", locationId] as const,
  cashSession: (orgId: number, sessionId: number) => ["op", orgId, "cashSession", sessionId] as const,
  tabs: (orgId: number, locationId: number, filters: Record<string, unknown>) =>
    ["op", orgId, "tabs", locationId, filters] as const,
  tab: (orgId: number, tabId: number) => ["op", orgId, "tab", tabId] as const,
  orders: (orgId: number, tabId: number) => ["op", orgId, "orders", tabId] as const,
  preparationItems: (orgId: number, locationId: number, filters: Record<string, unknown>) =>
    ["op", orgId, "preparationItems", locationId, filters] as const,
  payments: (orgId: number, tabId: number) => ["op", orgId, "payments", tabId] as const,
};
