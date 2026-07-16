import api from "@/lib/axios";
import type { VenueFinanceOverview } from "@/services/venue-finance";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueInsightsModule (nokta-api).
// Somente leitura — nunca uma segunda fonte de verdade.

export type VenueInsightsQuickPeriod = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "LAST_MONTH";
export type VenueInsightsComparison = "NONE" | "PREVIOUS_PERIOD" | "SAME_PERIOD_LAST_WEEK" | "SAME_PERIOD_LAST_MONTH";
export type VenueInsightsGranularity = "HOUR" | "DAY" | "WEEK" | "MONTH";
export type VenueInsightsTrendDirection = "UP" | "DOWN" | "STABLE";
export type VenueInsightsTrendSemantic = "positive" | "negative" | "neutral";

export interface VenueInsightsComparisonValue {
  current: number;
  previous: number | null;
  absoluteDiff: number | null;
  percentDiff: number | null;
  direction: VenueInsightsTrendDirection;
  hasBase: boolean;
  semantic: VenueInsightsTrendSemantic;
}

export interface VenueInsightsPeriodBounds {
  startAt: string;
  endAt: string;
}

export interface VenueInsightsFilterParams {
  locationId?: number;
  startDate?: string;
  endDate?: string;
  quickPeriod?: VenueInsightsQuickPeriod;
  comparison?: VenueInsightsComparison;
  granularity?: VenueInsightsGranularity;
  limit?: number;
  page?: number;
  search?: string;
  categoryId?: number;
  productId?: number;
  stationId?: number;
  source?: string;
}

// ---- Visão geral ----

export interface VenueInsightsOverview {
  period: VenueInsightsPeriodBounds;
  comparisonPeriod: VenueInsightsPeriodBounds | null;
  timeZone: string;
  cards: {
    revenueCents: VenueInsightsComparisonValue;
    operationalResultCents: VenueInsightsComparisonValue;
    averageTicketCents: VenueInsightsComparisonValue;
    guestsServed: VenueInsightsComparisonValue & { coverage: number | null };
  };
  secondary: {
    closedTabsCount: number;
    grossMarginCents: number;
    cmvCents: number;
    occupancyRate: number | null;
    occupancyMessage: string | null;
    averageTabDurationMs: number | null;
    noShowRate: number | null;
    lossCents: number;
    divergentCashSessionsCount: number;
  };
  timeline: { date: string; revenueCents: number; cmvCents: number; expensesCents: number; resultCents: number }[];
  salesByHour: { hour: number; amountCents: number }[];
  topProducts: { productId: number; nome: string; revenueCents: number }[];
  disclaimer: string;
}

export interface VenueInsightsAlerts {
  outOfStockItems: { itemId: number; nome: string }[];
  lowStockItems: { itemId: number; nome: string }[];
  overduePayables: { id: number; publicCode: string; description: string; remainingCents: number; dueAt: string | null }[];
  divergentCashSessions: { id: number; differenceCents: number | null; closedAt: string | null }[];
  elevatedNoShow: { rate: number } | null;
}

// ---- Vendas ----

export interface VenueInsightsSales {
  period: VenueInsightsPeriodBounds;
  timeZone: string;
  summary: {
    grossRevenueCents: VenueInsightsComparisonValue;
    paymentsCount: number;
    averageTicketCents: VenueInsightsComparisonValue;
    averageDiscountCents: number | null;
    totalDiscountCents: number;
    totalServiceChargeCents: number;
    netRevenueCents: number;
    canceledTabsCount: number;
  };
  timeline: { date: string; amountCents: number }[];
  byHour: { hour: number; amountCents: number }[];
  byWeekday: { weekday: number; label: string; amountCents: number }[];
  byPaymentMethod: { method: string; grossCents: number; count: number }[];
  byOrigin: { origin: string; count: number; totalCents: number }[];
  topTabsByTotal: { id: number; publicCode: string; customerName: string | null; totalCents: number; closedAt: string | null }[];
  topTabsByDiscount: { id: number; publicCode: string; customerName: string | null; discountCents: number; totalCents: number }[];
}

// ---- Operação ----

