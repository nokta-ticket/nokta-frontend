import { notFound, type MockHandler, type MockResult } from "./types";
import type {
  VenueCashSessionReport,
  VenueFinanceOverview,
  VenueFinancialCategory,
  VenueFinancialPaymentMethod,
  VenueOtherIncome,
  VenuePayable,
  VenuePayablePayment,
  VenuePaymentFeeRule,
  VenuePaymentMethod,
  VenuePaymentReconciliation,
  VenueSale,
  VenueSaleDetail,
} from "@/services/venue-finance";
import type { VenueInsightsComparisonValue, VenueInsightsProductRow } from "@/services/venue-insights";
import { f2Catalog } from "./venue-f2-menu";
import { f2Stock } from "./venue-f2-stock";

/**
 * F2 — Financeiro e Insights do venue. Vendas são geradas de forma
 * determinística por dia (seed = data), então overview/timeline/métodos/
 * conciliação/insights batem entre si e com o período pedido.
 */
const ORG = 1;
const DAY = 86_400_000;
const now = () => new Date().toISOString();
const agoD = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const seg = (url: URL, offset = 1) => Number(url.pathname.split("/").filter(Boolean).at(-offset));
const ok = (data: unknown): MockResult => ({ data });
const body = <T,>(b: unknown) => (b ?? {}) as T;
const fin = (suffix: string) => new RegExp(`/organizations/${ORG}/venue/finance${suffix}$`);
const ins = (suffix: string) => new RegExp(`/organizations/${ORG}/venue/insights${suffix}$`);
let seq = 12000;
const nextId = () => ++seq;

const todaySP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
function shift(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/** Resolve o período (quickPeriod ou startDate/endDate) em dias "YYYY-MM-DD". */
function periodDays(params: Record<string, string>): { start: string; end: string; days: string[] } {
  const today = todaySP();
  let start = params.startDate ?? today;
  let end = params.endDate ?? today;
  const q = params.quickPeriod;
  if (q === "YESTERDAY") { start = shift(today, -1); end = start; }
  if (q === "LAST_7_DAYS") { start = shift(today, -6); end = today; }
  if (q === "LAST_30_DAYS") { start = shift(today, -29); end = today; }
  if (q === "THIS_MONTH") { start = `${today.slice(0, 7)}-01`; end = today; }
  if (q === "LAST_MONTH") { const first = new Date(`${today.slice(0, 7)}-01T00:00:00Z`); first.setUTCMonth(first.getUTCMonth() - 1); start = first.toISOString().slice(0, 10); end = shift(`${today.slice(0, 7)}-01`, -1); }
  if (q === "TODAY" || (!q && !params.startDate)) { start = today; end = today; }
  const days: string[] = [];
  for (let d = start, i = 0; d <= end && i < 400; d = shift(d, 1), i++) days.push(d);
  return { start, end, days };
}
function previousPeriod(start: string, end: string, comparison?: string) {
  const len = Math.max(1, Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / DAY) + 1);
  if (comparison === "SAME_PERIOD_LAST_WEEK") return { start: shift(start, -7), end: shift(end, -7) };
  if (comparison === "SAME_PERIOD_LAST_MONTH") return { start: shift(start, -30), end: shift(end, -30) };
  return { start: shift(start, -len), end: shift(end, -len) };
}
const daysBetween = (start: string, end: string) => { const out: string[] = []; for (let d = start, i = 0; d <= end && i < 400; d = shift(d, 1), i++) out.push(d); return out; };

// ── Geração determinística de vendas por dia ─────────────────────────────────

const METHODS: VenuePaymentMethod[] = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "VOUCHER"];
const METHOD_WEIGHT = [0.38, 0.3, 0.16, 0.12, 0.04];
const FEE_BPS: Record<VenuePaymentMethod, number> = { PIX: 99, CREDIT_CARD: 349, DEBIT_CARD: 179, CASH: 0, VOUCHER: 500, OTHER: 0 };
const SETTLE_DAYS: Record<VenuePaymentMethod, number> = { PIX: 0, CREDIT_CARD: 30, DEBIT_CARD: 1, CASH: 0, VOUCHER: 30, OTHER: 0 };
const CUSTOMERS = ["Família Souza", null, "Aniversário da Lu", "Carla", "Turma do Rafa", "João Pedro", "Marina", null, "Beatriz", "Thiago", null, "Mesa 04", "Pedro", "Amanda", null, "Felipe"];
const SALE_PRODUCTS = [1, 4, 5, 6, 9, 10, 3, 8, 11, 14, 50, 51, 52, 2, 12];

