import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueStockModule (nokta-api).
// Quantidades trafegam como string decimal (Prisma.Decimal serializado) —
// nunca converter para float antes de exibir/editar, só para exibição formatada.

export type VenueInventoryUnit = "UNIT" | "GRAM" | "MILLILITER";

export type VenueStockMovementType =
  | "OPENING"
  | "PURCHASE"
  | "SALE_CONSUMPTION"
  | "SALE_REVERSAL"
  | "WASTE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "COUNT_ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

export type VenuePurchaseStatus = "DRAFT" | "RECEIVED" | "CANCELED";
export type VenueStockCountStatus = "DRAFT" | "COMPLETED" | "CANCELED";
export type VenueStockTransferStatus = "DRAFT" | "SENT" | "RECEIVED" | "CANCELED";
export type VenueInventoryBalanceStatus = "OUT_OF_STOCK" | "LOW_STOCK" | "OK";

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface VenueStockSettings {
  id: number;
  organizationId: number;
  locationId: number;
  allowNegativeStock: boolean;
  lowStockAlertsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueInventoryCategory {
  id: number;
  organizationId: number;
  nome: string;
  descricao: string | null;
  displayOrder: number;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueInventoryItem {
  id: number;
  organizationId: number;
  categoryId: number | null;
  nome: string;
  descricao: string | null;
  internalCode: string | null;
  barcode: string | null;
  baseUnit: VenueInventoryUnit;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: number; nome: string } | null;
}

export interface VenueInventoryBalance {
  id: number;
  organizationId: number;
  locationId: number;
  inventoryItemId: number;
  quantityOnHand: string;
  minimumQuantity: string;
  targetQuantity: string;
  averageUnitCostCents: string;
  updatedAt: string;
  status: VenueInventoryBalanceStatus;
  estimatedValueCents: string;
  location?: { id: number; nome: string };
}

export interface VenueStockMovement {
  id: number;
  organizationId: number;
  locationId: number;
  inventoryItemId: number;
  type: VenueStockMovementType;
  quantityDelta: string;
  balanceAfter: string;
  unitCostCents: string | null;
  totalCostCents: number | null;
  reason: string | null;
  referenceType: string | null;
  referenceId: number | null;
  createdByUserId: number | null;
  createdAt: string;
  inventoryItem?: { id: number; nome: string; baseUnit: VenueInventoryUnit };
  location?: { id: number; nome: string };
}

export interface VenueSupplier {
  id: number;
  organizationId: number;
  nome: string;
  document: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueSupplierDetail extends VenueSupplier {
  lastPurchase: { id: number; publicCode: string; receivedAt: string | null; totalCostCents: number } | null;
  purchaseCount: number;
}

export interface VenuePurchaseItem {
  id: number;
  purchaseId: number;
  inventoryItemId: number;
  packageQuantity: string | null;
  packageSizeBase: string | null;
  quantityBase: string;
  totalCostCents: number;
  unitCostCents: string;
  createdAt: string;
  updatedAt: string;
  inventoryItem: { id: number; nome: string; baseUnit: VenueInventoryUnit };
}

export interface VenuePurchase {
  id: number;
  organizationId: number;
  locationId: number;
  supplierId: number | null;
  publicCode: string;
  status: VenuePurchaseStatus;
  documentNumber: string | null;
  purchasedAt: string;
  receivedAt: string | null;
  totalCostCents: number;
  notes: string | null;
  createdByUserId: number;
  receivedByUserId: number | null;
  canceledByUserId: number | null;
  cancelReason: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: { id: number; nome: string } | null;
  items: VenuePurchaseItem[];
}

export interface VenueVariantInventoryComponent {
  id: number;
  organizationId: number;
  variantId: number;
  inventoryItemId: number;
  quantityPerSale: string;
  createdAt: string;
  updatedAt: string;
  inventoryItem: { id: number; nome: string; baseUnit: VenueInventoryUnit };
}

export interface VenueModifierInventoryComponent {
  id: number;
  organizationId: number;
  modifierOptionId: number;
  inventoryItemId: number;
  quantityPerSelection: string;
  createdAt: string;
  updatedAt: string;
  inventoryItem: { id: number; nome: string; baseUnit: VenueInventoryUnit };
}

export interface VenueStockCountItem {
  id: number;
  stockCountId: number;
  inventoryItemId: number;
  expectedQuantity: string;
  countedQuantity: string | null;
  differenceQuantity: string | null;
  createdAt: string;
  updatedAt: string;
  inventoryItem: { id: number; nome: string; baseUnit: VenueInventoryUnit };
}

export interface VenueStockCount {
  id: number;
  organizationId: number;
  locationId: number;
  publicCode: string;
  status: VenueStockCountStatus;
  notes: string | null;
  startedByUserId: number;
  completedByUserId: number | null;
  startedAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: VenueStockCountItem[];
}

export interface VenueStockTransferItem {
  id: number;
  transferId: number;
  inventoryItemId: number;
  quantity: string;
  unitCostCents: string;
  createdAt: string;
  updatedAt: string;
  inventoryItem: { id: number; nome: string; baseUnit: VenueInventoryUnit };
}

export interface VenueStockTransfer {
  id: number;
  organizationId: number;
  publicCode: string;
  fromLocationId: number;
  toLocationId: number;
  status: VenueStockTransferStatus;
  notes: string | null;
  createdByUserId: number;
  sentByUserId: number | null;
  receivedByUserId: number | null;
  sentAt: string | null;
  receivedAt: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  fromLocation: { id: number; nome: string };
  toLocation: { id: number; nome: string };
  items: VenueStockTransferItem[];
}

export interface VenueStockAlert {
  inventoryItemId: number;
  nome: string;
  baseUnit: VenueInventoryUnit;
  status: VenueInventoryBalanceStatus;
  quantityOnHand: string;
  minimumQuantity: string;
  targetQuantity: string;
  averageUnitCostCents: string;
  replenishmentSuggestion: string;
  estimatedReplenishmentCostCents: number;
  latestSupplier: { id: number; nome: string } | null;
}

export interface VenueStockSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  estimatedValueCents: number;
}

// ==================== PAYLOADS ====================

export interface UpdateVenueStockSettingsPayload {
  allowNegativeStock?: boolean;
  lowStockAlertsEnabled?: boolean;
}

export interface CreateVenueInventoryCategoryPayload {
  nome: string;
  descricao?: string;
  displayOrder?: number;
}
export type UpdateVenueInventoryCategoryPayload = Partial<CreateVenueInventoryCategoryPayload>;

export interface CreateVenueInventoryItemPayload {
  nome: string;
  categoryId?: number;
  descricao?: string;
  internalCode?: string;
  barcode?: string;
  baseUnit: VenueInventoryUnit;
  openingLocationId?: number;
  openingQuantity?: string;
  openingTotalCostCents?: number;
}
export type UpdateVenueInventoryItemPayload = Partial<
  Omit<CreateVenueInventoryItemPayload, "openingLocationId" | "openingQuantity" | "openingTotalCostCents">
>;

export interface SetInventoryItemThresholdsPayload {
  minimumQuantity: string;
  targetQuantity: string;
}

export interface VenueInventoryItemQueryParams {
  search?: string;
  categoryId?: number;
  status?: "ACTIVE" | "ARCHIVED";
  page?: number;
  limit?: number;
}

export interface CreateVenueSupplierPayload {
  nome: string;
  document?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
export type UpdateVenueSupplierPayload = Partial<CreateVenueSupplierPayload>;

export interface CreateVenuePurchaseItemPayload {
  inventoryItemId: number;
  packageQuantity?: string;
  packageSizeBase?: string;
  quantityBase?: string;
  totalCostCents: number;
}

export interface CreateVenuePurchasePayload {
  supplierId?: number;
  documentNumber?: string;
  purchasedAt?: string;
  notes?: string;
  items: CreateVenuePurchaseItemPayload[];
}
export type UpdateVenuePurchasePayload = Partial<CreateVenuePurchasePayload>;

export interface VenuePurchaseQueryParams {
  status?: VenuePurchaseStatus;
  page?: number;
  limit?: number;
}

export interface SetVariantComponentPayload {
  inventoryItemId: number;
  quantityPerSale: string;
}
export interface SetModifierComponentPayload {
  inventoryItemId: number;
  quantityPerSelection: string;
}

export interface CreateManualStockMovementPayload {
  quantity: string;
  reason: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface VenueStockMovementQueryParams {
  inventoryItemId?: number;
  type?: VenueStockMovementType;
  createdByUserId?: number;
  referenceType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateVenueStockCountPayload {
  categoryId?: number;
  notes?: string;
}

export interface UpdateVenueStockCountItemsPayload {
  items: { inventoryItemId: number; countedQuantity?: string }[];
}

export interface CreateVenueStockTransferPayload {
  fromLocationId: number;
  toLocationId: number;
  notes?: string;
  items: { inventoryItemId: number; quantity: string }[];
}
export type UpdateVenueStockTransferPayload = Partial<Omit<CreateVenueStockTransferPayload, "fromLocationId" | "toLocationId">>;

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue/stock`;

export const venueStockApi = {
  // ---- Configurações por unidade ----
  getSettings: (orgId: number, locationId: number) =>
    api.get<VenueStockSettings>(`${base(orgId)}/locations/${locationId}/settings`).then((r) => r.data),
  updateSettings: (orgId: number, locationId: number, payload: UpdateVenueStockSettingsPayload) =>
    api.patch<VenueStockSettings>(`${base(orgId)}/locations/${locationId}/settings`, payload).then((r) => r.data),

  // ---- Categorias ----
  listCategories: (orgId: number, includeArchived = false) =>
    api
      .get<VenueInventoryCategory[]>(`${base(orgId)}/categories`, { params: { includeArchived } })
      .then((r) => r.data),
  createCategory: (orgId: number, payload: CreateVenueInventoryCategoryPayload) =>
    api.post<VenueInventoryCategory>(`${base(orgId)}/categories`, payload).then((r) => r.data),
  reorderCategories: (orgId: number, items: { id: number; displayOrder: number }[]) =>
    api.patch(`${base(orgId)}/categories/reorder`, { items }).then((r) => r.data),
  updateCategory: (orgId: number, categoryId: number, payload: UpdateVenueInventoryCategoryPayload) =>
    api.patch<VenueInventoryCategory>(`${base(orgId)}/categories/${categoryId}`, payload).then((r) => r.data),
  archiveCategory: (orgId: number, categoryId: number) =>
    api.post<VenueInventoryCategory>(`${base(orgId)}/categories/${categoryId}/archive`).then((r) => r.data),

  // ---- Itens ----
  listItems: (orgId: number, params: VenueInventoryItemQueryParams = {}) =>
    api.get<Paginated<VenueInventoryItem>>(`${base(orgId)}/items`, { params }).then((r) => r.data),
  createItem: (orgId: number, payload: CreateVenueInventoryItemPayload) =>
    api.post<VenueInventoryItem>(`${base(orgId)}/items`, payload).then((r) => r.data),
  getItem: (orgId: number, itemId: number) =>
    api.get<VenueInventoryItem>(`${base(orgId)}/items/${itemId}`).then((r) => r.data),
  updateItem: (orgId: number, itemId: number, payload: UpdateVenueInventoryItemPayload) =>
    api.patch<VenueInventoryItem>(`${base(orgId)}/items/${itemId}`, payload).then((r) => r.data),
  archiveItem: (orgId: number, itemId: number) =>
    api.post<VenueInventoryItem>(`${base(orgId)}/items/${itemId}/archive`).then((r) => r.data),
  getItemBalances: (orgId: number, itemId: number) =>
    api.get<VenueInventoryBalance[]>(`${base(orgId)}/items/${itemId}/balances`).then((r) => r.data),
  getItemMovements: (orgId: number, itemId: number) =>
    api.get<VenueStockMovement[]>(`${base(orgId)}/items/${itemId}/movements`).then((r) => r.data),
  setItemThresholds: (orgId: number, locationId: number, itemId: number, payload: SetInventoryItemThresholdsPayload) =>
    api
      .patch<VenueInventoryBalance>(`${base(orgId)}/locations/${locationId}/items/${itemId}/thresholds`, payload)
      .then((r) => r.data),

  // ---- Fornecedores ----
  listSuppliers: (orgId: number, includeArchived = false) =>
    api.get<VenueSupplier[]>(`${base(orgId)}/suppliers`, { params: { includeArchived } }).then((r) => r.data),
  createSupplier: (orgId: number, payload: CreateVenueSupplierPayload) =>
    api.post<VenueSupplier>(`${base(orgId)}/suppliers`, payload).then((r) => r.data),
  getSupplier: (orgId: number, supplierId: number) =>
    api.get<VenueSupplierDetail>(`${base(orgId)}/suppliers/${supplierId}`).then((r) => r.data),
  updateSupplier: (orgId: number, supplierId: number, payload: UpdateVenueSupplierPayload) =>
    api.patch<VenueSupplier>(`${base(orgId)}/suppliers/${supplierId}`, payload).then((r) => r.data),
  archiveSupplier: (orgId: number, supplierId: number) =>
    api.post<VenueSupplier>(`${base(orgId)}/suppliers/${supplierId}/archive`).then((r) => r.data),

  // ---- Compras ----
  listPurchases: (orgId: number, locationId: number, params: VenuePurchaseQueryParams = {}) =>
    api
      .get<Paginated<VenuePurchase>>(`${base(orgId)}/locations/${locationId}/purchases`, { params })
      .then((r) => r.data),
  createPurchase: (orgId: number, locationId: number, payload: CreateVenuePurchasePayload) =>
    api.post<VenuePurchase>(`${base(orgId)}/locations/${locationId}/purchases`, payload).then((r) => r.data),
  getPurchase: (orgId: number, purchaseId: number) =>
    api.get<VenuePurchase>(`${base(orgId)}/purchases/${purchaseId}`).then((r) => r.data),
  updatePurchase: (orgId: number, purchaseId: number, payload: UpdateVenuePurchasePayload) =>
    api.patch<VenuePurchase>(`${base(orgId)}/purchases/${purchaseId}`, payload).then((r) => r.data),
  cancelPurchase: (orgId: number, purchaseId: number, reason?: string) =>
    api.post<VenuePurchase>(`${base(orgId)}/purchases/${purchaseId}/cancel`, { reason }).then((r) => r.data),
  receivePurchase: (orgId: number, purchaseId: number) =>
    api.post<VenuePurchase>(`${base(orgId)}/purchases/${purchaseId}/receive`).then((r) => r.data),

  // ---- Ficha técnica: variação e adicional ----
  getVariantComponents: (orgId: number, variantId: number) =>
    api
      .get<{ components: VenueVariantInventoryComponent[] }>(`${base(orgId)}/variants/${variantId}/inventory-components`)
      .then((r) => r.data),
  setVariantComponents: (orgId: number, variantId: number, components: SetVariantComponentPayload[]) =>
    api
      .put<VenueVariantInventoryComponent[]>(`${base(orgId)}/variants/${variantId}/inventory-components`, {
        components,
      })
      .then((r) => r.data),
  getModifierComponents: (orgId: number, modifierOptionId: number) =>
    api
      .get<{ components: VenueModifierInventoryComponent[] }>(
        `${base(orgId)}/modifier-options/${modifierOptionId}/inventory-components`,
      )
      .then((r) => r.data),
  setModifierComponents: (orgId: number, modifierOptionId: number, components: SetModifierComponentPayload[]) =>
    api
      .put<VenueModifierInventoryComponent[]>(
        `${base(orgId)}/modifier-options/${modifierOptionId}/inventory-components`,
        { components },
      )
      .then((r) => r.data),

  // ---- Movimentações e lançamentos manuais ----
  listMovements: (orgId: number, locationId: number, params: VenueStockMovementQueryParams = {}) =>
    api
      .get<Paginated<VenueStockMovement>>(`${base(orgId)}/locations/${locationId}/movements`, { params })
      .then((r) => r.data),
  registerWaste: (orgId: number, locationId: number, itemId: number, payload: CreateManualStockMovementPayload) =>
    api
      .post<VenueStockMovement>(`${base(orgId)}/locations/${locationId}/items/${itemId}/waste`, payload)
      .then((r) => r.data),
  registerAdjustmentIn: (orgId: number, locationId: number, itemId: number, payload: CreateManualStockMovementPayload) =>
    api
      .post<VenueStockMovement>(`${base(orgId)}/locations/${locationId}/items/${itemId}/adjustment-in`, payload)
      .then((r) => r.data),
  registerAdjustmentOut: (orgId: number, locationId: number, itemId: number, payload: CreateManualStockMovementPayload) =>
    api
      .post<VenueStockMovement>(`${base(orgId)}/locations/${locationId}/items/${itemId}/adjustment-out`, payload)
      .then((r) => r.data),

  // ---- Inventário / contagem ----
  listCounts: (orgId: number, locationId: number, status?: VenueStockCountStatus) =>
    api
      .get<VenueStockCount[]>(`${base(orgId)}/locations/${locationId}/counts`, { params: { status } })
      .then((r) => r.data),
  createCount: (orgId: number, locationId: number, payload: CreateVenueStockCountPayload) =>
    api.post<VenueStockCount>(`${base(orgId)}/locations/${locationId}/counts`, payload).then((r) => r.data),
  getCount: (orgId: number, countId: number) =>
    api.get<VenueStockCount>(`${base(orgId)}/counts/${countId}`).then((r) => r.data),
  updateCountItems: (orgId: number, countId: number, payload: UpdateVenueStockCountItemsPayload) =>
    api.patch<VenueStockCount>(`${base(orgId)}/counts/${countId}/items`, payload).then((r) => r.data),
  cancelCount: (orgId: number, countId: number) =>
    api.post<VenueStockCount>(`${base(orgId)}/counts/${countId}/cancel`).then((r) => r.data),
  completeCount: (orgId: number, countId: number) =>
    api.post<VenueStockCount>(`${base(orgId)}/counts/${countId}/complete`).then((r) => r.data),

  // ---- Transferências ----
  listTransfers: (orgId: number, status?: VenueStockTransferStatus) =>
    api.get<VenueStockTransfer[]>(`${base(orgId)}/transfers`, { params: { status } }).then((r) => r.data),
  createTransfer: (orgId: number, payload: CreateVenueStockTransferPayload) =>
    api.post<VenueStockTransfer>(`${base(orgId)}/transfers`, payload).then((r) => r.data),
  getTransfer: (orgId: number, transferId: number) =>
    api.get<VenueStockTransfer>(`${base(orgId)}/transfers/${transferId}`).then((r) => r.data),
  updateTransfer: (orgId: number, transferId: number, payload: UpdateVenueStockTransferPayload) =>
    api.patch<VenueStockTransfer>(`${base(orgId)}/transfers/${transferId}`, payload).then((r) => r.data),
  cancelTransfer: (orgId: number, transferId: number) =>
    api.post<VenueStockTransfer>(`${base(orgId)}/transfers/${transferId}/cancel`).then((r) => r.data),
  sendTransfer: (orgId: number, transferId: number) =>
    api.post<VenueStockTransfer>(`${base(orgId)}/transfers/${transferId}/send`).then((r) => r.data),
  receiveTransfer: (orgId: number, transferId: number) =>
    api.post<VenueStockTransfer>(`${base(orgId)}/transfers/${transferId}/receive`).then((r) => r.data),

  // ---- Alertas e resumo ----
  getSummary: (orgId: number, locationId: number) =>
    api.get<VenueStockSummary>(`${base(orgId)}/locations/${locationId}/summary`).then((r) => r.data),
  getAlerts: (orgId: number, locationId: number) =>
    api.get<VenueStockAlert[]>(`${base(orgId)}/locations/${locationId}/alerts`).then((r) => r.data),
};

// ==================== HELPERS ====================

export const VENUE_INVENTORY_UNIT_LABEL: Record<VenueInventoryUnit, string> = {
  UNIT: "Unidade",
  GRAM: "Grama",
  MILLILITER: "Mililitro",
};

export const VENUE_STOCK_MOVEMENT_TYPE_LABEL: Record<VenueStockMovementType, string> = {
  OPENING: "Saldo inicial",
  PURCHASE: "Compra",
  SALE_CONSUMPTION: "Consumo de venda",
  SALE_REVERSAL: "Reversão",
  WASTE: "Perda",
  ADJUSTMENT_IN: "Ajuste de entrada",
  ADJUSTMENT_OUT: "Ajuste de saída",
  COUNT_ADJUSTMENT: "Inventário",
  TRANSFER_IN: "Transferência recebida",
  TRANSFER_OUT: "Transferência enviada",
};

export const VENUE_PURCHASE_STATUS_LABEL: Record<VenuePurchaseStatus, string> = {
  DRAFT: "Rascunho",
  RECEIVED: "Recebida",
  CANCELED: "Cancelada",
};

export const VENUE_STOCK_COUNT_STATUS_LABEL: Record<VenueStockCountStatus, string> = {
  DRAFT: "Em andamento",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};

export const VENUE_STOCK_TRANSFER_STATUS_LABEL: Record<VenueStockTransferStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviada",
  RECEIVED: "Recebida",
  CANCELED: "Cancelada",
};

export const VENUE_BALANCE_STATUS_LABEL: Record<VenueInventoryBalanceStatus, string> = {
  OUT_OF_STOCK: "Sem estoque",
  LOW_STOCK: "Estoque baixo",
  OK: "OK",
};

/** Formata uma quantidade decimal (string) na unidade-base para exibição em pt-BR. */
export function formatStockQuantity(value: string | number, unit: VenueInventoryUnit): string {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  const suffix = unit === "UNIT" ? "un" : unit === "GRAM" ? "g" : "ml";
  return `${formatted} ${suffix}`;
}

/** Converte centavos (número ou string) em texto "R$ 0,00". */
export function formatCents(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
