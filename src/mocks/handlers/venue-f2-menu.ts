import { notFound, type MockHandler, type MockResult } from "./types";
import { MOCK_ORGANIZATION } from "./account";
import type {
  VenueAmenityItem,
  VenueMenu,
  VenueMenuCategory,
  VenueMenuItem,
  VenueModifierGroup,
  VenueModifierOption,
  VenuePreparationStation,
  VenueProduct,
  VenueProductDetail,
  VenueProductModifierGroup,
  VenueProductVariant,
  VenuePublicProfile,
} from "@/services/venue-menu";
import type { PublicMenuItem, PublicMenuResponse } from "@/services/venue-menu-public";

/**
 * F2 — Cardápio (menus, categorias, produtos, variações, adicionais, perfil
 * público). Estado mutável em memória. Os ids de produto/variação/item
 * (menuItemId = 1000 + productId) são os MESMOS do catálogo mínimo da F1 em
 * venue.ts — o lançamento de pedido da Operação continua encontrando os
 * itens que este cardápio lista.
 */
const ORG = 1;
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const now = () => new Date().toISOString();
const seg = (url: URL, offset = 1) => Number(url.pathname.split("/").filter(Boolean).at(-offset));
const ok = (data: unknown): MockResult => ({ data });
const body = <T,>(b: unknown) => (b ?? {}) as T;
const re = (suffix: string) => new RegExp(`/organizations/${ORG}/venue${suffix}$`);
let seq = 5000;
const nextId = () => ++seq;

// ── Perfil público e amenidades ──────────────────────────────────────────────

let profile: VenuePublicProfile = {
  logoUrl: "/mock/posters/noite-do-vinil.svg",
  logoOriginalUrl: "/mock/posters/noite-do-vinil.svg",
  bannerUrl: "/mock/posters/rooftop-live.svg",
  bannerOriginalUrl: "/mock/posters/rooftop-live.svg",
  address: "Rua Augusta, 1200 — Consolação, São Paulo/SP",
  instagramUrl: "https://instagram.com/noktabar",
  whatsappNumber: "+55 11 99999-9999",
};

const AMENITY_LABEL: Record<VenueAmenityItem["key"], string> = {
  VALET: "Valet",
  PARKING: "Estacionamento",
  PAYMENT_METHODS: "Formas de pagamento",
  WIFI: "Wi-Fi",
  OUTDOOR_AREA: "Área externa",
  ACCESSIBILITY: "Acessibilidade",
  PET_FRIENDLY: "Pet friendly",
  LIVE_MUSIC: "Música ao vivo",
  AIR_CONDITIONING: "Ar condicionado",
};
const amenities: VenueAmenityItem[] = (Object.keys(AMENITY_LABEL) as VenueAmenityItem["key"][]).map((key) => ({
  key,
  label: AMENITY_LABEL[key],
  enabled: ["VALET", "PAYMENT_METHODS", "WIFI", "OUTDOOR_AREA", "PET_FRIENDLY", "LIVE_MUSIC", "AIR_CONDITIONING"].includes(key),
  value: key === "VALET" ? "R$ 30 a noite" : key === "PAYMENT_METHODS" ? "Pix, débito, crédito e dinheiro" : key === "WIFI" ? "Senha com o garçom" : key === "OUTDOOR_AREA" ? "Varanda coberta" : key === "LIVE_MUSIC" ? "Quinta a sábado, a partir das 21h" : null,
}));

// ── Estações (GET é respondido pela frente D em dashboard.ts — mesmos ids) ──

const stations: VenuePreparationStation[] = [
  { id: 1, organizationId: ORG, nome: "Bar principal", tipo: "BAR", displayOrder: 0, active: true, createdAt: ago(90), updatedAt: ago(10) },
  { id: 2, organizationId: ORG, nome: "Cozinha", tipo: "KITCHEN", displayOrder: 1, active: true, createdAt: ago(90), updatedAt: ago(10) },
  { id: 3, organizationId: ORG, nome: "Copa", tipo: null, displayOrder: 2, active: false, createdAt: ago(40), updatedAt: ago(40) },
];

// ── Cardápios e categorias ───────────────────────────────────────────────────

const menus: VenueMenu[] = [
  { id: 1, organizationId: ORG, nome: "Cardápio principal", descricao: "Bar e tabacaria na Augusta — drinks autorais, chopp gelado e essências Ziggy.", slug: "principal", status: "PUBLISHED", isMain: true, publishedAt: ago(120), archivedAt: null, createdAt: ago(200), updatedAt: ago(2) },
  { id: 2, organizationId: ORG, nome: "Happy hour", descricao: "Terça a sexta, das 18h às 20h.", slug: "happy-hour", status: "DRAFT", isMain: false, publishedAt: null, archivedAt: null, createdAt: ago(14), updatedAt: ago(1) },
  { id: 3, organizationId: ORG, nome: "Carnaval 2025", descricao: null, slug: "carnaval-2025", status: "ARCHIVED", isMain: false, publishedAt: ago(250), archivedAt: ago(200), createdAt: ago(260), updatedAt: ago(200) },
];

