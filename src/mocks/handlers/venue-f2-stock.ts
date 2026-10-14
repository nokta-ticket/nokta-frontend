import { notFound, type MockHandler, type MockResult } from "./types";
import type {
  VenueInventoryBalance,
  VenueInventoryBalanceStatus,
  VenueInventoryCategory,
  VenueInventoryItem,
  VenueInventoryUnit,
  VenueModifierInventoryComponent,
  VenuePurchase,
  VenuePurchaseItem,
  VenueStockAlert,
  VenueStockCount,
  VenueStockMovement,
  VenueStockMovementType,
  VenueStockSettings,
  VenueStockTransfer,
  VenueSupplier,
  VenueVariantInventoryComponent,
} from "@/services/venue-stock";

/**
 * F2 — Estoque. Unidades 1 (Pinheiros, principal) e 2 (Rooftop) vêm da
 * frente D (dashboard.ts). Quantidades são strings decimais como no backend.
 */
const ORG = 1;
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const now = () => new Date().toISOString();
const seg = (url: URL, offset = 1) => Number(url.pathname.split("/").filter(Boolean).at(-offset));
const ok = (data: unknown): MockResult => ({ data });
const body = <T,>(b: unknown) => (b ?? {}) as T;
const re = (suffix: string) => new RegExp(`/organizations/${ORG}/venue/stock${suffix}$`);
let seq = 8000;
const nextId = () => ++seq;
const dec = (n: number) => String(Math.round(n * 1000) / 1000);

const settings: Record<number, VenueStockSettings> = {
  1: { id: 1, organizationId: ORG, locationId: 1, allowNegativeStock: false, lowStockAlertsEnabled: true, createdAt: ago(200), updatedAt: ago(10) },
  2: { id: 2, organizationId: ORG, locationId: 2, allowNegativeStock: true, lowStockAlertsEnabled: true, createdAt: ago(60), updatedAt: ago(10) },
};

const categories: VenueInventoryCategory[] = [
  { id: 1, organizationId: ORG, nome: "Bebidas", descricao: "Cervejas, destilados e refrigerantes", displayOrder: 0, active: true, archivedAt: null, createdAt: ago(200), updatedAt: ago(5) },
  { id: 2, organizationId: ORG, nome: "Insumos de bar", descricao: "Frutas, xaropes e gelo", displayOrder: 1, active: true, archivedAt: null, createdAt: ago(200), updatedAt: ago(5) },
  { id: 3, organizationId: ORG, nome: "Alimentos", descricao: null, displayOrder: 2, active: true, archivedAt: null, createdAt: ago(200), updatedAt: ago(5) },
  { id: 4, organizationId: ORG, nome: "Descartáveis", descricao: null, displayOrder: 3, active: true, archivedAt: null, createdAt: ago(120), updatedAt: ago(5) },
  { id: 5, organizationId: ORG, nome: "Tabacaria", descricao: "Essências e carvão", displayOrder: 4, active: true, archivedAt: null, createdAt: ago(100), updatedAt: ago(5) },
  { id: 6, organizationId: ORG, nome: "Limpeza", descricao: null, displayOrder: 5, active: false, archivedAt: ago(30), createdAt: ago(150), updatedAt: ago(30) },
];

type ItemSeed = { id: number; nome: string; cat: number | null; unit: VenueInventoryUnit; code?: string; barcode?: string; descricao?: string; archived?: boolean };
const ITEM_SEEDS: ItemSeed[] = [
  { id: 1, nome: "Barril de chopp Pilsen 50 L", cat: 1, unit: "MILLILITER", code: "BAR-PIL-50" },
  { id: 2, nome: "IPA artesanal 473 ml", cat: 1, unit: "UNIT", code: "IPA-473", barcode: "7891234567890" },
  { id: 3, nome: "Long neck Heineken", cat: 1, unit: "UNIT", code: "LN-HEIN", barcode: "7896045506873" },
  { id: 4, nome: "Gin London Dry 750 ml", cat: 1, unit: "MILLILITER", code: "GIN-750" },
  { id: 5, nome: "Cachaça artesanal 1 L", cat: 1, unit: "MILLILITER", code: "CACH-1L" },
  { id: 6, nome: "Vodka 1 L", cat: 1, unit: "MILLILITER", code: "VOD-1L" },
  { id: 7, nome: "Campari 1 L", cat: 1, unit: "MILLILITER", code: "CAMP-1L" },
  { id: 8, nome: "Água mineral 500 ml", cat: 1, unit: "UNIT", code: "AGUA-500", barcode: "7891991010016" },
  { id: 9, nome: "Limão taiti", cat: 2, unit: "GRAM", code: "LIMAO" },
  { id: 10, nome: "Morango", cat: 2, unit: "GRAM", code: "MORANGO" },
  { id: 11, nome: "Açúcar refinado", cat: 2, unit: "GRAM", code: "ACUCAR" },
  { id: 12, nome: "Gelo em cubos", cat: 2, unit: "GRAM", code: "GELO" },
  { id: 13, nome: "Água tônica 350 ml", cat: 2, unit: "UNIT", code: "TONICA-350" },
  { id: 14, nome: "Batata congelada", cat: 3, unit: "GRAM", code: "BATATA" },
  { id: 15, nome: "Queijo brie", cat: 3, unit: "GRAM", code: "BRIE" },
  { id: 16, nome: "Salame italiano", cat: 3, unit: "GRAM", code: "SALAME" },
  { id: 17, nome: "Pão ciabatta", cat: 3, unit: "UNIT", code: "CIABATTA" },
  { id: 18, nome: "Copo descartável 300 ml", cat: 4, unit: "UNIT", code: "COPO-300" },
  { id: 19, nome: "Guardanapo (pacote 50)", cat: 4, unit: "UNIT", code: "GUARD-50" },
  { id: 20, nome: "Essência Ziggy 50 g", cat: 5, unit: "GRAM", code: "ZIGGY-50" },
  { id: 21, nome: "Carvão de coco (caixa 1 kg)", cat: 5, unit: "GRAM", code: "CARVAO" },
  { id: 22, nome: "Papel alumínio narguilé", cat: 5, unit: "UNIT", code: "ALU-NARG" },
  { id: 23, nome: "Detergente 5 L", cat: 6, unit: "MILLILITER", code: "DET-5L", archived: true },
  { id: 24, nome: "Canudo de papel", cat: null, unit: "UNIT", code: "CANUDO" },
];

