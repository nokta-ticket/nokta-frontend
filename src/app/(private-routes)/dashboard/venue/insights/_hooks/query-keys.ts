/** Query keys do domínio Insights — sempre incluem organizationId/filtro (isolamento de cache). */
export const insightsKeys = {
  overview: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "overview", params] as const,
  alerts: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "alerts", params] as const,
  sales: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "sales", params] as const,
  operation: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "operation", params] as const,
  products: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "products", params] as const,
  productDetail: (orgId: number, productId: number, params: Record<string, unknown>) => ["insights", orgId, "productDetail", productId, params] as const,
  reservations: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "reservations", params] as const,
  stock: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "stock", params] as const,
  finance: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "finance", params] as const,
  locationsComparison: (orgId: number, params: Record<string, unknown>) => ["insights", orgId, "locationsComparison", params] as const,
};