type Cat = Omit<VenueMenuCategory, "itemCount">;
const categories: Cat[] = [
  { id: 1, menuId: 1, nome: "Cervejas", descricao: "Chopp gelado e long necks", imageUrl: "/mock/posters/sunset-sessions.svg", section: "MENU", displayOrder: 0, active: true, createdAt: ago(200), updatedAt: ago(5) },
  { id: 2, menuId: 1, nome: "Drinks", descricao: "Clássicos e autorais", imageUrl: "/mock/posters/baile-neon.svg", section: "MENU", displayOrder: 1, active: true, createdAt: ago(200), updatedAt: ago(5) },
  { id: 3, menuId: 1, nome: "Porções", descricao: "Pra dividir", imageUrl: "/mock/posters/garden-party.svg", section: "MENU", displayOrder: 2, active: true, createdAt: ago(200), updatedAt: ago(5) },
  { id: 4, menuId: 1, nome: "Sem álcool", descricao: null, imageUrl: null, section: "MENU", displayOrder: 3, active: true, createdAt: ago(200), updatedAt: ago(5) },
  { id: 5, menuId: 1, nome: "Essências", descricao: "Narguilé — venda proibida para menores de 18 anos", imageUrl: "/tabacaria/ziggy/tropical.webp", section: "TOBACCO", displayOrder: 4, active: true, createdAt: ago(200), updatedAt: ago(5) },
  { id: 6, menuId: 1, nome: "Sobremesas", descricao: null, imageUrl: null, section: "MENU", displayOrder: 5, active: false, createdAt: ago(30), updatedAt: ago(30) },
  { id: 7, menuId: 2, nome: "Promoções", descricao: "Dose dupla até as 20h", imageUrl: null, section: "MENU", displayOrder: 0, active: true, createdAt: ago(14), updatedAt: ago(14) },
  { id: 8, menuId: 2, nome: "Geral", descricao: null, imageUrl: null, section: "MENU", displayOrder: 1, active: true, createdAt: ago(14), updatedAt: ago(14) },
];

// ── Produtos, variações e adicionais ─────────────────────────────────────────

const ZIGGY = ["7-belo-berry", "abacaxi-tropical", "banana-tropical", "burley-mint", "cherry-starburst", "choco-menta", "coco-tropical", "fresh-lemon", "fresh-melon", "frutas-roxas", "grape-starburst", "jabuticaba-tropical", "manga-tropical", "maracuja-yellow", "melancia-watermelon-bomb", "morango-tropical", "red-lemonade", "sorvete-de-limao", "sorvete-de-pistache", "yogurt"];

type ProductRow = Omit<VenueProduct, "variants" | "preparationStation">;
const products: ProductRow[] = [];
const variants: VenueProductVariant[] = [];

function seedProduct(p: { id: number; nome: string; descricao?: string | null; imageUrl?: string | null; stationId?: number | null; status?: VenueProduct["status"]; prep?: number | null; harmoniza?: string; contra?: string; variants: { id: number; nome: string; priceCents: number; sku?: string; stock?: VenueProductVariant["stockControl"]; status?: VenueProductVariant["status"] }[] }) {
  products.push({ id: p.id, organizationId: ORG, nome: p.nome, descricao: p.descricao ?? null, harmonizaCom: p.harmoniza ?? null, contraindicacoes: p.contra ?? null, imageUrl: p.imageUrl ?? null, prepTimeMinutes: p.prep ?? null, status: p.status ?? "ACTIVE", preparationStationId: p.stationId === undefined ? 1 : p.stationId, archivedAt: p.status === "ARCHIVED" ? ago(20) : null, createdAt: ago(150 - (p.id % 7) * 3), updatedAt: ago(p.id % 9) });
  p.variants.forEach((v, i) => variants.push({ id: v.id, organizationId: ORG, productId: p.id, nome: v.nome, sku: v.sku ?? null, priceCents: v.priceCents, stockControl: v.stock ?? "NONE", isDefault: i === 0, displayOrder: i, status: v.status ?? "ACTIVE", archivedAt: v.status === "ARCHIVED" ? ago(10) : null, createdAt: ago(150), updatedAt: ago(3) }));
}

seedProduct({ id: 1, nome: "Chopp Pilsen", descricao: "Tirado na hora, colarinho de dois dedos.", imageUrl: "/mock/posters/rooftop-live.svg", prep: 2, variants: [{ id: 11, nome: "300 ml", priceCents: 1200, sku: "CHP-300", stock: "DIRECT" }, { id: 12, nome: "500 ml", priceCents: 1800, sku: "CHP-500", stock: "DIRECT" }, { id: 13, nome: "1 L", priceCents: 3200, sku: "CHP-1000", stock: "DIRECT" }] });
seedProduct({ id: 2, nome: "IPA artesanal", descricao: "Lupulada, amargor médio, 6,2% ABV.", variants: [{ id: 21, nome: "473 ml", priceCents: 2600, sku: "IPA-473", stock: "DIRECT" }] });
seedProduct({ id: 3, nome: "Balde de Long Neck", descricao: "6 unidades no gelo.", imageUrl: "/mock/posters/virada-tropical.svg", variants: [{ id: 31, nome: "6 un", priceCents: 6900, stock: "RECIPE" }] });
seedProduct({ id: 4, nome: "Caipirinha", descricao: "Cachaça artesanal, fruta macerada na hora.", imageUrl: "/mock/posters/forro-na-praca.svg", prep: 5, harmoniza: "Porção de batata", variants: [{ id: 41, nome: "Dose", priceCents: 2400, stock: "RECIPE" }, { id: 42, nome: "Jarra", priceCents: 7900, stock: "RECIPE" }] });
seedProduct({ id: 5, nome: "Negroni", descricao: "Gin, Campari e vermute rosso.", imageUrl: "/mock/posters/noite-do-vinil.svg", prep: 4, variants: [{ id: 51, nome: "Dose", priceCents: 3200, stock: "RECIPE" }] });
seedProduct({ id: 6, nome: "Gin Tônica", descricao: "Gin London Dry, tônica premium e especiarias.", prep: 3, variants: [{ id: 61, nome: "Dose", priceCents: 2900, stock: "RECIPE" }] });
seedProduct({ id: 7, nome: "Aperol Spritz", imageUrl: "/mock/posters/samba-de-raiz.svg", status: "SOLD_OUT", variants: [{ id: 71, nome: "Dose", priceCents: 3100, status: "SOLD_OUT" }] });
seedProduct({ id: 8, nome: "Moscow Mule", descricao: "Vodka, espuma de gengibre e limão.", variants: [{ id: 81, nome: "Dose", priceCents: 2800 }] });
seedProduct({ id: 9, nome: "Porção de batata", descricao: "Batata rústica com páprica.", imageUrl: "/mock/posters/pagode-do-cais.svg", stationId: 2, prep: 15, contra: "Contém glúten", variants: [{ id: 91, nome: "Média", priceCents: 2900, stock: "RECIPE" }, { id: 92, nome: "Grande", priceCents: 3900, stock: "RECIPE" }] });
seedProduct({ id: 10, nome: "Tábua de frios", descricao: "Queijos, salames, azeitonas e pães.", imageUrl: "/mock/posters/festival-horizonte.svg", stationId: 2, prep: 10, contra: "Contém lactose e glúten", variants: [{ id: 101, nome: "Para 2", priceCents: 5900 }, { id: 102, nome: "Para 4", priceCents: 8900 }] });
seedProduct({ id: 11, nome: "Bruschetta", descricao: "Tomate, manjericão e azeite.", stationId: 2, prep: 12, variants: [{ id: 111, nome: "4 un", priceCents: 2800 }] });
seedProduct({ id: 12, nome: "Água sem gás", stationId: null, variants: [{ id: 121, nome: "500 ml", priceCents: 600, sku: "AGUA-500", stock: "DIRECT" }] });
seedProduct({ id: 13, nome: "Água com gás", stationId: null, variants: [{ id: 131, nome: "500 ml", priceCents: 700, sku: "AGUAG-500", stock: "DIRECT" }] });
seedProduct({ id: 14, nome: "Suco natural", descricao: "Laranja, abacaxi ou maracujá.", variants: [{ id: 141, nome: "300 ml", priceCents: 1200 }, { id: 142, nome: "500 ml", priceCents: 1600 }] });
seedProduct({ id: 15, nome: "Cerveja sem álcool", status: "INACTIVE", variants: [{ id: 151, nome: "Long neck", priceCents: 1400 }] });
seedProduct({ id: 16, nome: "Petit gâteau", descricao: "Com sorvete de creme.", stationId: 2, status: "ARCHIVED", variants: [{ id: 161, nome: "Unidade", priceCents: 2600, status: "ARCHIVED" }] });
ZIGGY.forEach((slug, i) => {
  seedProduct({ id: 50 + i, nome: `Ziggy ${slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}`, descricao: "Essência Ziggy 50g — sessão de narguilé.", imageUrl: `/tabacaria/ziggy/${slug}.webp`, status: i === 5 ? "SOLD_OUT" : "ACTIVE", prep: 8, variants: [{ id: 500 + i * 2, nome: "Sessão", priceCents: 4500, stock: "DIRECT" }, { id: 501 + i * 2, nome: "Dupla", priceCents: 7900, stock: "DIRECT" }] });
});

