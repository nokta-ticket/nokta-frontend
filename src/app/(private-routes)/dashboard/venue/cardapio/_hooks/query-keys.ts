/** Query keys do domínio Cardápio — sempre incluem organizationId (isolamento de cache por org). */
export const venueKeys = {
  menus: (orgId: number) => ["venue", orgId, "menus"] as const,
  menu: (orgId: number, menuId: number) => ["venue", orgId, "menu", menuId] as const,
  categories: (orgId: number, menuId: number) => ["venue", orgId, "categories", menuId] as const,
  stations: (orgId: number) => ["venue", orgId, "stations"] as const,
  products: (orgId: number, query: Record<string, unknown>) =>
    ["venue", orgId, "products", query] as const,
  product: (orgId: number, productId: number) => ["venue", orgId, "product", productId] as const,
  variants: (orgId: number, productId: number) => ["venue", orgId, "variants", productId] as const,
  menuItems: (orgId: number, menuId: number) => ["venue", orgId, "menuItems", menuId] as const,
  modifierGroups: (orgId: number) => ["venue", orgId, "modifierGroups"] as const,
  modifierGroup: (orgId: number, groupId: number) => ["venue", orgId, "modifierGroup", groupId] as const,
  modifierOptions: (orgId: number, groupId: number) =>
    ["venue", orgId, "modifierOptions", groupId] as const,
  productModifierGroups: (orgId: number, productId: number) =>
    ["venue", orgId, "productModifierGroups", productId] as const,
};
