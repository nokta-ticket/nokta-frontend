import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueMenuModule (nokta-api).

export type VenueMenuStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type VenueProductStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT" | "ARCHIVED";
export type VenueStockControl = "NONE" | "DIRECT" | "RECIPE";
export type VenueAvailabilityStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT";

export interface VenueMenu {
  id: number;
  organizationId: number;
  nome: string;
  descricao: string | null;
  slug: string;
  status: VenueMenuStatus;
  isMain: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueMenuDetail extends VenueMenu {
  categories: VenueMenuCategory[];
}

export interface VenueMenuCategory {
  id: number;
  menuId: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenuePreparationStation {
  id: number;
  organizationId: number;
  nome: string;
  tipo: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueProductVariant {
  id: number;
  organizationId: number;
  productId: number;
  nome: string;
  sku: string | null;
  priceCents: number;
  stockControl: VenueStockControl;
  isDefault: boolean;
  displayOrder: number;
  status: VenueProductStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueProduct {
  id: number;
  organizationId: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  prepTimeMinutes: number | null;
  status: VenueProductStatus;
  preparationStationId: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  preparationStation?: { id: number; nome: string } | null;
  variants: VenueProductVariant[];
}

export interface VenueMenuItemVariantPriceInfo {
  variantId: number;
  variantNome: string;
  basePriceCents: number;
  overridePriceCents: number | null;
  effectivePriceCents: number;
}

export interface VenueProductMenuInfo {
  menuItemId: number;
  menuId: number;
  menuNome: string;
  menuStatus: VenueMenuStatus;
  categoryId: number;
  displayOrder: number;
  active: boolean;
  prices: VenueMenuItemVariantPriceInfo[];
}

export interface VenueModifierOption {
  id: number;
  modifierGroupId: number;
  nome: string;
  priceCents: number;
  displayOrder: number;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueModifierGroup {
  id: number;
  organizationId: number;
  nome: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VenueModifierGroupDetail extends VenueModifierGroup {
  options: VenueModifierOption[];
}

export interface VenueProductModifierGroup {
  id: number;
  productId: number;
  modifierGroupId: number;
  required: boolean;
  minSelect: number;
  maxSelect: number | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  group: VenueModifierGroupDetail;
}

export interface VenueProductDetail extends VenueProduct {
  modifierGroups: VenueProductModifierGroup[];
  menus: VenueProductMenuInfo[];
}

export interface VenueMenuItem {
  id: number;
  organizationId: number;
  menuId: number;
  categoryId: number;
  productId: number;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    nome: string;
    status: VenueProductStatus;
    imageUrl: string | null;
    variants: VenueProductVariant[];
  };
  prices: VenueMenuItemVariantPriceInfo[];
}

export interface VenueMenuItemVariantPrice {
  id: number;
  menuItemId: number;
  variantId: number;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  paginate: { page: number; limit: number; total: number };
}

// ==================== PAYLOADS ====================

export interface CreateVenueMenuPayload {
  nome: string;
  descricao?: string;
  slug?: string;
  isMain?: boolean;
}
export type UpdateVenueMenuPayload = Partial<CreateVenueMenuPayload>;

export interface CreateVenueMenuCategoryPayload {
  nome: string;
  descricao?: string;
  imageUrl?: string;
  displayOrder?: number;
  active?: boolean;
}
export type UpdateVenueMenuCategoryPayload = Partial<CreateVenueMenuCategoryPayload>;

export interface CreateVenuePreparationStationPayload {
  nome: string;
  tipo?: string;
  displayOrder?: number;
  active?: boolean;
}
export type UpdateVenuePreparationStationPayload = Partial<CreateVenuePreparationStationPayload>;

export interface CreateVenueProductPayload {
  nome: string;
  descricao?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  preparationStationId?: number;
  variantName?: string;
  sku?: string;
  priceCents: number;
  stockControl?: VenueStockControl;
}

export interface UpdateVenueProductPayload {
  nome?: string;
  descricao?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  preparationStationId?: number;
}

export interface VenueProductQuery {
  status?: VenueProductStatus;
  search?: string;
  preparationStationId?: number;
  menuId?: number;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export interface CreateVenueProductVariantPayload {
  nome: string;
  sku?: string;
  priceCents: number;
  stockControl?: VenueStockControl;
  displayOrder?: number;
}
export type UpdateVenueProductVariantPayload = Partial<CreateVenueProductVariantPayload>;

export interface CreateVenueMenuItemPayload {
  categoryId: number;
  productId: number;
  displayOrder?: number;
}
export interface UpdateVenueMenuItemPayload {
  categoryId?: number;
  displayOrder?: number;
  active?: boolean;
}

export interface CreateVenueModifierGroupPayload {
  nome: string;
  displayOrder?: number;
  active?: boolean;
}
export type UpdateVenueModifierGroupPayload = Partial<CreateVenueModifierGroupPayload>;

export interface CreateVenueModifierOptionPayload {
  nome: string;
  priceCents?: number;
  displayOrder?: number;
  active?: boolean;
}
export type UpdateVenueModifierOptionPayload = Partial<CreateVenueModifierOptionPayload>;

export interface CreateVenueProductModifierGroupPayload {
  modifierGroupId: number;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  displayOrder?: number;
}
export interface UpdateVenueProductModifierGroupPayload {
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  displayOrder?: number;
}

export interface ReorderItem {
  id: number;
  displayOrder: number;
}
export interface ReorderPayload {
  items: ReorderItem[];
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue`;

export const venueMenuApi = {
  // ---- Cardápios ----
  listMenus: (organizationId: number) =>
    api.get<VenueMenu[]>(`${base(organizationId)}/menus`).then((r) => r.data),
  getMenu: (organizationId: number, menuId: number) =>
    api.get<VenueMenuDetail>(`${base(organizationId)}/menus/${menuId}`).then((r) => r.data),
  createMenu: (organizationId: number, payload: CreateVenueMenuPayload) =>
    api.post<VenueMenu>(`${base(organizationId)}/menus`, payload).then((r) => r.data),
  updateMenu: (organizationId: number, menuId: number, payload: UpdateVenueMenuPayload) =>
    api.patch<VenueMenu>(`${base(organizationId)}/menus/${menuId}`, payload).then((r) => r.data),
  setMainMenu: (organizationId: number, menuId: number) =>
    api.post<VenueMenu>(`${base(organizationId)}/menus/${menuId}/set-main`).then((r) => r.data),
  publishMenu: (organizationId: number, menuId: number) =>
    api.post<VenueMenu>(`${base(organizationId)}/menus/${menuId}/publish`).then((r) => r.data),
  archiveMenu: (organizationId: number, menuId: number) =>
    api.post<VenueMenu>(`${base(organizationId)}/menus/${menuId}/archive`).then((r) => r.data),

  // ---- Categorias ----
  listCategories: (organizationId: number, menuId: number) =>
    api
      .get<VenueMenuCategory[]>(`${base(organizationId)}/menus/${menuId}/categories`)
      .then((r) => r.data),
  createCategory: (organizationId: number, menuId: number, payload: CreateVenueMenuCategoryPayload) =>
    api
      .post<VenueMenuCategory>(`${base(organizationId)}/menus/${menuId}/categories`, payload)
      .then((r) => r.data),
  updateCategory: (organizationId: number, categoryId: number, payload: UpdateVenueMenuCategoryPayload) =>
    api
      .patch<VenueMenuCategory>(`${base(organizationId)}/categories/${categoryId}`, payload)
      .then((r) => r.data),
  setCategoryActive: (organizationId: number, categoryId: number, active: boolean) =>
    api
      .patch<VenueMenuCategory>(`${base(organizationId)}/categories/${categoryId}/availability`, { active })
      .then((r) => r.data),
  reorderCategories: (organizationId: number, menuId: number, payload: ReorderPayload) =>
    api
      .patch<VenueMenuCategory[]>(`${base(organizationId)}/menus/${menuId}/categories/reorder`, payload)
      .then((r) => r.data),

  // ---- Estações de preparo ----
  listStations: (organizationId: number) =>
    api
      .get<VenuePreparationStation[]>(`${base(organizationId)}/preparation-stations`)
      .then((r) => r.data),
  createStation: (organizationId: number, payload: CreateVenuePreparationStationPayload) =>
    api
      .post<VenuePreparationStation>(`${base(organizationId)}/preparation-stations`, payload)
      .then((r) => r.data),
  updateStation: (
    organizationId: number,
    stationId: number,
    payload: UpdateVenuePreparationStationPayload,
  ) =>
    api
      .patch<VenuePreparationStation>(`${base(organizationId)}/preparation-stations/${stationId}`, payload)
      .then((r) => r.data),
  setStationActive: (organizationId: number, stationId: number, active: boolean) =>
    api
      .patch<VenuePreparationStation>(
        `${base(organizationId)}/preparation-stations/${stationId}/availability`,
        { active },
      )
      .then((r) => r.data),
  reorderStations: (organizationId: number, payload: ReorderPayload) =>
    api
      .patch<VenuePreparationStation[]>(`${base(organizationId)}/preparation-stations/reorder`, payload)
      .then((r) => r.data),

  // ---- Produtos ----
  listProducts: (organizationId: number, query: VenueProductQuery = {}) =>
    api
      .get<Paginated<VenueProduct>>(`${base(organizationId)}/products`, { params: query })
      .then((r) => r.data),
  getProduct: (organizationId: number, productId: number) =>
    api.get<VenueProductDetail>(`${base(organizationId)}/products/${productId}`).then((r) => r.data),
  createProduct: (organizationId: number, payload: CreateVenueProductPayload) =>
    api.post<VenueProduct>(`${base(organizationId)}/products`, payload).then((r) => r.data),
  updateProduct: (organizationId: number, productId: number, payload: UpdateVenueProductPayload) =>
    api.patch<VenueProduct>(`${base(organizationId)}/products/${productId}`, payload).then((r) => r.data),
  archiveProduct: (organizationId: number, productId: number) =>
    api.post<VenueProduct>(`${base(organizationId)}/products/${productId}/archive`).then((r) => r.data),
  setProductAvailability: (
    organizationId: number,
    productId: number,
    status: VenueAvailabilityStatus,
  ) =>
    api
      .patch<VenueProduct>(`${base(organizationId)}/products/${productId}/availability`, { status })
      .then((r) => r.data),

  // ---- Variações ----
  listVariants: (organizationId: number, productId: number) =>
    api
      .get<VenueProductVariant[]>(`${base(organizationId)}/products/${productId}/variants`)
      .then((r) => r.data),
  createVariant: (organizationId: number, productId: number, payload: CreateVenueProductVariantPayload) =>
    api
      .post<VenueProductVariant>(`${base(organizationId)}/products/${productId}/variants`, payload)
      .then((r) => r.data),
  updateVariant: (organizationId: number, variantId: number, payload: UpdateVenueProductVariantPayload) =>
    api
      .patch<VenueProductVariant>(`${base(organizationId)}/variants/${variantId}`, payload)
      .then((r) => r.data),
  setDefaultVariant: (organizationId: number, variantId: number) =>
    api
      .post<VenueProductVariant>(`${base(organizationId)}/variants/${variantId}/set-default`)
      .then((r) => r.data),
  archiveVariant: (organizationId: number, variantId: number) =>
    api
      .post<VenueProductVariant>(`${base(organizationId)}/variants/${variantId}/archive`)
      .then((r) => r.data),
  setVariantAvailability: (
    organizationId: number,
    variantId: number,
    status: VenueAvailabilityStatus,
  ) =>
    api
      .patch<VenueProductVariant>(`${base(organizationId)}/variants/${variantId}/availability`, { status })
      .then((r) => r.data),
  reorderVariants: (organizationId: number, productId: number, payload: ReorderPayload) =>
    api
      .patch<VenueProductVariant[]>(`${base(organizationId)}/products/${productId}/variants/reorder`, payload)
      .then((r) => r.data),

  // ---- Itens do cardápio ----
  listMenuItems: (organizationId: number, menuId: number) =>
    api.get<VenueMenuItem[]>(`${base(organizationId)}/menus/${menuId}/items`).then((r) => r.data),
  createMenuItem: (organizationId: number, menuId: number, payload: CreateVenueMenuItemPayload) =>
    api
      .post<VenueMenuItem>(`${base(organizationId)}/menus/${menuId}/items`, payload)
      .then((r) => r.data),
  updateMenuItem: (organizationId: number, menuItemId: number, payload: UpdateVenueMenuItemPayload) =>
    api
      .patch<VenueMenuItem>(`${base(organizationId)}/menu-items/${menuItemId}`, payload)
      .then((r) => r.data),
  removeMenuItem: (organizationId: number, menuItemId: number) =>
    api.delete(`${base(organizationId)}/menu-items/${menuItemId}`).then((r) => r.data),
  reorderMenuItems: (organizationId: number, menuId: number, payload: ReorderPayload) =>
    api
      .patch<VenueMenuItem[]>(`${base(organizationId)}/menus/${menuId}/items/reorder`, payload)
      .then((r) => r.data),
  setMenuItemVariantPrice: (
    organizationId: number,
    menuItemId: number,
    variantId: number,
    priceCents: number,
  ) =>
    api
      .put<VenueMenuItemVariantPrice>(
        `${base(organizationId)}/menu-items/${menuItemId}/variant-prices/${variantId}`,
        { priceCents },
      )
      .then((r) => r.data),
  removeMenuItemVariantPrice: (organizationId: number, menuItemId: number, variantId: number) =>
    api
      .delete(`${base(organizationId)}/menu-items/${menuItemId}/variant-prices/${variantId}`)
      .then((r) => r.data),

  // ---- Grupos de adicionais ----
  listModifierGroups: (organizationId: number) =>
    api.get<VenueModifierGroup[]>(`${base(organizationId)}/modifier-groups`).then((r) => r.data),
  getModifierGroup: (organizationId: number, groupId: number) =>
    api
      .get<VenueModifierGroupDetail>(`${base(organizationId)}/modifier-groups/${groupId}`)
      .then((r) => r.data),
  createModifierGroup: (organizationId: number, payload: CreateVenueModifierGroupPayload) =>
    api
      .post<VenueModifierGroup>(`${base(organizationId)}/modifier-groups`, payload)
      .then((r) => r.data),
  updateModifierGroup: (
    organizationId: number,
    groupId: number,
    payload: UpdateVenueModifierGroupPayload,
  ) =>
    api
      .patch<VenueModifierGroup>(`${base(organizationId)}/modifier-groups/${groupId}`, payload)
      .then((r) => r.data),
  setModifierGroupActive: (organizationId: number, groupId: number, active: boolean) =>
    api
      .patch<VenueModifierGroup>(`${base(organizationId)}/modifier-groups/${groupId}/availability`, {
        active,
      })
      .then((r) => r.data),
  reorderModifierGroups: (organizationId: number, payload: ReorderPayload) =>
    api
      .patch<VenueModifierGroup[]>(`${base(organizationId)}/modifier-groups/reorder`, payload)
      .then((r) => r.data),

  // ---- Opções de adicionais ----
  listModifierOptions: (organizationId: number, groupId: number) =>
    api
      .get<VenueModifierOption[]>(`${base(organizationId)}/modifier-groups/${groupId}/options`)
      .then((r) => r.data),
  createModifierOption: (
    organizationId: number,
    groupId: number,
    payload: CreateVenueModifierOptionPayload,
  ) =>
    api
      .post<VenueModifierOption>(`${base(organizationId)}/modifier-groups/${groupId}/options`, payload)
      .then((r) => r.data),
  updateModifierOption: (
    organizationId: number,
    optionId: number,
    payload: UpdateVenueModifierOptionPayload,
  ) =>
    api
      .patch<VenueModifierOption>(`${base(organizationId)}/modifier-options/${optionId}`, payload)
      .then((r) => r.data),
  archiveModifierOption: (organizationId: number, optionId: number) =>
    api
      .post<VenueModifierOption>(`${base(organizationId)}/modifier-options/${optionId}/archive`)
      .then((r) => r.data),
  setModifierOptionActive: (organizationId: number, optionId: number, active: boolean) =>
    api
      .patch<VenueModifierOption>(`${base(organizationId)}/modifier-options/${optionId}/availability`, {
        active,
      })
      .then((r) => r.data),
  reorderModifierOptions: (organizationId: number, groupId: number, payload: ReorderPayload) =>
    api
      .patch<VenueModifierOption[]>(
        `${base(organizationId)}/modifier-groups/${groupId}/options/reorder`,
        payload,
      )
      .then((r) => r.data),

  // ---- Vínculo produto ↔ grupo de adicionais ----
  listProductModifierGroups: (organizationId: number, productId: number) =>
    api
      .get<VenueProductModifierGroup[]>(`${base(organizationId)}/products/${productId}/modifier-groups`)
      .then((r) => r.data),
  createProductModifierGroup: (
    organizationId: number,
    productId: number,
    payload: CreateVenueProductModifierGroupPayload,
  ) =>
    api
      .post<VenueProductModifierGroup>(
        `${base(organizationId)}/products/${productId}/modifier-groups`,
        payload,
      )
      .then((r) => r.data),
  updateProductModifierGroup: (
    organizationId: number,
    linkId: number,
    payload: UpdateVenueProductModifierGroupPayload,
  ) =>
    api
      .patch<VenueProductModifierGroup>(`${base(organizationId)}/product-modifier-groups/${linkId}`, payload)
      .then((r) => r.data),
  removeProductModifierGroup: (organizationId: number, linkId: number) =>
    api.delete(`${base(organizationId)}/product-modifier-groups/${linkId}`).then((r) => r.data),
  reorderProductModifierGroups: (organizationId: number, productId: number, payload: ReorderPayload) =>
    api
      .patch<VenueProductModifierGroup[]>(
        `${base(organizationId)}/products/${productId}/modifier-groups/reorder`,
        payload,
      )
      .then((r) => r.data),
};

// ==================== HELPERS DE DINHEIRO ====================
// Preço sempre em centavos inteiros no backend; aqui só formatação/parse.

export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Valor inicial para um <input> editável em reais, ex.: "12,00". */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Converte texto digitado em reais ("12,50", "12.50", "12") para centavos inteiros. */
export function inputValueToCents(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export const VENUE_MENU_STATUS_LABEL: Record<VenueMenuStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export const VENUE_PRODUCT_STATUS_LABEL: Record<VenueProductStatus, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SOLD_OUT: "Esgotado",
  ARCHIVED: "Arquivado",
};

export const VENUE_STOCK_CONTROL_LABEL: Record<VenueStockControl, string> = {
  NONE: "Não controlar",
  DIRECT: "Controle direto",
  RECIPE: "Ficha técnica (em breve no Estoque)",
};