const groups: VenueModifierGroup[] = [
  { id: 1, organizationId: ORG, nome: "Fruta", displayOrder: 0, active: true, createdAt: ago(120), updatedAt: ago(4) },
  { id: 2, organizationId: ORG, nome: "Açúcar", displayOrder: 1, active: true, createdAt: ago(120), updatedAt: ago(4) },
  { id: 3, organizationId: ORG, nome: "Molhos", displayOrder: 2, active: true, createdAt: ago(100), updatedAt: ago(4) },
  { id: 4, organizationId: ORG, nome: "Pão extra", displayOrder: 3, active: false, createdAt: ago(60), updatedAt: ago(4) },
];
const options: VenueModifierOption[] = [
  { id: 1, modifierGroupId: 1, nome: "Limão", priceCents: 0, displayOrder: 0, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 2, modifierGroupId: 1, nome: "Morango", priceCents: 200, displayOrder: 1, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 3, modifierGroupId: 1, nome: "Maracujá", priceCents: 200, displayOrder: 2, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 4, modifierGroupId: 1, nome: "Kiwi", priceCents: 300, displayOrder: 3, active: false, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 5, modifierGroupId: 2, nome: "Normal", priceCents: 0, displayOrder: 0, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 6, modifierGroupId: 2, nome: "Sem açúcar", priceCents: 0, displayOrder: 1, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(4) },
  { id: 7, modifierGroupId: 3, nome: "Maionese", priceCents: 0, displayOrder: 0, active: true, archivedAt: null, createdAt: ago(100), updatedAt: ago(4) },
  { id: 8, modifierGroupId: 3, nome: "Cheddar", priceCents: 400, displayOrder: 1, active: true, archivedAt: null, createdAt: ago(100), updatedAt: ago(4) },
  { id: 9, modifierGroupId: 3, nome: "Barbecue", priceCents: 300, displayOrder: 2, active: true, archivedAt: null, createdAt: ago(100), updatedAt: ago(4) },
  { id: 12, modifierGroupId: 3, nome: "Mostarda e mel", priceCents: 300, displayOrder: 3, active: false, archivedAt: ago(10), createdAt: ago(100), updatedAt: ago(10) },
  { id: 10, modifierGroupId: 4, nome: "Ciabatta", priceCents: 500, displayOrder: 0, active: true, archivedAt: null, createdAt: ago(60), updatedAt: ago(4) },
  { id: 11, modifierGroupId: 4, nome: "Torradas", priceCents: 300, displayOrder: 1, active: true, archivedAt: null, createdAt: ago(60), updatedAt: ago(4) },
];
type Link = Omit<VenueProductModifierGroup, "group">;
const links: Link[] = [
  { id: 1, productId: 4, modifierGroupId: 1, required: true, minSelect: 1, maxSelect: 1, displayOrder: 0, createdAt: ago(120), updatedAt: ago(4) },
  { id: 2, productId: 4, modifierGroupId: 2, required: false, minSelect: 0, maxSelect: 1, displayOrder: 1, createdAt: ago(120), updatedAt: ago(4) },
  { id: 3, productId: 9, modifierGroupId: 3, required: false, minSelect: 0, maxSelect: 2, displayOrder: 0, createdAt: ago(100), updatedAt: ago(4) },
  { id: 4, productId: 10, modifierGroupId: 4, required: false, minSelect: 0, maxSelect: 3, displayOrder: 0, createdAt: ago(60), updatedAt: ago(4) },
];

