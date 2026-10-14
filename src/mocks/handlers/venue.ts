import type { MockHandler } from "./types";
import { notFound } from "./types";
import { f2Handlers } from "./venue-f2";
import type {
  VenueArea,
  VenueCashRegister,
  VenueCashSession,
  VenueCashSessionDetail,
  VenueDevice,
  VenueLocation,
  VenueOrder,
  VenueOrderItem,
  VenueOrderItemStatus,
  VenuePayment,
  VenuePaymentMethod,
  VenuePreparationItem,
  VenueTab,
  VenueTabDetail,
  VenueTabListItem,
  VenueTable,
  VenueTabType,
} from "@/services/venue-operation";
import type {
  VenueAvailabilityResponse,
  VenueReservation,
  VenueReservationGuest,
  VenueReservationStatus,
  VenueReservationsSummary,
  VenueWaitlistEntry,
} from "@/services/venue-reservations";
import type { VenueReview } from "@/services/venue-reviews";
import type { VenueSetupStatus } from "@/services/venue-setup";
import type { VenueHomeResponse } from "@/services/venue-home";
import type { PublicMenuItem, PublicMenuResponse } from "@/services/venue-menu-public";
import type { VenueHomePageData } from "@/services/venue-home-public";
import type { VenueReviewPageData } from "@/services/venue-review-public";