export interface VenueInsightsOperation {
  period: VenueInsightsPeriodBounds;
  timeZone: string;
  summary: {
    openedTabsCount: number;
    closedTabsCount: number;
    averageTabDurationMs: number | null;
    averageTimeToFirstOrderMs: number | null;
    averagePreparationTimeMs: number | null;
    averageTimeToDeliveryMs: number | null;
    canceledOrdersCount: number;
    canceledItemsCount: number;
    averageServiceChargeRateBps: number | null;
    averageDiscountCents: number | null;
  };
  byStation: { stationId: number | null; nome: string; itemCount: number; averagePreparationTimeMs: number | null }[];
  byHour: { hour: number; ordersCount: number }[];
  byOperator: { userId: number; openedTabs: number; createdOrders: number }[];
}

// ---- Produtos ----

export interface VenueInsightsProductRow {
  productId: number;
  variantId: number;
  nome: string;
  variantNome: string;
  quantitySold: number;
  averagePriceCents: number | null;
  revenueCents: number;
  cmvCents: number;
  marginCents: number;
  marginPercentage: number | null;
  canceledCount: number;
}

export interface VenueInsightsProducts {
  period: VenueInsightsPeriodBounds;
  rankings: {
    mostSold: VenueInsightsProductRow[];
    topRevenue: VenueInsightsProductRow[];
    topMargin: VenueInsightsProductRow[];
    lowestMargin: VenueInsightsProductRow[];
    mostCanceled: VenueInsightsProductRow[];
  };
  table: { data: VenueInsightsProductRow[]; page: number; limit: number; total: number };
  modifiersRanking: { modifierOptionId: number; nome: string; count: number; revenueCents: number }[];
  categoriesRanking: { nome: string; quantitySold: number; revenueCents: number }[];
}

export interface VenueInsightsProductDetail {
  productId: number;
  nome: string;
  quantitySold: number;
  revenueCents: number;
  cmvCents: number;
  marginCents: number;
  marginPercentage: number | null;
  byVariant: { variantId: number; variantNome: string; quantitySold: number; revenueCents: number; cmvCents: number; canceledCount: number }[];
}

// ---- Reservas ----

export interface VenueInsightsReservations {
  period: VenueInsightsPeriodBounds;
  timeZone: string;
  summary: {
    createdCount: number;
    confirmedCount: number;
    completedCount: number;
    canceledCount: number;
    noShowCount: number;
    expectedGuests: number;
    seatedGuests: number;
    noShowRate: number | null;
    attendanceRate: number | null;
    withoutTableCount: number;
  };
  conversion: { reservationsWithTabCount: number; revenueFromReservationsCents: number; averageTicketFromReservations: number | null };
  bySource: { source: string; count: number }[];
  byWeekday: { weekday: number; label: string; count: number }[];
  byHour: { hour: number; count: number }[];
  waitlist: {
    totalEntries: number;
    seatedCount: number;
    leftCount: number;
    canceledCount: number;
    conversionRate: number | null;
    averageWaitTimeMs: number | null;
    revenueCents: number;
  };
}

// ---- Estoque ----

export interface VenueInsightsStock {
  period: VenueInsightsPeriodBounds;
  summary: {
    estimatedValueCents: number;
    lowStockCount: number;
    outOfStockCount: number;
    negativeCount: number;
    purchasesTotalCents: number;
    lossCents: number;
    consumptionCents: number;
    estimatedTurnover: number | null;
    turnoverLabel: string;
    countAdjustmentsCount: number;
    transfersCount: number;
  };
  lossByReason: { reason: string; amountCents: number }[];
  purchasesBySupplier: { supplierId: number | null; nome: string; totalCents: number; count: number }[];
  highestValueItems: { itemId: number; nome: string; categoryNome: string | null; quantityOnHand: string | number; valueCents: number }[];
  mostConsumedItems: { itemId: number; nome: string; consumedQuantity: number }[];
  costByCategory: { nome: string; valueCents: number }[];
}

// ---- Financeiro ----

export interface VenueInsightsFinance {
  period: VenueInsightsPeriodBounds;
  overview: VenueFinanceOverview;
  expensesByCategory: { categoryId: number; nome: string; amountCents: number }[];
  cashDivergence: { sessionsCount: number; totalDifferenceCents: number };
  reconciliation: { divergentCount: number; totalCount: number; divergentRows: unknown[] };
}