// ── Itens de cardápio (menuItemId = 1000 + productId no principal) ───────────

type Item = { id: number; menuId: number; categoryId: number; productId: number; displayOrder: number; active: boolean; highlighted: boolean; overrides: Record<number, number>; createdAt: string; updatedAt: string };
const items: Item[] = [];
const catOf = (pid: number) => (pid >= 50 ? 5 : pid <= 3 ? 1 : pid <= 8 ? 2 : pid <= 11 ? 3 : pid <= 15 ? 4 : 6);
for (const p of products) {
  if (p.status === "ARCHIVED") continue;
  items.push({ id: 1000 + p.id, menuId: 1, categoryId: catOf(p.id), productId: p.id, displayOrder: items.length, active: p.id !== 15, highlighted: [1, 3, 5, 9, 50, 51].includes(p.id), overrides: p.id === 1 ? { 12: 1600 } : {}, createdAt: ago(150), updatedAt: ago(2) });
}
items.push({ id: 2001, menuId: 2, categoryId: 7, productId: 1, displayOrder: 0, active: true, highlighted: true, overrides: { 11: 900, 12: 1400 }, createdAt: ago(14), updatedAt: ago(1) });
items.push({ id: 2002, menuId: 2, categoryId: 7, productId: 4, displayOrder: 1, active: true, highlighted: false, overrides: { 41: 1900 }, createdAt: ago(14), updatedAt: ago(1) });
items.push({ id: 2003, menuId: 2, categoryId: 8, productId: 9, displayOrder: 2, active: true, highlighted: false, overrides: {}, createdAt: ago(14), updatedAt: ago(1) });

// ── Serialização ─────────────────────────────────────────────────────────────

const stationRef = (id: number | null) => {
  const s = id ? stations.find((x) => x.id === id) : null;
  return s ? { id: s.id, nome: s.nome } : null;
};
const productVariants = (pid: number) => variants.filter((v) => v.productId === pid).sort((a, b) => a.displayOrder - b.displayOrder);
const fullProduct = (p: ProductRow): VenueProduct => ({ ...p, preparationStation: stationRef(p.preparationStationId), variants: productVariants(p.id) });
const groupDetail = (g: VenueModifierGroup) => ({ ...g, options: options.filter((o) => o.modifierGroupId === g.id).sort((a, b) => a.displayOrder - b.displayOrder) });
const linkFull = (l: Link): VenueProductModifierGroup => ({ ...l, group: groupDetail(groups.find((g) => g.id === l.modifierGroupId)!) });
const prices = (it: Item) =>
  productVariants(it.productId).filter((v) => v.status !== "ARCHIVED").map((v) => ({ variantId: v.id, variantNome: v.nome, basePriceCents: v.priceCents, overridePriceCents: it.overrides[v.id] ?? null, effectivePriceCents: it.overrides[v.id] ?? v.priceCents }));
const menuItem = (it: Item): VenueMenuItem => {
  const p = products.find((x) => x.id === it.productId)!;
  return { id: it.id, organizationId: ORG, menuId: it.menuId, categoryId: it.categoryId, productId: it.productId, displayOrder: it.displayOrder, active: it.active, highlighted: it.highlighted, createdAt: it.createdAt, updatedAt: it.updatedAt, product: { id: p.id, nome: p.nome, status: p.status, imageUrl: p.imageUrl, variants: productVariants(p.id) }, prices: prices(it) };
};
const category = (c: Cat): VenueMenuCategory => ({ ...c, itemCount: items.filter((i) => i.categoryId === c.id).length });
const productDetail = (p: ProductRow): VenueProductDetail => ({
  ...fullProduct(p),
  modifierGroups: links.filter((l) => l.productId === p.id).sort((a, b) => a.displayOrder - b.displayOrder).map(linkFull),
  menus: items.filter((i) => i.productId === p.id).map((i) => {
    const m = menus.find((x) => x.id === i.menuId)!;
    return { menuItemId: i.id, menuId: m.id, menuNome: m.nome, menuStatus: m.status, categoryId: i.categoryId, displayOrder: i.displayOrder, active: i.active, highlighted: i.highlighted, prices: prices(i) };
  }),
});

function publicItem(it: Item, withCategory: boolean): PublicMenuItem {
  const p = products.find((x) => x.id === it.productId)!;
  const c = categories.find((x) => x.id === it.categoryId)!;
  return { id: it.id, nome: p.nome, descricao: p.descricao, harmonizaCom: p.harmonizaCom, contraindicacoes: p.contraindicacoes, imageUrl: p.imageUrl, available: p.status === "ACTIVE" && it.active, prices: prices(it), favoriteCount: (p.id * 7) % 23, favoritedByVisitor: false, ...(withCategory ? { categoryNome: c.nome, section: c.section } : {}) };
}
function preview(menu: VenueMenu): PublicMenuResponse {
  const menuItems = items.filter((i) => i.menuId === menu.id && i.active && products.find((p) => p.id === i.productId)?.status !== "ARCHIVED");
  return {
    organizationName: MOCK_ORGANIZATION.nome,
    profile: { logoUrl: profile.logoUrl, bannerUrl: profile.bannerUrl, address: profile.address, instagramUrl: profile.instagramUrl, whatsappNumber: profile.whatsappNumber },
    menu: {
      nome: menu.nome,
      descricao: menu.descricao,
      highlights: menuItems.filter((i) => i.highlighted).map((i) => publicItem(i, true)),
      categories: categories.filter((c) => c.menuId === menu.id && c.active).sort((a, b) => a.displayOrder - b.displayOrder).map((c) => ({ id: c.id, nome: c.nome, descricao: c.descricao, imageUrl: c.imageUrl, section: c.section, items: menuItems.filter((i) => i.categoryId === c.id).sort((a, b) => a.displayOrder - b.displayOrder).map((i) => publicItem(i, false)) })).filter((c) => c.items.length > 0),
    },
  };
}