// ── F1: operação/reservas/públicas — fixtures e estado em memória ─────────
// Estado mutável de propósito: abrir comanda, lançar pedido, receber e
// fechar caixa precisam "acontecer" pra testar o fluxo inteiro sem backend.
const F1_MIN = 60_000;
const f1Ago = (minutes: number) => new Date(Date.now() - minutes * F1_MIN).toISOString();
/** "Há N minutos", mas nunca antes das 00:10 de hoje — encerradas de "hoje" continuam de hoje mesmo de madrugada. */
const f1AgoToday = (minutes: number) => {
  const start = new Date();
  start.setHours(0, 10, 0, 0);
  return new Date(Math.max(Date.now() - minutes * F1_MIN, start.getTime())).toISOString();
};
const f1TodayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const f1Today = () => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
const f1At = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`).toISOString();
const f1Last = (pathname: string, offset = 1) => pathname.split("/").filter(Boolean).at(-offset) ?? "";
const f1Num = (pathname: string, offset = 1) => Number(f1Last(pathname, offset));
let f1Seq = 900;
const f1NextId = () => ++f1Seq;
const f1Code = () => Math.random().toString(36).slice(2, 6).toUpperCase();

const F1_LOCATION: VenueLocation = {
  id: 1,
  organizationId: 1,
  nome: "Nokta Bar",
  slug: "nokta-bar",
  descricao: null,
  endereco: "Rua Augusta, 1200 — Consolação, São Paulo/SP",
  telefone: "+5511999999999",
  active: true,
  isMain: true,
  timezone: "America/Sao_Paulo",
  defaultReservationDurationMinutes: 120,
  reservationMinAdvanceMinutes: 30,
  reservationLateToleranceMinutes: 15,
  cieloMerchantCode: null,
  archivedAt: null,
  createdAt: f1Ago(60 * 24 * 90),
  updatedAt: f1Ago(60 * 24),
};

const F1_AREAS: VenueArea[] = [
  { id: 1, locationId: 1, nome: "Salão", displayOrder: 0, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) },
  { id: 2, locationId: 1, nome: "Varanda", displayOrder: 1, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) },
  { id: 3, locationId: 1, nome: "Balcão", displayOrder: 2, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) },
];

type F1TableSeed = { id: number; areaId: number; nome: string; capacidade: number };
const F1_TABLE_SEEDS: F1TableSeed[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: i + 1, areaId: 1, nome: `Mesa ${String(i + 1).padStart(2, "0")}`, capacidade: i % 3 === 2 ? 6 : 4 })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: 20 + i, areaId: 2, nome: `Varanda ${i + 1}`, capacidade: i === 3 ? 8 : 2 })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: 30 + i, areaId: 3, nome: `Balcão ${i + 1}`, capacidade: 1 })),
];

function f1Modifier(orderItemId: number, groupName: string, optionName: string, priceCents: number) {
  return { id: f1NextId(), orderItemId, modifierGroupId: 1, modifierOptionId: f1NextId(), groupNameSnapshot: groupName, optionNameSnapshot: optionName, unitPriceCents: priceCents, quantity: 1, totalPriceCents: priceCents, createdAt: f1Ago(10), updatedAt: f1Ago(10) };
}

function f1Item(orderId: number, name: string, variant: string, unitPriceCents: number, quantity: number, status: VenueOrderItemStatus, opts: { modifiers?: [string, string, number][]; notes?: string; stationId?: number; minutesAgo?: number } = {}): VenueOrderItem {
  const id = f1NextId();
  const modifiers = (opts.modifiers ?? []).map(([g, o, p]) => f1Modifier(id, g, o, p));
  const modifiersTotalCents = modifiers.reduce((s, m) => s + m.totalPriceCents, 0);
  const lineSubtotalCents = (unitPriceCents + modifiersTotalCents) * quantity;
  return {
    id,
    organizationId: 1,
    orderId,
    menuItemId: id,
    productId: id,
    variantId: id,
    preparationStationId: opts.stationId ?? 1,
    quantity,
    productNameSnapshot: name,
    variantNameSnapshot: variant,
    unitPriceCents,
    modifiersTotalCents,
    lineSubtotalCents,
    discountCents: 0,
    lineTotalCents: lineSubtotalCents,
    status,
    notes: opts.notes ?? null,
    cancellationReason: null,
    canceledByUserId: null,
    canceledAt: null,
    createdAt: f1Ago(opts.minutesAgo ?? 12),
    updatedAt: f1Ago(opts.minutesAgo ?? 12),
    modifiers,
  };
}

function f1Order(tabId: number, items: ((orderId: number) => VenueOrderItem)[], minutesAgo = 15): VenueOrder {
  const id = f1NextId();
  const built = items.map((fn) => fn(id));
  const statuses = new Set(built.map((i) => i.status));
  const status = statuses.has("SENT") ? "SENT" : statuses.has("IN_PREPARATION") ? "IN_PREPARATION" : statuses.has("READY") ? "READY" : built.every((i) => i.status === "CANCELED") ? "CANCELED" : "DELIVERED";
  return { id, organizationId: 1, locationId: 1, tabId, publicCode: `P${id}`, clientRequestId: null, status, createdByUserId: 1, sentAt: f1Ago(minutesAgo), canceledAt: null, cancelReason: null, notes: null, createdAt: f1Ago(minutesAgo), updatedAt: f1Ago(minutesAgo), items: built };
}

function f1Payment(tabId: number, method: VenuePaymentMethod, amountCents: number, opts: { receivedCents?: number; minutesAgo?: number } = {}): VenuePayment {
  const receivedCents = opts.receivedCents ?? null;
  return { id: f1NextId(), organizationId: 1, locationId: 1, tabId, cashSessionId: 1, method, status: "CONFIRMED", amountCents, receivedCents, changeCents: receivedCents ? Math.max(0, receivedCents - amountCents) : 0, externalReference: null, idempotencyKey: `k-${f1NextId()}`, notes: null, createdByUserId: 1, canceledByUserId: null, cancelReason: null, confirmedAt: f1Ago(opts.minutesAgo ?? 30), canceledAt: null, refundStatus: null, refundConfirmedAt: null, refundConfirmedByUserId: null, refundNotes: null, createdAt: f1Ago(opts.minutesAgo ?? 30), updatedAt: f1Ago(opts.minutesAgo ?? 30) };
}

function f1Tab(seed: { id: number; type: VenueTabType; tableId?: number; status?: VenueTab["status"]; customerName?: string | null; guestCount?: number | null; openedMinutesAgo?: number; orders?: ((tabId: number) => VenueOrder)[]; payments?: ((tabId: number) => VenuePayment)[]; discountCents?: number; serviceChargeRateBps?: number; closedMinutesAgo?: number; canceled?: boolean; postCloseCanceled?: boolean }): VenueTabDetail {
  const table = seed.tableId ? F1_TABLE_SEEDS.find((t) => t.id === seed.tableId) ?? null : null;
  const orders = (seed.orders ?? []).map((fn) => fn(seed.id));
  const payments = (seed.payments ?? []).map((fn) => fn(seed.id));
  const tab: VenueTabDetail = {
    id: seed.id,
    organizationId: 1,
    locationId: 1,
    tableId: table?.id ?? null,
    publicCode: `${seed.type === "TABLE" ? "M" : seed.type === "COUNTER" ? "B" : "C"}${String(seed.id).padStart(3, "0")}`,
    type: seed.type,
    status: seed.status ?? "OPEN",
    customerName: seed.customerName ?? null,
    customerPhone: null,
    guestCount: seed.guestCount ?? null,
    openedByUserId: 1,
    closedByUserId: null,
    canceledByUserId: null,
    openedAt: f1Ago(seed.openedMinutesAgo ?? 40),
    closedAt: null,
    canceledAt: null,
    cancelReason: null,
    discountCents: seed.discountCents ?? 0,
    discountReason: seed.discountCents ? "Cortesia da casa" : null,
    serviceChargeRateBps: seed.serviceChargeRateBps ?? 1000,
    serviceChargeCents: 0,
    subtotalCents: 0,
    totalCents: 0,
    paidCents: 0,
    remainingCents: 0,
    version: 1,
    postCloseCanceledAt: null,
    postCloseCanceledByUserId: null,
    postCloseCancelReason: null,
    notes: null,
    createdAt: f1Ago(seed.openedMinutesAgo ?? 40),
    updatedAt: f1Ago(1),
    table: table ? { id: table.id, nome: table.nome, areaId: table.areaId } : null,
    orders,
    payments,
  };
  f1Recalc(tab);
  if (seed.status === "CLOSED" || seed.canceled || seed.postCloseCanceled) {
    tab.closedAt = f1AgoToday(seed.closedMinutesAgo ?? 60);
    tab.closedByUserId = 1;
  }
  if (seed.canceled) {
    tab.status = "CANCELED";
    tab.canceledAt = f1AgoToday(seed.closedMinutesAgo ?? 60);
    tab.cancelReason = "Cliente desistiu";
    tab.closedAt = null;
  }
  if (seed.postCloseCanceled) {
    tab.status = "CLOSED";
    tab.postCloseCanceledAt = f1Ago(20);
    tab.postCloseCanceledByUserId = 1;
    tab.postCloseCancelReason = "Cobrança duplicada";
    tab.payments.forEach((p) => (p.refundStatus = "PENDING_MANUAL"));
  }
  return tab;
}

function f1Recalc(tab: VenueTabDetail) {
  const subtotal = tab.orders.flatMap((o) => o.items).filter((i) => i.status !== "CANCELED").reduce((s, i) => s + i.lineTotalCents, 0);
  tab.subtotalCents = subtotal;
  tab.serviceChargeCents = Math.round(subtotal * (tab.serviceChargeRateBps / 10000));
  tab.totalCents = Math.max(0, subtotal + tab.serviceChargeCents - tab.discountCents);
  tab.paidCents = tab.payments.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.amountCents, 0);
  tab.remainingCents = Math.max(0, tab.totalCents - tab.paidCents);
}

const F1_TABS: VenueTabDetail[] = [
  f1Tab({ id: 101, type: "TABLE", tableId: 1, customerName: "Família Souza", guestCount: 4, openedMinutesAgo: 95, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Chopp Pilsen", "500 ml", 1800, 4, "DELIVERED"), (o) => f1Item(o, "Porção de batata", "Grande", 3900, 1, "DELIVERED", { modifiers: [["Molhos", "Cheddar", 400]], stationId: 2 })], 80), (t) => f1Order(t, [(o) => f1Item(o, "Caipirinha", "Dose", 2400, 2, "IN_PREPARATION", { modifiers: [["Fruta", "Morango", 200]], minutesAgo: 6 })], 6)] }),
  f1Tab({ id: 102, type: "TABLE", tableId: 3, customerName: null, guestCount: 2, openedMinutesAgo: 35, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Negroni", "Dose", 3200, 2, "READY", { minutesAgo: 9 }), (o) => f1Item(o, "Bruschetta", "4 un", 2800, 1, "SENT", { stationId: 2, minutesAgo: 3 })], 9)] }),
  f1Tab({ id: 103, type: "TABLE", tableId: 6, customerName: "Aniversário da Lu", guestCount: 6, status: "CLOSING", openedMinutesAgo: 140, serviceChargeRateBps: 1000, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Balde de Long Neck", "6 un", 6900, 2, "DELIVERED"), (o) => f1Item(o, "Tábua de frios", "Para 4", 8900, 1, "DELIVERED", { stationId: 2 }), (o) => f1Item(o, "Gin Tônica", "Dose", 2900, 4, "DELIVERED")], 120)] }),
  f1Tab({ id: 104, type: "TABLE", tableId: 21, customerName: "Carla", guestCount: 2, openedMinutesAgo: 12, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Água com gás", "500 ml", 700, 2, "SENT", { minutesAgo: 1 }), (o) => f1Item(o, "Moscow Mule", "Dose", 2800, 2, "SENT", { minutesAgo: 1 })], 1)] }),
  f1Tab({ id: 105, type: "TABLE", tableId: 23, customerName: "Turma do Rafa", guestCount: 8, openedMinutesAgo: 60, discountCents: 2000, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Chopp Pilsen", "300 ml", 1200, 8, "DELIVERED"), (o) => f1Item(o, "Porção de batata", "Grande", 3900, 2, "DELIVERED", { stationId: 2 })], 50)], payments: [(t) => f1Payment(t, "PIX", 5000, { minutesAgo: 10 })] }),
  f1Tab({ id: 110, type: "INDIVIDUAL", customerName: "João Pedro", openedMinutesAgo: 50, orders: [(t) => f1Order(t, [(o) => f1Item(o, "IPA artesanal", "473 ml", 2600, 2, "DELIVERED")], 45)] }),
  f1Tab({ id: 111, type: "INDIVIDUAL", customerName: "Marina", openedMinutesAgo: 22, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Aperol Spritz", "Dose", 3100, 1, "IN_PREPARATION", { minutesAgo: 4 })], 4)] }),
  f1Tab({ id: 112, type: "COUNTER", customerName: null, openedMinutesAgo: 4, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Água sem gás", "500 ml", 600, 1, "DELIVERED", { minutesAgo: 3 })], 3)] }),
  f1Tab({ id: 120, type: "TABLE", tableId: 2, customerName: "Beatriz", guestCount: 3, status: "CLOSED", openedMinutesAgo: 240, closedMinutesAgo: 90, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Chopp Pilsen", "500 ml", 1800, 6, "DELIVERED"), (o) => f1Item(o, "Bruschetta", "4 un", 2800, 2, "DELIVERED", { stationId: 2 })], 200)], payments: [(t) => f1Payment(t, "CREDIT_CARD", 18040, { minutesAgo: 90 })] }),
  f1Tab({ id: 121, type: "COUNTER", status: "CLOSED", openedMinutesAgo: 150, closedMinutesAgo: 148, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Gin Tônica", "Dose", 2900, 2, "DELIVERED")], 150)], payments: [(t) => f1Payment(t, "CASH", 6380, { receivedCents: 7000, minutesAgo: 148 })] }),
  f1Tab({ id: 122, type: "INDIVIDUAL", customerName: "Thiago", status: "CLOSED", openedMinutesAgo: 300, closedMinutesAgo: 200, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Negroni", "Dose", 3200, 3, "DELIVERED")], 280)], payments: [(t) => f1Payment(t, "DEBIT_CARD", 10560, { minutesAgo: 200 })] }),
  f1Tab({ id: 123, type: "TABLE", tableId: 4, customerName: "Mesa 04 — almoço", status: "CLOSED", openedMinutesAgo: 420, closedMinutesAgo: 330, postCloseCanceled: true, orders: [(t) => f1Order(t, [(o) => f1Item(o, "Tábua de frios", "Para 4", 8900, 1, "DELIVERED", { stationId: 2 })], 400)], payments: [(t) => f1Payment(t, "PIX", 9790, { minutesAgo: 330 })] }),
  f1Tab({ id: 124, type: "INDIVIDUAL", customerName: "Pedro", openedMinutesAgo: 500, closedMinutesAgo: 480, canceled: true }),
];

function f1TableList(): VenueTable[] {
  return F1_TABLE_SEEDS.map((t) => {
    const open = F1_TABS.find((tab) => tab.tableId === t.id && (tab.status === "OPEN" || tab.status === "CLOSING" || tab.status === "PAYMENT_IN_PROGRESS"));
    return {
      id: t.id,
      locationId: 1,
      areaId: t.areaId,
      nome: t.nome,
      capacidade: t.capacidade,
      displayOrder: t.id,
      active: true,
      createdAt: f1Ago(99999),
      updatedAt: f1Ago(99999),
      openTab: open ? { id: open.id, publicCode: open.publicCode, type: open.type, totalCents: open.totalCents, paidCents: open.paidCents, remainingCents: open.remainingCents, openedAt: open.openedAt, customerName: open.customerName } : null,
    };
  });
}

function f1TabListItem(tab: VenueTabDetail): VenueTabListItem {
  const { orders, payments: _payments, table, ...rest } = tab;
  void _payments;
  return { ...rest, table: table ? { id: table.id, nome: table.nome } : null, _count: { orders: orders.length } };
}

function f1IsOpen(tab: VenueTab) {
  return tab.status === "OPEN" || tab.status === "CLOSING" || tab.status === "PAYMENT_IN_PROGRESS";
}

const F1_CASH_SESSIONS: VenueCashSessionDetail[] = [
  { id: 1, organizationId: 1, locationId: 1, cashRegisterId: 1, openedByUserId: 1, closedByUserId: null, openingAmountCents: 20000, expectedCashCents: 20000 + 6380 - 5000, countedCashCents: null, differenceCents: null, status: "OPEN", openedAt: f1Ago(380), closedAt: null, notes: null, createdAt: f1Ago(380), updatedAt: f1Ago(5), movements: [{ id: 1, organizationId: 1, locationId: 1, cashSessionId: 1, type: "WITHDRAWAL", amountCents: 5000, reason: "Sangria pra troco do bar", createdByUserId: 1, createdAt: f1Ago(120) }], paymentsByMethod: { CASH: 6380, PIX: 14790, CREDIT_CARD: 18040, DEBIT_CARD: 10560 } },
  { id: 2, organizationId: 1, locationId: 1, cashRegisterId: 1, openedByUserId: 1, closedByUserId: 1, openingAmountCents: 15000, expectedCashCents: 42300, countedCashCents: 42000, differenceCents: -300, status: "CLOSED", openedAt: f1Ago(60 * 30), closedAt: f1Ago(60 * 22), notes: "Faltou troco de R$ 3", createdAt: f1Ago(60 * 30), updatedAt: f1Ago(60 * 22), movements: [], paymentsByMethod: { CASH: 27300, PIX: 31000 } },
  { id: 3, organizationId: 1, locationId: 1, cashRegisterId: 2, openedByUserId: 2, closedByUserId: 2, openingAmountCents: 10000, expectedCashCents: 18500, countedCashCents: 18500, differenceCents: 0, status: "CLOSED", openedAt: f1Ago(60 * 54), closedAt: f1Ago(60 * 46), notes: null, createdAt: f1Ago(60 * 54), updatedAt: f1Ago(60 * 46), movements: [], paymentsByMethod: { CASH: 8500, CREDIT_CARD: 22000 } },
];

const F1_REGISTERS: VenueCashRegister[] = [
  { id: 1, locationId: 1, nome: "Caixa principal", active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999), openSession: null },
  { id: 2, locationId: 1, nome: "Caixa do bar", active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999), openSession: null },
];
function f1RegisterList(): VenueCashRegister[] {
  return F1_REGISTERS.map((r) => {
    const open = F1_CASH_SESSIONS.find((s) => s.cashRegisterId === r.id && s.status === "OPEN");
    return { ...r, openSession: open ? { id: open.id, openedAt: open.openedAt, openedByUserId: open.openedByUserId, expectedCashCents: open.expectedCashCents } : null };
  });
}
function f1SessionSummary(s: VenueCashSessionDetail): VenueCashSession {
  const { movements: _m, paymentsByMethod: _p, ...rest } = s;
  void _m;
  void _p;
  return rest;
}

const F1_DEVICES: VenueDevice[] = [
  { id: 1, organizationId: 1, locationId: 1, label: "Maquininha do caixa", pairedByUserId: 1, deviceToken: "tok-1", pairingCode: null, pairingCodeExpiresAt: null, lastSeenAt: f1Ago(0.3), revokedAt: null, createdAt: f1Ago(60 * 24 * 12) },
  { id: 2, organizationId: 1, locationId: 1, label: "Terminal da varanda", pairedByUserId: 1, deviceToken: "tok-2", pairingCode: null, pairingCodeExpiresAt: null, lastSeenAt: f1Ago(48), revokedAt: null, createdAt: f1Ago(60 * 24 * 5) },
  { id: 3, organizationId: 1, locationId: 1, label: "Tablet garçom 2", pairedByUserId: null, deviceToken: null, pairingCode: "482913", pairingCodeExpiresAt: new Date(Date.now() + 8 * F1_MIN).toISOString(), lastSeenAt: null, revokedAt: null, createdAt: f1Ago(2) },
  { id: 4, organizationId: 1, locationId: 1, label: "POS antigo", pairedByUserId: 1, deviceToken: null, pairingCode: null, pairingCodeExpiresAt: null, lastSeenAt: f1Ago(60 * 24 * 20), revokedAt: f1Ago(60 * 24 * 3), createdAt: f1Ago(60 * 24 * 60) },
];

function f1PreparationItems(status?: string, stationId?: number): VenuePreparationItem[] {
  const out: VenuePreparationItem[] = [];
  for (const tab of F1_TABS) {
    if (!f1IsOpen(tab)) continue;
    for (const order of tab.orders) {
      for (const item of order.items) {
        if (status && item.status !== status) continue;
        if (stationId && item.preparationStationId !== stationId) continue;
        out.push({ ...item, order: { id: order.id, publicCode: order.publicCode, tab: { id: tab.id, publicCode: tab.publicCode, table: tab.table ? { nome: tab.table.nome } : null } }, preparationStation: item.preparationStationId === 2 ? { id: 2, nome: "Cozinha" } : { id: 1, nome: "Bar" } });
      }
    }
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Catálogo mínimo pro lançamento de pedido (F2 é dona do cardápio — os
// handlers dela vêm antes no array e vencem; estes só garantem o fluxo).
const F1_ZIGGY = ["7-belo-berry", "abacaxi-tropical", "banana-tropical", "burley-mint", "cherry-starburst", "choco-menta", "coco-tropical", "fresh-lemon", "fresh-melon", "frutas-roxas", "grape-starburst", "jabuticaba-tropical", "manga-tropical", "maracuja-yellow", "melancia-watermelon-bomb", "morango-tropical", "red-lemonade", "sorvete-de-limao", "sorvete-de-pistache", "yogurt"];
type F1Product = { id: number; categoryId: number; nome: string; descricao: string | null; imageUrl: string | null; stationId: number; status: "ACTIVE" | "SOLD_OUT"; variants: { id: number; nome: string; priceCents: number }[]; harmoniza?: string; contra?: string; highlighted?: boolean; favorites?: number };
const F1_CATEGORIES = [
  { id: 1, nome: "Cervejas", descricao: "Chopp gelado e long necks", section: "MENU" as const, imageUrl: "/mock/posters/sunset-sessions.svg" },
  { id: 2, nome: "Drinks", descricao: "Clássicos e autorais", section: "MENU" as const, imageUrl: "/mock/posters/baile-neon.svg" },
  { id: 3, nome: "Porções", descricao: "Pra dividir", section: "MENU" as const, imageUrl: "/mock/posters/garden-party.svg" },
  { id: 4, nome: "Sem álcool", descricao: null, section: "MENU" as const, imageUrl: null },
  { id: 5, nome: "Essências", descricao: "Narguilé — venda proibida para menores de 18 anos", section: "TOBACCO" as const, imageUrl: "/tabacaria/ziggy/tropical.webp" },
];
const F1_PRODUCTS: F1Product[] = [
  { id: 1, categoryId: 1, nome: "Chopp Pilsen", descricao: "Tirado na hora, colarinho de dois dedos.", imageUrl: "/mock/posters/rooftop-live.svg", stationId: 1, status: "ACTIVE", variants: [{ id: 11, nome: "300 ml", priceCents: 1200 }, { id: 12, nome: "500 ml", priceCents: 1800 }, { id: 13, nome: "1 L", priceCents: 3200 }], highlighted: true, favorites: 42 },
  { id: 2, categoryId: 1, nome: "IPA artesanal", descricao: "Lupulada, amargor médio, 6,2% ABV.", imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 21, nome: "473 ml", priceCents: 2600 }], favorites: 17 },
  { id: 3, categoryId: 1, nome: "Balde de Long Neck", descricao: "6 unidades no gelo.", imageUrl: "/mock/posters/virada-tropical.svg", stationId: 1, status: "ACTIVE", variants: [{ id: 31, nome: "6 un", priceCents: 6900 }], highlighted: true, favorites: 9 },
  { id: 4, categoryId: 2, nome: "Caipirinha", descricao: "Cachaça artesanal, fruta macerada na hora.", imageUrl: "/mock/posters/forro-na-praca.svg", stationId: 1, status: "ACTIVE", variants: [{ id: 41, nome: "Dose", priceCents: 2400 }, { id: 42, nome: "Jarra", priceCents: 7900 }], harmoniza: "Porção de batata", favorites: 31 },
  { id: 5, categoryId: 2, nome: "Negroni", descricao: "Gin, Campari e vermute rosso.", imageUrl: "/mock/posters/noite-do-vinil.svg", stationId: 1, status: "ACTIVE", variants: [{ id: 51, nome: "Dose", priceCents: 3200 }], highlighted: true, favorites: 25 },
  { id: 6, categoryId: 2, nome: "Gin Tônica", descricao: "Gin London Dry, tônica premium e especiarias.", imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 61, nome: "Dose", priceCents: 2900 }], favorites: 12 },
  { id: 7, categoryId: 2, nome: "Aperol Spritz", descricao: null, imageUrl: "/mock/posters/samba-de-raiz.svg", stationId: 1, status: "SOLD_OUT", variants: [{ id: 71, nome: "Dose", priceCents: 3100 }], favorites: 4 },
  { id: 8, categoryId: 2, nome: "Moscow Mule", descricao: "Vodka, espuma de gengibre e limão.", imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 81, nome: "Dose", priceCents: 2800 }], favorites: 8 },
  { id: 9, categoryId: 3, nome: "Porção de batata", descricao: "Batata rústica com páprica.", imageUrl: "/mock/posters/pagode-do-cais.svg", stationId: 2, status: "ACTIVE", variants: [{ id: 91, nome: "Média", priceCents: 2900 }, { id: 92, nome: "Grande", priceCents: 3900 }], highlighted: true, favorites: 38, contra: "Contém glúten" },
  { id: 10, categoryId: 3, nome: "Tábua de frios", descricao: "Queijos, salames, azeitonas e pães.", imageUrl: "/mock/posters/festival-horizonte.svg", stationId: 2, status: "ACTIVE", variants: [{ id: 101, nome: "Para 2", priceCents: 5900 }, { id: 102, nome: "Para 4", priceCents: 8900 }], favorites: 14, contra: "Contém lactose e glúten" },
  { id: 11, categoryId: 3, nome: "Bruschetta", descricao: "Tomate, manjericão e azeite.", imageUrl: null, stationId: 2, status: "ACTIVE", variants: [{ id: 111, nome: "4 un", priceCents: 2800 }], favorites: 6 },
  { id: 12, categoryId: 4, nome: "Água sem gás", descricao: null, imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 121, nome: "500 ml", priceCents: 600 }], favorites: 0 },
  { id: 13, categoryId: 4, nome: "Água com gás", descricao: null, imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 131, nome: "500 ml", priceCents: 700 }], favorites: 0 },
  { id: 14, categoryId: 4, nome: "Suco natural", descricao: "Laranja, abacaxi ou maracujá.", imageUrl: null, stationId: 1, status: "ACTIVE", variants: [{ id: 141, nome: "300 ml", priceCents: 1200 }, { id: 142, nome: "500 ml", priceCents: 1600 }], favorites: 3 },
  ...F1_ZIGGY.map((slug, i) => ({ id: 50 + i, categoryId: 5, nome: slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), descricao: "Essência Ziggy 50g.", imageUrl: `/tabacaria/ziggy/${slug}.webp`, stationId: 1, status: i === 5 ? ("SOLD_OUT" as const) : ("ACTIVE" as const), variants: [{ id: 500 + i * 2, nome: "Sessão", priceCents: 4500 }, { id: 501 + i * 2, nome: "Dupla", priceCents: 7900 }], highlighted: i < 2, favorites: (i * 7) % 23 })),
];
const F1_MODIFIERS: Record<number, { id: number; nome: string; required: boolean; minSelect: number; maxSelect: number | null; options: { id: number; nome: string; priceCents: number }[] }[]> = {
  4: [{ id: 1, nome: "Fruta", required: true, minSelect: 1, maxSelect: 1, options: [{ id: 1, nome: "Limão", priceCents: 0 }, { id: 2, nome: "Morango", priceCents: 200 }, { id: 3, nome: "Maracujá", priceCents: 200 }, { id: 4, nome: "Kiwi", priceCents: 300 }] }, { id: 2, nome: "Açúcar", required: false, minSelect: 0, maxSelect: 1, options: [{ id: 5, nome: "Normal", priceCents: 0 }, { id: 6, nome: "Sem açúcar", priceCents: 0 }] }],
  9: [{ id: 3, nome: "Molhos", required: false, minSelect: 0, maxSelect: 2, options: [{ id: 7, nome: "Maionese", priceCents: 0 }, { id: 8, nome: "Cheddar", priceCents: 400 }, { id: 9, nome: "Barbecue", priceCents: 300 }] }],
  10: [{ id: 4, nome: "Pão extra", required: false, minSelect: 0, maxSelect: 3, options: [{ id: 10, nome: "Ciabatta", priceCents: 500 }, { id: 11, nome: "Torradas", priceCents: 300 }] }],
};
const f1Variant = (p: F1Product, v: F1Product["variants"][number], i: number) => ({ id: v.id, organizationId: 1, productId: p.id, nome: v.nome, sku: null, priceCents: v.priceCents, stockControl: "NONE" as const, isDefault: i === 0, displayOrder: i, status: "ACTIVE" as const, archivedAt: null, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) });
function f1MenuItems() {
  return F1_PRODUCTS.map((p, i) => ({ id: 1000 + p.id, organizationId: 1, menuId: 1, categoryId: p.categoryId, productId: p.id, displayOrder: i, active: true, highlighted: Boolean(p.highlighted), createdAt: f1Ago(99999), updatedAt: f1Ago(99999), product: { id: p.id, nome: p.nome, status: p.status, imageUrl: p.imageUrl, variants: p.variants.map((v, vi) => f1Variant(p, v, vi)) }, prices: p.variants.map((v) => ({ variantId: v.id, variantNome: v.nome, basePriceCents: v.priceCents, overridePriceCents: null, effectivePriceCents: v.priceCents })) }));
}
function f1ProductDetail(productId: number) {
  const p = F1_PRODUCTS.find((x) => x.id === productId);
  if (!p) return null;
  return { id: p.id, organizationId: 1, nome: p.nome, descricao: p.descricao, harmonizaCom: p.harmoniza ?? null, contraindicacoes: p.contra ?? null, imageUrl: p.imageUrl, prepTimeMinutes: null, status: p.status, preparationStationId: p.stationId, archivedAt: null, createdAt: f1Ago(99999), updatedAt: f1Ago(99999), preparationStation: { id: p.stationId, nome: p.stationId === 2 ? "Cozinha" : "Bar" }, variants: p.variants.map((v, vi) => f1Variant(p, v, vi)), modifierGroups: (F1_MODIFIERS[p.id] ?? []).map((g, gi) => ({ id: g.id, productId: p.id, modifierGroupId: g.id, required: g.required, minSelect: g.minSelect, maxSelect: g.maxSelect, displayOrder: gi, createdAt: f1Ago(99999), updatedAt: f1Ago(99999), group: { id: g.id, organizationId: 1, nome: g.nome, displayOrder: gi, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999), options: g.options.map((o, oi) => ({ id: o.id, modifierGroupId: g.id, nome: o.nome, priceCents: o.priceCents, displayOrder: oi, active: true, archivedAt: null, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) })) } })), menus: [] };
}

// Favoritos do visitante do cardápio público (por token, em memória).
const f1Favorites = new Map<string, Set<number>>();
const F1_PUBLIC_PROFILE = { logoUrl: "/mock/posters/noite-do-vinil.svg", bannerUrl: "/mock/posters/rooftop-live.svg", address: "Rua Augusta, 1200 — Consolação\nSão Paulo/SP", instagramUrl: "https://instagram.com/noktabar", whatsappNumber: "+5511999999999" };
function f1PublicItem(p: F1Product, token: string, withCategory = false): PublicMenuItem {
  const cat = F1_CATEGORIES.find((c) => c.id === p.categoryId)!;
  const favs = f1Favorites.get(token);
  return { id: 1000 + p.id, nome: p.nome, descricao: p.descricao, harmonizaCom: p.harmoniza ?? null, contraindicacoes: p.contra ?? null, imageUrl: p.imageUrl, available: p.status !== "SOLD_OUT", prices: p.variants.map((v) => ({ variantId: v.id, variantNome: v.nome, basePriceCents: v.priceCents, overridePriceCents: null, effectivePriceCents: v.priceCents })), favoriteCount: (p.favorites ?? 0) + (favs?.has(1000 + p.id) ? 1 : 0), favoritedByVisitor: Boolean(favs?.has(1000 + p.id)), ...(withCategory ? { categoryNome: cat.nome, section: cat.section } : {}) };
}
function f1PublicMenu(token: string): PublicMenuResponse {
  return { organizationName: "Nokta Bar", profile: F1_PUBLIC_PROFILE, menu: { nome: "Nokta Bar", descricao: "Bar e tabacaria na Augusta", highlights: F1_PRODUCTS.filter((p) => p.highlighted).map((p) => f1PublicItem(p, token, true)), categories: F1_CATEGORIES.map((c) => ({ id: c.id, nome: c.nome, descricao: c.descricao, imageUrl: c.imageUrl, section: c.section, items: F1_PRODUCTS.filter((p) => p.categoryId === c.id).map((p) => f1PublicItem(p, token)) })) } };
}

// ── Reservas ──
let F1_RESERVATIONS: VenueReservation[] = [];
function f1Reservation(seed: { id: number; date: string; time: string; name: string; phone: string; party: number; status: VenueReservationStatus; source?: VenueReservation["source"]; tableIds?: number[]; areaId?: number | null; notes?: string | null; tabId?: number | null }): VenueReservation {
  const startAt = f1At(seed.date, seed.time);
  const endAt = new Date(new Date(startAt).getTime() + 120 * F1_MIN).toISOString();
  const tables = (seed.tableIds ?? []).map((tid, i) => {
    const t = F1_TABLE_SEEDS.find((x) => x.id === tid)!;
    return { id: f1NextId(), reservationId: seed.id, tableId: tid, isPrimary: i === 0, createdAt: f1Ago(1000), table: { id: t.id, nome: t.nome, areaId: t.areaId } };
  });
  const area = seed.areaId ? F1_AREAS.find((a) => a.id === seed.areaId) ?? null : null;
  const tab = seed.tabId ? F1_TABS.find((t) => t.id === seed.tabId) : null;
  return { id: seed.id, organizationId: 1, locationId: 1, publicCode: `R${String(seed.id).padStart(3, "0")}`, status: seed.status, source: seed.source ?? "WHATSAPP", customerName: seed.name, customerPhone: seed.phone, customerEmail: null, partySize: seed.party, startAt, endAt, preferredAreaId: area?.id ?? null, notes: seed.notes ?? null, internalNotes: null, cancelReason: seed.status === "CANCELED" ? "Cliente remarcou" : null, version: 1, createdByUserId: 1, confirmedByUserId: null, seatedByUserId: null, canceledByUserId: null, noShowByUserId: null, completedByUserId: null, confirmedAt: seed.status === "CONFIRMED" || seed.status === "SEATED" ? f1Ago(600) : null, seatedAt: seed.status === "SEATED" ? f1Ago(30) : null, canceledAt: seed.status === "CANCELED" ? f1Ago(300) : null, noShowAt: seed.status === "NO_SHOW" ? f1Ago(20) : null, completedAt: seed.status === "COMPLETED" ? f1Ago(10) : null, createdAt: f1Ago(2000), updatedAt: f1Ago(10), tables, preferredArea: area ? { id: area.id, nome: area.nome } : null, tab: tab ? { id: tab.id, publicCode: tab.publicCode, status: tab.status } : null };
}
function f1SeedReservations() {
  const today = f1Today();
  const tomorrow = new Date(Date.now() + 24 * 60 * F1_MIN);
  const tmr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrow);
  F1_RESERVATIONS = [
    f1Reservation({ id: 1, date: today, time: "12:30", name: "Beatriz Lima", phone: "11988887777", party: 3, status: "COMPLETED", source: "PHONE", tableIds: [2], tabId: 120 }),
    f1Reservation({ id: 2, date: today, time: "19:00", name: "Família Souza", phone: "11977776666", party: 4, status: "SEATED", tableIds: [1], tabId: 101, notes: "Cadeirão pra criança" }),
    f1Reservation({ id: 3, date: today, time: "19:30", name: "Luana Castro", phone: "11966665555", party: 6, status: "SEATED", tableIds: [6], tabId: 103, notes: "Aniversário — bolo às 21h" }),
    f1Reservation({ id: 4, date: today, time: "20:00", name: "Rodrigo Alves", phone: "11955554444", party: 2, status: "CONFIRMED", source: "INSTAGRAM", tableIds: [5], areaId: 1 }),
    f1Reservation({ id: 5, date: today, time: "20:30", name: "Patrícia Nunes", phone: "11944443333", party: 8, status: "PENDING", source: "WEBSITE", areaId: 2, notes: "Prefere varanda" }),
    f1Reservation({ id: 6, date: today, time: "21:00", name: "Gustavo Ferreira", phone: "11933332222", party: 2, status: "CONFIRMED", source: "WALK_IN", tableIds: [22] }),
    f1Reservation({ id: 7, date: today, time: "18:00", name: "Camila Rocha", phone: "11922221111", party: 5, status: "NO_SHOW", tableIds: [7] }),
    f1Reservation({ id: 8, date: today, time: "21:30", name: "Henrique Dias", phone: "11911110000", party: 4, status: "CANCELED" }),
    f1Reservation({ id: 9, date: tmr, time: "20:00", name: "Amanda Teixeira", phone: "11900009999", party: 4, status: "CONFIRMED", tableIds: [3] }),
    f1Reservation({ id: 10, date: tmr, time: "21:00", name: "Felipe Santos", phone: "11999998888", party: 10, status: "PENDING", areaId: 2 }),
  ];
}
f1SeedReservations();
const F1_GUESTS = new Map<number, VenueReservationGuest[]>([
  [3, [{ id: 1, reservationId: 3, name: "Luana Castro", checkedInAt: f1Ago(30), checkedInByUserId: 1, createdByUserId: 1, createdAt: f1Ago(2000) }, { id: 2, reservationId: 3, name: "Marcos Castro", checkedInAt: f1Ago(28), checkedInByUserId: 1, createdByUserId: 1, createdAt: f1Ago(2000) }, { id: 3, reservationId: 3, name: "Priscila Mendes", checkedInAt: null, checkedInByUserId: null, createdByUserId: 1, createdAt: f1Ago(2000) }, { id: 4, reservationId: 3, name: "Diego Ramos", checkedInAt: null, checkedInByUserId: null, createdByUserId: 1, createdAt: f1Ago(2000) }]],
  [5, [{ id: 5, reservationId: 5, name: "Patrícia Nunes", checkedInAt: null, checkedInByUserId: null, createdByUserId: 1, createdAt: f1Ago(1500) }]],
]);
const F1_WAITLIST: VenueWaitlistEntry[] = [
  { id: 1, organizationId: 1, locationId: 1, publicCode: "F001", status: "WAITING", customerName: "Bruno Martins", customerPhone: "11987654321", partySize: 2, preferredAreaId: null, estimatedWaitMinutes: 15, notes: null, version: 1, createdByUserId: 1, notifiedByUserId: null, seatedByUserId: null, canceledByUserId: null, notifiedAt: null, seatedAt: null, canceledAt: null, leftAt: null, createdAt: f1Ago(18), updatedAt: f1Ago(18), preferredArea: null, tab: null },
  { id: 2, organizationId: 1, locationId: 1, publicCode: "F002", status: "NOTIFIED", customerName: "Sofia Andrade", customerPhone: "11976543210", partySize: 4, preferredAreaId: 2, estimatedWaitMinutes: 25, notes: "Com cachorro pequeno", version: 1, createdByUserId: 1, notifiedByUserId: 1, seatedByUserId: null, canceledByUserId: null, notifiedAt: f1Ago(2), seatedAt: null, canceledAt: null, leftAt: null, createdAt: f1Ago(31), updatedAt: f1Ago(2), preferredArea: { id: 2, nome: "Varanda" }, tab: null },
  { id: 3, organizationId: 1, locationId: 1, publicCode: "F003", status: "WAITING", customerName: "Igor Pereira", customerPhone: "11965432109", partySize: 3, preferredAreaId: null, estimatedWaitMinutes: null, notes: null, version: 1, createdByUserId: 1, notifiedByUserId: null, seatedByUserId: null, canceledByUserId: null, notifiedAt: null, seatedAt: null, canceledAt: null, leftAt: null, createdAt: f1Ago(7), updatedAt: f1Ago(7), preferredArea: null, tab: null },
  { id: 4, organizationId: 1, locationId: 1, publicCode: "F004", status: "SEATED", customerName: "Marina", customerPhone: "11954321098", partySize: 1, preferredAreaId: null, estimatedWaitMinutes: 10, notes: null, version: 1, createdByUserId: 1, notifiedByUserId: 1, seatedByUserId: 1, canceledByUserId: null, notifiedAt: f1Ago(40), seatedAt: f1Ago(22), canceledAt: null, leftAt: null, createdAt: f1Ago(55), updatedAt: f1Ago(22), preferredArea: null, tab: { id: 111, publicCode: "C111", status: "OPEN" } },
  { id: 5, organizationId: 1, locationId: 1, publicCode: "F005", status: "LEFT", customerName: "Caio", customerPhone: "11943210987", partySize: 5, preferredAreaId: null, estimatedWaitMinutes: 40, notes: null, version: 1, createdByUserId: 1, notifiedByUserId: null, seatedByUserId: null, canceledByUserId: null, notifiedAt: null, seatedAt: null, canceledAt: null, leftAt: f1Ago(60), createdAt: f1Ago(100), updatedAt: f1Ago(60), preferredArea: null, tab: null },
];

function f1Availability(partySize: number, areaId?: number): VenueAvailabilityResponse {
  const tables = f1TableList();
  const areas = F1_AREAS.filter((a) => !areaId || a.id === areaId).map((a) => ({ id: a.id, nome: a.nome, tables: tables.filter((t) => t.areaId === a.id).map((t) => ({ id: t.id, nome: t.nome, capacidade: t.capacidade, available: t.openTab === null && ![5, 22].includes(t.id), occupiedByOpenTab: t.openTab !== null, blockedByReservation: [5, 22].includes(t.id) })) }));
  const free = areas.flatMap((a) => a.tables).filter((t) => t.available);
  const fits = free.some((t) => (t.capacidade ?? 0) >= partySize);
  let suggested: number[] | null = null;
  if (!fits) {
    let acc = 0;
    suggested = [];
    for (const t of free.sort((a, b) => (b.capacidade ?? 0) - (a.capacidade ?? 0))) {
      if (acc >= partySize) break;
      suggested.push(t.id);
      acc += t.capacidade ?? 0;
    }
    if (acc < partySize) suggested = null;
  }
  return { locationId: 1, partySize, startAt: new Date().toISOString(), endAt: new Date(Date.now() + 120 * F1_MIN).toISOString(), areas, suggestedCombination: suggested };
}

function f1Summary(date: string): VenueReservationsSummary {
  const list = F1_RESERVATIONS.filter((r) => r.startAt.startsWith(date) || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(r.startAt)) === date);
  const count = (s: VenueReservationStatus) => list.filter((r) => r.status === s).length;
  const active = F1_WAITLIST.filter((w) => w.status === "WAITING" || w.status === "NOTIFIED");
  return { date, totalReservations: list.length, expectedPeople: list.filter((r) => r.status !== "CANCELED" && r.status !== "NO_SHOW").reduce((s, r) => s + r.partySize, 0), pending: count("PENDING"), confirmed: count("CONFIRMED"), seated: count("SEATED"), completed: count("COMPLETED"), canceled: count("CANCELED"), noShow: count("NO_SHOW"), waitlistCount: active.length, averageWaitMinutes: active.length ? 18 : null };
}

// ── Avaliações ──
const F1_REVIEWS: VenueReview[] = [
  { id: 1, organizationId: 1, liked: false, priceRating: 3, productsRating: 4, serviceRating: 1, ambienceRating: 4, complaintCategory: "DEMORA_ATENDIMENTO", comment: "Esperei 40 minutos pelo pedido e ninguém avisou que a cozinha estava cheia.", reviewerName: "Larissa Moraes", reviewerWhatsapp: "11988881111", reviewerBirthDate: "1994-03-12", marketingOptIn: true, resolvedAt: null, createdAt: f1Ago(90) },
  { id: 2, organizationId: 1, liked: true, priceRating: 4, productsRating: 5, serviceRating: 5, ambienceRating: 5, complaintCategory: null, comment: "Melhor negroni da Augusta. Voltamos semana que vem!", reviewerName: "Rafael Costa", reviewerWhatsapp: "11977772222", reviewerBirthDate: null, marketingOptIn: false, resolvedAt: null, createdAt: f1Ago(200) },
  { id: 3, organizationId: 1, liked: false, priceRating: 2, productsRating: 3, serviceRating: 4, ambienceRating: 3, complaintCategory: "COBRANCA", comment: "Cobraram dois chopps a mais na conta.", reviewerName: "Juliana Prado", reviewerWhatsapp: "11966663333", reviewerBirthDate: null, marketingOptIn: false, resolvedAt: null, createdAt: f1Ago(60 * 26) },
  { id: 4, organizationId: 1, liked: true, priceRating: 5, productsRating: 4, serviceRating: 4, ambienceRating: 5, complaintCategory: null, comment: null, reviewerName: "Eduardo Lins", reviewerWhatsapp: "11955554444", reviewerBirthDate: "1989-11-02", marketingOptIn: true, resolvedAt: f1Ago(60 * 30), createdAt: f1Ago(60 * 50) },
  { id: 5, organizationId: 1, liked: false, priceRating: null, productsRating: 2, serviceRating: null, ambienceRating: null, complaintCategory: "PRODUTO", comment: "A batata veio fria.", reviewerName: "Tatiane Reis", reviewerWhatsapp: "11944445555", reviewerBirthDate: null, marketingOptIn: false, resolvedAt: f1Ago(60 * 70), createdAt: f1Ago(60 * 75) },
  { id: 6, organizationId: 1, liked: true, priceRating: 4, productsRating: 5, serviceRating: 5, ambienceRating: 4, complaintCategory: null, comment: "Atendimento impecável, a Marina foi super atenciosa.", reviewerName: "Paulo Henrique", reviewerWhatsapp: "11933336666", reviewerBirthDate: null, marketingOptIn: true, resolvedAt: null, createdAt: f1Ago(60 * 100) },
  { id: 7, organizationId: 1, liked: false, priceRating: 3, productsRating: 3, serviceRating: 3, ambienceRating: 1, complaintCategory: "AMBIENTE", comment: "Som alto demais pra conversar.", reviewerName: "Vanessa Lopes", reviewerWhatsapp: "11922227777", reviewerBirthDate: null, marketingOptIn: false, resolvedAt: f1Ago(60 * 120), createdAt: f1Ago(60 * 130) },
  { id: 8, organizationId: 1, liked: true, priceRating: 3, productsRating: 5, serviceRating: 4, ambienceRating: 5, complaintCategory: null, comment: "Varanda linda no fim de tarde.", reviewerName: "Otávio Braga", reviewerWhatsapp: "11911118888", reviewerBirthDate: null, marketingOptIn: false, resolvedAt: null, createdAt: f1Ago(60 * 160) },
];

// ── Setup / Início ──
let f1SetupProfile: NonNullable<VenueSetupStatus["profile"]> = { businessType: "BAR", operationMode: "MIXED", status: "IN_PROGRESS", lastStep: "cardapio", welcomeSeenAt: f1Ago(60), dismissedAt: null, completedAt: null };
function f1SetupStatus(): VenueSetupStatus {
  const required = [
    { key: "active_location", label: "Unidade principal ativa", done: true, route: "/dashboard/venue/onboarding?tab=sobre" },
    { key: "operational_structure", label: "Áreas e mesas cadastradas", done: true, route: "/dashboard/venue/onboarding?tab=estrutura" },
    { key: "cash_register", label: "Caixa cadastrado", done: true, route: "/dashboard/venue/onboarding?tab=estrutura" },
    { key: "published_menu", label: "Cardápio publicado", done: true, route: "/dashboard/cardapio" },
    { key: "active_product", label: "Produto ativo com variação válida", done: f1SetupProfile.status === "COMPLETED", route: "/dashboard/cardapio" },
  ];
  const recommended = [
    { key: "team", label: "Equipe convidada", done: false, route: "/dashboard/equipe" },
    { key: "business_hours", label: "Horários de funcionamento", done: true, route: "/dashboard/configuracoes?tab=horarios" },
  ];
  const all = [...required, ...recommended];
  const progress = Math.round((all.filter((i) => i.done).length / all.length) * 100);
  const ready = required.every((i) => i.done);
  return { restricted: false, readyToOperate: ready, progress, profile: f1SetupProfile, requiredItems: required, recommendedItems: recommended, blockingItems: required.filter((i) => !i.done), nextStep: ready ? null : "cardapio" };
}
function f1Home(): VenueHomeResponse {
  const tables = f1TableList();
  const open = F1_TABS.filter(f1IsOpen);
  const closedToday = F1_TABS.filter((t) => t.status === "CLOSED" && !t.postCloseCanceledAt);
  const prep = f1PreparationItems();
  return { hasLocation: true, locations: [{ id: 1, nome: "Nokta Bar", isMain: true }], location: { id: 1, nome: "Nokta Bar", timezone: "America/Sao_Paulo" }, date: f1Today(), tables: { total: tables.length, occupied: tables.filter((t) => t.openTab).length }, openTabsCount: open.length, cashSessions: F1_CASH_SESSIONS.filter((s) => s.status === "OPEN").map((s) => ({ id: s.id, openedAt: s.openedAt, cashRegister: { id: s.cashRegisterId, nome: F1_REGISTERS.find((r) => r.id === s.cashRegisterId)?.nome ?? "Caixa" } })), todaysReservations: F1_RESERVATIONS.filter((r) => f1Summary(f1Today()).date && new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(r.startAt)) === f1Today()).map((r) => ({ id: r.id, publicCode: r.publicCode, customerName: r.customerName, partySize: r.partySize, startAt: r.startAt, status: r.status })), waitlistCount: F1_WAITLIST.filter((w) => w.status === "WAITING" || w.status === "NOTIFIED").length, ordersInPreparationCount: prep.filter((i) => i.status === "IN_PREPARATION" || i.status === "SENT").length, ordersReadyCount: prep.filter((i) => i.status === "READY").length, lowStockCount: 2, outOfStockCount: 1, overduePayablesCount: 0, cashDiscrepancyCount: 0, financeSummary: { totalCents: closedToday.reduce((s, t) => s + t.totalCents, 0), paymentsCount: closedToday.length }, onboarding: f1SetupStatus(), shortcuts: ["new_reservation", "open_tab", "new_order", "open_cash", "register_purchase", "invite_team"] };
}

const F1_HOME_PUBLIC: VenueHomePageData = {
  organizationName: "Nokta Bar",
  profile: F1_PUBLIC_PROFILE,
  isOpenNow: true,
  todayHoursLabel: "18:00 – 02:00",
  weekHours: [
    { dayOfWeek: 0, label: "Domingo", hours: "16:00 – 23:00" },
    { dayOfWeek: 1, label: "Segunda", hours: null },
    { dayOfWeek: 2, label: "Terça", hours: "18:00 – 00:00" },
    { dayOfWeek: 3, label: "Quarta", hours: "18:00 – 00:00" },
    { dayOfWeek: 4, label: "Quinta", hours: "18:00 – 01:00" },
    { dayOfWeek: 5, label: "Sexta", hours: "18:00 – 02:00" },
    { dayOfWeek: 6, label: "Sábado", hours: "16:00 – 02:00" },
  ],
  amenities: [
    { key: "VALET", label: "Valet", value: "R$ 30 a noite" },
    { key: "PAYMENT_METHODS", label: "Formas de pagamento", value: "Pix, débito, crédito e dinheiro" },
    { key: "WIFI", label: "Wi-Fi", value: "Senha com o garçom" },
    { key: "OUTDOOR_AREA", label: "Área externa", value: "Varanda coberta" },
    { key: "PET_FRIENDLY", label: "Pet friendly", value: null },
    { key: "LIVE_MUSIC", label: "Música ao vivo", value: "Quinta a sábado, a partir das 21h" },
    { key: "AIR_CONDITIONING", label: "Ar condicionado", value: null },
  ],
};
const F1_REVIEW_PUBLIC: VenueReviewPageData = { organizationName: "Nokta Bar", profile: { logoUrl: F1_PUBLIC_PROFILE.logoUrl, bannerUrl: F1_PUBLIC_PROFILE.bannerUrl, instagramUrl: F1_PUBLIC_PROFILE.instagramUrl } };

const f1Op = (re: string) => new RegExp(`/organizations/\\d+/venue/operation${re}`);
const f1Res = (re: string) => new RegExp(`/organizations/\\d+/venue/reservations${re}`);
const f1Body = <T,>(body: unknown) => (body ?? {}) as T;

/** Módulo Venue: cardápio, operação, estoque, reservas, finance/insights de venue, páginas públicas do estabelecimento (frentes F edita aqui). */
export const venueHandlers: MockHandler[] = [
  // ── F2: cardápio/estoque/finance/insights ── (./venue-f2*.ts; antes da F1
  // porque o catálogo mínimo da F1 abaixo é só fallback dos mesmos ids)
  ...f2Handlers,
  // ── F1: operação/reservas/públicas ──
  // Operação: unidades, áreas, mesas
  { test: f1Op("/locations$"), method: "get", handle: () => ({ data: [F1_LOCATION] }) },
  { test: f1Op("/locations$"), method: "post", handle: ({ body }) => ({ data: { ...F1_LOCATION, id: f1NextId(), ...f1Body<Partial<VenueLocation>>(body) } }) },
  { test: f1Op("/locations/\\d+/areas$"), method: "get", handle: () => ({ data: F1_AREAS }) },
  { test: f1Op("/locations/\\d+/areas$"), method: "post", handle: ({ body }) => { const area: VenueArea = { id: f1NextId(), locationId: 1, nome: f1Body<{ nome: string }>(body).nome, displayOrder: F1_AREAS.length, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; F1_AREAS.push(area); return { data: area }; } },
  { test: f1Op("/locations/\\d+/tables$"), method: "get", handle: () => ({ data: f1TableList() }) },
  { test: f1Op("/locations/\\d+/tables$"), method: "post", handle: ({ body }) => { const b = f1Body<{ areaId: number; nome: string; capacidade?: number }>(body); const seed = { id: f1NextId(), areaId: b.areaId, nome: b.nome, capacidade: b.capacidade ?? 4 }; F1_TABLE_SEEDS.push(seed); return { data: f1TableList().find((t) => t.id === seed.id) }; } },
  { test: f1Op("/tables/\\d+/sessions$"), method: "get", handle: ({ url }) => { const tableId = f1Num(url.pathname, 2); return { data: F1_TABS.filter((t) => t.tableId === tableId).sort((a, b) => b.openedAt.localeCompare(a.openedAt)).map((t) => ({ id: t.id, publicCode: t.publicCode, status: t.status, customerName: t.customerName, openedAt: t.openedAt, closedAt: t.closedAt, canceledAt: t.canceledAt, totalCents: t.totalCents, paidCents: t.paidCents, remainingCents: t.remainingCents, postCloseCanceledAt: t.postCloseCanceledAt })) }; } },
  // Caixas e sessões
  { test: f1Op("/locations/\\d+/cash-registers$"), method: "get", handle: () => ({ data: f1RegisterList() }) },
  { test: f1Op("/locations/\\d+/cash-registers$"), method: "post", handle: ({ body }) => { const r: VenueCashRegister = { id: f1NextId(), locationId: 1, nome: f1Body<{ nome: string }>(body).nome, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), openSession: null }; F1_REGISTERS.push(r); return { data: r }; } },
  { test: f1Op("/locations/\\d+/cash-sessions$"), method: "get", handle: () => ({ data: F1_CASH_SESSIONS.map(f1SessionSummary).sort((a, b) => b.openedAt.localeCompare(a.openedAt)) }) },
  { test: f1Op("/cash-registers/\\d+/open$"), method: "post", handle: ({ url, body }) => { const registerId = f1Num(url.pathname, 2); const b = f1Body<{ openingAmountCents: number; notes?: string }>(body); const s: VenueCashSessionDetail = { id: f1NextId(), organizationId: 1, locationId: 1, cashRegisterId: registerId, openedByUserId: 1, closedByUserId: null, openingAmountCents: b.openingAmountCents, expectedCashCents: b.openingAmountCents, countedCashCents: null, differenceCents: null, status: "OPEN", openedAt: new Date().toISOString(), closedAt: null, notes: b.notes ?? null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), movements: [], paymentsByMethod: {} }; F1_CASH_SESSIONS.unshift(s); return { data: f1SessionSummary(s) }; } },
  { test: f1Op("/cash-sessions/\\d+$"), method: "get", handle: ({ url }) => { const s = F1_CASH_SESSIONS.find((x) => x.id === f1Num(url.pathname)); return s ? { data: s } : notFound(); } },
  { test: f1Op("/cash-sessions/\\d+/movements$"), method: "post", handle: ({ url, body }) => { const s = F1_CASH_SESSIONS.find((x) => x.id === f1Num(url.pathname, 2)); if (!s) return notFound(); const b = f1Body<{ type: VenueCashSessionDetail["movements"][number]["type"]; amountCents: number; reason: string }>(body); const m = { id: f1NextId(), organizationId: 1, locationId: 1, cashSessionId: s.id, type: b.type, amountCents: b.amountCents, reason: b.reason, createdByUserId: 1, createdAt: new Date().toISOString() }; s.movements.unshift(m); s.expectedCashCents += b.type === "SUPPLY" || b.type === "ADJUSTMENT" ? b.amountCents : -b.amountCents; return { data: m }; } },
  { test: f1Op("/cash-sessions/\\d+/close$"), method: "post", handle: ({ url, body }) => { const s = F1_CASH_SESSIONS.find((x) => x.id === f1Num(url.pathname, 2)); if (!s) return notFound(); const b = f1Body<{ countedCashCents: number; notes?: string }>(body); s.status = "CLOSED"; s.closedAt = new Date().toISOString(); s.closedByUserId = 1; s.countedCashCents = b.countedCashCents; s.differenceCents = b.countedCashCents - s.expectedCashCents; s.notes = b.notes ?? s.notes; return { data: f1SessionSummary(s) }; } },
  // Terminais
  { test: f1Op("/devices$"), method: "get", handle: () => ({ data: { devices: F1_DEVICES.filter((d) => d.deviceToken || d.pairingCode || d.revokedAt), serverNow: new Date().toISOString() } }) },
  { test: f1Op("/devices/pairing-code$"), method: "post", handle: ({ body }) => { const d: VenueDevice = { id: f1NextId(), organizationId: 1, locationId: 1, label: f1Body<{ label: string }>(body).label, pairedByUserId: null, deviceToken: null, pairingCode: String(Math.floor(100000 + Math.random() * 900000)), pairingCodeExpiresAt: new Date(Date.now() + 10 * F1_MIN).toISOString(), lastSeenAt: null, revokedAt: null, createdAt: new Date().toISOString() }; F1_DEVICES.unshift(d); return { data: { id: d.id, pairingCode: d.pairingCode, expiresAt: d.pairingCodeExpiresAt } }; } },
  { test: f1Op("/devices/\\d+/pairing-code$"), method: "post", handle: ({ url }) => { const d = F1_DEVICES.find((x) => x.id === f1Num(url.pathname, 2)); if (!d) return notFound(); d.deviceToken = null; d.revokedAt = null; d.pairingCode = String(Math.floor(100000 + Math.random() * 900000)); d.pairingCodeExpiresAt = new Date(Date.now() + 10 * F1_MIN).toISOString(); return { data: { id: d.id, pairingCode: d.pairingCode, expiresAt: d.pairingCodeExpiresAt } }; } },
  { test: f1Op("/devices/\\d+/permanently$"), method: "delete", handle: ({ url }) => { const i = F1_DEVICES.findIndex((x) => x.id === f1Num(url.pathname, 2)); if (i >= 0) F1_DEVICES.splice(i, 1); return { data: null }; } },
  { test: f1Op("/devices/\\d+$"), method: "delete", handle: ({ url }) => { const d = F1_DEVICES.find((x) => x.id === f1Num(url.pathname)); if (d) { d.revokedAt = new Date().toISOString(); d.deviceToken = null; } return { data: null }; } },
  // Comandas
  { test: f1Op("/locations/\\d+/tabs$"), method: "get", handle: ({ params }) => { const statuses = params.status ? params.status.split(",") : null; const from = params.closedAtFrom ?? null; const search = (params.search ?? "").toLowerCase(); const list = F1_TABS.filter((t) => (!statuses || statuses.includes(t.status)) && (!params.type || t.type === params.type) && (!from || (t.closedAt ?? t.canceledAt ?? t.openedAt) >= from) && (!search || `${t.publicCode} ${t.customerName ?? ""} ${t.table?.nome ?? ""}`.toLowerCase().includes(search))).sort((a, b) => b.openedAt.localeCompare(a.openedAt)); return { data: list.map(f1TabListItem) }; } },
  { test: f1Op("/locations/\\d+/tabs$"), method: "post", handle: ({ body }) => { const b = f1Body<{ type: VenueTabType; tableId?: number; customerName?: string; guestCount?: number }>(body); const id = f1NextId(); const tab = f1Tab({ id, type: b.type, tableId: b.tableId, customerName: b.customerName ?? null, guestCount: b.guestCount ?? null, openedMinutesAgo: 0 }); F1_TABS.unshift(tab); return { data: tab }; } },
  { test: f1Op("/tabs/\\d+$"), method: "get", handle: ({ url }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname)); return t ? { data: t } : notFound("Comanda não encontrada"); } },
  { test: f1Op("/tabs/\\d+$"), method: "patch", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname)); if (!t) return notFound(); Object.assign(t, f1Body<Partial<VenueTab>>(body)); return { data: t }; } },
  { test: f1Op("/tabs/\\d+/transfer-table$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); const target = F1_TABLE_SEEDS.find((x) => x.id === f1Body<{ tableId: number }>(body).tableId); if (!target) return notFound("Mesa não encontrada"); t.tableId = target.id; t.table = { id: target.id, nome: target.nome, areaId: target.areaId }; return { data: t }; } },
  { test: f1Op("/tabs/\\d+/discount$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); const b = f1Body<{ discountCents: number; reason?: string }>(body); t.discountCents = b.discountCents; t.discountReason = b.reason ?? null; f1Recalc(t); return { data: t }; } },
  { test: f1Op("/tabs/\\d+/service-charge$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); t.serviceChargeRateBps = f1Body<{ rateBps: number }>(body).rateBps; f1Recalc(t); return { data: t }; } },
  { test: f1Op("/tabs/\\d+/cancel$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); t.status = "CANCELED"; t.canceledAt = new Date().toISOString(); t.cancelReason = f1Body<{ reason: string }>(body).reason; return { data: t }; } },
  { test: f1Op("/tabs/\\d+/close$"), method: "post", handle: ({ url }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); if (t.remainingCents > 0) return { status: 400, data: { message: "A comanda ainda tem saldo em aberto." } }; t.status = "CLOSED"; t.closedAt = new Date().toISOString(); return { data: t }; } },
  { test: f1Op("/tabs/\\d+/request-close$"), method: "post", handle: ({ url }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); t.status = "CLOSING"; return { data: t }; } },
  { test: f1Op("/tabs/\\d+/cancel-close$"), method: "post", handle: ({ url }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); t.status = "OPEN"; return { data: t }; } },
  { test: f1Op("/tabs/\\d+/cancel-closed$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); t.postCloseCanceledAt = new Date().toISOString(); t.postCloseCancelReason = f1Body<{ reason: string }>(body).reason; t.payments.forEach((p) => { if (p.status === "CONFIRMED") p.refundStatus = "PENDING_MANUAL"; }); return { data: t }; } },
  { test: f1Op("/payments/\\d+/confirm-refund$"), method: "post", handle: ({ url }) => { for (const t of F1_TABS) { const p = t.payments.find((x) => x.id === f1Num(url.pathname, 2)); if (p) { p.refundStatus = "COMPLETED"; p.refundConfirmedAt = new Date().toISOString(); return { data: p }; } } return notFound(); } },
  // Pedidos
  { test: f1Op("/tabs/\\d+/orders$"), method: "get", handle: ({ url }) => ({ data: F1_TABS.find((x) => x.id === f1Num(url.pathname, 2))?.orders ?? [] }) },
  { test: f1Op("/tabs/\\d+/orders$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); const b = f1Body<{ items: { menuItemId: number; variantId: number; quantity: number; notes?: string; modifiers?: { modifierGroupId: number; modifierOptionId: number }[] }[] }>(body); const order = f1Order(t.id, b.items.map((line) => (orderId) => { const p = F1_PRODUCTS.find((x) => 1000 + x.id === line.menuItemId); const v = p?.variants.find((x) => x.id === line.variantId); const mods: [string, string, number][] = (line.modifiers ?? []).map((m) => { const g = (p ? F1_MODIFIERS[p.id] ?? [] : []).find((x) => x.id === m.modifierGroupId); const o = g?.options.find((x) => x.id === m.modifierOptionId); return [g?.nome ?? "Adicional", o?.nome ?? "", o?.priceCents ?? 0]; }); return f1Item(orderId, p?.nome ?? "Item", v?.nome ?? "", v?.priceCents ?? 0, line.quantity, "DRAFT", { modifiers: mods, notes: line.notes, stationId: p?.stationId, minutesAgo: 0 }); }), 0); order.status = "DRAFT"; order.sentAt = null; t.orders.push(order); f1Recalc(t); return { data: order }; } },
  { test: f1Op("/orders/\\d+/send$"), method: "post", handle: ({ url }) => { for (const t of F1_TABS) { const o = t.orders.find((x) => x.id === f1Num(url.pathname, 2)); if (o) { o.status = "SENT"; o.sentAt = new Date().toISOString(); o.items.forEach((i) => (i.status = "SENT")); return { data: o }; } } return notFound(); } },
  { test: f1Op("/order-items/\\d+/cancel$"), method: "post", handle: ({ url, body }) => { for (const t of F1_TABS) for (const o of t.orders) { const i = o.items.find((x) => x.id === f1Num(url.pathname, 2)); if (i) { i.status = "CANCELED"; i.cancellationReason = f1Body<{ reason: string }>(body).reason; i.canceledAt = new Date().toISOString(); f1Recalc(t); return { data: i }; } } return notFound(); } },
  { test: f1Op("/order-items/\\d+/(status|preparation-status)$"), method: "patch", handle: ({ url, body }) => { for (const t of F1_TABS) for (const o of t.orders) { const i = o.items.find((x) => x.id === f1Num(url.pathname, 2)); if (i) { i.status = f1Body<{ status: VenueOrderItemStatus }>(body).status; i.updatedAt = new Date().toISOString(); return { data: i }; } } return notFound(); } },
  { test: f1Op("/locations/\\d+/preparation-items$"), method: "get", handle: ({ params }) => ({ data: f1PreparationItems(params.status, params.preparationStationId ? Number(params.preparationStationId) : undefined) }) },
  // Pagamentos
  { test: f1Op("/tabs/\\d+/payments$"), method: "get", handle: ({ url }) => ({ data: F1_TABS.find((x) => x.id === f1Num(url.pathname, 2))?.payments ?? [] }) },
  { test: f1Op("/tabs/\\d+/payments$"), method: "post", handle: ({ url, body }) => { const t = F1_TABS.find((x) => x.id === f1Num(url.pathname, 2)); if (!t) return notFound(); const b = f1Body<{ method: VenuePaymentMethod; amountCents: number; receivedCents?: number }>(body); if (b.amountCents > t.remainingCents) return { status: 400, data: { message: "O valor ultrapassa o saldo restante." } }; const p = f1Payment(t.id, b.method, b.amountCents, { receivedCents: b.receivedCents, minutesAgo: 0 }); t.payments.push(p); f1Recalc(t); if (t.remainingCents === 0 && t.orders.flatMap((o) => o.items).every((i) => i.status === "DELIVERED" || i.status === "CANCELED")) { t.status = "CLOSED"; t.closedAt = new Date().toISOString(); } else if (t.remainingCents > 0) { t.status = "PAYMENT_IN_PROGRESS"; } const session = F1_CASH_SESSIONS.find((s) => s.status === "OPEN"); if (session) { session.paymentsByMethod[b.method] = (session.paymentsByMethod[b.method] ?? 0) + b.amountCents; if (b.method === "CASH") session.expectedCashCents += b.amountCents; } return { data: p }; } },
  // Catálogo mínimo (lançar pedido) — F2 pode cobrir com os handlers dela, que vêm antes.
  { test: /\/organizations\/\d+\/venue\/menus$/, method: "get", handle: () => ({ data: [{ id: 1, organizationId: 1, nome: "Cardápio principal", descricao: null, slug: "principal", status: "PUBLISHED", isMain: true, publishedAt: f1Ago(99999), archivedAt: null, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) }] }) },
  { test: /\/organizations\/\d+\/venue\/menus\/\d+\/categories$/, method: "get", handle: () => ({ data: F1_CATEGORIES.map((c, i) => ({ id: c.id, menuId: 1, nome: c.nome, descricao: c.descricao, imageUrl: c.imageUrl, section: c.section, displayOrder: i, active: true, itemCount: F1_PRODUCTS.filter((p) => p.categoryId === c.id).length, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) })) }) },
  { test: /\/organizations\/\d+\/venue\/menus\/\d+\/items$/, method: "get", handle: () => ({ data: f1MenuItems() }) },
  { test: /\/organizations\/\d+\/venue\/menus\/\d+\/preview$/, method: "get", handle: () => ({ data: f1PublicMenu("") }) },
  { test: /\/organizations\/\d+\/venue\/products\/\d+$/, method: "get", handle: ({ url }) => { const p = f1ProductDetail(f1Num(url.pathname)); return p ? { data: p } : notFound(); } },
  { test: /\/organizations\/\d+\/venue\/stations$/, method: "get", handle: () => ({ data: [{ id: 1, organizationId: 1, nome: "Bar", tipo: "BAR", displayOrder: 0, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) }, { id: 2, organizationId: 1, nome: "Cozinha", tipo: "KITCHEN", displayOrder: 1, active: true, createdAt: f1Ago(99999), updatedAt: f1Ago(99999) }] }) },
  // Reservas
  { test: f1Res("/locations/\\d+/summary$"), method: "get", handle: ({ params }) => ({ data: f1Summary(params.date ?? f1Today()) }) },
  { test: f1Res("/locations/\\d+/waitlist$"), method: "get", handle: ({ params }) => { const list = F1_WAITLIST.filter((w) => !params.status || w.status === params.status); return { data: { data: list, page: 1, limit: 50, total: list.length } }; } },
  { test: f1Res("/locations/\\d+/waitlist$"), method: "post", handle: ({ body }) => { const b = f1Body<{ customerName: string; customerPhone: string; partySize: number; preferredAreaId?: number; estimatedWaitMinutes?: number; notes?: string }>(body); const area = b.preferredAreaId ? F1_AREAS.find((a) => a.id === b.preferredAreaId) : null; const e: VenueWaitlistEntry = { id: f1NextId(), organizationId: 1, locationId: 1, publicCode: `F${f1Code()}`, status: "WAITING", customerName: b.customerName, customerPhone: b.customerPhone, partySize: b.partySize, preferredAreaId: area?.id ?? null, estimatedWaitMinutes: b.estimatedWaitMinutes ?? null, notes: b.notes ?? null, version: 1, createdByUserId: 1, notifiedByUserId: null, seatedByUserId: null, canceledByUserId: null, notifiedAt: null, seatedAt: null, canceledAt: null, leftAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), preferredArea: area ? { id: area.id, nome: area.nome } : null, tab: null }; F1_WAITLIST.push(e); return { data: e }; } },
  { test: f1Res("/waitlist/\\d+/notify$"), method: "post", handle: ({ url }) => { const e = F1_WAITLIST.find((x) => x.id === f1Num(url.pathname, 2)); if (!e) return notFound(); e.status = "NOTIFIED"; e.notifiedAt = new Date().toISOString(); return { data: e }; } },
  { test: f1Res("/waitlist/\\d+/left$"), method: "post", handle: ({ url }) => { const e = F1_WAITLIST.find((x) => x.id === f1Num(url.pathname, 2)); if (!e) return notFound(); e.status = "LEFT"; e.leftAt = new Date().toISOString(); return { data: e }; } },
  { test: f1Res("/waitlist/\\d+/cancel$"), method: "post", handle: ({ url }) => { const e = F1_WAITLIST.find((x) => x.id === f1Num(url.pathname, 2)); if (!e) return notFound(); e.status = "CANCELED"; e.canceledAt = new Date().toISOString(); return { data: e }; } },
  { test: f1Res("/waitlist/\\d+/seat$"), method: "post", handle: ({ url, body }) => { const e = F1_WAITLIST.find((x) => x.id === f1Num(url.pathname, 2)); if (!e) return notFound(); const tableId = f1Body<{ tableIds: number[] }>(body).tableIds?.[0]; const tab = f1Tab({ id: f1NextId(), type: "TABLE", tableId, customerName: e.customerName, guestCount: e.partySize, openedMinutesAgo: 0 }); F1_TABS.unshift(tab); e.status = "SEATED"; e.seatedAt = new Date().toISOString(); e.tab = { id: tab.id, publicCode: tab.publicCode, status: tab.status }; return { data: { entry: e, tab } }; } },
  { test: f1Res("/waitlist/\\d+$"), method: "patch", handle: ({ url, body }) => { const e = F1_WAITLIST.find((x) => x.id === f1Num(url.pathname)); if (!e) return notFound(); Object.assign(e, f1Body<Partial<VenueWaitlistEntry>>(body), { version: e.version + 1 }); return { data: e }; } },
  { test: f1Res("/availability$"), method: "get", handle: ({ params }) => ({ data: f1Availability(Number(params.partySize ?? 2), params.areaId ? Number(params.areaId) : undefined) }) },
  { test: f1Res("/locations/\\d+$"), method: "get", handle: ({ params }) => { const tz = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }); const search = (params.search ?? "").toLowerCase(); let list = F1_RESERVATIONS.filter((r) => (!params.date || tz.format(new Date(r.startAt)) === params.date) && (!params.status || r.status === params.status) && (!params.source || r.source === params.source) && (!search || `${r.customerName} ${r.customerPhone} ${r.publicCode}`.toLowerCase().includes(search))); list = list.sort((a, b) => (params.date ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt))); const page = Number(params.page ?? 1); const limit = Number(params.limit ?? 50); return { data: { data: list.slice((page - 1) * limit, page * limit), page, limit, total: list.length } }; } },
  { test: f1Res("/locations/\\d+$"), method: "post", handle: ({ body }) => { const b = f1Body<{ customerName: string; customerPhone: string; customerEmail?: string; partySize: number; startAt: string; endAt?: string; source?: VenueReservation["source"]; preferredAreaId?: number; tableIds?: number[]; notes?: string; internalNotes?: string; confirmed?: boolean }>(body); const id = f1NextId(); const r = f1Reservation({ id, date: b.startAt.slice(0, 10), time: "00:00", name: b.customerName, phone: b.customerPhone, party: b.partySize, status: b.confirmed ? "CONFIRMED" : "PENDING", source: b.source, tableIds: b.tableIds, areaId: b.preferredAreaId ?? null, notes: b.notes ?? null }); r.startAt = b.startAt; r.endAt = b.endAt ?? new Date(new Date(b.startAt).getTime() + 120 * F1_MIN).toISOString(); r.customerEmail = b.customerEmail ?? null; r.internalNotes = b.internalNotes ?? null; F1_RESERVATIONS.push(r); return { data: r }; } },
  { test: f1Res("/\\d+/guests$"), method: "get", handle: ({ url }) => ({ data: F1_GUESTS.get(f1Num(url.pathname, 2)) ?? [] }) },
  { test: f1Res("/\\d+/guests$"), method: "post", handle: ({ url, body }) => { const rid = f1Num(url.pathname, 2); const g: VenueReservationGuest = { id: f1NextId(), reservationId: rid, name: f1Body<{ name: string }>(body).name, checkedInAt: null, checkedInByUserId: null, createdByUserId: 1, createdAt: new Date().toISOString() }; F1_GUESTS.set(rid, [...(F1_GUESTS.get(rid) ?? []), g]); return { data: g }; } },
  { test: f1Res("/\\d+/guests/\\d+/check-in$"), method: "post", handle: ({ url }) => { const g = (F1_GUESTS.get(f1Num(url.pathname, 4)) ?? []).find((x) => x.id === f1Num(url.pathname, 2)); if (!g) return notFound(); g.checkedInAt = new Date().toISOString(); g.checkedInByUserId = 1; return { data: g }; } },
  { test: f1Res("/\\d+/guests/\\d+$"), method: "delete", handle: ({ url }) => { const rid = f1Num(url.pathname, 3); F1_GUESTS.set(rid, (F1_GUESTS.get(rid) ?? []).filter((x) => x.id !== f1Num(url.pathname))); return { data: null }; } },
  { test: f1Res("/\\d+/(confirm|cancel|no-show|complete|seat)$"), method: "post", handle: ({ url, body }) => { const r = F1_RESERVATIONS.find((x) => x.id === f1Num(url.pathname, 2)); if (!r) return notFound(); const action = f1Last(url.pathname); const nowIso = new Date().toISOString(); if (action === "confirm") { r.status = "CONFIRMED"; r.confirmedAt = nowIso; } if (action === "cancel") { r.status = "CANCELED"; r.canceledAt = nowIso; r.cancelReason = f1Body<{ reason: string }>(body).reason; } if (action === "no-show") { r.status = "NO_SHOW"; r.noShowAt = nowIso; } if (action === "complete") { r.status = "COMPLETED"; r.completedAt = nowIso; } if (action === "seat") { const tableId = f1Body<{ tableIds?: number[] }>(body).tableIds?.[0] ?? r.tables[0]?.tableId; const tab = f1Tab({ id: f1NextId(), type: "TABLE", tableId, customerName: r.customerName, guestCount: r.partySize, openedMinutesAgo: 0 }); F1_TABS.unshift(tab); r.status = "SEATED"; r.seatedAt = nowIso; r.tab = { id: tab.id, publicCode: tab.publicCode, status: tab.status }; return { data: { reservation: r, tab } }; } r.version += 1; return { data: r }; } },
  { test: f1Res("/\\d+/tables$"), method: "put", handle: ({ url, body }) => { const r = F1_RESERVATIONS.find((x) => x.id === f1Num(url.pathname, 2)); if (!r) return notFound(); const b = f1Body<{ tableIds: number[]; primaryTableId?: number }>(body); r.tables = b.tableIds.map((tid) => { const t = F1_TABLE_SEEDS.find((x) => x.id === tid)!; return { id: f1NextId(), reservationId: r.id, tableId: tid, isPrimary: (b.primaryTableId ?? b.tableIds[0]) === tid, createdAt: new Date().toISOString(), table: { id: t.id, nome: t.nome, areaId: t.areaId } }; }); r.version += 1; return { data: r }; } },
  { test: f1Res("/\\d+$"), method: "get", handle: ({ url }) => { const r = F1_RESERVATIONS.find((x) => x.id === f1Num(url.pathname)); return r ? { data: r } : notFound("Reserva não encontrada"); } },
  { test: f1Res("/\\d+$"), method: "patch", handle: ({ url, body }) => { const r = F1_RESERVATIONS.find((x) => x.id === f1Num(url.pathname)); if (!r) return notFound(); const { version: _v, ...rest } = f1Body<Partial<VenueReservation> & { version: number }>(body); void _v; Object.assign(r, rest, { version: r.version + 1 }); if (rest.preferredAreaId !== undefined) { const a = F1_AREAS.find((x) => x.id === rest.preferredAreaId); r.preferredArea = a ? { id: a.id, nome: a.nome } : null; } return { data: r }; } },
  // Avaliações
  { test: /\/organizations\/\d+\/venue\/reviews$/, method: "get", handle: ({ params }) => { const list = F1_REVIEWS.filter((r) => (params.liked === undefined || String(r.liked) === params.liked) && (!params.resolution || (params.resolution === "RESOLVED" ? r.resolvedAt !== null : r.resolvedAt === null))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); const page = Number(params.page ?? 1); const limit = Number(params.limit ?? 20); return { data: { data: list.slice((page - 1) * limit, page * limit), paginate: { page, limit, total: list.length } } }; } },
  { test: /\/organizations\/\d+\/venue\/reviews\/\d+\/(resolver|reabrir)$/, method: "patch", handle: ({ url }) => { const r = F1_REVIEWS.find((x) => x.id === f1Num(url.pathname, 2)); if (!r) return notFound(); r.resolvedAt = f1Last(url.pathname) === "resolver" ? new Date().toISOString() : null; return { data: r }; } },
  // Setup guiado e Início
  { test: /\/organizations\/\d+\/venue\/setup\/status$/, method: "get", handle: () => ({ data: f1SetupStatus() }) },
  { test: /\/organizations\/\d+\/venue\/setup\/profile$/, method: "put", handle: ({ body }) => { f1SetupProfile = { ...f1SetupProfile, ...f1Body<Partial<typeof f1SetupProfile>>(body) }; return { data: f1SetupProfile }; } },
  { test: /\/organizations\/\d+\/venue\/setup\/welcome-seen$/, method: "post", handle: () => { f1SetupProfile.welcomeSeenAt = new Date().toISOString(); return { data: { ok: true } }; } },
  { test: /\/organizations\/\d+\/venue\/setup\/dismiss$/, method: "post", handle: () => { f1SetupProfile = { ...f1SetupProfile, status: "DISMISSED", dismissedAt: new Date().toISOString() }; return { data: { ok: true } }; } },
  { test: /\/organizations\/\d+\/venue\/setup\/complete$/, method: "post", handle: () => { if (!f1SetupStatus().readyToOperate) return { status: 400, data: { message: "Ainda há itens obrigatórios pendentes." } }; f1SetupProfile = { ...f1SetupProfile, status: "COMPLETED", completedAt: new Date().toISOString() }; return { data: { ok: true } }; } },
  { test: /\/organizations\/\d+\/venue\/home$/, method: "get", handle: () => ({ data: f1Home() }) },
  // Públicas (nokta.live/{slug}, /cardapio/{slug}, /avaliacao/{slug})
  { test: /\/cardapio-publico\/[^/]+\/itens\/\d+\/favoritar$/, method: "post", handle: ({ url, body }) => { const token = f1Body<{ visitorToken: string }>(body).visitorToken ?? ""; const set = f1Favorites.get(token) ?? new Set<number>(); set.add(f1Num(url.pathname, 2)); f1Favorites.set(token, set); const p = F1_PRODUCTS.find((x) => 1000 + x.id === f1Num(url.pathname, 2)); return { data: { favoriteCount: (p?.favorites ?? 0) + 1 } }; } },
  { test: /\/cardapio-publico\/[^/]+\/itens\/\d+\/favoritar$/, method: "delete", handle: ({ url, params }) => { const set = f1Favorites.get(params.visitorToken ?? ""); set?.delete(f1Num(url.pathname, 2)); const p = F1_PRODUCTS.find((x) => 1000 + x.id === f1Num(url.pathname, 2)); return { data: { favoriteCount: p?.favorites ?? 0 } }; } },
  { test: /\/cardapio-publico\/[^/]+$/, method: "get", handle: ({ url, params }) => (f1Last(url.pathname) === "nao-existe" ? notFound("Cardápio não encontrado") : { data: f1PublicMenu(params.visitorToken ?? "") }) },
  { test: /\/inicio-publica\/[^/]+$/, method: "get", handle: ({ url }) => (f1Last(url.pathname) === "nao-existe" ? notFound("Estabelecimento não encontrado") : { data: F1_HOME_PUBLIC }) },
  { test: /\/avaliacao-publica\/[^/]+$/, method: "get", handle: ({ url }) => (f1Last(url.pathname) === "nao-existe" ? notFound("Estabelecimento não encontrado") : { data: F1_REVIEW_PUBLIC }) },
  { test: /\/avaliacao-publica\/[^/]+$/, method: "post", handle: () => ({ data: { id: f1NextId() } }) },
  // ── fim F1 ──
];
