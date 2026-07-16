import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueFinanceModule (nokta-api).

export type VenueFinanceBasis = "CASH" | "ACCRUAL";
export type VenueFinanceQuickPeriod = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "LAST_MONTH";
export type VenueFinancialCategoryType = "EXPENSE" | "OTHER_INCOME";
export type VenuePayableStatus = "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELED";
export type VenueFinancialPaymentMethod = "CASH" | "PIX" | "BANK_TRANSFER" | "DEBIT_CARD" | "CREDIT_CARD" | "BOLETO" | "OTHER";
export type VenuePaymentMethod = "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD" | "VOUCHER" | "OTHER";
export type VenuePaymentStatus = "CONFIRMED" | "CANCELED";
export type VenueReconciliationStatus = "PENDING" | "MATCHED" | "DIVERGENT";

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface VenueFinancialCategory {
  id: number;
  organizationId: number;
  nome: string;
  type: VenueFinancialCategoryType;
  description: string | null;
  displayOrder: number;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueFinanceOverview {
  basis: VenueFinanceBasis;
  period: { startAt: string; endAt: string };
  grossRevenueCents: number;
  netRevenueCents: number;
  estimatedFeeCents: number;
  discountCents: number;
  serviceChargeCents: number;
  canceledCents: number;
  cmvCents: number;
  grossMarginCents: number;
  expensesCents: number;
  otherIncomeCents: number;
  operationalResultCents: number;
  payablesOpenCount: number;
  payablesOverdueCount: number;
  disclaimer: string;
}

export interface VenueFinanceTimelinePoint {
  date: string;
  revenueCents: number;
  cmvCents: number;
  expensesCents: number;
  resultCents: number;
}

export interface VenueFinancePaymentMethodBucket {
  method: VenuePaymentMethod;
  grossCents: number;
  feeCents: number;
  netCents: number;
  count: number;
}

export interface VenueFinanceExpenseByCategory {
  categoryId: number;
  nome: string;
  amountCents: number;
}

export interface VenueFinanceLocationComparison extends VenueFinanceOverview {
  locationId: number;
  nome: string;
}

export interface VenuePayablePayment {
  id: number;
  organizationId: number;
  payableId: number;
  locationId: number | null;
  cashSessionId: number | null;
  method: VenueFinancialPaymentMethod;
  amountCents: number;
  paidAt: string;
  externalReference: string | null;
  idempotencyKey: string;
  notes: string | null;
  createdByUserId: number;
  canceledByUserId: number | null;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface VenuePayable {
  id: number;
  organizationId: number;
  locationId: number | null;
  categoryId: number;
  supplierId: number | null;
  purchaseId: number | null;
  publicCode: string;
  description: string;
  status: VenuePayableStatus;
  totalAmountCents: number;
  paidAmountCents: number;
  incurredAt: string;
  dueAt: string | null;
  notes: string | null;
  documentNumber: string | null;
  createdByUserId: number;
  canceledByUserId: number | null;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: number; nome: string };
  supplier: { id: number; nome: string } | null;
  location: { id: number; nome: string } | null;
  purchase: { id: number; publicCode: string } | null;
}

export interface VenueOtherIncome {
  id: number;
  organizationId: number;
  locationId: number | null;
  categoryId: number;
  description: string;
  amountCents: number;
  receivedAt: string;
  method: VenueFinancialPaymentMethod;
  cashSessionId: number | null;
  idempotencyKey: string;
  notes: string | null;
  createdByUserId: number;
  canceledByUserId: number | null;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  category: { id: number; nome: string };
  location: { id: number; nome: string } | null;
}

export interface VenuePaymentFeeRule {
  id: number;
  organizationId: number;
  locationId: number | null;
  method: VenuePaymentMethod;
  percentageBps: number;
  fixedFeeCents: number;
  settlementDays: number;
  active: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenuePaymentReconciliation {
  date: string;
  locationId: number;
  method: VenuePaymentMethod;
  expectedGrossCents: number;
  expectedFeeCents: number;
  expectedNetCents: number;
  actualNetCents: number | null;
  differenceCents: number | null;
  status: VenueReconciliationStatus;
  notes: string | null;
  reconciledByUserId: number | null;
  reconciledAt: string | null;
}

export interface VenueSaleFinancialSnapshot {
  id: number;
  paymentId: number;
  grossAmountCents: number;
  estimatedFeeCents: number;
  estimatedNetCents: number;
  expectedSettlementAt: string | null;
  feeRuleId: number | null;
}

export interface VenueSale {
  id: number;
  organizationId: number;
  locationId: number;
  tabId: number;
  cashSessionId: number | null;
  method: VenuePaymentMethod;
  status: VenuePaymentStatus;
  amountCents: number;
  receivedCents: number | null;
  changeCents: number;
  externalReference: string | null;
  notes: string | null;
  createdByUserId: number;
  confirmedAt: string;
  canceledAt: string | null;
  tab: { id: number; publicCode: string; customerName: string | null; tableId: number | null };
  financialSnapshot: VenueSaleFinancialSnapshot | null;
}

export interface VenueSaleDetail {
  payment: VenueSale;
  tab: {
    id: number;
    publicCode: string;
    customerName: string | null;
    discountCents: number;
    serviceChargeCents: number;
    subtotalCents: number;
    totalCents: number;
    payments: VenueSale[];
    items: { id: number; productNameSnapshot: string; variantNameSnapshot: string; quantity: number; lineTotalCents: number }[];
  };
  cmvCents: number;
  marginCents: number;
}

export interface VenueReceivablesAgenda {
  todayCents: number;
  tomorrowCents: number;
  next7DaysCents: number;
  next30DaysCents: number;
  byMethodNext7Days: { method: VenuePaymentMethod; netCents: number }[];
  disclaimer: string;
}

export interface VenueCashSessionReport {
  sessionId: number;
  operatorUserId: number;
  closedByUserId: number | null;
  cashRegister: { id: number; nome: string };
  location: { id: number; nome: string };
  openedAt: string;
  closedAt: string | null;
  openingAmountCents: number;
  cashSalesCents: number;
  otherIncomeCents: number;
  supplyCents: number;
  withdrawalCents: number;
  expenseCents: number;
  adjustmentsCents: number;
  expectedCashCents: number;
  countedCashCents: number | null;
  differenceCents: number | null;
  status: "OPEN" | "CLOSED";
  notes: string | null;
}

// ==================== PAYLOADS ====================

export interface VenueFinancePeriodParams {
  quickPeriod?: VenueFinanceQuickPeriod;
  startDate?: string;
  endDate?: string;
  basis?: VenueFinanceBasis;
}

export interface CreateVenueFinancialCategoryPayload {
  nome: string;
  type: VenueFinancialCategoryType;
  description?: string;
  displayOrder?: number;
}
export type UpdateVenueFinancialCategoryPayload = Partial<Omit<CreateVenueFinancialCategoryPayload, "type">>;

export interface CreateInitialPayablePaymentPayload {
  method: VenueFinancialPaymentMethod;
  amountCents: number;
  paidAt?: string;
  cashSessionId?: number;
  externalReference?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface CreateVenuePayablePayload {
  locationId?: number;
  categoryId: number;
  supplierId?: number;
  purchaseId?: number;
  description: string;
  totalAmountCents: number;
  incurredAt: string;
  dueAt?: string;
  notes?: string;
  documentNumber?: string;
  initialPayment?: CreateInitialPayablePaymentPayload;
}

export type UpdateVenuePayablePayload = Partial<Omit<CreateVenuePayablePayload, "purchaseId" | "initialPayment">>;

export interface CreateVenuePayablePaymentPayload {
  method: VenueFinancialPaymentMethod;
  amountCents: number;
  paidAt?: string;
  cashSessionId?: number;
  externalReference?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface VenuePayableQueryParams {
  status?: VenuePayableStatus;
  locationId?: number;
  categoryId?: number;
  supplierId?: number;
  dueBefore?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateVenueOtherIncomePayload {
  locationId?: number;
  categoryId: number;
  description: string;
  amountCents: number;
  receivedAt?: string;
  method: VenueFinancialPaymentMethod;
  cashSessionId?: number;
  idempotencyKey: string;
  notes?: string;
}

export interface CreateVenuePaymentFeeRulePayload {
  locationId?: number;
  method: VenuePaymentMethod;
  percentageBps?: number;
  fixedFeeCents?: number;
  settlementDays?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateVenuePaymentFeeRulePayload {
  percentageBps?: number;
  fixedFeeCents?: number;
  settlementDays?: number;
  validUntil?: string;
  active?: boolean;
}

export interface VenueCashSessionReportQueryParams {
  startDate?: string;
  endDate?: string;
  cashRegisterId?: number;
  operatorUserId?: number;
  onlyDivergent?: boolean;
  status?: string;
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue/finance`;

export const venueFinanceApi = {
  // ---- Resumo ----
  getOverview: (orgId: number, locationId: number, params: VenueFinancePeriodParams = {}) =>
    api.get<VenueFinanceOverview>(`${base(orgId)}/locations/${locationId}/overview`, { params }).then((r) => r.data),
  getTimeline: (orgId: number, locationId: number, params: VenueFinancePeriodParams = {}) =>
    api.get<VenueFinanceTimelinePoint[]>(`${base(orgId)}/locations/${locationId}/timeline`, { params }).then((r) => r.data),
  getPaymentMethods: (orgId: number, locationId: number, params: VenueFinancePeriodParams = {}) =>
    api.get<VenueFinancePaymentMethodBucket[]>(`${base(orgId)}/locations/${locationId}/payment-methods`, { params }).then((r) => r.data),
  getExpensesByCategory: (orgId: number, locationId: number, params: VenueFinancePeriodParams = {}) =>
    api.get<VenueFinanceExpenseByCategory[]>(`${base(orgId)}/locations/${locationId}/expenses-by-category`, { params }).then((r) => r.data),
  compareLocations: (orgId: number, params: VenueFinancePeriodParams = {}) =>
    api.get<VenueFinanceLocationComparison[]>(`${base(orgId)}/compare-locations`, { params }).then((r) => r.data),

  // ---- Vendas ----
  listSales: (
    orgId: number,
    locationId: number,
    params: VenueFinancePeriodParams & { method?: VenuePaymentMethod; status?: VenuePaymentStatus; search?: string; page?: number; limit?: number } = {},
  ) => api.get<Paginated<VenueSale>>(`${base(orgId)}/locations/${locationId}/sales`, { params }).then((r) => r.data),
  getSaleDetail: (orgId: number, paymentId: number) => api.get<VenueSaleDetail>(`${base(orgId)}/sales/${paymentId}`).then((r) => r.data),
  getReceivablesAgenda: (orgId: number, locationId: number) =>
    api.get<VenueReceivablesAgenda>(`${base(orgId)}/locations/${locationId}/receivables`).then((r) => r.data),

  // ---- Categorias ----
  listCategories: (orgId: number, type?: VenueFinancialCategoryType, includeArchived = false) =>
    api.get<VenueFinancialCategory[]>(`${base(orgId)}/categories`, { params: { type, includeArchived } }).then((r) => r.data),
  createCategory: (orgId: number, payload: CreateVenueFinancialCategoryPayload) =>
    api.post<VenueFinancialCategory>(`${base(orgId)}/categories`, payload).then((r) => r.data),
  updateCategory: (orgId: number, categoryId: number, payload: UpdateVenueFinancialCategoryPayload) =>
    api.patch<VenueFinancialCategory>(`${base(orgId)}/categories/${categoryId}`, payload).then((r) => r.data),
  archiveCategory: (orgId: number, categoryId: number) =>
    api.post<VenueFinancialCategory>(`${base(orgId)}/categories/${categoryId}/archive`).then((r) => r.data),

  // ---- Contas a pagar ----
  listPayables: (orgId: number, params: VenuePayableQueryParams = {}) =>
    api.get<Paginated<VenuePayable>>(`${base(orgId)}/payables`, { params }).then((r) => r.data),
  createPayable: (orgId: number, payload: CreateVenuePayablePayload) =>
    api.post<VenuePayable>(`${base(orgId)}/payables`, payload).then((r) => r.data),
  getPayable: (orgId: number, payableId: number) => api.get<VenuePayable>(`${base(orgId)}/payables/${payableId}`).then((r) => r.data),
  updatePayable: (orgId: number, payableId: number, payload: UpdateVenuePayablePayload) =>
    api.patch<VenuePayable>(`${base(orgId)}/payables/${payableId}`, payload).then((r) => r.data),
  cancelPayable: (orgId: number, payableId: number, reason?: string) =>
    api.post<VenuePayable>(`${base(orgId)}/payables/${payableId}/cancel`, { reason }).then((r) => r.data),
  listPayablePayments: (orgId: number, payableId: number) =>
    api.get<VenuePayablePayment[]>(`${base(orgId)}/payables/${payableId}/payments`).then((r) => r.data),
  registerPayablePayment: (orgId: number, payableId: number, payload: CreateVenuePayablePaymentPayload) =>
    api.post<VenuePayablePayment>(`${base(orgId)}/payables/${payableId}/payments`, payload).then((r) => r.data),
  cancelPayablePayment: (orgId: number, paymentId: number, reason: string) =>
    api.post<VenuePayablePayment>(`${base(orgId)}/payable-payments/${paymentId}/cancel`, { reason }).then((r) => r.data),

  // ---- Outras receitas ----
  listOtherIncome: (orgId: number, params: { locationId?: number; startDate?: string; endDate?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<VenueOtherIncome>>(`${base(orgId)}/other-income`, { params }).then((r) => r.data),
  createOtherIncome: (orgId: number, payload: CreateVenueOtherIncomePayload) =>
    api.post<VenueOtherIncome>(`${base(orgId)}/other-income`, payload).then((r) => r.data),
  cancelOtherIncome: (orgId: number, incomeId: number, reason: string) =>
    api.post<VenueOtherIncome>(`${base(orgId)}/other-income/${incomeId}/cancel`, { reason }).then((r) => r.data),

  // ---- Regras de taxa ----
  listFeeRules: (orgId: number, locationId?: number) =>
    api.get<VenuePaymentFeeRule[]>(`${base(orgId)}/fee-rules`, { params: { locationId } }).then((r) => r.data),
  createFeeRule: (orgId: number, payload: CreateVenuePaymentFeeRulePayload) =>
    api.post<VenuePaymentFeeRule>(`${base(orgId)}/fee-rules`, payload).then((r) => r.data),
  updateFeeRule: (orgId: number, ruleId: number, payload: UpdateVenuePaymentFeeRulePayload) =>
    api.patch<VenuePaymentFeeRule>(`${base(orgId)}/fee-rules/${ruleId}`, payload).then((r) => r.data),
  deactivateFeeRule: (orgId: number, ruleId: number) =>
    api.post<VenuePaymentFeeRule>(`${base(orgId)}/fee-rules/${ruleId}/deactivate`).then((r) => r.data),

  // ---- Conciliação ----
  listReconciliations: (orgId: number, locationId: number, params: { startDate?: string; endDate?: string; status?: string } = {}) =>
    api.get<VenuePaymentReconciliation[]>(`${base(orgId)}/locations/${locationId}/reconciliations`, { params }).then((r) => r.data),
  setReconciliation: (orgId: number, locationId: number, date: string, method: VenuePaymentMethod, actualNetCents: number, notes?: string) =>
    api
      .put<VenuePaymentReconciliation>(`${base(orgId)}/locations/${locationId}/reconciliations/${date}/${method}`, { actualNetCents, notes })
      .then((r) => r.data),

  // ---- Caixa ----
  listCashSessions: (orgId: number, locationId: number, params: VenueCashSessionReportQueryParams = {}) =>
    api.get<unknown[]>(`${base(orgId)}/locations/${locationId}/cash-sessions`, { params }).then((r) => r.data),
  getCashSessionReport: (orgId: number, sessionId: number) =>
    api.get<VenueCashSessionReport>(`${base(orgId)}/cash-sessions/${sessionId}/report`).then((r) => r.data),

  // ---- Backfill (manutenção) ----
  runBackfill: (orgId: number) => api.post<{ processed: number; remaining: number }>(`${base(orgId)}/backfill-snapshots`).then((r) => r.data),

  // ---- Exportação CSV ----
  // Precisa ser um fetch autenticado (Blob), não um <a href> cru: o token vai
  // num header Bearer anexado pelo interceptor do axios, não num cookie de
  // sessão httpOnly — um link de navegação direta chegaria sem Authorization.
  downloadExport: async (
    orgId: number,
    kind: "sales" | "payables" | "expenses" | "cash-sessions" | "reconciliations" | "summary",
    locationId: number,
    filename: string,
    params: VenueFinancePeriodParams = {},
  ) => {
    const response = await api.get(`${base(orgId)}/exports/${kind}.csv`, {
      params: { locationId, ...params },
      responseType: "blob",
    });
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

export const VENUE_FINANCE_QUICK_PERIOD_LABEL: Record<VenueFinanceQuickPeriod, string> = {
  TODAY: "Hoje",
  YESTERDAY: "Ontem",
  LAST_7_DAYS: "Últimos 7 dias",
  THIS_MONTH: "Este mês",
  LAST_MONTH: "Mês anterior",
};

export const VENUE_PAYABLE_STATUS_LABEL: Record<VenuePayableStatus, string> = {
  PENDING: "Pendente",
  PARTIALLY_PAID: "Parcialmente paga",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELED: "Cancelada",
};

export const VENUE_FINANCIAL_PAYMENT_METHOD_LABEL: Record<VenueFinancialPaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  BANK_TRANSFER: "Transferência",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export const VENUE_PAYMENT_METHOD_LABEL: Record<VenuePaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  VOUCHER: "Voucher",
  OTHER: "Outro",
};

export const VENUE_RECONCILIATION_STATUS_LABEL: Record<VenueReconciliationStatus, string> = {
  PENDING: "Pendente",
  MATCHED: "Conciliado",
  DIVERGENT: "Divergente",
};

/** Formata centavos em "R$ 0,00". */
export function formatCentsBRL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