function rng(seedStr: string) {
  let h = 2166136261;
  for (const ch of seedStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function dayFactor(date: string, locationId: number) {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  const base = dow === 5 || dow === 6 ? 1.0 : dow === 0 ? 0.55 : dow === 1 ? 0.15 : 0.45;
  return base * (locationId === 2 ? 0.45 : 1);
}
/** Vendas (pagamentos confirmados + alguns cancelados) de um dia/unidade. */
function salesOf(date: string, locationId: number): VenueSale[] {
  const r = rng(`${date}-${locationId}`);
  const count = Math.round(dayFactor(date, locationId) * (14 + r() * 18));
  const out: VenueSale[] = [];
  const today = todaySP();
  const hourCap = date === today ? Math.max(12, new Date().getHours()) : 27;
  for (let i = 0; i < count; i++) {
    const pick = r();
    let acc = 0;
    let method: VenuePaymentMethod = "PIX";
    for (let m = 0; m < METHODS.length; m++) { acc += METHOD_WEIGHT[m]; if (pick <= acc) { method = METHODS[m]; break; } }
    const amountCents = Math.round((3500 + r() * 24000) / 100) * 100;
    const hour = 11 + Math.floor(r() * Math.min(15, hourCap - 11));
    const minute = Math.floor(r() * 60);
    const confirmedAt = new Date(`${date}T${String(hour % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`).toISOString();
    const canceled = r() < 0.04;
    const id = Number(date.replace(/-/g, "")) * 100 + locationId * 50 + i;
    const tabId = 20000 + i;
    const fee = Math.round((amountCents * FEE_BPS[method]) / 10000);
    out.push({ id, organizationId: ORG, locationId, tabId, cashSessionId: method === "CASH" ? 1 : null, method, status: canceled ? "CANCELED" : "CONFIRMED", amountCents, receivedCents: method === "CASH" ? Math.ceil(amountCents / 5000) * 5000 : null, changeCents: method === "CASH" ? Math.ceil(amountCents / 5000) * 5000 - amountCents : 0, externalReference: method === "PIX" ? `E${id}` : null, notes: null, createdByUserId: 1, confirmedAt, canceledAt: canceled ? confirmedAt : null, tab: { id: tabId, publicCode: `M${String(i + 1).padStart(3, "0")}`, customerName: CUSTOMERS[i % CUSTOMERS.length], tableId: i % 3 === 0 ? null : (i % 8) + 1 }, financialSnapshot: canceled ? null : { id, paymentId: id, grossAmountCents: amountCents, estimatedFeeCents: fee, estimatedNetCents: amountCents - fee, expectedSettlementAt: new Date(new Date(confirmedAt).getTime() + SETTLE_DAYS[method] * DAY).toISOString(), feeRuleId: METHODS.indexOf(method) + 1 } });
  }
  return out.sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
}
const salesInRange = (days: string[], locationId: number) => days.flatMap((d) => salesOf(d, locationId));
const confirmed = (list: VenueSale[]) => list.filter((s) => s.status === "CONFIRMED");
const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

// ── Categorias financeiras, contas a pagar, outras receitas, taxas ───────────

const categories: VenueFinancialCategory[] = [
  { id: 1, organizationId: ORG, nome: "Fornecedores", type: "EXPENSE", description: "Bebidas, insumos e alimentos", displayOrder: 0, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 2, organizationId: ORG, nome: "Aluguel", type: "EXPENSE", description: null, displayOrder: 1, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 3, organizationId: ORG, nome: "Folha e freelas", type: "EXPENSE", description: "Equipe fixa e extras de fim de semana", displayOrder: 2, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 4, organizationId: ORG, nome: "Energia e água", type: "EXPENSE", description: null, displayOrder: 3, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 5, organizationId: ORG, nome: "Marketing", type: "EXPENSE", description: null, displayOrder: 4, active: true, archivedAt: null, createdAt: agoD(120), updatedAt: agoD(5) },
  { id: 6, organizationId: ORG, nome: "Manutenção", type: "EXPENSE", description: null, displayOrder: 5, active: false, archivedAt: agoD(20), createdAt: agoD(120), updatedAt: agoD(20) },
  { id: 7, organizationId: ORG, nome: "Aluguel de espaço", type: "OTHER_INCOME", description: "Eventos fechados", displayOrder: 0, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 8, organizationId: ORG, nome: "Couvert artístico", type: "OTHER_INCOME", description: null, displayOrder: 1, active: true, archivedAt: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 9, organizationId: ORG, nome: "Patrocínio", type: "OTHER_INCOME", description: null, displayOrder: 2, active: true, archivedAt: null, createdAt: agoD(90), updatedAt: agoD(5) },
];
const catRef = (id: number) => { const c = categories.find((x) => x.id === id)!; return { id: c.id, nome: c.nome }; };
const locRef = (id: number | null) => (id === null ? null : { id, nome: id === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena" });

const payables: VenuePayable[] = [];
const payablePayments: VenuePayablePayment[] = [];
function payable(p: { id: number; cat: number; supplierId?: number; purchaseId?: number; desc: string; total: number; paid?: number; incurredDaysAgo: number; dueInDays: number | null; status: VenuePayable["status"]; doc?: string; notes?: string; locationId?: number | null; cancel?: string }) {
  const sup = p.supplierId ? f2Stock.suppliers.find((s) => s.id === p.supplierId) : null;
  const pur = p.purchaseId ? f2Stock.purchases.find((x) => x.id === p.purchaseId) : null;
  const paid = p.paid ?? (p.status === "PAID" ? p.total : 0);
  payables.push({ id: p.id, organizationId: ORG, locationId: p.locationId === undefined ? 1 : p.locationId, categoryId: p.cat, supplierId: sup?.id ?? null, purchaseId: pur?.id ?? null, publicCode: `CP-${String(p.id).padStart(4, "0")}`, description: p.desc, status: p.status, totalAmountCents: p.total, paidAmountCents: paid, incurredAt: agoD(p.incurredDaysAgo), dueAt: p.dueInDays === null ? null : agoD(-p.dueInDays), notes: p.notes ?? null, documentNumber: p.doc ?? null, createdByUserId: 1, canceledByUserId: p.cancel ? 1 : null, canceledAt: p.cancel ? agoD(p.incurredDaysAgo - 1) : null, cancelReason: p.cancel ?? null, createdAt: agoD(p.incurredDaysAgo), updatedAt: agoD(Math.max(0, p.incurredDaysAgo - 2)), category: catRef(p.cat), supplier: sup ? { id: sup.id, nome: sup.nome } : null, location: locRef(p.locationId === undefined ? 1 : p.locationId), purchase: pur ? { id: pur.id, publicCode: pur.publicCode } : null });
  if (paid > 0) payablePayments.push({ id: nextId(), organizationId: ORG, payableId: p.id, locationId: 1, cashSessionId: null, method: p.cat === 3 ? "BANK_TRANSFER" : "PIX", amountCents: paid, paidAt: agoD(Math.max(0, p.incurredDaysAgo - 3)), externalReference: null, idempotencyKey: `pay-${p.id}`, notes: null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: agoD(Math.max(0, p.incurredDaysAgo - 3)) });
}
payable({ id: 1, cat: 1, supplierId: 1, purchaseId: 2, desc: "Chopp e tônicas — NF 48930", total: 129200, incurredDaysAgo: 9, dueInDays: 12, status: "PENDING", doc: "NF 48930" });
payable({ id: 2, cat: 1, supplierId: 1, purchaseId: 1, desc: "Long necks e essências — NF 48211", total: 158880, paid: 80000, incurredDaysAgo: 20, dueInDays: 3, status: "PARTIALLY_PAID", doc: "NF 48211", notes: "Combinado em 2x com o Sérgio." });
payable({ id: 3, cat: 2, desc: "Aluguel do salão — mês atual", total: 850000, incurredDaysAgo: 12, dueInDays: -2, status: "OVERDUE", doc: "Boleto 7731" });
payable({ id: 4, cat: 3, desc: "Freelas do fim de semana", total: 126000, incurredDaysAgo: 3, dueInDays: 4, status: "PENDING" });
payable({ id: 5, cat: 4, desc: "Conta de energia — Enel", total: 213450, incurredDaysAgo: 25, dueInDays: -20, status: "PAID", doc: "Fatura 0921" });
payable({ id: 6, cat: 1, supplierId: 2, purchaseId: 3, desc: "Hortifruti da semana", total: 18600, incurredDaysAgo: 4, dueInDays: -1, status: "PAID" });
payable({ id: 7, cat: 5, desc: "Impulsionamento Instagram", total: 40000, incurredDaysAgo: 15, dueInDays: null, status: "CANCELED", cancel: "Campanha cancelada" });
payable({ id: 8, cat: 1, supplierId: 3, desc: "Essências Ziggy — pedido 2210", total: 154000, incurredDaysAgo: 1, dueInDays: 29, status: "PENDING", doc: "Pedido 2210" });
payable({ id: 9, cat: 3, desc: "Folha — equipe fixa", total: 1480000, incurredDaysAgo: 28, dueInDays: -23, status: "PAID", locationId: null });
payable({ id: 10, cat: 4, desc: "Água — Sabesp", total: 48900, incurredDaysAgo: 2, dueInDays: 8, status: "PENDING", locationId: 2 });

const otherIncome: VenueOtherIncome[] = [
  { id: 1, organizationId: ORG, locationId: 1, categoryId: 7, description: "Evento fechado — confraternização Zion Tech", amountCents: 350000, receivedAt: agoD(6), method: "PIX", cashSessionId: null, idempotencyKey: "oi-1", notes: "Sábado, 40 pessoas.", createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: agoD(6), category: catRef(7), location: locRef(1) },
  { id: 2, organizationId: ORG, locationId: 1, categoryId: 8, description: "Couvert — show do Samba de Raiz", amountCents: 84000, receivedAt: agoD(2), method: "CASH", cashSessionId: 2, idempotencyKey: "oi-2", notes: null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: agoD(2), category: catRef(8), location: locRef(1) },
  { id: 3, organizationId: ORG, locationId: null, categoryId: 9, description: "Patrocínio Heineken — ativação de verão", amountCents: 500000, receivedAt: agoD(40), method: "BANK_TRANSFER", cashSessionId: null, idempotencyKey: "oi-3", notes: null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: agoD(40), category: catRef(9), location: null },
  { id: 4, organizationId: ORG, locationId: 2, categoryId: 8, description: "Couvert — DJ set rooftop", amountCents: 32000, receivedAt: agoD(9), method: "PIX", cashSessionId: null, idempotencyKey: "oi-4", notes: null, createdByUserId: 1, canceledByUserId: 1, canceledAt: agoD(8), cancelReason: "Lançado em duplicidade", createdAt: agoD(9), category: catRef(8), location: locRef(2) },
];

const feeRules: VenuePaymentFeeRule[] = [
  { id: 1, organizationId: ORG, locationId: null, method: "PIX", percentageBps: 99, fixedFeeCents: 0, settlementDays: 0, active: true, validFrom: agoD(200), validUntil: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 2, organizationId: ORG, locationId: null, method: "CREDIT_CARD", percentageBps: 349, fixedFeeCents: 0, settlementDays: 30, active: true, validFrom: agoD(200), validUntil: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 3, organizationId: ORG, locationId: null, method: "DEBIT_CARD", percentageBps: 179, fixedFeeCents: 0, settlementDays: 1, active: true, validFrom: agoD(200), validUntil: null, createdAt: agoD(200), updatedAt: agoD(5) },
  { id: 4, organizationId: ORG, locationId: 1, method: "VOUCHER", percentageBps: 500, fixedFeeCents: 50, settlementDays: 30, active: true, validFrom: agoD(90), validUntil: null, createdAt: agoD(90), updatedAt: agoD(5) },
  { id: 5, organizationId: ORG, locationId: null, method: "CREDIT_CARD", percentageBps: 399, fixedFeeCents: 0, settlementDays: 30, active: false, validFrom: agoD(400), validUntil: agoD(200), createdAt: agoD(400), updatedAt: agoD(200) },
];

const reconciliationOverrides = new Map<string, { actualNetCents: number; notes: string | null; at: string }>();
function reconciliations(locationId: number, days: string[]): VenuePaymentReconciliation[] {
  const out: VenuePaymentReconciliation[] = [];
  for (const date of days) {
    const sales = confirmed(salesOf(date, locationId));
    for (const method of METHODS) {
      const mine = sales.filter((s) => s.method === method);
      if (mine.length === 0) continue;
      const gross = sum(mine.map((s) => s.amountCents));
      const fee = sum(mine.map((s) => s.financialSnapshot?.estimatedFeeCents ?? 0));
      const net = gross - fee;
      const key = `${locationId}:${date}:${method}`;
      const r = rng(key)();
      const override = reconciliationOverrides.get(key);
      const auto = date < todaySP() && method !== "CASH" && r < 0.6 ? (r < 0.5 ? net : net - Math.round(r * 2000)) : null;
      const actual = override?.actualNetCents ?? auto;
      const diff = actual === null ? null : actual - net;
      out.push({ date, locationId, method, expectedGrossCents: gross, expectedFeeCents: fee, expectedNetCents: net, actualNetCents: actual, differenceCents: diff, status: actual === null ? "PENDING" : diff === 0 ? "MATCHED" : "DIVERGENT", notes: override?.notes ?? null, reconciledByUserId: actual === null ? null : 1, reconciledAt: override?.at ?? (actual === null ? null : `${date}T23:30:00.000Z`) });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.method.localeCompare(b.method));
}

type CashRow = { id: number; locationId: number; openedAt: string; closedAt: string | null; status: "OPEN" | "CLOSED"; expectedCashCents: number; countedCashCents: number | null; differenceCents: number | null; operatorName: string | null; cashRegister: { id: number; nome: string }; opening: number; cashSales: number; other: number; supply: number; withdrawal: number; expense: number; notes: string | null };
const cashRows: CashRow[] = [];
{
  const today = todaySP();
  for (let i = 0; i < 40; i++) {
    const date = shift(today, -i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (dow === 1) continue;
    const r = rng(`cash-${date}`);
    const cash = sum(confirmed(salesOf(date, 1)).filter((s) => s.method === "CASH").map((s) => s.amountCents));
    const opening = 20000;
    const withdrawal = r() < 0.5 ? 5000 : 0;
    const expense = r() < 0.3 ? Math.round(r() * 8000) : 0;
    const expected = opening + cash - withdrawal - expense;
    const isOpen = i === 0;
    const diff = isOpen ? null : r() < 0.7 ? 0 : Math.round((r() - 0.6) * 4000);
    cashRows.push({ id: 100 + i, locationId: 1, openedAt: `${date}T21:00:00.000Z`, closedAt: isOpen ? null : `${shift(date, 1)}T05:${String(Math.floor(r() * 59)).padStart(2, "0")}:00.000Z`, status: isOpen ? "OPEN" : "CLOSED", expectedCashCents: expected, countedCashCents: isOpen ? null : expected + (diff ?? 0), differenceCents: diff, operatorName: i % 3 === 0 ? "Rafael Nunes" : i % 3 === 1 ? "Marina Castro" : "Vitor Reis", cashRegister: i % 4 === 3 ? { id: 2, nome: "Caixa do bar" } : { id: 1, nome: "Caixa principal" }, opening, cashSales: cash, other: 0, supply: 0, withdrawal, expense, notes: diff && diff < 0 ? "Faltou troco na gaveta" : null });
  }
}
function cashReport(row: CashRow): VenueCashSessionReport {
  return { sessionId: row.id, operatorUserId: 1, closedByUserId: row.status === "CLOSED" ? 1 : null, cashRegister: row.cashRegister, location: locRef(row.locationId)!, openedAt: row.openedAt, closedAt: row.closedAt, openingAmountCents: row.opening, cashSalesCents: row.cashSales, otherIncomeCents: row.other, supplyCents: row.supply, withdrawalCents: row.withdrawal, expenseCents: row.expense, adjustmentsCents: 0, expectedCashCents: row.expectedCashCents, countedCashCents: row.countedCashCents, differenceCents: row.differenceCents, status: row.status, notes: row.notes };
}

// ── Overview / timeline ──────────────────────────────────────────────────────

const CMV_RATE = 0.34;
function expensesInRange(start: string, end: string, locationId?: number) {
  return payables.filter((p) => p.status !== "CANCELED" && (locationId === undefined || p.locationId === locationId || p.locationId === null) && p.incurredAt.slice(0, 10) >= start && p.incurredAt.slice(0, 10) <= end);
}
function otherIncomeInRange(start: string, end: string, locationId?: number) {
  return otherIncome.filter((o) => !o.canceledAt && (locationId === undefined || o.locationId === locationId || o.locationId === null) && o.receivedAt.slice(0, 10) >= start && o.receivedAt.slice(0, 10) <= end);
}
function overview(locationId: number, params: Record<string, string>): VenueFinanceOverview {
  const { start, end, days } = periodDays(params);
  const basis = params.basis === "ACCRUAL" ? "ACCRUAL" : "CASH";
  const all = salesInRange(days, locationId);
  const sales = confirmed(all);
  const gross = sum(sales.map((s) => s.amountCents));
  const fee = sum(sales.map((s) => s.financialSnapshot?.estimatedFeeCents ?? 0));
  const discount = Math.round(gross * 0.021);
  const service = Math.round(gross * 0.1);
  const canceled = sum(all.filter((s) => s.status === "CANCELED").map((s) => s.amountCents));
  const cmv = Math.round(gross * CMV_RATE);
  const exp = expensesInRange(start, end, locationId);
  const expenses = basis === "CASH" ? sum(exp.map((p) => p.paidAmountCents)) : sum(exp.map((p) => p.totalAmountCents));
  const other = sum(otherIncomeInRange(start, end, locationId).map((o) => o.amountCents));
  const open = payables.filter((p) => ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(p.status));
  return { basis, period: { startAt: `${start}T03:00:00.000Z`, endAt: `${shift(end, 1)}T02:59:59.999Z` }, grossRevenueCents: gross, netRevenueCents: gross - fee, estimatedFeeCents: fee, discountCents: discount, serviceChargeCents: service, canceledCents: canceled, cmvCents: cmv, grossMarginCents: gross - fee - cmv, expensesCents: expenses, otherIncomeCents: other, operationalResultCents: gross - fee - cmv - expenses + other, payablesOpenCount: open.length, payablesOverdueCount: open.filter((p) => p.status === "OVERDUE").length, disclaimer: basis === "CASH" ? "Regime de caixa: considera o que foi efetivamente recebido e pago no período. Taxas são estimadas pelas regras cadastradas." : "Regime de competência: considera vendas e despesas pela data em que aconteceram, pagas ou não. Taxas são estimadas pelas regras cadastradas." };
}
function timeline(locationId: number, params: Record<string, string>) {
  const { days } = periodDays(params);
  const totalDays = days.length;
  return days.map((date) => {
    const sales = confirmed(salesOf(date, locationId));
    const revenue = sum(sales.map((s) => s.amountCents));
    const cmv = Math.round(revenue * CMV_RATE);
    const exp = Math.round(sum(expensesInRange(days[0], days[totalDays - 1], locationId).map((p) => p.totalAmountCents)) / totalDays);
    return { date, revenueCents: revenue, cmvCents: cmv, expensesCents: exp, resultCents: revenue - cmv - exp };
  });
}
function paymentMethods(locationId: number, params: Record<string, string>) {
  const sales = confirmed(salesInRange(periodDays(params).days, locationId));
  return METHODS.map((method) => { const mine = sales.filter((s) => s.method === method); const gross = sum(mine.map((s) => s.amountCents)); const fee = sum(mine.map((s) => s.financialSnapshot?.estimatedFeeCents ?? 0)); return { method, grossCents: gross, feeCents: fee, netCents: gross - fee, count: mine.length }; }).filter((b) => b.count > 0);
}
function expensesByCategory(locationId: number | undefined, params: Record<string, string>) {
  const { start, end } = periodDays(params);
  const map = new Map<number, number>();
  for (const p of expensesInRange(start, end, locationId)) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + p.totalAmountCents);
  return [...map.entries()].map(([categoryId, amountCents]) => ({ categoryId, nome: catRef(categoryId).nome, amountCents })).sort((a, b) => b.amountCents - a.amountCents);
}
function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const head = Object.keys(rows[0]);
  return [head.join(";"), ...rows.map((r) => head.map((k) => JSON.stringify(r[k] ?? "")).join(";"))].join("\n");
}

// ── Insights ─────────────────────────────────────────────────────────────────

function cmp(current: number, previous: number | null, goodWhenUp = true): VenueInsightsComparisonValue {
  if (previous === null) return { current, previous: null, absoluteDiff: null, percentDiff: null, direction: "STABLE", hasBase: false, semantic: "neutral" };
  const diff = current - previous;
  const pct = previous === 0 ? null : Math.round((diff / previous) * 1000) / 10;
  const direction = Math.abs(diff) < Math.max(1, previous * 0.01) ? "STABLE" : diff > 0 ? "UP" : "DOWN";
  const semantic = direction === "STABLE" ? "neutral" : (direction === "UP") === goodWhenUp ? "positive" : "negative";
  return { current, previous, absoluteDiff: diff, percentDiff: pct, direction, hasBase: true, semantic };
}
const allLocations = (params: Record<string, string>) => (params.locationId ? [Number(params.locationId)] : [1, 2]);
function insightsBase(params: Record<string, string>) {
  const { start, end, days } = periodDays(params);
  const locs = allLocations(params);
  const comparison = params.comparison ?? "PREVIOUS_PERIOD";
  const prev = comparison === "NONE" ? null : previousPeriod(start, end, comparison);
  const sales = confirmed(locs.flatMap((l) => salesInRange(days, l)));
  const prevSales = prev ? confirmed(locs.flatMap((l) => salesInRange(daysBetween(prev.start, prev.end), l))) : null;
  return { start, end, days, locs, prev, sales, prevSales, period: { startAt: `${start}T03:00:00.000Z`, endAt: `${shift(end, 1)}T02:59:59.999Z` }, comparisonPeriod: prev ? { startAt: `${prev.start}T03:00:00.000Z`, endAt: `${shift(prev.end, 1)}T02:59:59.999Z` } : null };
}
function byHour(sales: VenueSale[]) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, amountCents: 0, count: 0 }));
  for (const s of sales) { const h = new Date(s.confirmedAt).getUTCHours(); const local = (h + 21) % 24; hours[local].amountCents += s.amountCents; hours[local].count += 1; }
  return hours.filter((h) => h.hour >= 11 || h.hour <= 3);
}
const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function byWeekday(sales: VenueSale[]) {
  const out = WEEKDAY.map((label, weekday) => ({ weekday, label, amountCents: 0, count: 0 }));
  for (const s of sales) { const w = new Date(s.confirmedAt).getUTCDay(); out[w].amountCents += s.amountCents; out[w].count += 1; }
  return out;
}
function productRows(sales: VenueSale[]): VenueInsightsProductRow[] {
  const total = sum(sales.map((s) => s.amountCents));
  const r = rng(`prod-${sales.length}-${total}`);
  return SALE_PRODUCTS.map((pid, i) => {
    const p = f2Catalog.products.find((x) => x.id === pid)!;
    const v = f2Catalog.variants.find((x) => x.productId === pid && x.isDefault) ?? f2Catalog.variants.find((x) => x.productId === pid)!;
    const share = [0.19, 0.14, 0.1, 0.09, 0.11, 0.07, 0.06, 0.05, 0.04, 0.03, 0.04, 0.03, 0.02, 0.02, 0.01][i];
    const revenue = Math.round(total * share * (0.85 + r() * 0.3));
    const qty = Math.max(0, Math.round(revenue / Math.max(1, v.priceCents)));
    const cmvRate = pid >= 50 ? 0.22 : pid === 1 ? 0.3 : pid === 9 ? 0.45 : pid === 12 ? 0.55 : 0.33;
    const cmv = Math.round(revenue * cmvRate);
    return { productId: pid, variantId: v.id, nome: p.nome, variantNome: v.nome, quantitySold: qty, averagePriceCents: qty ? Math.round(revenue / qty) : null, revenueCents: revenue, cmvCents: cmv, marginCents: revenue - cmv, marginPercentage: revenue ? Math.round(((revenue - cmv) / revenue) * 1000) / 10 : null, canceledCount: Math.round(qty * (pid === 7 ? 0.08 : 0.015)) };
  });
}
function insightsOverview(params: Record<string, string>) {
  const b = insightsBase(params);
  const gross = sum(b.sales.map((s) => s.amountCents));
  const prevGross = b.prevSales ? sum(b.prevSales.map((s) => s.amountCents)) : null;
  const fee = sum(b.sales.map((s) => s.financialSnapshot?.estimatedFeeCents ?? 0));
  const cmv = Math.round(gross * CMV_RATE);
  const expenses = sum(expensesInRange(b.start, b.end).map((p) => p.totalAmountCents));
  const other = sum(otherIncomeInRange(b.start, b.end).map((o) => o.amountCents));
  const result = gross - fee - cmv - expenses + other;
  const prevResult = prevGross === null ? null : Math.round(prevGross * (1 - CMV_RATE) - expenses * 0.95);
  const tabs = Math.round(b.sales.length * 0.8);
  const prevTabs = b.prevSales ? Math.round(b.prevSales.length * 0.8) : null;
  const guests = Math.round(tabs * 2.6);
  const prevGuests = prevTabs === null ? null : Math.round(prevTabs * 2.5);
  const avg = tabs ? Math.round(gross / tabs) : 0;
  const prevAvg = prevTabs ? Math.round((prevGross ?? 0) / prevTabs) : null;
  const tl = timeline(1, params);
  const products = productRows(b.sales);
  return { period: b.period, comparisonPeriod: b.comparisonPeriod, timeZone: "America/Sao_Paulo", cards: { revenueCents: cmp(gross, prevGross), operationalResultCents: cmp(result, prevResult), averageTicketCents: cmp(avg, prevAvg), guestsServed: { ...cmp(guests, prevGuests), coverage: 0.86 } }, secondary: { closedTabsCount: tabs, grossMarginCents: gross - fee - cmv, cmvCents: cmv, occupancyRate: 0.72, occupancyMessage: null, averageTabDurationMs: 94 * 60000, noShowRate: 0.11, lossCents: 6200 * b.days.length, divergentCashSessionsCount: cashRows.filter((c) => c.status === "CLOSED" && c.differenceCents && c.openedAt.slice(0, 10) >= b.start && c.openedAt.slice(0, 10) <= b.end).length }, timeline: tl, salesByHour: byHour(b.sales).map(({ hour, amountCents }) => ({ hour, amountCents })), topProducts: products.sort((x, y) => y.revenueCents - x.revenueCents).slice(0, 5).map((p) => ({ productId: p.productId, nome: p.nome, revenueCents: p.revenueCents })), disclaimer: "Leitura consolidada do que já aconteceu na Operação, Reservas, Estoque e Financeiro — não é uma nova fonte de dados." };
}
function insightsAlerts() {
  const alerts = f2Stock.alerts(1);
  return { outOfStockItems: alerts.filter((a) => a.status === "OUT_OF_STOCK").map((a) => ({ itemId: a.inventoryItemId, nome: a.nome })), lowStockItems: alerts.filter((a) => a.status === "LOW_STOCK").map((a) => ({ itemId: a.inventoryItemId, nome: a.nome })), overduePayables: payables.filter((p) => p.status === "OVERDUE").map((p) => ({ id: p.id, publicCode: p.publicCode, description: p.description, remainingCents: p.totalAmountCents - p.paidAmountCents, dueAt: p.dueAt })), divergentCashSessions: cashRows.filter((c) => c.status === "CLOSED" && c.differenceCents).slice(0, 5).map((c) => ({ id: c.id, differenceCents: c.differenceCents, closedAt: c.closedAt })), elevatedNoShow: { rate: 0.11 } };
}
function insightsSales(params: Record<string, string>) {
  const b = insightsBase(params);
  const gross = sum(b.sales.map((s) => s.amountCents));
  const prevGross = b.prevSales ? sum(b.prevSales.map((s) => s.amountCents)) : null;
  const tabs = Math.max(1, Math.round(b.sales.length * 0.8));
  const prevTabs = b.prevSales ? Math.max(1, Math.round(b.prevSales.length * 0.8)) : null;
  const fee = sum(b.sales.map((s) => s.financialSnapshot?.estimatedFeeCents ?? 0));
  const granularity = params.granularity ?? "DAY";
  let tl: { date: string; amountCents: number }[];
  if (granularity === "HOUR") tl = byHour(b.sales).map((h) => ({ date: `${String(h.hour).padStart(2, "0")}h`, amountCents: h.amountCents }));
  else if (granularity === "WEEK" || granularity === "MONTH") { const map = new Map<string, number>(); for (const d of b.days) { const key = granularity === "MONTH" ? d.slice(0, 7) : shift(d, -new Date(`${d}T12:00:00Z`).getUTCDay()); map.set(key, (map.get(key) ?? 0) + sum(b.locs.flatMap((l) => confirmed(salesOf(d, l))).map((s) => s.amountCents))); } tl = [...map.entries()].map(([date, amountCents]) => ({ date, amountCents })); }
  else tl = b.days.map((d) => ({ date: d, amountCents: sum(b.locs.flatMap((l) => confirmed(salesOf(d, l))).map((s) => s.amountCents)) }));
  const top = [...b.sales].sort((x, y) => y.amountCents - x.amountCents).slice(0, 5);
  return { period: b.period, timeZone: "America/Sao_Paulo", summary: { grossRevenueCents: cmp(gross, prevGross), paymentsCount: b.sales.length, averageTicketCents: cmp(Math.round(gross / tabs), prevTabs ? Math.round((prevGross ?? 0) / prevTabs) : null), averageDiscountCents: Math.round(gross * 0.021 / tabs), totalDiscountCents: Math.round(gross * 0.021), totalServiceChargeCents: Math.round(gross * 0.1), netRevenueCents: gross - fee, canceledTabsCount: Math.round(b.sales.length * 0.03) }, timeline: tl, byHour: byHour(b.sales).map(({ hour, amountCents }) => ({ hour, amountCents })), byWeekday: byWeekday(b.sales).map(({ weekday, label, amountCents }) => ({ weekday, label, amountCents })), byPaymentMethod: METHODS.map((method) => { const mine = b.sales.filter((s) => s.method === method); return { method, grossCents: sum(mine.map((s) => s.amountCents)), count: mine.length }; }).filter((m) => m.count > 0), byOrigin: [{ origin: "TABLE", count: Math.round(tabs * 0.62), totalCents: Math.round(gross * 0.66) }, { origin: "INDIVIDUAL", count: Math.round(tabs * 0.2), totalCents: Math.round(gross * 0.17) }, { origin: "COUNTER", count: Math.round(tabs * 0.1), totalCents: Math.round(gross * 0.07) }, { origin: "RESERVATION", count: Math.round(tabs * 0.06), totalCents: Math.round(gross * 0.08) }, { origin: "WAITLIST", count: Math.round(tabs * 0.02), totalCents: Math.round(gross * 0.02) }], topTabsByTotal: top.map((s) => ({ id: s.tabId, publicCode: s.tab.publicCode, customerName: s.tab.customerName, totalCents: s.amountCents, closedAt: s.confirmedAt })), topTabsByDiscount: top.slice(0, 3).map((s, i) => ({ id: s.tabId, publicCode: s.tab.publicCode, customerName: s.tab.customerName, discountCents: [2000, 1500, 1000][i], totalCents: s.amountCents })) };
}
function insightsOperation(params: Record<string, string>) {
  const b = insightsBase(params);
  const tabs = Math.round(b.sales.length * 0.8);
  const hours = byHour(b.sales);
  return { period: b.period, timeZone: "America/Sao_Paulo", summary: { openedTabsCount: tabs + 3, closedTabsCount: tabs, averageTabDurationMs: 94 * 60000, averageTimeToFirstOrderMs: 6 * 60000, averagePreparationTimeMs: 11 * 60000 + 20000, averageTimeToDeliveryMs: 14 * 60000, canceledOrdersCount: Math.round(tabs * 0.03), canceledItemsCount: Math.round(tabs * 0.05), averageServiceChargeRateBps: 1000, averageDiscountCents: 180 }, byStation: [{ stationId: 1, nome: "Bar principal", itemCount: Math.round(tabs * 3.1), averagePreparationTimeMs: 6 * 60000 + 30000 }, { stationId: 2, nome: "Cozinha", itemCount: Math.round(tabs * 1.4), averagePreparationTimeMs: 17 * 60000 }, { stationId: null, nome: "Sem estação", itemCount: Math.round(tabs * 0.4), averagePreparationTimeMs: null }], byHour: hours.map((h) => ({ hour: h.hour, ordersCount: Math.round(h.count * 1.6) })), byOperator: [{ userId: 1, openedTabs: Math.round(tabs * 0.45), createdOrders: Math.round(tabs * 1.3) }, { userId: 7, openedTabs: Math.round(tabs * 0.35), createdOrders: Math.round(tabs * 1.1) }, { userId: 21, openedTabs: Math.round(tabs * 0.2), createdOrders: Math.round(tabs * 0.7) }] };
}
function insightsProducts(params: Record<string, string>) {
  const b = insightsBase(params);
  const rows = productRows(b.sales);
  const search = (params.search ?? "").toLowerCase();
  const table = rows.filter((r) => !search || r.nome.toLowerCase().includes(search)).sort((x, y) => y.revenueCents - x.revenueCents);
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = Number(params.limit ?? 20);
  const byRev = [...rows].sort((x, y) => y.revenueCents - x.revenueCents);
  return { period: b.period, rankings: { mostSold: [...rows].sort((x, y) => y.quantitySold - x.quantitySold).slice(0, 5), topRevenue: byRev.slice(0, 5), topMargin: [...rows].sort((x, y) => y.marginCents - x.marginCents).slice(0, 5), lowestMargin: [...rows].filter((r) => r.marginPercentage !== null).sort((x, y) => (x.marginPercentage ?? 0) - (y.marginPercentage ?? 0)).slice(0, 5), mostCanceled: [...rows].sort((x, y) => y.canceledCount - x.canceledCount).slice(0, 5) }, table: { data: table.slice((page - 1) * limit, page * limit), page, limit, total: table.length }, modifiersRanking: [{ modifierOptionId: 2, nome: "Morango", count: Math.round(rows[1].quantitySold * 0.4), revenueCents: Math.round(rows[1].quantitySold * 0.4 * 200) }, { modifierOptionId: 8, nome: "Cheddar", count: Math.round(rows[4].quantitySold * 0.5), revenueCents: Math.round(rows[4].quantitySold * 0.5 * 400) }, { modifierOptionId: 9, nome: "Barbecue", count: Math.round(rows[4].quantitySold * 0.3), revenueCents: Math.round(rows[4].quantitySold * 0.3 * 300) }, { modifierOptionId: 1, nome: "Limão", count: Math.round(rows[1].quantitySold * 0.5), revenueCents: 0 }], categoriesRanking: [{ nome: "Drinks", quantitySold: sum(rows.filter((r) => [4, 5, 6, 8].includes(r.productId)).map((r) => r.quantitySold)), revenueCents: sum(rows.filter((r) => [4, 5, 6, 8].includes(r.productId)).map((r) => r.revenueCents)) }, { nome: "Cervejas", quantitySold: sum(rows.filter((r) => [1, 2, 3].includes(r.productId)).map((r) => r.quantitySold)), revenueCents: sum(rows.filter((r) => [1, 2, 3].includes(r.productId)).map((r) => r.revenueCents)) }, { nome: "Porções", quantitySold: sum(rows.filter((r) => [9, 10, 11].includes(r.productId)).map((r) => r.quantitySold)), revenueCents: sum(rows.filter((r) => [9, 10, 11].includes(r.productId)).map((r) => r.revenueCents)) }, { nome: "Essências", quantitySold: sum(rows.filter((r) => r.productId >= 50).map((r) => r.quantitySold)), revenueCents: sum(rows.filter((r) => r.productId >= 50).map((r) => r.revenueCents)) }, { nome: "Sem álcool", quantitySold: sum(rows.filter((r) => [12, 14].includes(r.productId)).map((r) => r.quantitySold)), revenueCents: sum(rows.filter((r) => [12, 14].includes(r.productId)).map((r) => r.revenueCents)) }].sort((x, y) => y.revenueCents - x.revenueCents) };
}
function insightsProductDetail(productId: number, params: Record<string, string>) {
  const row = productRows(insightsBase(params).sales).find((r) => r.productId === productId);
  const p = f2Catalog.products.find((x) => x.id === productId);
  if (!row || !p) return null;
  const vars = f2Catalog.variants.filter((v) => v.productId === productId);
  return { productId, nome: p.nome, quantitySold: row.quantitySold, revenueCents: row.revenueCents, cmvCents: row.cmvCents, marginCents: row.marginCents, marginPercentage: row.marginPercentage, byVariant: vars.map((v, i) => { const share = i === 0 ? 0.7 : 0.3 / Math.max(1, vars.length - 1); return { variantId: v.id, variantNome: v.nome, quantitySold: Math.round(row.quantitySold * share), revenueCents: Math.round(row.revenueCents * share), cmvCents: Math.round(row.cmvCents * share), canceledCount: Math.round(row.canceledCount * share) }; }) };
}
function insightsReservations(params: Record<string, string>) {
  const b = insightsBase(params);
  const n = Math.max(4, Math.round(b.days.length * 9));
  const created = n;
  const canceled = Math.round(n * 0.12);
  const noShow = Math.round(n * 0.11);
  const completed = Math.round(n * 0.6);
  const confirmedCount = n - canceled - noShow - completed;
  const r = rng(`res-${b.start}`);
  return { period: b.period, timeZone: "America/Sao_Paulo", summary: { createdCount: created, confirmedCount: confirmedCount, completedCount: completed, canceledCount: canceled, noShowCount: noShow, expectedGuests: Math.round(n * 3.4), seatedGuests: Math.round((completed + confirmedCount) * 3.2), noShowRate: Math.round((noShow / n) * 1000) / 1000, attendanceRate: Math.round((completed / n) * 1000) / 1000, withoutTableCount: Math.round(n * 0.08) }, conversion: { reservationsWithTabCount: completed, revenueFromReservationsCents: completed * 18900, averageTicketFromReservations: 18900 }, bySource: [{ source: "WHATSAPP", count: Math.round(n * 0.46) }, { source: "INSTAGRAM", count: Math.round(n * 0.22) }, { source: "WEBSITE", count: Math.round(n * 0.15) }, { source: "PHONE", count: Math.round(n * 0.1) }, { source: "WALK_IN", count: Math.round(n * 0.07) }], byWeekday: WEEKDAY.map((label, weekday) => ({ weekday, label, count: Math.round((n / 7) * [0.7, 0.1, 0.5, 0.8, 1.1, 1.9, 1.9][weekday]) })), byHour: [12, 13, 18, 19, 20, 21, 22].map((hour) => ({ hour, count: Math.round((n / 7) * [0.4, 0.6, 0.5, 1.2, 1.8, 1.6, 0.9][[12, 13, 18, 19, 20, 21, 22].indexOf(hour)] * (0.8 + r() * 0.4)) })), waitlist: { totalEntries: Math.round(n * 0.5), seatedCount: Math.round(n * 0.33), leftCount: Math.round(n * 0.1), canceledCount: Math.round(n * 0.07), conversionRate: 0.66, averageWaitTimeMs: 18 * 60000, revenueCents: Math.round(n * 0.33 * 9800) } };
}
function insightsStock(params: Record<string, string>) {
  const b = insightsBase(params);
  const s = f2Stock.summary(1);
  const purchases = f2Stock.purchases.filter((p) => p.status === "RECEIVED" && p.receivedAt && p.receivedAt.slice(0, 10) >= b.start && p.receivedAt.slice(0, 10) <= b.end);
  const waste = f2Stock.movements.filter((m) => m.type === "WASTE" && m.createdAt.slice(0, 10) >= b.start && m.createdAt.slice(0, 10) <= b.end);
  const consumption = Math.round(sum(b.sales.map((x) => x.amountCents)) * CMV_RATE);
  const lossCents = sum(waste.map((m) => Math.round(Math.abs(Number(m.quantityDelta)) * Number(f2Stock.balances.find((x) => x.inventoryItemId === m.inventoryItemId && x.locationId === 1)?.averageUnitCostCents ?? 0)))) + 4200;
  const bySupplier = new Map<number | null, { nome: string; totalCents: number; count: number }>();
  for (const p of purchases) { const k = p.supplierId; const cur = bySupplier.get(k) ?? { nome: p.supplier?.nome ?? "Sem fornecedor", totalCents: 0, count: 0 }; cur.totalCents += p.totalCostCents; cur.count += 1; bySupplier.set(k, cur); }
  const highest = [...f2Stock.balances].filter((x) => x.locationId === 1).sort((x, y) => Number(y.estimatedValueCents) - Number(x.estimatedValueCents)).slice(0, 6).map((x) => { const it = f2Stock.items.find((i) => i.id === x.inventoryItemId)!; return { itemId: it.id, nome: it.nome, categoryNome: it.category?.nome ?? null, quantityOnHand: x.quantityOnHand, valueCents: Math.round(Number(x.estimatedValueCents)) }; });
  const costByCat = new Map<string, number>();
  for (const x of f2Stock.balances.filter((y) => y.locationId === 1)) { const it = f2Stock.items.find((i) => i.id === x.inventoryItemId)!; const k = it.category?.nome ?? "Sem categoria"; costByCat.set(k, (costByCat.get(k) ?? 0) + Math.round(Number(x.estimatedValueCents))); }
  return { period: b.period, summary: { estimatedValueCents: s.estimatedValueCents, lowStockCount: s.lowStockCount, outOfStockCount: s.outOfStockCount, negativeCount: 0, purchasesTotalCents: sum(purchases.map((p) => p.totalCostCents)), lossCents, consumptionCents: consumption, estimatedTurnover: s.estimatedValueCents ? Math.round((consumption / s.estimatedValueCents) * 100) / 100 : null, turnoverLabel: "Consumo do período dividido pelo valor em estoque hoje.", countAdjustmentsCount: 1, transfersCount: 2 }, lossByReason: [{ reason: "Perda", amountCents: Math.round(lossCents * 0.7) }, { reason: "Ajuste de saída", amountCents: Math.round(lossCents * 0.3) }], purchasesBySupplier: [...bySupplier.entries()].map(([supplierId, v]) => ({ supplierId, ...v })).sort((x, y) => y.totalCents - x.totalCents), highestValueItems: highest, mostConsumedItems: [{ itemId: 1, nome: "Barril de chopp Pilsen 50 L", consumedQuantity: 42500 * b.days.length / 7 }, { itemId: 12, nome: "Gelo em cubos", consumedQuantity: 18000 * b.days.length / 7 }, { itemId: 9, nome: "Limão taiti", consumedQuantity: 2400 * b.days.length / 7 }, { itemId: 3, nome: "Long neck Heineken", consumedQuantity: 144 * b.days.length / 7 }, { itemId: 20, nome: "Essência Ziggy 50 g", consumedQuantity: 150 * b.days.length / 7 }].map((m) => ({ ...m, consumedQuantity: Math.round(m.consumedQuantity) })), costByCategory: [...costByCat.entries()].map(([nome, valueCents]) => ({ nome, valueCents })).sort((x, y) => y.valueCents - x.valueCents) };
}
function insightsFinance(params: Record<string, string>) {
  const b = insightsBase(params);
  const ov = overview(1, params);
  const divergent = cashRows.filter((c) => c.status === "CLOSED" && c.differenceCents && c.openedAt.slice(0, 10) >= b.start && c.openedAt.slice(0, 10) <= b.end);
  const rec = reconciliations(1, b.days);
  return { period: b.period, overview: ov, expensesByCategory: expensesByCategory(undefined, params), cashDivergence: { sessionsCount: divergent.length, totalDifferenceCents: sum(divergent.map((c) => c.differenceCents ?? 0)) }, reconciliation: { divergentCount: rec.filter((r) => r.status === "DIVERGENT").length, totalCount: rec.length, divergentRows: rec.filter((r) => r.status === "DIVERGENT").slice(0, 10) } };
}
function locationsComparison(params: Record<string, string>) {
  const { days, start, end } = periodDays(params);
  return { period: { startAt: `${start}T03:00:00.000Z`, endAt: `${shift(end, 1)}T02:59:59.999Z` }, locations: [1, 2].map((locationId) => { const sales = confirmed(salesInRange(days, locationId)); const gross = sum(sales.map((s) => s.amountCents)); const tabs = Math.max(1, Math.round(sales.length * 0.8)); const cmv = Math.round(gross * CMV_RATE); return { locationId, nome: locationId === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena", revenueCents: gross, operationalResultCents: Math.round(gross * 0.42), grossMarginCents: gross - cmv, averageTicketCents: Math.round(gross / tabs), closedTabsCount: tabs, guestsServed: Math.round(tabs * 2.6), averageTabDurationMs: (locationId === 1 ? 94 : 76) * 60000, noShowRate: locationId === 1 ? 0.11 : 0.06, lossCents: locationId === 1 ? 6200 * days.length : 1800 * days.length, divergentCashSessionsCount: locationId === 1 ? 2 : 0 }; }) };
}

export const f2FinanceHandlers: MockHandler[] = [
  // Resumo
  { test: fin("/locations/\\d+/overview"), method: "get", handle: ({ url, params }) => ok(overview(seg(url, 2), params)) },
  { test: fin("/locations/\\d+/timeline"), method: "get", handle: ({ url, params }) => ok(timeline(seg(url, 2), params)) },
  { test: fin("/locations/\\d+/payment-methods"), method: "get", handle: ({ url, params }) => ok(paymentMethods(seg(url, 2), params)) },
  { test: fin("/locations/\\d+/expenses-by-category"), method: "get", handle: ({ url, params }) => ok(expensesByCategory(seg(url, 2), params)) },
  { test: fin("/compare-locations"), method: "get", handle: ({ params }) => ok([1, 2].map((id) => ({ ...overview(id, params), locationId: id, nome: id === 1 ? "Unidade Pinheiros" : "Rooftop Vila Madalena" }))) },

  // Vendas
  { test: fin("/locations/\\d+/sales"), method: "get", handle: ({ url, params }) => { const search = (params.search ?? "").toLowerCase(); const list = salesInRange(periodDays(params).days, seg(url, 2)).filter((s) => (!params.method || s.method === params.method) && (!params.status || s.status === params.status) && (!search || `${s.tab.publicCode} ${s.tab.customerName ?? ""} ${s.externalReference ?? ""}`.toLowerCase().includes(search))); const page = Math.max(1, Number(params.page ?? 1)); const limit = Number(params.limit ?? 20); return ok({ data: list.slice((page - 1) * limit, page * limit), page, limit, total: list.length }); } },
  { test: fin("/sales/\\d+"), method: "get", handle: ({ url }) => { const id = seg(url); const date = String(Math.floor(id / 100)); const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`; const sale = [1, 2].flatMap((l) => salesOf(iso, l)).find((s) => s.id === id); if (!sale) return notFound("Venda não encontrada"); const r = rng(`detail-${id}`); const items = SALE_PRODUCTS.slice(0, 2 + Math.floor(r() * 3)).map((pid, i) => { const p = f2Catalog.products.find((x) => x.id === pid)!; const v = f2Catalog.variants.find((x) => x.productId === pid)!; const qty = 1 + Math.floor(r() * 3); return { id: id * 10 + i, productNameSnapshot: p.nome, variantNameSnapshot: v.nome, quantity: qty, lineTotalCents: v.priceCents * qty }; }); const subtotal = sum(items.map((i) => i.lineTotalCents)); const service = Math.round(subtotal * 0.1); const detail: VenueSaleDetail = { payment: sale, tab: { id: sale.tabId, publicCode: sale.tab.publicCode, customerName: sale.tab.customerName, discountCents: 0, serviceChargeCents: service, subtotalCents: subtotal, totalCents: subtotal + service, payments: [sale], items }, cmvCents: Math.round(subtotal * CMV_RATE), marginCents: subtotal - Math.round(subtotal * CMV_RATE) }; return ok(detail); } },
  { test: fin("/locations/\\d+/receivables"), method: "get", handle: ({ url }) => { const locationId = seg(url, 2); const today = todaySP(); const recent = confirmed(salesInRange(daysBetween(shift(today, -30), today), locationId)); const bucket = (from: number, to: number) => sum(recent.filter((s) => { const d = s.financialSnapshot?.expectedSettlementAt?.slice(0, 10) ?? ""; return d >= shift(today, from) && d <= shift(today, to); }).map((s) => s.financialSnapshot?.estimatedNetCents ?? 0)); return ok({ todayCents: bucket(0, 0), tomorrowCents: bucket(1, 1), next7DaysCents: bucket(0, 6), next30DaysCents: bucket(0, 29), byMethodNext7Days: METHODS.map((method) => ({ method, netCents: sum(recent.filter((s) => s.method === method && (s.financialSnapshot?.expectedSettlementAt?.slice(0, 10) ?? "") >= today && (s.financialSnapshot?.expectedSettlementAt?.slice(0, 10) ?? "") <= shift(today, 6)).map((s) => s.financialSnapshot?.estimatedNetCents ?? 0)) })).filter((m) => m.netCents > 0), disclaimer: "Previsão baseada nos prazos de liquidação das regras de taxa — o valor real depende da adquirente." }); } },

  // Categorias
  { test: fin("/categories"), method: "get", handle: ({ params }) => ok(categories.filter((c) => (!params.type || c.type === params.type) && (params.includeArchived === "true" || !c.archivedAt)).sort((a, b) => a.displayOrder - b.displayOrder)) },
  { test: fin("/categories"), method: "post", handle: ({ body: b }) => { const p = body<{ nome: string; type: VenueFinancialCategory["type"]; description?: string }>(b); const c: VenueFinancialCategory = { id: nextId(), organizationId: ORG, nome: p.nome, type: p.type, description: p.description ?? null, displayOrder: categories.filter((x) => x.type === p.type).length, active: true, archivedAt: null, createdAt: now(), updatedAt: now() }; categories.push(c); return ok(c); } },
  { test: fin("/categories/\\d+/archive"), method: "post", handle: ({ url }) => { const c = categories.find((x) => x.id === seg(url, 2)); if (!c) return notFound(); c.active = false; c.archivedAt = now(); return ok(c); } },
  { test: fin("/categories/\\d+"), method: "patch", handle: ({ url, body: b }) => { const c = categories.find((x) => x.id === seg(url)); if (!c) return notFound(); Object.assign(c, body<object>(b), { updatedAt: now() }); return ok(c); } },

  // Contas a pagar
  { test: fin("/payables"), method: "get", handle: ({ params }) => { const search = (params.search ?? "").toLowerCase(); const list = payables.filter((p) => (!params.status || p.status === params.status) && (!params.locationId || p.locationId === Number(params.locationId) || p.locationId === null) && (!params.categoryId || p.categoryId === Number(params.categoryId)) && (!params.supplierId || p.supplierId === Number(params.supplierId)) && (!params.dueBefore || (p.dueAt ?? "") <= params.dueBefore) && (!search || `${p.description} ${p.publicCode} ${p.supplier?.nome ?? ""} ${p.documentNumber ?? ""}`.toLowerCase().includes(search))).sort((a, b) => (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9")); const page = Math.max(1, Number(params.page ?? 1)); const limit = Number(params.limit ?? 20); return ok({ data: list.slice((page - 1) * limit, page * limit), page, limit, total: list.length }); } },
  {
    test: fin("/payables"),
    method: "post",
    handle: ({ body: b }) => {
      const p = body<{ locationId?: number; categoryId: number; supplierId?: number; purchaseId?: number; description: string; totalAmountCents: number; incurredAt: string; dueAt?: string; notes?: string; documentNumber?: string; initialPayment?: { method: VenueFinancialPaymentMethod; amountCents: number; paidAt?: string; notes?: string } }>(b);
      if (!p.description?.trim()) return { status: 400, data: { message: "Informe a descrição." } };
      const id = nextId();
      const sup = p.supplierId ? f2Stock.suppliers.find((s) => s.id === p.supplierId) : null;
      const paid = p.initialPayment?.amountCents ?? 0;
      const overdue = p.dueAt ? p.dueAt.slice(0, 10) < todaySP() : false;
      const row: VenuePayable = { id, organizationId: ORG, locationId: p.locationId ?? null, categoryId: p.categoryId, supplierId: sup?.id ?? null, purchaseId: p.purchaseId ?? null, publicCode: `CP-${String(id).padStart(4, "0")}`, description: p.description.trim(), status: paid >= p.totalAmountCents ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : overdue ? "OVERDUE" : "PENDING", totalAmountCents: p.totalAmountCents, paidAmountCents: paid, incurredAt: p.incurredAt, dueAt: p.dueAt ?? null, notes: p.notes ?? null, documentNumber: p.documentNumber ?? null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: now(), updatedAt: now(), category: catRef(p.categoryId), supplier: sup ? { id: sup.id, nome: sup.nome } : null, location: locRef(p.locationId ?? null), purchase: null };
      payables.unshift(row);
      if (paid > 0 && p.initialPayment) payablePayments.push({ id: nextId(), organizationId: ORG, payableId: id, locationId: p.locationId ?? null, cashSessionId: null, method: p.initialPayment.method, amountCents: paid, paidAt: p.initialPayment.paidAt ?? now(), externalReference: null, idempotencyKey: `pay-${id}`, notes: p.initialPayment.notes ?? null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: now() });
      return ok(row);
    },
  },
  { test: fin("/payables/\\d+/cancel"), method: "post", handle: ({ url, body: b }) => { const p = payables.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); if (p.status === "PAID") return { status: 400, data: { message: "Conta já paga não pode ser cancelada." } }; p.status = "CANCELED"; p.canceledAt = now(); p.canceledByUserId = 1; p.cancelReason = body<{ reason?: string }>(b).reason ?? null; return ok(p); } },
  { test: fin("/payables/\\d+/payments"), method: "get", handle: ({ url }) => ok(payablePayments.filter((x) => x.payableId === seg(url, 2))) },
  { test: fin("/payables/\\d+/payments"), method: "post", handle: ({ url, body: b }) => { const p = payables.find((x) => x.id === seg(url, 2)); if (!p) return notFound(); const pay = body<{ method: VenueFinancialPaymentMethod; amountCents: number; paidAt?: string; externalReference?: string; notes?: string; idempotencyKey: string }>(b); const remaining = p.totalAmountCents - p.paidAmountCents; if (pay.amountCents <= 0 || pay.amountCents > remaining) return { status: 400, data: { message: `O valor precisa ser maior que zero e no máximo o saldo em aberto.` } }; const row: VenuePayablePayment = { id: nextId(), organizationId: ORG, payableId: p.id, locationId: p.locationId, cashSessionId: null, method: pay.method, amountCents: pay.amountCents, paidAt: pay.paidAt ?? now(), externalReference: pay.externalReference ?? null, idempotencyKey: pay.idempotencyKey, notes: pay.notes ?? null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: now() }; payablePayments.push(row); p.paidAmountCents += pay.amountCents; p.status = p.paidAmountCents >= p.totalAmountCents ? "PAID" : "PARTIALLY_PAID"; p.updatedAt = now(); return ok(row); } },
  { test: fin("/payables/\\d+"), method: "get", handle: ({ url }) => { const p = payables.find((x) => x.id === seg(url)); return p ? ok(p) : notFound("Conta não encontrada"); } },
  { test: fin("/payables/\\d+"), method: "patch", handle: ({ url, body: b }) => { const p = payables.find((x) => x.id === seg(url)); if (!p) return notFound(); const patch = body<Partial<VenuePayable>>(b); Object.assign(p, patch, { updatedAt: now() }); if (patch.categoryId) p.category = catRef(patch.categoryId); if (patch.supplierId !== undefined) { const s = patch.supplierId ? f2Stock.suppliers.find((x) => x.id === patch.supplierId) : null; p.supplier = s ? { id: s.id, nome: s.nome } : null; } return ok(p); } },
  { test: fin("/payable-payments/\\d+/cancel"), method: "post", handle: ({ url, body: b }) => { const pay = payablePayments.find((x) => x.id === seg(url, 2)); if (!pay) return notFound(); pay.canceledAt = now(); pay.canceledByUserId = 1; pay.cancelReason = body<{ reason: string }>(b).reason ?? null; const p = payables.find((x) => x.id === pay.payableId); if (p) { p.paidAmountCents = Math.max(0, p.paidAmountCents - pay.amountCents); p.status = p.paidAmountCents === 0 ? ((p.dueAt ?? "") && (p.dueAt ?? "").slice(0, 10) < todaySP() ? "OVERDUE" : "PENDING") : "PARTIALLY_PAID"; } return ok(pay); } },

  // Outras receitas
  { test: fin("/other-income"), method: "get", handle: ({ params }) => { const list = otherIncome.filter((o) => (!params.locationId || o.locationId === Number(params.locationId) || o.locationId === null) && (!params.startDate || o.receivedAt.slice(0, 10) >= params.startDate) && (!params.endDate || o.receivedAt.slice(0, 10) <= params.endDate)).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)); const page = Math.max(1, Number(params.page ?? 1)); const limit = Number(params.limit ?? 20); return ok({ data: list.slice((page - 1) * limit, page * limit), page, limit, total: list.length }); } },
  { test: fin("/other-income"), method: "post", handle: ({ body: b }) => { const p = body<{ locationId?: number; categoryId: number; description: string; amountCents: number; receivedAt?: string; method: VenueFinancialPaymentMethod; notes?: string; idempotencyKey: string }>(b); const row: VenueOtherIncome = { id: nextId(), organizationId: ORG, locationId: p.locationId ?? null, categoryId: p.categoryId, description: p.description, amountCents: p.amountCents, receivedAt: p.receivedAt ?? now(), method: p.method, cashSessionId: null, idempotencyKey: p.idempotencyKey, notes: p.notes ?? null, createdByUserId: 1, canceledByUserId: null, canceledAt: null, cancelReason: null, createdAt: now(), category: catRef(p.categoryId), location: locRef(p.locationId ?? null) }; otherIncome.unshift(row); return ok(row); } },
  { test: fin("/other-income/\\d+/cancel"), method: "post", handle: ({ url, body: b }) => { const o = otherIncome.find((x) => x.id === seg(url, 2)); if (!o) return notFound(); o.canceledAt = now(); o.canceledByUserId = 1; o.cancelReason = body<{ reason: string }>(b).reason ?? null; return ok(o); } },

  // Regras de taxa
  { test: fin("/fee-rules"), method: "get", handle: ({ params }) => ok(feeRules.filter((r) => !params.locationId || r.locationId === null || r.locationId === Number(params.locationId))) },
  { test: fin("/fee-rules"), method: "post", handle: ({ body: b }) => { const p = body<{ locationId?: number; method: VenuePaymentMethod; percentageBps?: number; fixedFeeCents?: number; settlementDays?: number; validFrom?: string; validUntil?: string }>(b); const r: VenuePaymentFeeRule = { id: nextId(), organizationId: ORG, locationId: p.locationId ?? null, method: p.method, percentageBps: p.percentageBps ?? 0, fixedFeeCents: p.fixedFeeCents ?? 0, settlementDays: p.settlementDays ?? 0, active: true, validFrom: p.validFrom ?? now(), validUntil: p.validUntil ?? null, createdAt: now(), updatedAt: now() }; feeRules.unshift(r); return ok(r); } },
  { test: fin("/fee-rules/\\d+/deactivate"), method: "post", handle: ({ url }) => { const r = feeRules.find((x) => x.id === seg(url, 2)); if (!r) return notFound(); r.active = false; r.validUntil = now(); return ok(r); } },
  { test: fin("/fee-rules/\\d+"), method: "patch", handle: ({ url, body: b }) => { const r = feeRules.find((x) => x.id === seg(url)); if (!r) return notFound(); Object.assign(r, body<object>(b), { updatedAt: now() }); return ok(r); } },

  // Conciliação
  { test: fin("/locations/\\d+/reconciliations"), method: "get", handle: ({ url, params }) => { const today = todaySP(); const start = params.startDate ?? shift(today, -6); const end = params.endDate ?? today; const list = reconciliations(seg(url, 2), daysBetween(start, end)); return ok(params.status ? list.filter((r) => r.status === params.status) : list); } },
  { test: fin("/locations/\\d+/reconciliations/[0-9-]+/[A-Z_]+"), method: "put", handle: ({ url, body: b }) => { const parts = url.pathname.split("/").filter(Boolean); const method = parts.at(-1) as VenuePaymentMethod; const date = parts.at(-2)!; const locationId = seg(url, 4); const p = body<{ actualNetCents: number; notes?: string }>(b); reconciliationOverrides.set(`${locationId}:${date}:${method}`, { actualNetCents: p.actualNetCents, notes: p.notes ?? null, at: now() }); const row = reconciliations(locationId, [date]).find((r) => r.method === method); return row ? ok(row) : notFound("Sem vendas nesse dia/método"); } },

  // Caixa
  { test: fin("/locations/\\d+/cash-sessions"), method: "get", handle: ({ url, params }) => { const locationId = seg(url, 2); const list = cashRows.filter((c) => c.locationId === locationId && (!params.startDate || c.openedAt >= params.startDate) && (!params.endDate || c.openedAt <= params.endDate) && (!params.cashRegisterId || c.cashRegister.id === Number(params.cashRegisterId)) && (params.onlyDivergent !== "true" || (c.differenceCents ?? 0) !== 0) && (!params.status || c.status === params.status)).sort((a, b) => b.openedAt.localeCompare(a.openedAt)); return ok(list.map(({ opening: _o, cashSales: _c, other: _ot, supply: _s, withdrawal: _w, expense: _e, notes: _n, ...rest }) => { void _o; void _c; void _ot; void _s; void _w; void _e; void _n; return rest; })); } },
  { test: fin("/cash-sessions/\\d+/report"), method: "get", handle: ({ url }) => { const row = cashRows.find((c) => c.id === seg(url, 2)); return row ? ok(cashReport(row)) : notFound("Fechamento não encontrado"); } },
  { test: fin("/backfill-snapshots"), method: "post", handle: () => ok({ processed: 0, remaining: 0 }) },

  // Exportações (CSV em texto — o front baixa como Blob)
  { test: fin("/exports/[a-z-]+\\.csv"), method: "get", handle: ({ url, params }) => { const kind = url.pathname.split("/").at(-1)!.replace(".csv", ""); const locationId = Number(params.locationId ?? 1); const { days } = periodDays(params); const rows = kind === "sales" ? confirmed(salesInRange(days, locationId)).map((s) => ({ data: s.confirmedAt, comanda: s.tab.publicCode, metodo: s.method, bruto: s.amountCents / 100, taxa: (s.financialSnapshot?.estimatedFeeCents ?? 0) / 100 })) : kind === "payables" ? payables.map((p) => ({ codigo: p.publicCode, descricao: p.description, status: p.status, total: p.totalAmountCents / 100, pago: p.paidAmountCents / 100, vencimento: p.dueAt ?? "" })) : kind === "reconciliations" ? reconciliations(locationId, days).map((r) => ({ data: r.date, metodo: r.method, esperado: r.expectedNetCents / 100, informado: (r.actualNetCents ?? 0) / 100, status: r.status })) : kind === "cash-sessions" ? cashRows.map((c) => ({ caixa: c.cashRegister.nome, abertura: c.openedAt, fechamento: c.closedAt ?? "", esperado: c.expectedCashCents / 100, contado: (c.countedCashCents ?? 0) / 100 })) : kind === "expenses" ? expensesByCategory(locationId, params).map((e) => ({ categoria: e.nome, total: e.amountCents / 100 })) : [overview(locationId, params)].map((o) => ({ bruto: o.grossRevenueCents / 100, liquido: o.netRevenueCents / 100, cmv: o.cmvCents / 100, despesas: o.expensesCents / 100, resultado: o.operationalResultCents / 100 })); return ok(csv(rows)); } },
];

export const f2InsightsHandlers: MockHandler[] = [
  { test: ins("/overview"), method: "get", handle: ({ params }) => ok(insightsOverview(params)) },
  { test: ins("/alerts"), method: "get", handle: () => ok(insightsAlerts()) },
  { test: ins("/sales"), method: "get", handle: ({ params }) => ok(insightsSales(params)) },
  { test: ins("/operation"), method: "get", handle: ({ params }) => ok(insightsOperation(params)) },
  { test: ins("/products"), method: "get", handle: ({ params }) => ok(insightsProducts(params)) },
  { test: ins("/products/\\d+"), method: "get", handle: ({ url, params }) => { const d = insightsProductDetail(seg(url), params); return d ? ok(d) : notFound("Produto não encontrado"); } },
  { test: ins("/reservations"), method: "get", handle: ({ params }) => ok(insightsReservations(params)) },
  { test: ins("/stock"), method: "get", handle: ({ params }) => ok(insightsStock(params)) },
  { test: ins("/finance"), method: "get", handle: ({ params }) => ok(insightsFinance(params)) },
  { test: ins("/locations/comparison"), method: "get", handle: ({ params }) => ok(locationsComparison(params)) },
  { test: ins("/exports/[a-z-]+\\.csv"), method: "get", handle: ({ url, params }) => { const kind = url.pathname.split("/").at(-1)!.replace(".csv", ""); const rows = kind === "products" ? insightsProducts(params).table.data.map((r) => ({ produto: r.nome, variacao: r.variantNome, quantidade: r.quantitySold, receita: r.revenueCents / 100, margem: r.marginCents / 100 })) : kind === "sales" ? insightsSales(params).timeline.map((t) => ({ data: t.date, receita: t.amountCents / 100 })) : [{ periodo: periodDays(params).start, ate: periodDays(params).end }]; return ok(csv(rows)); } },
];