const items: VenueInventoryItem[] = ITEM_SEEDS.map((s) => ({ id: s.id, organizationId: ORG, categoryId: s.cat, nome: s.nome, descricao: s.descricao ?? null, internalCode: s.code ?? null, barcode: s.barcode ?? null, baseUnit: s.unit, active: !s.archived, archivedAt: s.archived ? ago(30) : null, createdAt: ago(180 - s.id * 2), updatedAt: ago(s.id % 6), category: s.cat ? { id: s.cat, nome: categories.find((c) => c.id === s.cat)!.nome } : null }));

// Saldos por unidade: [onHand, min, target, avgCostCents]
type Bal = { onHand: number; min: number; target: number; cost: number };
const BAL: Record<number, Record<number, Bal>> = {
  1: { 1: { onHand: 32000, min: 50000, target: 150000, cost: 1.1 }, 2: { onHand: 48, min: 24, target: 96, cost: 980 }, 3: { onHand: 0, min: 48, target: 144, cost: 520 }, 4: { onHand: 2250, min: 1500, target: 6000, cost: 9.6 }, 5: { onHand: 800, min: 2000, target: 8000, cost: 4.2 }, 6: { onHand: 4500, min: 1000, target: 5000, cost: 6.5 }, 7: { onHand: 1700, min: 1000, target: 3000, cost: 11.8 }, 8: { onHand: 210, min: 60, target: 240, cost: 110 }, 9: { onHand: 6400, min: 3000, target: 12000, cost: 0.9 }, 10: { onHand: 0, min: 1000, target: 4000, cost: 2.4 }, 11: { onHand: 9800, min: 2000, target: 10000, cost: 0.5 }, 12: { onHand: 42000, min: 20000, target: 80000, cost: 0.3 }, 13: { onHand: 18, min: 36, target: 120, cost: 320 }, 14: { onHand: 15500, min: 5000, target: 20000, cost: 1.6 }, 15: { onHand: 900, min: 500, target: 2000, cost: 9.8 }, 16: { onHand: 450, min: 500, target: 2000, cost: 7.2 }, 17: { onHand: 36, min: 20, target: 60, cost: 240 }, 18: { onHand: 1200, min: 500, target: 3000, cost: 18 }, 19: { onHand: 14, min: 10, target: 40, cost: 650 }, 20: { onHand: 1850, min: 1000, target: 4000, cost: 42 }, 21: { onHand: 0, min: 2000, target: 10000, cost: 2.8 }, 22: { onHand: 60, min: 20, target: 100, cost: 90 }, 24: { onHand: 800, min: 300, target: 1500, cost: 6 } },
  2: { 1: { onHand: 60000, min: 50000, target: 100000, cost: 1.1 }, 3: { onHand: 72, min: 48, target: 144, cost: 520 }, 4: { onHand: 750, min: 750, target: 3000, cost: 9.6 }, 6: { onHand: 2000, min: 1000, target: 3000, cost: 6.5 }, 8: { onHand: 40, min: 60, target: 180, cost: 110 }, 9: { onHand: 2100, min: 2000, target: 6000, cost: 0.9 }, 12: { onHand: 15000, min: 10000, target: 40000, cost: 0.3 }, 13: { onHand: 60, min: 24, target: 96, cost: 320 }, 18: { onHand: 300, min: 500, target: 2000, cost: 18 }, 20: { onHand: 600, min: 500, target: 2000, cost: 42 } },
};
const balances: VenueInventoryBalance[] = [];
let balSeq = 1;
for (const [locId, rows] of Object.entries(BAL)) {
  for (const [itemId, b] of Object.entries(rows)) {
    balances.push({ id: balSeq++, organizationId: ORG, locationId: Number(locId), inventoryItemId: Number(itemId), quantityOnHand: dec(b.onHand), minimumQuantity: dec(b.min), targetQuantity: dec(b.target), averageUnitCostCents: dec(b.cost), updatedAt: ago(Number(itemId) % 5), status: "OK", estimatedValueCents: dec(b.onHand * b.cost), location: { id: Number(locId), nome: Number(locId) === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena" } });
  }
}
function statusOf(b: VenueInventoryBalance): VenueInventoryBalanceStatus {
  const q = Number(b.quantityOnHand);
  if (q <= 0) return "OUT_OF_STOCK";
  return q < Number(b.minimumQuantity) ? "LOW_STOCK" : "OK";
}
function refresh(b: VenueInventoryBalance) {
  b.status = statusOf(b);
  b.estimatedValueCents = dec(Math.max(0, Number(b.quantityOnHand)) * Number(b.averageUnitCostCents));
  b.updatedAt = now();
}
balances.forEach(refresh);
const balanceOf = (locationId: number, itemId: number) => {
  let b = balances.find((x) => x.locationId === locationId && x.inventoryItemId === itemId);
  if (!b) {
    b = { id: balSeq++, organizationId: ORG, locationId, inventoryItemId: itemId, quantityOnHand: "0", minimumQuantity: "0", targetQuantity: "0", averageUnitCostCents: "0", updatedAt: now(), status: "OUT_OF_STOCK", estimatedValueCents: "0", location: { id: locationId, nome: locationId === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena" } };
    balances.push(b);
  }
  return b;
};
const itemRef = (id: number) => { const it = items.find((x) => x.id === id)!; return { id: it.id, nome: it.nome, baseUnit: it.baseUnit }; };
const locRef = (id: number) => ({ id, nome: id === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena" });

const suppliers: VenueSupplier[] = [
  { id: 1, organizationId: ORG, nome: "Distribuidora Paulista de Bebidas", document: "12.345.678/0001-90", contactName: "Sérgio Amaral", phone: "(11) 3333-1000", email: "vendas@dpbebidas.com.br", notes: "Entrega às terças e sextas.", active: true, archivedAt: null, createdAt: ago(200), updatedAt: ago(8) },
  { id: 2, organizationId: ORG, nome: "Hortifruti do Zé", document: null, contactName: "Zé Carlos", phone: "(11) 98888-2020", email: null, notes: null, active: true, archivedAt: null, createdAt: ago(150), updatedAt: ago(3) },
  { id: 3, organizationId: ORG, nome: "Ziggy Essências — Atacado", document: "98.765.432/0001-10", contactName: "Luana", phone: "(11) 97777-3030", email: "atacado@ziggy.com.br", notes: null, active: true, archivedAt: null, createdAt: ago(100), updatedAt: ago(20) },
  { id: 4, organizationId: ORG, nome: "Embalagens Ipiranga", document: null, contactName: null, phone: null, email: "pedidos@embalagensipiranga.com", notes: "Fornecedor antigo.", active: false, archivedAt: ago(40), createdAt: ago(300), updatedAt: ago(40) },
];

const movements: VenueStockMovement[] = [];
let movSeq = 1;
function mov(locationId: number, itemId: number, type: VenueStockMovementType, delta: number, daysAgo: number, opts: { unitCost?: number; reason?: string; refType?: string; refId?: number; balanceAfter?: number } = {}) {
  const b = balanceOf(locationId, itemId);
  movements.push({ id: movSeq++, organizationId: ORG, locationId, inventoryItemId: itemId, type, quantityDelta: dec(delta), balanceAfter: dec(opts.balanceAfter ?? Number(b.quantityOnHand)), unitCostCents: opts.unitCost !== undefined ? dec(opts.unitCost) : null, totalCostCents: opts.unitCost !== undefined ? Math.round(Math.abs(delta) * opts.unitCost) : null, reason: opts.reason ?? null, referenceType: opts.refType ?? null, referenceId: opts.refId ?? null, createdByUserId: 1, createdAt: ago(daysAgo), inventoryItem: itemRef(itemId), location: locRef(locationId) });
}
mov(1, 1, "OPENING", 150000, 60, { unitCost: 1.1, reason: "Saldo inicial" });
mov(1, 1, "PURCHASE", 100000, 9, { unitCost: 1.1, refType: "PURCHASE", refId: 2 });
mov(1, 1, "SALE_CONSUMPTION", -18000, 2);
mov(1, 1, "SALE_CONSUMPTION", -24500, 1);
mov(1, 1, "WASTE", -5000, 1, { reason: "Chopp com espuma excessiva na troca de barril" });
mov(1, 3, "PURCHASE", 144, 20, { unitCost: 520, refType: "PURCHASE", refId: 1 });
mov(1, 3, "SALE_CONSUMPTION", -96, 5);
mov(1, 3, "SALE_CONSUMPTION", -48, 1);
mov(1, 9, "PURCHASE", 10000, 4, { unitCost: 0.9, refType: "PURCHASE", refId: 3 });
mov(1, 9, "SALE_CONSUMPTION", -2400, 2);
mov(1, 9, "WASTE", -1200, 1, { reason: "Limões passados" });
mov(1, 10, "PURCHASE", 4000, 4, { unitCost: 2.4, refType: "PURCHASE", refId: 3 });
mov(1, 10, "SALE_CONSUMPTION", -4000, 1);
mov(1, 4, "ADJUSTMENT_IN", 750, 3, { reason: "Garrafa encontrada no depósito" });
mov(1, 5, "ADJUSTMENT_OUT", -500, 2, { reason: "Quebra na limpeza" });
mov(1, 13, "SALE_CONSUMPTION", -30, 1);
mov(1, 20, "PURCHASE", 2000, 12, { unitCost: 42, refType: "PURCHASE", refId: 1 });
mov(1, 20, "SALE_CONSUMPTION", -150, 0.5);
mov(1, 21, "SALE_CONSUMPTION", -2000, 0.3, { balanceAfter: 0 });
mov(1, 14, "COUNT_ADJUSTMENT", -500, 6, { reason: "Inventário INV-0003", refType: "STOCK_COUNT", refId: 2 });
mov(1, 12, "TRANSFER_OUT", -8000, 7, { refType: "TRANSFER", refId: 1 });
mov(2, 12, "TRANSFER_IN", 8000, 7, { refType: "TRANSFER", refId: 1 });
mov(2, 1, "OPENING", 100000, 40, { unitCost: 1.1 });
mov(2, 1, "SALE_CONSUMPTION", -40000, 1);
mov(2, 8, "SALE_CONSUMPTION", -24, 1);
mov(1, 8, "SALE_REVERSAL", 2, 0.2, { reason: "Comanda M123 cancelada após fechamento" });

const purchases: VenuePurchase[] = [];
function purchase(p: { id: number; locationId: number; supplierId: number | null; status: VenuePurchase["status"]; doc?: string; purchasedDaysAgo: number; receivedDaysAgo?: number; notes?: string; cancel?: string; items: { itemId: number; pkgQty?: number; pkgSize?: number; qty: number; total: number }[] }) {
  const rows: VenuePurchaseItem[] = p.items.map((it) => ({ id: nextId(), purchaseId: p.id, inventoryItemId: it.itemId, packageQuantity: it.pkgQty !== undefined ? dec(it.pkgQty) : null, packageSizeBase: it.pkgSize !== undefined ? dec(it.pkgSize) : null, quantityBase: dec(it.qty), totalCostCents: it.total, unitCostCents: dec(it.total / it.qty), createdAt: ago(p.purchasedDaysAgo), updatedAt: ago(p.purchasedDaysAgo), inventoryItem: itemRef(it.itemId) }));
  const sup = p.supplierId ? suppliers.find((s) => s.id === p.supplierId) : null;
  purchases.push({ id: p.id, organizationId: ORG, locationId: p.locationId, supplierId: p.supplierId, publicCode: `CP-${String(p.id).padStart(4, "0")}`, status: p.status, documentNumber: p.doc ?? null, purchasedAt: ago(p.purchasedDaysAgo), receivedAt: p.receivedDaysAgo !== undefined ? ago(p.receivedDaysAgo) : null, totalCostCents: rows.reduce((s, r) => s + r.totalCostCents, 0), notes: p.notes ?? null, createdByUserId: 1, receivedByUserId: p.receivedDaysAgo !== undefined ? 1 : null, canceledByUserId: p.cancel ? 1 : null, cancelReason: p.cancel ?? null, canceledAt: p.cancel ? ago(p.purchasedDaysAgo - 1) : null, createdAt: ago(p.purchasedDaysAgo), updatedAt: ago(p.receivedDaysAgo ?? p.purchasedDaysAgo), supplier: sup ? { id: sup.id, nome: sup.nome } : null, items: rows });
}
purchase({ id: 1, locationId: 1, supplierId: 1, status: "RECEIVED", doc: "NF 48211", purchasedDaysAgo: 20, receivedDaysAgo: 20, items: [{ itemId: 3, pkgQty: 6, pkgSize: 24, qty: 144, total: 74880 }, { itemId: 20, pkgQty: 40, pkgSize: 50, qty: 2000, total: 84000 }] });
purchase({ id: 2, locationId: 1, supplierId: 1, status: "RECEIVED", doc: "NF 48930", purchasedDaysAgo: 9, receivedDaysAgo: 9, notes: "Dois barris, um ficou na câmara fria.", items: [{ itemId: 1, pkgQty: 2, pkgSize: 50000, qty: 100000, total: 110000 }, { itemId: 13, pkgQty: 5, pkgSize: 12, qty: 60, total: 19200 }] });
purchase({ id: 3, locationId: 1, supplierId: 2, status: "RECEIVED", purchasedDaysAgo: 4, receivedDaysAgo: 4, items: [{ itemId: 9, qty: 10000, total: 9000 }, { itemId: 10, qty: 4000, total: 9600 }] });
purchase({ id: 4, locationId: 1, supplierId: 3, status: "DRAFT", doc: "Pedido 2210", purchasedDaysAgo: 1, notes: "Aguardando entrega na quinta.", items: [{ itemId: 20, pkgQty: 60, pkgSize: 50, qty: 3000, total: 126000 }, { itemId: 21, pkgQty: 10, pkgSize: 1000, qty: 10000, total: 28000 }] });
purchase({ id: 5, locationId: 1, supplierId: 4, status: "CANCELED", purchasedDaysAgo: 30, cancel: "Fornecedor não entregou no prazo", items: [{ itemId: 18, pkgQty: 10, pkgSize: 100, qty: 1000, total: 18000 }] });
purchase({ id: 6, locationId: 2, supplierId: 1, status: "DRAFT", purchasedDaysAgo: 2, items: [{ itemId: 8, pkgQty: 10, pkgSize: 12, qty: 120, total: 13200 }] });

const counts: VenueStockCount[] = [
  { id: 1, organizationId: ORG, locationId: 1, publicCode: "INV-0004", status: "DRAFT", notes: "Contagem semanal do bar", startedByUserId: 1, completedByUserId: null, startedAt: ago(0.1), completedAt: null, canceledAt: null, createdAt: ago(0.1), updatedAt: ago(0.1), items: [1, 2, 3, 4, 5, 6, 7, 13].map((itemId) => ({ id: nextId(), stockCountId: 1, inventoryItemId: itemId, expectedQuantity: balanceOf(1, itemId).quantityOnHand, countedQuantity: itemId === 2 ? "46" : itemId === 4 ? "2250" : null, differenceQuantity: itemId === 2 ? "-2" : itemId === 4 ? "0" : null, createdAt: ago(0.1), updatedAt: ago(0.1), inventoryItem: itemRef(itemId) })) },
  { id: 2, organizationId: ORG, locationId: 1, publicCode: "INV-0003", status: "COMPLETED", notes: "Cozinha", startedByUserId: 1, completedByUserId: 1, startedAt: ago(6.2), completedAt: ago(6), canceledAt: null, createdAt: ago(6.2), updatedAt: ago(6), items: [{ id: nextId(), stockCountId: 2, inventoryItemId: 14, expectedQuantity: "16000", countedQuantity: "15500", differenceQuantity: "-500", createdAt: ago(6), updatedAt: ago(6), inventoryItem: itemRef(14) }, { id: nextId(), stockCountId: 2, inventoryItemId: 15, expectedQuantity: "900", countedQuantity: "900", differenceQuantity: "0", createdAt: ago(6), updatedAt: ago(6), inventoryItem: itemRef(15) }, { id: nextId(), stockCountId: 2, inventoryItemId: 17, expectedQuantity: "36", countedQuantity: "36", differenceQuantity: "0", createdAt: ago(6), updatedAt: ago(6), inventoryItem: itemRef(17) }] },
  { id: 3, organizationId: ORG, locationId: 1, publicCode: "INV-0002", status: "CANCELED", notes: null, startedByUserId: 1, completedByUserId: null, startedAt: ago(15), completedAt: null, canceledAt: ago(14.9), createdAt: ago(15), updatedAt: ago(14.9), items: [] },
];

const transfers: VenueStockTransfer[] = [
  { id: 1, organizationId: ORG, publicCode: "TR-0001", fromLocationId: 1, toLocationId: 2, status: "RECEIVED", notes: "Gelo pro evento de sábado", createdByUserId: 1, sentByUserId: 1, receivedByUserId: 1, sentAt: ago(7.1), receivedAt: ago(7), canceledAt: null, createdAt: ago(7.2), updatedAt: ago(7), fromLocation: locRef(1), toLocation: locRef(2), items: [{ id: nextId(), transferId: 1, inventoryItemId: 12, quantity: "8000", unitCostCents: "0.3", createdAt: ago(7.2), updatedAt: ago(7.2), inventoryItem: itemRef(12) }] },
  { id: 2, organizationId: ORG, publicCode: "TR-0002", fromLocationId: 1, toLocationId: 2, status: "SENT", notes: null, createdByUserId: 1, sentByUserId: 1, receivedByUserId: null, sentAt: ago(0.4), receivedAt: null, canceledAt: null, createdAt: ago(0.5), updatedAt: ago(0.4), fromLocation: locRef(1), toLocation: locRef(2), items: [{ id: nextId(), transferId: 2, inventoryItemId: 3, quantity: "24", unitCostCents: "520", createdAt: ago(0.5), updatedAt: ago(0.5), inventoryItem: itemRef(3) }, { id: nextId(), transferId: 2, inventoryItemId: 13, quantity: "12", unitCostCents: "320", createdAt: ago(0.5), updatedAt: ago(0.5), inventoryItem: itemRef(13) }] },
  { id: 3, organizationId: ORG, publicCode: "TR-0003", fromLocationId: 2, toLocationId: 1, status: "DRAFT", notes: "Devolver sobras do rooftop", createdByUserId: 1, sentByUserId: null, receivedByUserId: null, sentAt: null, receivedAt: null, canceledAt: null, createdAt: ago(0.1), updatedAt: ago(0.1), fromLocation: locRef(2), toLocation: locRef(1), items: [{ id: nextId(), transferId: 3, inventoryItemId: 1, quantity: "20000", unitCostCents: "1.1", createdAt: ago(0.1), updatedAt: ago(0.1), inventoryItem: itemRef(1) }] },
];

const variantComponents = new Map<number, VenueVariantInventoryComponent[]>([
  [11, [{ id: nextId(), organizationId: ORG, variantId: 11, inventoryItemId: 1, quantityPerSale: "300", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(1) }]],
  [12, [{ id: nextId(), organizationId: ORG, variantId: 12, inventoryItemId: 1, quantityPerSale: "500", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(1) }]],
  [13, [{ id: nextId(), organizationId: ORG, variantId: 13, inventoryItemId: 1, quantityPerSale: "1000", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(1) }]],
  [21, [{ id: nextId(), organizationId: ORG, variantId: 21, inventoryItemId: 2, quantityPerSale: "1", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(2) }]],
  [41, [{ id: nextId(), organizationId: ORG, variantId: 41, inventoryItemId: 5, quantityPerSale: "60", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(5) }, { id: nextId(), organizationId: ORG, variantId: 41, inventoryItemId: 9, quantityPerSale: "80", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(9) }, { id: nextId(), organizationId: ORG, variantId: 41, inventoryItemId: 11, quantityPerSale: "20", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(11) }, { id: nextId(), organizationId: ORG, variantId: 41, inventoryItemId: 12, quantityPerSale: "150", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(12) }]],
  [61, [{ id: nextId(), organizationId: ORG, variantId: 61, inventoryItemId: 4, quantityPerSale: "50", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(4) }, { id: nextId(), organizationId: ORG, variantId: 61, inventoryItemId: 13, quantityPerSale: "1", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(13) }]],
  [91, [{ id: nextId(), organizationId: ORG, variantId: 91, inventoryItemId: 14, quantityPerSale: "300", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(14) }]],
  [92, [{ id: nextId(), organizationId: ORG, variantId: 92, inventoryItemId: 14, quantityPerSale: "500", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(14) }]],
  [121, [{ id: nextId(), organizationId: ORG, variantId: 121, inventoryItemId: 8, quantityPerSale: "1", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(8) }]],
]);
const modifierComponents = new Map<number, VenueModifierInventoryComponent[]>([
  [2, [{ id: nextId(), organizationId: ORG, modifierOptionId: 2, inventoryItemId: 10, quantityPerSelection: "60", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(10) }]],
  [8, [{ id: nextId(), organizationId: ORG, modifierOptionId: 8, inventoryItemId: 15, quantityPerSelection: "40", createdAt: ago(100), updatedAt: ago(100), inventoryItem: itemRef(15) }]],
]);

function summary(locationId: number) {
  const rows = balances.filter((b) => b.locationId === locationId && items.find((i) => i.id === b.inventoryItemId)?.active);
  return { totalItems: rows.length, lowStockCount: rows.filter((b) => b.status === "LOW_STOCK").length, outOfStockCount: rows.filter((b) => b.status === "OUT_OF_STOCK").length, estimatedValueCents: Math.round(rows.reduce((s, b) => s + Number(b.estimatedValueCents), 0)) };
}
function alerts(locationId: number): VenueStockAlert[] {
  return balances.filter((b) => b.locationId === locationId && b.status !== "OK" && items.find((i) => i.id === b.inventoryItemId)?.active).map((b) => {
    const it = items.find((i) => i.id === b.inventoryItemId)!;
    const need = Math.max(0, Number(b.targetQuantity) - Number(b.quantityOnHand));
    const lastPurchase = purchases.filter((p) => p.status === "RECEIVED" && p.items.some((x) => x.inventoryItemId === it.id)).sort((a, c) => c.purchasedAt.localeCompare(a.purchasedAt))[0];
    return { inventoryItemId: it.id, nome: it.nome, baseUnit: it.baseUnit, status: b.status, quantityOnHand: b.quantityOnHand, minimumQuantity: b.minimumQuantity, targetQuantity: b.targetQuantity, averageUnitCostCents: b.averageUnitCostCents, replenishmentSuggestion: dec(need), estimatedReplenishmentCostCents: Math.round(need * Number(b.averageUnitCostCents)), latestSupplier: lastPurchase?.supplier ?? null };
  }).sort((a, b) => (a.status === b.status ? 0 : a.status === "OUT_OF_STOCK" ? -1 : 1));
}
function apply(locationId: number, itemId: number, type: VenueStockMovementType, delta: number, opts: { unitCost?: number; reason?: string; refType?: string; refId?: number } = {}) {
  const b = balanceOf(locationId, itemId);
  b.quantityOnHand = dec(Number(b.quantityOnHand) + delta);
  if (opts.unitCost !== undefined && delta > 0) b.averageUnitCostCents = dec(opts.unitCost);
  refresh(b);
  mov(locationId, itemId, type, delta, 0, { ...opts, balanceAfter: Number(b.quantityOnHand) });
}
const paginate = <T,>(list: T[], params: Record<string, string>) => { const page = Math.max(1, Number(params.page ?? 1)); const limit = Number(params.limit ?? 20); return { data: list.slice((page - 1) * limit, page * limit), page, limit, total: list.length }; };

export const f2StockHandlers: MockHandler[] = [
  // Configurações
  { test: re("/locations/\\d+/settings"), method: "get", handle: ({ url }) => ok(settings[seg(url, 2)] ?? { ...settings[1], locationId: seg(url, 2) }) },
  { test: re("/locations/\\d+/settings"), method: "patch", handle: ({ url, body: b }) => { const id = seg(url, 2); settings[id] = { ...(settings[id] ?? settings[1]), locationId: id, ...body<object>(b), updatedAt: now() }; return ok(settings[id]); } },

  // Categorias
  { test: re("/categories/reorder"), method: "patch", handle: ({ body: b }) => { for (const it of body<{ items?: { id: number; displayOrder: number }[] }>(b).items ?? []) { const c = categories.find((x) => x.id === it.id); if (c) c.displayOrder = it.displayOrder; } return ok(categories); } },
  { test: re("/categories"), method: "get", handle: ({ params }) => ok(categories.filter((c) => params.includeArchived === "true" || !c.archivedAt).sort((a, b) => a.displayOrder - b.displayOrder)) },
  { test: re("/categories"), method: "post", handle: ({ body: b }) => { const p = body<{ nome: string; descricao?: string }>(b); const c: VenueInventoryCategory = { id: nextId(), organizationId: ORG, nome: p.nome, descricao: p.descricao ?? null, displayOrder: categories.length, active: true, archivedAt: null, createdAt: now(), updatedAt: now() }; categories.push(c); return ok(c); } },
  { test: re("/categories/\\d+/archive"), method: "post", handle: ({ url }) => { const c = categories.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); c.active = false; c.archivedAt = now(); return ok(c); } },
  { test: re("/categories/\\d+"), method: "patch", handle: ({ url, body: b }) => { const c = categories.find((x) => x.id === seg(url)); if (!c) return notFound(); Object.assign(c, body<object>(b), { updatedAt: now() }); items.filter((i) => i.categoryId === c.id).forEach((i) => (i.category = { id: c.id, nome: c.nome })); return ok(c); } },

  // Itens
  { test: re("/items"), method: "get", handle: ({ params }) => { const search = (params.search ?? "").trim().toLowerCase(); const status = params.status; const list = items.filter((i) => (status === "ARCHIVED" ? !i.active : status === "ACTIVE" ? i.active : true) && (!params.categoryId || i.categoryId === Number(params.categoryId)) && (!search || `${i.nome} ${i.internalCode ?? ""} ${i.barcode ?? ""}`.toLowerCase().includes(search))).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")); return ok(paginate(list, params)); } },
  {
    test: re("/items"),
    method: "post",
    handle: ({ body: b }) => {
      const p = body<{ nome: string; categoryId?: number; descricao?: string; internalCode?: string; barcode?: string; baseUnit: VenueInventoryUnit; openingLocationId?: number; openingQuantity?: string; openingTotalCostCents?: number }>(b);
      const cat = p.categoryId ? categories.find((c) => c.id === p.categoryId) : null;
      const it: VenueInventoryItem = { id: nextId(), organizationId: ORG, categoryId: cat?.id ?? null, nome: p.nome, descricao: p.descricao ?? null, internalCode: p.internalCode ?? null, barcode: p.barcode ?? null, baseUnit: p.baseUnit, active: true, archivedAt: null, createdAt: now(), updatedAt: now(), category: cat ? { id: cat.id, nome: cat.nome } : null };
      items.push(it);
      if (p.openingLocationId && p.openingQuantity && Number(p.openingQuantity) > 0) apply(p.openingLocationId, it.id, "OPENING", Number(p.openingQuantity), { unitCost: p.openingTotalCostCents ? p.openingTotalCostCents / Number(p.openingQuantity) : undefined, reason: "Saldo inicial" });
      return ok(it);
    },
  },
  { test: re("/items/\\d+/balances"), method: "get", handle: ({ url }) => ok(balances.filter((b) => b.inventoryItemId === seg(url, 2))) },
  { test: re("/items/\\d+/movements"), method: "get", handle: ({ url }) => ok(movements.filter((m) => m.inventoryItemId === seg(url, 2)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))) },
  { test: re("/items/\\d+/archive"), method: "post", handle: ({ url }) => { const it = items.find((x) => x.id === seg(url, 2)); if (!it) return notFound(); it.active = false; it.archivedAt = now(); return ok(it); } },
  { test: re("/items/\\d+"), method: "get", handle: ({ url }) => { const it = items.find((x) => x.id === seg(url)); return it ? ok(it) : notFound("Item não encontrado"); } },
  { test: re("/items/\\d+"), method: "patch", handle: ({ url, body: b }) => { const it = items.find((x) => x.id === seg(url)); if (!it) return notFound(); const p = body<Partial<VenueInventoryItem>>(b); Object.assign(it, p, { updatedAt: now() }); if (p.categoryId !== undefined) { const cat = categories.find((c) => c.id === p.categoryId); it.categoryId = cat?.id ?? null; it.category = cat ? { id: cat.id, nome: cat.nome } : null; } return ok(it); } },
  { test: re("/locations/\\d+/items/\\d+/thresholds"), method: "patch", handle: ({ url, body: b }) => { const bal = balanceOf(seg(url, 4), seg(url, 2)); const p = body<{ minimumQuantity: string; targetQuantity: string }>(b); bal.minimumQuantity = p.minimumQuantity; bal.targetQuantity = p.targetQuantity; refresh(bal); return ok(bal); } },
  { test: re("/locations/\\d+/items/\\d+/(waste|adjustment-in|adjustment-out)"), method: "post", handle: ({ url, body: b }) => { const kind = url.pathname.split("/").at(-1); const p = body<{ quantity: string; reason: string; notes?: string }>(b); const qty = Number(p.quantity); const locationId = seg(url, 4); const itemId = seg(url, 2); const type: VenueStockMovementType = kind === "waste" ? "WASTE" : kind === "adjustment-in" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT"; const delta = type === "ADJUSTMENT_IN" ? qty : -qty; if (!settings[locationId]?.allowNegativeStock && Number(balanceOf(locationId, itemId).quantityOnHand) + delta < 0) return { status: 400, data: { message: "Essa saída deixaria o saldo negativo. Confira a quantidade ou libere saldo negativo nas configurações da unidade." } }; apply(locationId, itemId, type, delta, { reason: [p.reason, p.notes].filter(Boolean).join(" — ") }); return ok(movements[movements.length - 1]); } },

  // Fornecedores
  { test: re("/suppliers"), method: "get", handle: ({ params }) => ok(suppliers.filter((s) => params.includeArchived === "true" || !s.archivedAt)) },
  { test: re("/suppliers"), method: "post", handle: ({ body: b }) => { const p = body<Partial<VenueSupplier> & { nome: string }>(b); const s: VenueSupplier = { id: nextId(), organizationId: ORG, nome: p.nome, document: p.document ?? null, contactName: p.contactName ?? null, phone: p.phone ?? null, email: p.email ?? null, notes: p.notes ?? null, active: true, archivedAt: null, createdAt: now(), updatedAt: now() }; suppliers.push(s); return ok(s); } },
  { test: re("/suppliers/\\d+/archive"), method: "post", handle: ({ url }) => { const s = suppliers.find((x) => x.id === seg(url, 2)); if (!s) return notFound(); s.active = false; s.archivedAt = now(); return ok(s); } },
  { test: re("/suppliers/\\d+"), method: "get", handle: ({ url }) => { const s = suppliers.find((x) => x.id === seg(url)); if (!s) return notFound(); const mine = purchases.filter((p) => p.supplierId === s.id && p.status !== "CANCELED").sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)); const last = mine[0]; return ok({ ...s, purchaseCount: mine.length, lastPurchase: last ? { id: last.id, publicCode: last.publicCode, receivedAt: last.receivedAt, totalCostCents: last.totalCostCents } : null }); } },
  { test: re("/suppliers/\\d+"), method: "patch", handle: ({ url, body: b }) => { const s = suppliers.find((x) => x.id === seg(url)); if (!s) return notFound(); Object.assign(s, body<object>(b), { updatedAt: now() }); purchases.filter((p) => p.supplierId === s.id).forEach((p) => (p.supplier = { id: s.id, nome: s.nome })); return ok(s); } },

  // Compras
  { test: re("/locations/\\d+/purchases"), method: "get", handle: ({ url, params }) => ok(paginate(purchases.filter((p) => p.locationId === seg(url, 2) && (!params.status || p.status === params.status)).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)), params)) },
  {
    test: re("/locations/\\d+/purchases"),
    method: "post",
    handle: ({ url, body: b }) => {
      const locationId = seg(url, 2);
      const p = body<{ supplierId?: number; documentNumber?: string; purchasedAt?: string; notes?: string; items: { inventoryItemId: number; packageQuantity?: string; packageSizeBase?: string; quantityBase?: string; totalCostCents: number }[] }>(b);
      if (!p.items?.length) return { status: 400, data: { message: "Adicione ao menos um item à compra." } };
      const id = nextId();
      const rows: VenuePurchaseItem[] = p.items.map((it) => { const qty = it.quantityBase ? Number(it.quantityBase) : Number(it.packageQuantity ?? 0) * Number(it.packageSizeBase ?? 0); return { id: nextId(), purchaseId: id, inventoryItemId: it.inventoryItemId, packageQuantity: it.packageQuantity ?? null, packageSizeBase: it.packageSizeBase ?? null, quantityBase: dec(qty), totalCostCents: it.totalCostCents, unitCostCents: dec(qty > 0 ? it.totalCostCents / qty : 0), createdAt: now(), updatedAt: now(), inventoryItem: itemRef(it.inventoryItemId) }; });
      const sup = p.supplierId ? suppliers.find((s) => s.id === p.supplierId) : null;
      const pur: VenuePurchase = { id, organizationId: ORG, locationId, supplierId: sup?.id ?? null, publicCode: `CP-${String(id).padStart(4, "0")}`, status: "DRAFT", documentNumber: p.documentNumber ?? null, purchasedAt: p.purchasedAt ?? now(), receivedAt: null, totalCostCents: rows.reduce((s, r) => s + r.totalCostCents, 0), notes: p.notes ?? null, createdByUserId: 1, receivedByUserId: null, canceledByUserId: null, cancelReason: null, canceledAt: null, createdAt: now(), updatedAt: now(), supplier: sup ? { id: sup.id, nome: sup.nome } : null, items: rows };
      purchases.unshift(pur);
      return ok(pur);
    },
  },
  { test: re("/purchases/\\d+/cancel"), method: "post", handle: ({ url, body: b }) => { const p = purchases.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); if (p.status === "RECEIVED") return { status: 400, data: { message: "Compra já recebida não pode ser cancelada." } }; p.status = "CANCELED"; p.canceledAt = now(); p.canceledByUserId = 1; p.cancelReason = body<{ reason?: string }>(b).reason ?? null; return ok(p); } },
  { test: re("/purchases/\\d+/receive"), method: "post", handle: ({ url }) => { const p = purchases.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); if (p.status !== "DRAFT") return { status: 400, data: { message: "Só compras em rascunho podem ser recebidas." } }; p.status = "RECEIVED"; p.receivedAt = now(); p.receivedByUserId = 1; for (const row of p.items) apply(p.locationId, row.inventoryItemId, "PURCHASE", Number(row.quantityBase), { unitCost: Number(row.unitCostCents), refType: "PURCHASE", refId: p.id }); return ok(p); } },
  { test: re("/purchases/\\d+"), method: "get", handle: ({ url }) => { const p = purchases.find((x) => x.id === seg(url)); return p ? ok(p) : notFound("Compra não encontrada"); } },
  { test: re("/purchases/\\d+"), method: "patch", handle: ({ url, body: b }) => { const p = purchases.find((x) => x.id === seg(url)); if (!p) return notFound(); Object.assign(p, body<object>(b), { updatedAt: now() }); return ok(p); } },

  // Ficha técnica
  { test: re("/variants/\\d+/inventory-components"), method: "get", handle: ({ url }) => ok({ components: variantComponents.get(seg(url, 2)) ?? [] }) },
  { test: re("/variants/\\d+/inventory-components"), method: "put", handle: ({ url, body: b }) => { const variantId = seg(url, 2); const rows = (body<{ components?: { inventoryItemId: number; quantityPerSale: string }[] }>(b).components ?? []).map((c) => ({ id: nextId(), organizationId: ORG, variantId, inventoryItemId: c.inventoryItemId, quantityPerSale: c.quantityPerSale, createdAt: now(), updatedAt: now(), inventoryItem: itemRef(c.inventoryItemId) })); variantComponents.set(variantId, rows); return ok(rows); } },
  { test: re("/modifier-options/\\d+/inventory-components"), method: "get", handle: ({ url }) => ok({ components: modifierComponents.get(seg(url, 2)) ?? [] }) },
  { test: re("/modifier-options/\\d+/inventory-components"), method: "put", handle: ({ url, body: b }) => { const optionId = seg(url, 2); const rows = (body<{ components?: { inventoryItemId: number; quantityPerSelection: string }[] }>(b).components ?? []).map((c) => ({ id: nextId(), organizationId: ORG, modifierOptionId: optionId, inventoryItemId: c.inventoryItemId, quantityPerSelection: c.quantityPerSelection, createdAt: now(), updatedAt: now(), inventoryItem: itemRef(c.inventoryItemId) })); modifierComponents.set(optionId, rows); return ok(rows); } },

  // Movimentações
  { test: re("/locations/\\d+/movements"), method: "get", handle: ({ url, params }) => { const locationId = seg(url, 2); const list = movements.filter((m) => m.locationId === locationId && (!params.inventoryItemId || m.inventoryItemId === Number(params.inventoryItemId)) && (!params.type || m.type === params.type) && (!params.startDate || m.createdAt >= params.startDate) && (!params.endDate || m.createdAt <= `${params.endDate}T23:59:59.999Z`)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return ok(paginate(list, params)); } },

  // Inventário
  { test: re("/locations/\\d+/counts"), method: "get", handle: ({ url, params }) => ok(counts.filter((c) => c.locationId === seg(url, 2) && (!params.status || c.status === params.status)).sort((a, b) => b.startedAt.localeCompare(a.startedAt))) },
  { test: re("/locations/\\d+/counts"), method: "post", handle: ({ url, body: b }) => { const locationId = seg(url, 2); const p = body<{ categoryId?: number; notes?: string }>(b); const id = nextId(); const scope = items.filter((i) => i.active && (!p.categoryId || i.categoryId === p.categoryId)); const c: VenueStockCount = { id, organizationId: ORG, locationId, publicCode: `INV-${String(id).padStart(4, "0")}`, status: "DRAFT", notes: p.notes ?? null, startedByUserId: 1, completedByUserId: null, startedAt: now(), completedAt: null, canceledAt: null, createdAt: now(), updatedAt: now(), items: scope.map((i) => ({ id: nextId(), stockCountId: id, inventoryItemId: i.id, expectedQuantity: balanceOf(locationId, i.id).quantityOnHand, countedQuantity: null, differenceQuantity: null, createdAt: now(), updatedAt: now(), inventoryItem: itemRef(i.id) })) }; counts.unshift(c); return ok(c); } },
  { test: re("/counts/\\d+/items"), method: "patch", handle: ({ url, body: b }) => { const c = counts.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); for (const row of body<{ items?: { inventoryItemId: number; countedQuantity?: string }[] }>(b).items ?? []) { const it = c.items.find((x) => x.inventoryItemId === row.inventoryItemId); if (!it) continue; it.countedQuantity = row.countedQuantity ?? null; it.differenceQuantity = row.countedQuantity !== undefined && row.countedQuantity !== "" ? dec(Number(row.countedQuantity) - Number(it.expectedQuantity)) : null; it.updatedAt = now(); } c.updatedAt = now(); return ok(c); } },
  { test: re("/counts/\\d+/cancel"), method: "post", handle: ({ url }) => { const c = counts.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); c.status = "CANCELED"; c.canceledAt = now(); return ok(c); } },
  { test: re("/counts/\\d+/complete"), method: "post", handle: ({ url }) => { const c = counts.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); if (c.items.some((i) => i.countedQuantity === null)) return { status: 400, data: { message: "Informe a quantidade contada de todos os itens antes de concluir." } }; c.status = "COMPLETED"; c.completedAt = now(); c.completedByUserId = 1; for (const it of c.items) { const diff = Number(it.differenceQuantity ?? 0); if (diff !== 0) apply(c.locationId, it.inventoryItemId, "COUNT_ADJUSTMENT", diff, { reason: `Inventário ${c.publicCode}`, refType: "STOCK_COUNT", refId: c.id }); } return ok(c); } },
  { test: re("/counts/\\d+"), method: "get", handle: ({ url }) => { const c = counts.find((x) => x.id === seg(url)); return c ? ok(c) : notFound("Contagem não encontrada"); } },

  // Transferências
  { test: re("/transfers"), method: "get", handle: ({ params }) => ok(transfers.filter((t) => !params.status || t.status === params.status).sort((a, b) => b.createdAt.localeCompare(a.createdAt))) },
  { test: re("/transfers"), method: "post", handle: ({ body: b }) => { const p = body<{ fromLocationId: number; toLocationId: number; notes?: string; items: { inventoryItemId: number; quantity: string }[] }>(b); if (p.fromLocationId === p.toLocationId) return { status: 400, data: { message: "Origem e destino precisam ser unidades diferentes." } }; const id = nextId(); const t: VenueStockTransfer = { id, organizationId: ORG, publicCode: `TR-${String(id).padStart(4, "0")}`, fromLocationId: p.fromLocationId, toLocationId: p.toLocationId, status: "DRAFT", notes: p.notes ?? null, createdByUserId: 1, sentByUserId: null, receivedByUserId: null, sentAt: null, receivedAt: null, canceledAt: null, createdAt: now(), updatedAt: now(), fromLocation: locRef(p.fromLocationId), toLocation: locRef(p.toLocationId), items: (p.items ?? []).map((it) => ({ id: nextId(), transferId: id, inventoryItemId: it.inventoryItemId, quantity: it.quantity, unitCostCents: balanceOf(p.fromLocationId, it.inventoryItemId).averageUnitCostCents, createdAt: now(), updatedAt: now(), inventoryItem: itemRef(it.inventoryItemId) })) }; transfers.unshift(t); return ok(t); } },
  { test: re("/transfers/\\d+/cancel"), method: "post", handle: ({ url }) => { const t = transfers.find((x) => x.id === seg(url, 2)); if (!t) return notFound(); t.status = "CANCELED"; t.canceledAt = now(); return ok(t); } },
  { test: re("/transfers/\\d+/send"), method: "post", handle: ({ url }) => { const t = transfers.find((x) => x.id === seg(url, 2)); if (!t) return notFound(); t.status = "SENT"; t.sentAt = now(); t.sentByUserId = 1; for (const it of t.items) apply(t.fromLocationId, it.inventoryItemId, "TRANSFER_OUT", -Number(it.quantity), { refType: "TRANSFER", refId: t.id }); return ok(t); } },
  { test: re("/transfers/\\d+/receive"), method: "post", handle: ({ url }) => { const t = transfers.find((x) => x.id === seg(url, 2)); if (!t) return notFound(); t.status = "RECEIVED"; t.receivedAt = now(); t.receivedByUserId = 1; for (const it of t.items) apply(t.toLocationId, it.inventoryItemId, "TRANSFER_IN", Number(it.quantity), { unitCost: Number(it.unitCostCents), refType: "TRANSFER", refId: t.id }); return ok(t); } },
  { test: re("/transfers/\\d+"), method: "get", handle: ({ url }) => { const t = transfers.find((x) => x.id === seg(url)); return t ? ok(t) : notFound("Transferência não encontrada"); } },
  { test: re("/transfers/\\d+"), method: "patch", handle: ({ url, body: b }) => { const t = transfers.find((x) => x.id === seg(url)); if (!t) return notFound(); const p = body<{ notes?: string; items?: { inventoryItemId: number; quantity: string }[] }>(b); if (p.notes !== undefined) t.notes = p.notes; if (p.items) t.items = p.items.map((it) => ({ id: nextId(), transferId: t.id, inventoryItemId: it.inventoryItemId, quantity: it.quantity, unitCostCents: balanceOf(t.fromLocationId, it.inventoryItemId).averageUnitCostCents, createdAt: now(), updatedAt: now(), inventoryItem: itemRef(it.inventoryItemId) })); t.updatedAt = now(); return ok(t); } },

  // Resumo e alertas
  { test: re("/locations/\\d+/summary"), method: "get", handle: ({ url }) => ok(summary(seg(url, 2))) },
  { test: re("/locations/\\d+/alerts"), method: "get", handle: ({ url }) => ok(alerts(seg(url, 2))) },
];

/** Exposto pros insights de estoque (mesmos números das abas). */
export const f2Stock = { items, balances, purchases, suppliers, movements, summary, alerts, categories };
