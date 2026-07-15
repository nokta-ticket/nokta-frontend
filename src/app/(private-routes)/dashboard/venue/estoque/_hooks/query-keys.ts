/** Query keys do domínio Estoque — sempre incluem organizationId/locationId (isolamento de cache por org e unidade). */
export const stockKeys = {
  settings: (orgId: number, locationId: number) => ["stock", orgId, "settings", locationId] as const,
  categories: (orgId: number, includeArchived: boolean) => ["stock", orgId, "categories", includeArchived] as const,
  items: (orgId: number, params: Record<string, unknown>) => ["stock", orgId, "items", params] as const,
  item: (orgId: number, itemId: number) => ["stock", orgId, "item", itemId] as const,
  itemBalances: (orgId: number, itemId: number) => ["stock", orgId, "itemBalances", itemId] as const,
  itemMovements: (orgId: number, itemId: number) => ["stock", orgId, "itemMovements", itemId] as const,
  suppliers: (orgId: number, includeArchived: boolean) => ["stock", orgId, "suppliers", includeArchived] as const,
  supplier: (orgId: number, supplierId: number) => ["stock", orgId, "supplier", supplierId] as const,
  purchases: (orgId: number, locationId: number, params: Record<string, unknown>) =>
    ["stock", orgId, "purchases", locationId, params] as const,
  purchase: (orgId: number, purchaseId: number) => ["stock", orgId, "purchase", purchaseId] as const,
  variantComponents: (orgId: number, variantId: number) => ["stock", orgId, "variantComponents", variantId] as const,
  modifierComponents: (orgId: number, modifierOptionId: number) =>
    ["stock", orgId, "modifierComponents", modifierOptionId] as const,
  movements: (orgId: number, locationId: number, params: Record<string, unknown>) =>
    ["stock", orgId, "movements", locationId, params] as const,
  counts: (orgId: number, locationId: number, status?: string) => ["stock", orgId, "counts", locationId, status] as const,
  count: (orgId: number, countId: number) => ["stock", orgId, "count", countId] as const,
  transfers: (orgId: number, status?: string) => ["stock", orgId, "transfers", status] as const,
  transfer: (orgId: number, transferId: number) => ["stock", orgId, "transfer", transferId] as const,
  summary: (orgId: number, locationId: number) => ["stock", orgId, "summary", locationId] as const,
  alerts: (orgId: number, locationId: number) => ["stock", orgId, "alerts", locationId] as const,
};