// ---- Comparação entre unidades ----

export interface VenueInsightsLocationComparisonRow {
  locationId: number;
  nome: string;
  revenueCents: number;
  operationalResultCents: number;
  grossMarginCents: number;
  averageTicketCents: number | null;
  closedTabsCount: number;
  guestsServed: number;
  averageTabDurationMs: number | null;
  noShowRate: number | null;
  lossCents: number;
  divergentCashSessionsCount: number;
}

export interface VenueInsightsLocationComparison {
  period: VenueInsightsPeriodBounds;
  locations: VenueInsightsLocationComparisonRow[];
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue/insights`;

export const venueInsightsApi = {
  getOverview: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsOverview>(`${base(orgId)}/overview`, { params }).then((r) => r.data),
  getAlerts: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsAlerts>(`${base(orgId)}/alerts`, { params }).then((r) => r.data),
  getSales: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsSales>(`${base(orgId)}/sales`, { params }).then((r) => r.data),
  getOperation: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsOperation>(`${base(orgId)}/operation`, { params }).then((r) => r.data),
  getProducts: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsProducts>(`${base(orgId)}/products`, { params }).then((r) => r.data),
  getProductDetail: (orgId: number, productId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsProductDetail>(`${base(orgId)}/products/${productId}`, { params }).then((r) => r.data),
  getReservations: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsReservations>(`${base(orgId)}/reservations`, { params }).then((r) => r.data),
  getStock: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsStock>(`${base(orgId)}/stock`, { params }).then((r) => r.data),
  getFinance: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsFinance>(`${base(orgId)}/finance`, { params }).then((r) => r.data),
  getLocationsComparison: (orgId: number, params: VenueInsightsFilterParams = {}) =>
    api.get<VenueInsightsLocationComparison>(`${base(orgId)}/locations/comparison`, { params }).then((r) => r.data),

  // ---- Exportação CSV ----
  // Fetch autenticado (Blob), não <a href> cru: o token vai num header Bearer
  // anexado pelo interceptor do axios, não num cookie httpOnly.
  downloadExport: async (
    orgId: number,
    kind: "overview" | "sales" | "products" | "reservations" | "stock" | "finance",
    filename: string,
    params: VenueInsightsFilterParams = {},
  ) => {
    const response = await api.get(`${base(orgId)}/exports/${kind}.csv`, { params, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ==================== HELPERS ====================

export const VENUE_INSIGHTS_QUICK_PERIOD_LABEL: Record<VenueInsightsQuickPeriod, string> = {
  TODAY: "Hoje",
  YESTERDAY: "Ontem",
  LAST_7_DAYS: "Últimos 7 dias",
  LAST_30_DAYS: "Últimos 30 dias",
  THIS_MONTH: "Este mês",
  LAST_MONTH: "Mês anterior",
};

export const VENUE_INSIGHTS_COMPARISON_LABEL: Record<VenueInsightsComparison, string> = {
  NONE: "Sem comparação",
  PREVIOUS_PERIOD: "Período anterior",
  SAME_PERIOD_LAST_WEEK: "Mesmo período — semana passada",
  SAME_PERIOD_LAST_MONTH: "Mesmo período — mês passado",
};

export const VENUE_INSIGHTS_GRANULARITY_LABEL: Record<VenueInsightsGranularity, string> = {
  HOUR: "Por hora",
  DAY: "Por dia",
  WEEK: "Por semana",
  MONTH: "Por mês",
};

export const VENUE_INSIGHTS_ORIGIN_LABEL: Record<string, string> = {
  RESERVATION: "Reserva",
  WAITLIST: "Fila de espera",
  COUNTER: "Balcão",
  INDIVIDUAL: "Individual",
  TABLE: "Mesa",
};

/** Formata centavos em "R$ 0,00". */
export function formatCentsBRL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata uma taxa (0-1) como percentual — null quando não há base de cálculo. */
export function formatRate(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** Formata uma duração em milissegundos como "Xh Ymin" (ou "Ymin" quando < 1h). */
export function formatDurationMs(ms: number | null): string {
  if (ms === null) return "—";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}
