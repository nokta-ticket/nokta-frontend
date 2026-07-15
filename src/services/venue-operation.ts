import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueOperationModule (nokta-api).

export type VenueTabType = "TABLE" | "INDIVIDUAL" | "COUNTER";
export type VenueTabStatus = "OPEN" | "CLOSED" | "CANCELED";
export type VenueOrderStatus = "DRAFT" | "SENT" | "IN_PREPARATION" | "READY" | "DELIVERED" | "CANCELED";
export type VenueOrderItemStatus = VenueOrderStatus;
export type OrderItemSettableStatus = "IN_PREPARATION" | "READY" | "DELIVERED";
export type VenueCashSessionStatus = "OPEN" | "CLOSED";
export type VenueCashMovementType = "SUPPLY" | "WITHDRAWAL" | "EXPENSE" | "ADJUSTMENT";
export type VenuePaymentMethod = "CASH" | "PIX" | "DEBIT_CARD" | "CREDIT_CARD" | "VOUCHER" | "OTHER";
export type VenuePaymentStatus = "CONFIRMED" | "CANCELED";

export interface VenueLocation {
  id: number;
  organizationId: number;
  nome: string;
  slug: string;
  descricao: string | null;
  endereco: string | null;
  telefone: string | null;
  active: boolean;
  isMain: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueArea {
  id: number;
  locationId: number;
  nome: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueTableOpenTabInfo {
  id: number;
  publicCode: string;
  type: VenueTabType;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  openedAt: string;
  customerName: string | null;
}

export interface VenueTable {
  id: number;
  locationId: number;
  areaId: number;
  nome: string;
  capacidade: number | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  openTab: VenueTableOpenTabInfo | null;
}

export interface VenueCashRegisterOpenSessionInfo {
  id: number;
  openedAt: string;
  openedByUserId: number;
  expectedCashCents: number;
}

export interface VenueCashRegister {
  id: number;
  locationId: number;
  nome: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  openSession: VenueCashRegisterOpenSessionInfo | null;
}

export interface VenueCashMovement {
  id: number;
  organizationId: number;
  locationId: number;
  cashSessionId: number;
  type: VenueCashMovementType;
  amountCents: number;
  reason: string;
  createdByUserId: number;
  createdAt: string;
}

export interface VenueCashSession {
  id: number;
  organizationId: number;
  locationId: number;
  cashRegisterId: number;
  openedByUserId: number;
  closedByUserId: number | null;
  openingAmountCents: number;
  expectedCashCents: number;
  countedCashCents: number | null;
  differenceCents: number | null;
  status: VenueCashSessionStatus;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueCashSessionDetail extends VenueCashSession {
  movements: VenueCashMovement[];
  paymentsByMethod: Record<string, number>;
}

export interface VenueOrderItemModifier {
  id: number;
  orderItemId: number;
  modifierGroupId: number;
  modifierOptionId: number;
  groupNameSnapshot: string;
  optionNameSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface VenueOrderItem {
  id: number;
  organizationId: number;
  orderId: number;
  menuItemId: number | null;
  productId: number;
  variantId: number;
  preparationStationId: number | null;
  quantity: number;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitPriceCents: number;
  modifiersTotalCents: number;
  lineSubtotalCents: number;
  discountCents: number;
  lineTotalCents: number;
  status: VenueOrderItemStatus;
  notes: string | null;
  cancellationReason: string | null;
  canceledByUserId: number | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  modifiers: VenueOrderItemModifier[];
}

export interface VenueOrder {
  id: number;
  organizationId: number;
  locationId: number;
  tabId: number;
  publicCode: string;
  clientRequestId: string | null;
  status: VenueOrderStatus;
  createdByUserId: number;
  sentAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: VenueOrderItem[];
}

export interface VenueTab {
  id: number;
  organizationId: number;
  locationId: number;
  tableId: number | null;
  publicCode: string;
  type: VenueTabType;
  status: VenueTabStatus;
  customerName: string | null;
  customerPhone: string | null;
  guestCount: number | null;
  openedByUserId: number;
  closedByUserId: number | null;
  canceledByUserId: number | null;
  openedAt: string;
  closedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  discountCents: number;
  discountReason: string | null;
  serviceChargeRateBps: number;
  serviceChargeCents: number;
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
  version: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueTabListItem extends VenueTab {
  table: { id: number; nome: string } | null;
  _count: { orders: number };
}

export interface VenuePayment {
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
  idempotencyKey: string;
  notes: string | null;
  createdByUserId: number;
  canceledByUserId: number | null;
  cancelReason: string | null;
  confirmedAt: string;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueTabDetail extends VenueTab {
  table: { id: number; nome: string; areaId: number } | null;
  orders: VenueOrder[];
  payments: VenuePayment[];
}

export interface VenuePreparationItem extends VenueOrderItem {
  order: {
    id: number;
    publicCode: string;
    tab: { id: number; publicCode: string; table: { nome: string } | null };
  };
  preparationStation: { id: number; nome: string } | null;
}

// ==================== PAYLOADS ====================

export interface CreateVenueLocationPayload {
  nome: string;
  descricao?: string;
  endereco?: string;
  telefone?: string;
  slug?: string;
  isMain?: boolean;
}
export type UpdateVenueLocationPayload = Partial<CreateVenueLocationPayload>;

export interface CreateVenueAreaPayload {
  nome: string;
  displayOrder?: number;
  active?: boolean;
}
export type UpdateVenueAreaPayload = Partial<CreateVenueAreaPayload>;

export interface CreateVenueTablePayload {
  areaId: number;
  nome: string;
  capacidade?: number;
  displayOrder?: number;
  active?: boolean;
}
export interface UpdateVenueTablePayload {
  areaId?: number;
  nome?: string;
  capacidade?: number;
  displayOrder?: number;
  active?: boolean;
}

export interface CreateVenueCashRegisterPayload {
  nome: string;
  active?: boolean;
}
export type UpdateVenueCashRegisterPayload = Partial<CreateVenueCashRegisterPayload>;

export interface OpenCashSessionPayload {
  openingAmountCents: number;
  notes?: string;
}
export interface CloseCashSessionPayload {
  countedCashCents: number;
  notes?: string;
}
export interface CreateCashMovementPayload {
  type: VenueCashMovementType;
  amountCents: number;
  reason: string;
}

export interface CreateVenueTabPayload {
  type: VenueTabType;
  tableId?: number;
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
}
export interface UpdateVenueTabPayload {
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  notes?: string;
}
export interface SetTabDiscountPayload {
  discountCents: number;
  reason?: string;
}
export interface SetTabServiceChargePayload {
  rateBps: number;
}
export interface CancelTabPayload {
  reason: string;
}
export interface TransferTabTablePayload {
  tableId: number;
}

export interface CreateOrderItemModifierPayload {
  modifierGroupId: number;
  modifierOptionId: number;
  quantity?: number;
}
export interface CreateOrderItemPayload {
  menuItemId: number;
  variantId: number;
  quantity: number;
  notes?: string;
  modifiers?: CreateOrderItemModifierPayload[];
}
export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  clientRequestId?: string;
  notes?: string;
}
export interface UpdateOrderPayload {
  items: CreateOrderItemPayload[];
  notes?: string;
}
export interface CancelOrderItemPayload {
  reason: string;
}
export interface SetOrderItemStatusPayload {
  status: OrderItemSettableStatus;
}

export interface CreatePaymentPayload {
  method: VenuePaymentMethod;
  amountCents: number;
  receivedCents?: number;
  idempotencyKey: string;
  externalReference?: string;
  notes?: string;
}
export interface CancelPaymentPayload {
  reason: string;
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue/operation`;

export const venueOperationApi = {
  // ---- Unidades ----
  listLocations: (orgId: number) =>
    api.get<VenueLocation[]>(`${base(orgId)}/locations`).then((r) => r.data),
  createLocation: (orgId: number, payload: CreateVenueLocationPayload) =>
    api.post<VenueLocation>(`${base(orgId)}/locations`, payload).then((r) => r.data),
  updateLocation: (orgId: number, locationId: number, payload: UpdateVenueLocationPayload) =>
    api.patch<VenueLocation>(`${base(orgId)}/locations/${locationId}`, payload).then((r) => r.data),
  setMainLocation: (orgId: number, locationId: number) =>
    api.post<VenueLocation>(`${base(orgId)}/locations/${locationId}/set-main`).then((r) => r.data),
  archiveLocation: (orgId: number, locationId: number) =>
    api.post<VenueLocation>(`${base(orgId)}/locations/${locationId}/archive`).then((r) => r.data),

  // ---- Áreas ----
  listAreas: (orgId: number, locationId: number) =>
    api.get<VenueArea[]>(`${base(orgId)}/locations/${locationId}/areas`).then((r) => r.data),
  createArea: (orgId: number, locationId: number, payload: CreateVenueAreaPayload) =>
    api.post<VenueArea>(`${base(orgId)}/locations/${locationId}/areas`, payload).then((r) => r.data),
  updateArea: (orgId: number, areaId: number, payload: UpdateVenueAreaPayload) =>
    api.patch<VenueArea>(`${base(orgId)}/areas/${areaId}`, payload).then((r) => r.data),
  setAreaActive: (orgId: number, areaId: number, active: boolean) =>
    api.patch<VenueArea>(`${base(orgId)}/areas/${areaId}/availability`, { active }).then((r) => r.data),
  reorderAreas: (orgId: number, locationId: number, items: { id: number; displayOrder: number }[]) =>
    api
      .patch<VenueArea[]>(`${base(orgId)}/locations/${locationId}/areas/reorder`, { items })
      .then((r) => r.data),

  // ---- Mesas ----
  listTables: (orgId: number, locationId: number) =>
    api.get<VenueTable[]>(`${base(orgId)}/locations/${locationId}/tables`).then((r) => r.data),
  createTable: (orgId: number, locationId: number, payload: CreateVenueTablePayload) =>
    api.post<VenueTable>(`${base(orgId)}/locations/${locationId}/tables`, payload).then((r) => r.data),
  updateTable: (orgId: number, tableId: number, payload: UpdateVenueTablePayload) =>
    api.patch<VenueTable>(`${base(orgId)}/tables/${tableId}`, payload).then((r) => r.data),
  setTableActive: (orgId: number, tableId: number, active: boolean) =>
    api.patch<VenueTable>(`${base(orgId)}/tables/${tableId}/availability`, { active }).then((r) => r.data),
  reorderTables: (orgId: number, locationId: number, items: { id: number; displayOrder: number }[]) =>
    api
      .patch<VenueTable[]>(`${base(orgId)}/locations/${locationId}/tables/reorder`, { items })
      .then((r) => r.data),

  // ---- Caixas ----
  listCashRegisters: (orgId: number, locationId: number) =>
    api.get<VenueCashRegister[]>(`${base(orgId)}/locations/${locationId}/cash-registers`).then((r) => r.data),
  createCashRegister: (orgId: number, locationId: number, payload: CreateVenueCashRegisterPayload) =>
    api
      .post<VenueCashRegister>(`${base(orgId)}/locations/${locationId}/cash-registers`, payload)
      .then((r) => r.data),
  updateCashRegister: (orgId: number, registerId: number, payload: UpdateVenueCashRegisterPayload) =>
    api.patch<VenueCashRegister>(`${base(orgId)}/cash-registers/${registerId}`, payload).then((r) => r.data),

  // ---- Sessões de caixa ----
  listCashSessions: (orgId: number, locationId: number) =>
    api.get<VenueCashSession[]>(`${base(orgId)}/locations/${locationId}/cash-sessions`).then((r) => r.data),
  openCashSession: (orgId: number, registerId: number, payload: OpenCashSessionPayload) =>
    api.post<VenueCashSession>(`${base(orgId)}/cash-registers/${registerId}/open`, payload).then((r) => r.data),
  getCashSession: (orgId: number, sessionId: number) =>
    api.get<VenueCashSessionDetail>(`${base(orgId)}/cash-sessions/${sessionId}`).then((r) => r.data),
  addCashMovement: (orgId: number, sessionId: number, payload: CreateCashMovementPayload) =>
    api
      .post<VenueCashMovement>(`${base(orgId)}/cash-sessions/${sessionId}/movements`, payload)
      .then((r) => r.data),
  closeCashSession: (orgId: number, sessionId: number, payload: CloseCashSessionPayload) =>
    api.post<VenueCashSession>(`${base(orgId)}/cash-sessions/${sessionId}/close`, payload).then((r) => r.data),

  // ---- Comandas ----
  listTabs: (
    orgId: number,
    locationId: number,
    filters: { status?: string; type?: string; search?: string } = {},
  ) =>
    api
      .get<VenueTabListItem[]>(`${base(orgId)}/locations/${locationId}/tabs`, { params: filters })
      .then((r) => r.data),
  createTab: (orgId: number, locationId: number, payload: CreateVenueTabPayload) =>
    api.post<VenueTab>(`${base(orgId)}/locations/${locationId}/tabs`, payload).then((r) => r.data),
  getTab: (orgId: number, tabId: number) =>
    api.get<VenueTabDetail>(`${base(orgId)}/tabs/${tabId}`).then((r) => r.data),
  updateTab: (orgId: number, tabId: number, payload: UpdateVenueTabPayload) =>
    api.patch<VenueTab>(`${base(orgId)}/tabs/${tabId}`, payload).then((r) => r.data),
  transferTabTable: (orgId: number, tabId: number, payload: TransferTabTablePayload) =>
    api.post<VenueTab>(`${base(orgId)}/tabs/${tabId}/transfer-table`, payload).then((r) => r.data),
  setTabDiscount: (orgId: number, tabId: number, payload: SetTabDiscountPayload) =>
    api.post<VenueTab>(`${base(orgId)}/tabs/${tabId}/discount`, payload).then((r) => r.data),
  setTabServiceCharge: (orgId: number, tabId: number, payload: SetTabServiceChargePayload) =>
    api.post<VenueTab>(`${base(orgId)}/tabs/${tabId}/service-charge`, payload).then((r) => r.data),
  cancelTab: (orgId: number, tabId: number, payload: CancelTabPayload) =>
    api.post<VenueTab>(`${base(orgId)}/tabs/${tabId}/cancel`, payload).then((r) => r.data),
  closeTab: (orgId: number, tabId: number) =>
    api.post<VenueTab>(`${base(orgId)}/tabs/${tabId}/close`).then((r) => r.data),

  // ---- Pedidos ----
  listOrders: (orgId: number, tabId: number) =>
    api.get<VenueOrder[]>(`${base(orgId)}/tabs/${tabId}/orders`).then((r) => r.data),
  createOrder: (orgId: number, tabId: number, payload: CreateOrderPayload) =>
    api.post<VenueOrder>(`${base(orgId)}/tabs/${tabId}/orders`, payload).then((r) => r.data),
  getOrder: (orgId: number, orderId: number) =>
    api.get<VenueOrder>(`${base(orgId)}/orders/${orderId}`).then((r) => r.data),
  updateOrder: (orgId: number, orderId: number, payload: UpdateOrderPayload) =>
    api.patch<VenueOrder>(`${base(orgId)}/orders/${orderId}`, payload).then((r) => r.data),
  sendOrder: (orgId: number, orderId: number) =>
    api.post<VenueOrder>(`${base(orgId)}/orders/${orderId}/send`).then((r) => r.data),
  cancelOrderItem: (orgId: number, itemId: number, payload: CancelOrderItemPayload) =>
    api.post<VenueOrderItem>(`${base(orgId)}/order-items/${itemId}/cancel`, payload).then((r) => r.data),
  setOrderItemStatus: (orgId: number, itemId: number, payload: SetOrderItemStatusPayload) =>
    api.patch<VenueOrderItem>(`${base(orgId)}/order-items/${itemId}/status`, payload).then((r) => r.data),

  // ---- Preparo ----
  listPreparationItems: (
    orgId: number,
    locationId: number,
    filters: { preparationStationId?: number; status?: string } = {},
  ) =>
    api
      .get<VenuePreparationItem[]>(`${base(orgId)}/locations/${locationId}/preparation-items`, {
        params: filters,
      })
      .then((r) => r.data),
  setPreparationStatus: (orgId: number, itemId: number, payload: SetOrderItemStatusPayload) =>
    api
      .patch<VenueOrderItem>(`${base(orgId)}/order-items/${itemId}/preparation-status`, payload)
      .then((r) => r.data),

  // ---- Pagamentos ----
  listPayments: (orgId: number, tabId: number) =>
    api.get<VenuePayment[]>(`${base(orgId)}/tabs/${tabId}/payments`).then((r) => r.data),
  createPayment: (orgId: number, tabId: number, payload: CreatePaymentPayload) =>
    api.post<VenuePayment>(`${base(orgId)}/tabs/${tabId}/payments`, payload).then((r) => r.data),
  cancelPayment: (orgId: number, paymentId: number, payload: CancelPaymentPayload) =>
    api.post<VenuePayment>(`${base(orgId)}/payments/${paymentId}/cancel`, payload).then((r) => r.data),
};

// ==================== HELPERS ====================

export function newIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const VENUE_TAB_TYPE_LABEL: Record<VenueTabType, string> = {
  TABLE: "Mesa",
  INDIVIDUAL: "Individual",
  COUNTER: "Balcão",
};

export const VENUE_TAB_STATUS_LABEL: Record<VenueTabStatus, string> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  CANCELED: "Cancelada",
};

export const VENUE_ORDER_STATUS_LABEL: Record<VenueOrderStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Novo",
  IN_PREPARATION: "Em preparo",
  READY: "Pronto",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

export const VENUE_PAYMENT_METHOD_LABEL: Record<VenuePaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  VOUCHER: "Voucher",
  OTHER: "Outro",
};

export const VENUE_CASH_MOVEMENT_TYPE_LABEL: Record<VenueCashMovementType, string> = {
  SUPPLY: "Suprimento",
  WITHDRAWAL: "Retirada",
  EXPENSE: "Despesa",
  ADJUSTMENT: "Ajuste",
};