function reorder<T extends { id: number; displayOrder: number }>(list: T[], b: unknown) {
  for (const it of body<{ items?: { id: number; displayOrder: number }[] }>(b).items ?? []) {
    const row = list.find((x) => x.id === it.id);
    if (row) row.displayOrder = it.displayOrder;
  }
}

const UPLOAD_POOL = ["/tabacaria/ziggy/tropical.webp", "/tabacaria/ziggy/sakamoto.webp", "/tabacaria/ziggy/copa-2026.webp", "/mock/posters/techno-bunker.svg", "/mock/posters/bloco-da-madrugada.svg"];
let uploadSeq = 0;

export const f2MenuHandlers: MockHandler[] = [
  // Upload (mesmo endpoint das thumbnails de evento) — devolve uma imagem do pool.
  { test: /\/upload$/, method: "post", handle: () => ok({ data: [UPLOAD_POOL[uploadSeq++ % UPLOAD_POOL.length]] }) },
  // Slug da organização (reflete no /me/organizations via objeto compartilhado).
  {
    test: new RegExp(`/organizations/${ORG}/slug$`),
    method: "patch",
    handle: ({ body: b }) => {
      const slug = body<{ slug?: string }>(b).slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") ?? "";
      if (!slug) return { status: 400, data: { message: "Informe um link válido." } };
      if (slug === "indisponivel") return { status: 409, data: { message: "Esse link já está em uso por outra organização." } };
      MOCK_ORGANIZATION.slug = slug;
      return ok({ id: ORG, slug });
    },
  },

  // Perfil público e amenidades
  { test: re("/menu-publico/perfil"), method: "get", handle: () => ok(profile) },
  { test: re("/menu-publico/perfil"), method: "patch", handle: ({ body: b }) => { profile = { ...profile, ...body<Partial<VenuePublicProfile>>(b) }; return ok(profile); } },
  { test: re("/menu-publico/amenidades"), method: "get", handle: () => ok(amenities) },
  {
    test: re("/menu-publico/amenidades"),
    method: "put",
    handle: ({ body: b }) => {
      for (const it of body<{ items?: { key: VenueAmenityItem["key"]; enabled: boolean; value?: string }[] }>(b).items ?? []) {
        const a = amenities.find((x) => x.key === it.key);
        if (a) { a.enabled = it.enabled; a.value = it.value ?? null; }
      }
      return ok(amenities);
    },
  },

  // Cardápios
  { test: re("/menus/ensure-default"), method: "post", handle: () => ok({ menu: menus.find((m) => m.isMain), defaultCategoryId: 4 }) },
  { test: re("/menus"), method: "get", handle: () => ok(menus) },
  {
    test: re("/menus"),
    method: "post",
    handle: ({ body: b }) => {
      const p = body<{ nome: string; descricao?: string; isMain?: boolean }>(b);
      const m: VenueMenu = { id: nextId(), organizationId: ORG, nome: p.nome, descricao: p.descricao ?? null, slug: p.nome.toLowerCase().replace(/\s+/g, "-"), status: "DRAFT", isMain: Boolean(p.isMain), publishedAt: null, archivedAt: null, createdAt: now(), updatedAt: now() };
      if (m.isMain) menus.forEach((x) => (x.isMain = false));
      menus.push(m);
      categories.push({ id: nextId(), menuId: m.id, nome: "Geral", descricao: null, imageUrl: null, section: "MENU", displayOrder: 0, active: true, createdAt: now(), updatedAt: now() });
      return ok(m);
    },
  },
  { test: re("/menus/\\d+/preview"), method: "get", handle: ({ url }) => { const m = menus.find((x) => x.id === seg(url, 2)); return m ? ok(preview(m)) : notFound("Cardápio não encontrado"); } },
  { test: re("/menus/\\d+/set-main"), method: "post", handle: ({ url }) => { const m = menus.find((x) => x.id === seg(url, 2)); if (!m) return notFound(); menus.forEach((x) => (x.isMain = x.id === m.id)); return ok(m); } },
  { test: re("/menus/\\d+/publish"), method: "post", handle: ({ url }) => { const m = menus.find((x) => x.id === seg(url, 2)); if (!m) return notFound(); m.status = "PUBLISHED"; m.publishedAt = now(); m.updatedAt = now(); return ok(m); } },
  { test: re("/menus/\\d+/archive"), method: "post", handle: ({ url }) => { const m = menus.find((x) => x.id === seg(url, 2)); if (!m) return notFound(); if (m.isMain) return { status: 400, data: { message: "O cardápio principal não pode ser arquivado. Defina outro como principal antes." } }; m.status = "ARCHIVED"; m.archivedAt = now(); return ok(m); } },
  { test: re("/menus/\\d+/categories/bulk"), method: "post", handle: ({ url, body: b }) => { const menuId = seg(url, 3); const rows = body<{ categories?: { nome?: string; descricao?: string }[] }>(b).categories ?? []; const created: VenueMenuCategory[] = []; const errors: { index: number; message: string }[] = []; rows.forEach((r, index) => { const nome = r.nome?.trim(); if (!nome) return errors.push({ index, message: "Informe o nome." }); if (categories.some((c) => c.menuId === menuId && c.nome.toLowerCase() === nome.toLowerCase())) return errors.push({ index, message: `Já existe uma categoria "${nome}".` }); const c: Cat = { id: nextId(), menuId, nome, descricao: r.descricao ?? null, imageUrl: null, section: "MENU", displayOrder: categories.filter((x) => x.menuId === menuId).length, active: true, createdAt: now(), updatedAt: now() }; categories.push(c); created.push(category(c)); }); return ok({ created, errors }); } },
  { test: re("/menus/\\d+/categories/reorder"), method: "patch", handle: ({ url, body: b }) => { reorder(categories, b); return ok(categories.filter((c) => c.menuId === seg(url, 3)).map(category)); } },
  { test: re("/menus/\\d+/categories"), method: "get", handle: ({ url }) => ok(categories.filter((c) => c.menuId === seg(url, 2)).sort((a, b) => a.displayOrder - b.displayOrder).map(category)) },
  { test: re("/menus/\\d+/categories"), method: "post", handle: ({ url, body: b }) => { const menuId = seg(url, 2); const p = body<{ nome: string; descricao?: string; imageUrl?: string; section?: Cat["section"] }>(b); const c: Cat = { id: nextId(), menuId, nome: p.nome, descricao: p.descricao ?? null, imageUrl: p.imageUrl ?? null, section: p.section ?? "MENU", displayOrder: categories.filter((x) => x.menuId === menuId).length, active: true, createdAt: now(), updatedAt: now() }; categories.push(c); return ok(category(c)); } },
  { test: re("/menus/\\d+/items/bulk"), method: "post", handle: ({ url, body: b }) => { const menuId = seg(url, 3); const rows = body<{ items?: { nome?: string; priceCents?: number; preparationStationId?: number; categoryId?: number; status?: VenueProduct["status"] }[] }>(b).items ?? []; const created: unknown[] = []; const errors: { index: number; message: string }[] = []; rows.forEach((r, index) => { const nome = r.nome?.trim(); if (!nome) return errors.push({ index, message: "Informe o nome do produto." }); if (!r.categoryId) return errors.push({ index, message: "Selecione a categoria." }); if (products.some((p) => p.nome.toLowerCase() === nome.toLowerCase())) return errors.push({ index, message: `Já existe um produto "${nome}".` }); const id = nextId(); seedProduct({ id, nome, stationId: r.preparationStationId ?? null, status: r.status ?? "ACTIVE", variants: [{ id: nextId(), nome: "Padrão", priceCents: r.priceCents ?? 0 }] }); const it: Item = { id: nextId(), menuId, categoryId: r.categoryId, productId: id, displayOrder: items.length, active: true, highlighted: false, overrides: {}, createdAt: now(), updatedAt: now() }; items.push(it); created.push({ product: fullProduct(products.find((p) => p.id === id)!), category: category(categories.find((c) => c.id === r.categoryId)!), menuItem: menuItem(it) }); }); return ok({ created, errors }); } },
  { test: re("/menus/\\d+/items/reorder"), method: "patch", handle: ({ url, body: b }) => { reorder(items, b); return ok(items.filter((i) => i.menuId === seg(url, 3)).map(menuItem)); } },
  { test: re("/menus/\\d+/items"), method: "get", handle: ({ url }) => ok(items.filter((i) => i.menuId === seg(url, 2)).sort((a, b) => a.displayOrder - b.displayOrder).map(menuItem)) },
  { test: re("/menus/\\d+/items"), method: "post", handle: ({ url, body: b }) => { const menuId = seg(url, 2); const p = body<{ categoryId: number; productId: number }>(b); if (items.some((i) => i.menuId === menuId && i.productId === p.productId)) return { status: 409, data: { message: "Este produto já está neste cardápio." } }; const it: Item = { id: nextId(), menuId, categoryId: p.categoryId, productId: p.productId, displayOrder: items.length, active: true, highlighted: false, overrides: {}, createdAt: now(), updatedAt: now() }; items.push(it); return ok(menuItem(it)); } },
  { test: re("/menus/\\d+"), method: "get", handle: ({ url }) => { const m = menus.find((x) => x.id === seg(url)); return m ? ok({ ...m, categories: categories.filter((c) => c.menuId === m.id).map(category) }) : notFound("Cardápio não encontrado"); } },
  { test: re("/menus/\\d+"), method: "patch", handle: ({ url, body: b }) => { const m = menus.find((x) => x.id === seg(url)); if (!m) return notFound(); const p = body<Partial<VenueMenu>>(b); if (p.isMain) menus.forEach((x) => (x.isMain = false)); Object.assign(m, p, { updatedAt: now() }); return ok(m); } },

  // Categorias
  { test: re("/categories/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const c = categories.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); c.active = Boolean(body<{ active: boolean }>(b).active); return ok(category(c)); } },
  { test: re("/categories/\\d+"), method: "patch", handle: ({ url, body: b }) => { const c = categories.find((x) => x.id === seg(url)); if (!c) return notFound(); Object.assign(c, body<Partial<Cat>>(b), { updatedAt: now() }); return ok(category(c)); } },

  // Estações (GET /preparation-stations vem da frente D; aqui só mutações)
  { test: re("/preparation-stations/reorder"), method: "patch", handle: ({ body: b }) => { reorder(stations, b); return ok(stations); } },
  { test: re("/preparation-stations"), method: "get", handle: () => ok(stations) },
  { test: re("/preparation-stations"), method: "post", handle: ({ body: b }) => { const p = body<{ nome: string; tipo?: string }>(b); const s: VenuePreparationStation = { id: nextId(), organizationId: ORG, nome: p.nome, tipo: p.tipo ?? null, displayOrder: stations.length, active: true, createdAt: now(), updatedAt: now() }; stations.push(s); return ok(s); } },
  { test: re("/preparation-stations/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const s = stations.find((x) => x.id === seg(url, 2)); if (!s) return notFound(); s.active = Boolean(body<{ active: boolean }>(b).active); return ok(s); } },
  { test: re("/preparation-stations/\\d+"), method: "patch", handle: ({ url, body: b }) => { const s = stations.find((x) => x.id === seg(url)); if (!s) return notFound(); Object.assign(s, body<Partial<VenuePreparationStation>>(b), { updatedAt: now() }); return ok(s); } },

  // Produtos
  {
    test: re("/products"),
    method: "get",
    handle: ({ params }) => {
      const search = (params.search ?? "").trim().toLowerCase();
      let list = products.filter((p) => (!params.status || p.status === params.status) && (!search || p.nome.toLowerCase().includes(search)) && (!params.preparationStationId || p.preparationStationId === Number(params.preparationStationId)));
      if (params.menuId) { const pids = new Set(items.filter((i) => i.menuId === Number(params.menuId) && (!params.categoryId || i.categoryId === Number(params.categoryId))).map((i) => i.productId)); list = list.filter((p) => pids.has(p.id)); }
      list = list.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      const page = Math.max(1, Number(params.page ?? 1));
      const limit = Number(params.limit ?? 20);
      return ok({ data: list.slice((page - 1) * limit, page * limit).map(fullProduct), paginate: { page, limit, total: list.length } });
    },
  },
  {
    test: re("/products"),
    method: "post",
    handle: ({ body: b }) => {
      const p = body<{ nome: string; descricao?: string; harmonizaCom?: string; contraindicacoes?: string; imageUrl?: string; prepTimeMinutes?: number; preparationStationId?: number; variantName?: string; sku?: string; priceCents: number; stockControl?: VenueProductVariant["stockControl"]; menuId?: number; categoryId?: number }>(b);
      if (!p.nome?.trim()) return { status: 400, data: { message: "Informe o nome do produto." } };
      const id = nextId();
      seedProduct({ id, nome: p.nome.trim(), descricao: p.descricao, imageUrl: p.imageUrl, stationId: p.preparationStationId ?? null, prep: p.prepTimeMinutes ?? null, harmoniza: p.harmonizaCom, contra: p.contraindicacoes, variants: [{ id: nextId(), nome: p.variantName?.trim() || "Padrão", priceCents: p.priceCents ?? 0, sku: p.sku, stock: p.stockControl }] });
      if (p.menuId && p.categoryId) items.push({ id: nextId(), menuId: p.menuId, categoryId: p.categoryId, productId: id, displayOrder: items.length, active: true, highlighted: false, overrides: {}, createdAt: now(), updatedAt: now() });
      return ok(fullProduct(products.find((x) => x.id === id)!));
    },
  },
  { test: re("/products/\\d+/variants/reorder"), method: "patch", handle: ({ url, body: b }) => { reorder(variants, b); return ok(productVariants(seg(url, 3))); } },
  { test: re("/products/\\d+/variants"), method: "get", handle: ({ url }) => ok(productVariants(seg(url, 2))) },
  { test: re("/products/\\d+/variants"), method: "post", handle: ({ url, body: b }) => { const productId = seg(url, 2); const p = body<{ nome: string; sku?: string; priceCents: number; stockControl?: VenueProductVariant["stockControl"] }>(b); const v: VenueProductVariant = { id: nextId(), organizationId: ORG, productId, nome: p.nome, sku: p.sku ?? null, priceCents: p.priceCents, stockControl: p.stockControl ?? "NONE", isDefault: productVariants(productId).length === 0, displayOrder: productVariants(productId).length, status: "ACTIVE", archivedAt: null, createdAt: now(), updatedAt: now() }; variants.push(v); return ok(v); } },
  { test: re("/products/\\d+/modifier-groups/reorder"), method: "patch", handle: ({ url, body: b }) => { reorder(links, b); return ok(links.filter((l) => l.productId === seg(url, 3)).map(linkFull)); } },
  { test: re("/products/\\d+/modifier-groups"), method: "get", handle: ({ url }) => ok(links.filter((l) => l.productId === seg(url, 2)).sort((a, b) => a.displayOrder - b.displayOrder).map(linkFull)) },
  { test: re("/products/\\d+/modifier-groups"), method: "post", handle: ({ url, body: b }) => { const productId = seg(url, 2); const p = body<{ modifierGroupId: number; required?: boolean; minSelect?: number; maxSelect?: number }>(b); if (links.some((l) => l.productId === productId && l.modifierGroupId === p.modifierGroupId)) return { status: 409, data: { message: "Este grupo já está vinculado ao produto." } }; const l: Link = { id: nextId(), productId, modifierGroupId: p.modifierGroupId, required: Boolean(p.required), minSelect: p.minSelect ?? 0, maxSelect: p.maxSelect ?? null, displayOrder: links.filter((x) => x.productId === productId).length, createdAt: now(), updatedAt: now() }; links.push(l); return ok(linkFull(l)); } },
  { test: re("/products/\\d+/archive"), method: "post", handle: ({ url }) => { const p = products.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); p.status = "ARCHIVED"; p.archivedAt = now(); return ok(fullProduct(p)); } },
  { test: re("/products/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const p = products.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); p.status = body<{ status: VenueProduct["status"] }>(b).status; p.updatedAt = now(); return ok(fullProduct(p)); } },
  { test: re("/products/\\d+"), method: "get", handle: ({ url }) => { const p = products.find((x) => x.id === seg(url)); return p ? ok(productDetail(p)) : notFound("Produto não encontrado"); } },
  { test: re("/products/\\d+"), method: "patch", handle: ({ url, body: b }) => { const p = products.find((x) => x.id === seg(url)); if (!p) return notFound(); const patch = body<Record<string, unknown>>(b); Object.assign(p, { ...patch, preparationStationId: patch.preparationStationId === undefined ? null : patch.preparationStationId, prepTimeMinutes: patch.prepTimeMinutes ?? null, descricao: patch.descricao ?? null, harmonizaCom: patch.harmonizaCom ?? null, contraindicacoes: patch.contraindicacoes ?? null, imageUrl: patch.imageUrl ?? null, updatedAt: now() }); return ok(fullProduct(p)); } },

  // Variações
  { test: re("/variants/\\d+/set-default"), method: "post", handle: ({ url }) => { const v = variants.find((x) => x.id === seg(url, 2)); if (!v) return notFound(); variants.filter((x) => x.productId === v.productId).forEach((x) => (x.isDefault = x.id === v.id)); return ok(v); } },
  { test: re("/variants/\\d+/archive"), method: "post", handle: ({ url }) => { const v = variants.find((x) => x.id === seg(url, 2)); if (!v) return notFound(); v.status = "ARCHIVED"; v.archivedAt = now(); if (v.isDefault) { v.isDefault = false; const next = variants.find((x) => x.productId === v.productId && x.status !== "ARCHIVED"); if (next) next.isDefault = true; } return ok(v); } },
  { test: re("/variants/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const v = variants.find((x) => x.id === seg(url, 2)); if (!v) return notFound(); v.status = body<{ status: VenueProductVariant["status"] }>(b).status; return ok(v); } },
  { test: re("/variants/\\d+"), method: "patch", handle: ({ url, body: b }) => { const v = variants.find((x) => x.id === seg(url)); if (!v) return notFound(); Object.assign(v, body<Partial<VenueProductVariant>>(b), { updatedAt: now() }); return ok(v); } },

  // Itens de cardápio
  { test: re("/menu-items/\\d+/variant-prices/\\d+"), method: "put", handle: ({ url, body: b }) => { const it = items.find((x) => x.id === seg(url, 3)); if (!it) return notFound(); const variantId = seg(url); it.overrides[variantId] = body<{ priceCents: number }>(b).priceCents; return ok({ id: nextId(), menuItemId: it.id, variantId, priceCents: it.overrides[variantId], createdAt: now(), updatedAt: now() }); } },
  { test: re("/menu-items/\\d+/variant-prices/\\d+"), method: "delete", handle: ({ url }) => { const it = items.find((x) => x.id === seg(url, 3)); if (it) delete it.overrides[seg(url)]; return ok({ ok: true }); } },
  { test: re("/menu-items/\\d+"), method: "patch", handle: ({ url, body: b }) => { const it = items.find((x) => x.id === seg(url)); if (!it) return notFound(); Object.assign(it, body<Partial<Item>>(b), { updatedAt: now() }); return ok(menuItem(it)); } },
  { test: re("/menu-items/\\d+"), method: "delete", handle: ({ url }) => { const i = items.findIndex((x) => x.id === seg(url)); if (i >= 0) items.splice(i, 1); return ok({ ok: true }); } },

  // Grupos de adicionais e opções
  { test: re("/modifier-groups/reorder"), method: "patch", handle: ({ body: b }) => { reorder(groups, b); return ok(groups); } },
  { test: re("/modifier-groups"), method: "get", handle: () => ok([...groups].sort((a, b) => a.displayOrder - b.displayOrder)) },
  { test: re("/modifier-groups"), method: "post", handle: ({ body: b }) => { const g: VenueModifierGroup = { id: nextId(), organizationId: ORG, nome: body<{ nome: string }>(b).nome, displayOrder: groups.length, active: true, createdAt: now(), updatedAt: now() }; groups.push(g); return ok(g); } },
  { test: re("/modifier-groups/\\d+/options/reorder"), method: "patch", handle: ({ url, body: b }) => { reorder(options, b); return ok(options.filter((o) => o.modifierGroupId === seg(url, 3))); } },
  { test: re("/modifier-groups/\\d+/options"), method: "get", handle: ({ url }) => ok(options.filter((o) => o.modifierGroupId === seg(url, 2)).sort((a, b) => a.displayOrder - b.displayOrder)) },
  { test: re("/modifier-groups/\\d+/options"), method: "post", handle: ({ url, body: b }) => { const groupId = seg(url, 2); const p = body<{ nome: string; priceCents?: number }>(b); const o: VenueModifierOption = { id: nextId(), modifierGroupId: groupId, nome: p.nome, priceCents: p.priceCents ?? 0, displayOrder: options.filter((x) => x.modifierGroupId === groupId).length, active: true, archivedAt: null, createdAt: now(), updatedAt: now() }; options.push(o); return ok(o); } },
  { test: re("/modifier-groups/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const g = groups.find((x) => x.id === seg(url, 2)); if (!g) return notFound(); g.active = Boolean(body<{ active: boolean }>(b).active); return ok(g); } },
  { test: re("/modifier-groups/\\d+"), method: "get", handle: ({ url }) => { const g = groups.find((x) => x.id === seg(url)); return g ? ok(groupDetail(g)) : notFound("Grupo não encontrado"); } },
  { test: re("/modifier-groups/\\d+"), method: "patch", handle: ({ url, body: b }) => { const g = groups.find((x) => x.id === seg(url)); if (!g) return notFound(); Object.assign(g, body<Partial<VenueModifierGroup>>(b), { updatedAt: now() }); return ok(g); } },
  { test: re("/modifier-options/\\d+/archive"), method: "post", handle: ({ url }) => { const o = options.find((x) => x.id === seg(url, 2)); if (!o) return notFound(); o.archivedAt = now(); o.active = false; return ok(o); } },
  { test: re("/modifier-options/\\d+/availability"), method: "patch", handle: ({ url, body: b }) => { const o = options.find((x) => x.id === seg(url, 2)); if (!o) return notFound(); o.active = Boolean(body<{ active: boolean }>(b).active); return ok(o); } },
  { test: re("/modifier-options/\\d+"), method: "patch", handle: ({ url, body: b }) => { const o = options.find((x) => x.id === seg(url)); if (!o) return notFound(); Object.assign(o, body<Partial<VenueModifierOption>>(b), { updatedAt: now() }); return ok(o); } },
  { test: re("/product-modifier-groups/\\d+"), method: "patch", handle: ({ url, body: b }) => { const l = links.find((x) => x.id === seg(url)); if (!l) return notFound(); const p = body<Partial<Link>>(b); Object.assign(l, p, { maxSelect: p.maxSelect === undefined ? null : p.maxSelect, updatedAt: now() }); return ok(linkFull(l)); } },
  { test: re("/product-modifier-groups/\\d+"), method: "delete", handle: ({ url }) => { const i = links.findIndex((x) => x.id === seg(url)); if (i >= 0) links.splice(i, 1); return ok({ ok: true }); } },
];

/** Nomes de produto/variação pro estoque e insights (mesma fonte dos ids). */
export const f2Catalog = { products, variants };
