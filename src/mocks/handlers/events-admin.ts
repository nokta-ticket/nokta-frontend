import { MOCK_EVENTS, mockEventDetails, posterUrl } from "../fixtures";
import { notFound, paginate, type MockHandler, type MockResult } from "./types";
import type { EventPromoterAssignment, OrganizationPromoter, PromoterSettlement } from "@/services/promoters";
import type { CrmSegment } from "@/services/crm";
import type { CrmCampaign, CrmTemplate } from "@/services/crm-marketing";

/**
 * Painel de eventos do produtor, promotores, CRM, financeiro/insights de
 * ingressos (frente E edita aqui). Os handlers são específicos
 * (`/produtor/...`, `/organizations/:id/...`) pra nunca engolir as rotas
 * públicas de `public.ts`.
 */

const DAY = 24 * 60 * 60 * 1000;
const isoDaysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const isoDaysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const seg = (url: URL, offset = 1) => decodeURIComponent(url.pathname.split("/").at(-offset) ?? "");
const num = (url: URL, offset = 1) => Number(seg(url, offset));
const ok = (data: unknown = { ok: true }): MockResult => ({ data });

// ── Eventos do produtor ────────────────────────────────────────────────────
// EventStatus: 1=DRAFT 2=PUBLISHED 3=CANCELLED 4=FINISHED
const STATUS_BY_ID: Record<number, number> = { 101: 2, 102: 2, 103: 2, 104: 1, 105: 2, 106: 1, 107: 2, 108: 4, 109: 2, 110: 1, 111: 2, 112: 3 };
const eventStatus = new Map<number, number>(Object.entries(STATUS_BY_ID).map(([k, v]) => [Number(k), v]));
const deleted = new Set<number>();

type AdminLote = { id: number; nome: string; tipo: number; lote: number; quantidade: number; valor: number; disponivelParaVenda: boolean; dataLimite: string | null; vip?: boolean; vipAte?: string | null; vipToken?: string | null; sold?: number };

function adminLotes(id: number): AdminLote[] {
  const base = id * 10;
  const ev = MOCK_EVENTS.find((e) => Number(e.id) === id);
  const dataLimite1 = ev ? new Date(new Date(ev.data).getTime() - 10 * DAY).toISOString().slice(0, 10) : null;
  return [
    { id: base + 1, nome: "Pista", tipo: 1, lote: 1, quantidade: 120, valor: 60, disponivelParaVenda: false, dataLimite: dataLimite1, sold: 120 },
    { id: base + 4, nome: "Camarote Open Bar", tipo: 4, lote: 1, quantidade: 40, valor: 220, disponivelParaVenda: true, dataLimite: dataLimite1, sold: 31 },
    { id: base + 2, nome: "Pista", tipo: 1, lote: 2, quantidade: 300, valor: 80, disponivelParaVenda: true, dataLimite: null, sold: 142 },
    { id: base + 3, nome: "Pista — Meia-entrada", tipo: 3, lote: 2, quantidade: 80, valor: 40, disponivelParaVenda: true, dataLimite: null, sold: 27 },
    { id: base + 5, nome: "Lista VIP até 23h", tipo: 3, lote: 1, quantidade: 100, valor: 0, disponivelParaVenda: true, dataLimite: null, vip: true, vipAte: isoDaysFromNow(2), vipToken: `vip-${id}-aberta` },
  ];
}

const lotesStore = new Map<number, AdminLote[]>();
const getLotes = (id: number) => {
  if (!lotesStore.has(id)) lotesStore.set(id, adminLotes(id));
  return lotesStore.get(id)!;
};

function adminEvent(id: number) {
  const ev = MOCK_EVENTS.find((e) => Number(e.id) === id);
  const details = mockEventDetails(String(id));
  if (!ev || !details || deleted.has(id)) return null;
  return {
    id,
    slug: ev.slug,
    nome: ev.nome,
    descricao: details.descricao,
    data: ev.data,
    horario: ev.horario,
    status: eventStatus.get(id) ?? 1,
    destaque: ev.destaque ?? false,
    classificacaoEtaria: details.classificacaoEtaria,
    email: details.email,
    whatsapp: details.whatsapp,
    instagram: details.instagram,
    atracoes: "Pedro Sampaio, Gabe Pereira, Malía",
    programacao: details.programacao,
    politicaMeiaEntrada: details.politicaMeiaEntrada,
    politicaCancelamento: details.politicaCancelamento,
    thumbnails: ev.thumbnails.map((t, i) => ({ id: id * 100 + i, url: t.url })),
    endereco: { ...ev.endereco, numero: ev.endereco.numero || "" },
    local: ev.local,
    ingressos: getLotes(id),
    percentualVendido: ev.percentualVendido ?? 0,
    ingressosVendidos: Math.round(((ev.percentualVendido ?? 0) / 100) * 540),
    receita: Math.round(((ev.percentualVendido ?? 0) / 100) * 540 * 74),
  };
}

function listEvents(params: Record<string, string>) {
  const status = params.status ? Number(params.status) : null;
  const q = (params.search ?? params.q ?? "").toLowerCase();
  const items = MOCK_EVENTS.map((e) => adminEvent(Number(e.id)))
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .filter((e) => (status ? e.status === status : true))
    .filter((e) => (q ? e.nome.toLowerCase().includes(q) : true));
  return paginate(items, params, Number(params.limit ?? 12));
}

// ── Cupons ─────────────────────────────────────────────────────────────────
type Cupom = { id: number; eventoId: number; codigo: string; tipo: "PERCENTUAL" | "FIXO"; desconto: number; maxDesconto: number | null; valorMinimoCompra: number | null; aplicacao: "EVENTO" | "LOTE" | "TIPO_INGRESSO"; loteNumero: number | null; tipoIngressoId: number | null; inicio: string | null; fim: string | null; limiteUso: number | null; limitePorUsuario: number | null; totalUsado: number; ativo: boolean; descricao: string | null; deletedAt: string | null; createdAt: string };
let cupomSeq = 900;
const cuponsStore = new Map<number, Cupom[]>();
function getCupons(eventoId: number) {
  if (!cuponsStore.has(eventoId)) {
    cuponsStore.set(eventoId, [
      { id: ++cupomSeq, eventoId, codigo: "NOKTA10", tipo: "PERCENTUAL", desconto: 10, maxDesconto: 30, valorMinimoCompra: null, aplicacao: "EVENTO", loteNumero: null, tipoIngressoId: null, inicio: isoDaysAgo(20), fim: isoDaysFromNow(10), limiteUso: 200, limitePorUsuario: 1, totalUsado: 84, ativo: true, descricao: "Campanha de lançamento", deletedAt: null, createdAt: isoDaysAgo(20) },
      { id: ++cupomSeq, eventoId, codigo: "AMIGOS20", tipo: "FIXO", desconto: 20, maxDesconto: null, valorMinimoCompra: 120, aplicacao: "LOTE", loteNumero: 2, tipoIngressoId: null, inicio: null, fim: null, limiteUso: 50, limitePorUsuario: 2, totalUsado: 50, ativo: true, descricao: null, deletedAt: null, createdAt: isoDaysAgo(12) },
      { id: ++cupomSeq, eventoId, codigo: "EARLY", tipo: "PERCENTUAL", desconto: 25, maxDesconto: null, valorMinimoCompra: null, aplicacao: "EVENTO", loteNumero: null, tipoIngressoId: null, inicio: isoDaysAgo(60), fim: isoDaysAgo(30), limiteUso: null, limitePorUsuario: null, totalUsado: 312, ativo: true, descricao: "Pré-venda", deletedAt: null, createdAt: isoDaysAgo(60) },
      { id: ++cupomSeq, eventoId, codigo: "INFLU15", tipo: "PERCENTUAL", desconto: 15, maxDesconto: 40, valorMinimoCompra: null, aplicacao: "EVENTO", loteNumero: null, tipoIngressoId: null, inicio: null, fim: null, limiteUso: null, limitePorUsuario: 1, totalUsado: 7, ativo: false, descricao: "Parceria pausada", deletedAt: null, createdAt: isoDaysAgo(5) },
    ]);
  }
  return cuponsStore.get(eventoId)!;
}

// ── Vendas do evento ───────────────────────────────────────────────────────
const BUYERS = ["Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Alves", "Eduarda Reis", "Felipe Costa", "Gabriela Nunes", "Henrique Dias", "Isabela Rocha", "João Pedro"];
function vendas(eventoId: number) {
  const ev = adminEvent(eventoId);
  const pct = ev?.percentualVendido ?? 40;
  const vendidos = Math.round((pct / 100) * 540);
  const bruto = vendidos * 74;
  const vendasPorDia = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * DAY);
    const wave = Math.max(0, Math.round(6 + 5 * Math.sin(i / 3.2) + (i > 24 ? i - 22 : 0) + ((i * 7) % 4)));
    return { data: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, pedidos: wave };
  });
  const pedidosRecentes = Array.from({ length: 10 }, (_, i) => ({
    id: 5000 + i,
    code: `NKT-${eventoId}-${(1000 + i * 37).toString(36).toUpperCase()}`,
    status: ([2, 2, 1, 2, 3, 2, 4, 2, 2, 1] as const)[i],
    totalValue: [160, 80, 220, 120, 80, 440, 80, 160, 40, 80][i],
    desconto: i % 3 === 0 ? 8 : 0,
    codigoCupom: i % 3 === 0 ? "NOKTA10" : null,
    quantidade: [2, 1, 1, 3, 1, 2, 1, 2, 1, 1][i],
    comprador: BUYERS[i],
    email: `${BUYERS[i].split(" ")[0].toLowerCase()}@exemplo.com`,
    criadoEm: isoDaysAgo(i * 0.4),
  }));
  return {
    faturamentoBruto: bruto,
    totalDesconto: Math.round(bruto * 0.04),
    ingressosVendidos: vendidos,
    taxasEstimadas: Math.round(bruto * 0.1),
    valorLiquido: bruto - Math.round(bruto * 0.04),
    feePercent: 10,
    vendasPorLote: [
      { lote: 1, quantidade: Math.round(vendidos * 0.45), valor: Math.round(bruto * 0.4) },
      { lote: 2, quantidade: Math.round(vendidos * 0.55), valor: Math.round(bruto * 0.6) },
    ],
    vendasPorTipo: [
      { nome: "Pista", quantidade: Math.round(vendidos * 0.7), valor: Math.round(bruto * 0.62) },
      { nome: "Pista — Meia-entrada", quantidade: Math.round(vendidos * 0.18), valor: Math.round(bruto * 0.1) },
      { nome: "Camarote Open Bar", quantidade: Math.round(vendidos * 0.12), valor: Math.round(bruto * 0.28) },
    ],
    vendasPorDia,
    pedidosRecentes,
  };
}

// ── Equipe ─────────────────────────────────────────────────────────────────
const equipeStore = new Map<number, { id: number; userId: number; nome: string; email: string; adicionadoEm: string }[]>();
let equipeSeq = 300;
const getEquipe = (eventoId: number) => {
  if (!equipeStore.has(eventoId)) {
    equipeStore.set(eventoId, [
      { id: ++equipeSeq, userId: 11, nome: "Marina Castro", email: "marina@nokta.live", adicionadoEm: isoDaysAgo(9) },
      { id: ++equipeSeq, userId: 12, nome: "Rafael Torres", email: "rafael@nokta.live", adicionadoEm: isoDaysAgo(3) },
    ]);
  }
  return equipeStore.get(eventoId)!;
};

// ── Financeiro de ingressos ────────────────────────────────────────────────
type Row = { key: string; type: "SALE" | "REFUND" | "CHARGEBACK" | "WITHDRAWAL"; occurredAt: string; eventId: number; eventName: string; reference: string; quantity: number | null; buyerName: string | null; grossCents: number; feeCents: number; netCents: number; status: "CUSTODY" | "RELEASED" | "COMPLETED" | "IN_PROGRESS" | "DEBITED" | "FAILED"; fees: { commissionCents: number; commissionPercent: number; buyerServiceFeeCents: number; buyerGatewayFeeCents: number; producerGatewayFeeCents: number }; reason: string | null; releaseAt: string | null };

const FIN_EVENTS = [101, 102, 103, 105, 108];
function statementRows(): Row[] {
  const rows: Row[] = [];
  let n = 0;
  for (let i = 0; i < 46; i++) {
    const evId = FIN_EVENTS[i % FIN_EVENTS.length];
    const ev = MOCK_EVENTS.find((e) => Number(e.id) === evId)!;
    const qty = (i % 3) + 1;
    const gross = qty * 8000;
    const commission = Math.round(gross * 0.1);
    const kind: Row["type"] = i % 11 === 7 ? "REFUND" : i % 17 === 9 ? "CHARGEBACK" : i % 13 === 12 ? "WITHDRAWAL" : "SALE";
    const past = evId === 108;
    const occurredAt = isoDaysAgo(i * 0.65);
    n++;
    if (kind === "WITHDRAWAL") {
      rows.push({ key: `w-${n}`, type: kind, occurredAt, eventId: evId, eventName: ev.nome, reference: `SAQ-${1000 + n}`, quantity: null, buyerName: null, grossCents: -120000, feeCents: 0, netCents: -120000, status: i % 2 ? "COMPLETED" : "IN_PROGRESS", fees: { commissionCents: 0, commissionPercent: 10, buyerServiceFeeCents: 0, buyerGatewayFeeCents: 0, producerGatewayFeeCents: 0 }, reason: null, releaseAt: null });
    } else if (kind === "REFUND") {
      rows.push({ key: `r-${n}`, type: kind, occurredAt, eventId: evId, eventName: ev.nome, reference: `PED-${2000 + n}`, quantity: qty, buyerName: BUYERS[i % BUYERS.length], grossCents: -gross, feeCents: -commission, netCents: -(gross - commission), status: "DEBITED", fees: { commissionCents: -commission, commissionPercent: 10, buyerServiceFeeCents: -Math.round(gross * 0.1), buyerGatewayFeeCents: 0, producerGatewayFeeCents: 0 }, reason: "Arrependimento em até 7 dias", releaseAt: null });
    } else if (kind === "CHARGEBACK") {
      rows.push({ key: `c-${n}`, type: kind, occurredAt, eventId: evId, eventName: ev.nome, reference: `PED-${2000 + n}`, quantity: qty, buyerName: BUYERS[i % BUYERS.length], grossCents: -(gross + Math.round(gross * 0.1)), feeCents: -399, netCents: -(gross + Math.round(gross * 0.1) + 399), status: "DEBITED", fees: { commissionCents: 0, commissionPercent: 10, buyerServiceFeeCents: Math.round(gross * 0.1), buyerGatewayFeeCents: 0, producerGatewayFeeCents: 399 }, reason: i % 2 ? "Compra não reconhecida" : null, releaseAt: null });
    } else {
      rows.push({ key: `s-${n}`, type: kind, occurredAt, eventId: evId, eventName: ev.nome, reference: `PED-${2000 + n}`, quantity: qty, buyerName: BUYERS[i % BUYERS.length], grossCents: gross, feeCents: commission, netCents: gross - commission, status: past ? "RELEASED" : "CUSTODY", fees: { commissionCents: commission, commissionPercent: 10, buyerServiceFeeCents: Math.round(gross * 0.1), buyerGatewayFeeCents: 99 * qty, producerGatewayFeeCents: 0 }, reason: null, releaseAt: past ? isoDaysAgo(12) : isoDaysFromNow(7 + (i % 20)) });
    }
  }
  return rows;
}
const STATEMENT_ROWS = statementRows();

function financeOverview(eventId?: number) {
  const events = FIN_EVENTS.filter((id) => (eventId ? id === eventId : true)).map((id) => {
    const ev = MOCK_EVENTS.find((e) => Number(e.id) === id)!;
    const rows = STATEMENT_ROWS.filter((r) => r.eventId === id);
    const sales = rows.filter((r) => r.type === "SALE").reduce((s, r) => s + r.grossCents, 0);
    const commission = rows.filter((r) => r.type === "SALE").reduce((s, r) => s + r.feeCents, 0);
    const refunds = rows.filter((r) => r.type === "REFUND").reduce((s, r) => s + r.netCents, 0);
    const chargebacks = rows.filter((r) => r.type === "CHARGEBACK").reduce((s, r) => s + r.netCents, 0);
    const withdrawn = -rows.filter((r) => r.type === "WITHDRAWAL" && r.status === "COMPLETED").reduce((s, r) => s + r.netCents, 0);
    const inTransit = -rows.filter((r) => r.type === "WITHDRAWAL" && r.status === "IN_PROGRESS").reduce((s, r) => s + r.netCents, 0);
    const net = sales - commission + refunds + chargebacks;
    const released = id === 108;
    return {
      eventId: id,
      eventName: ev.nome,
      eventDate: ev.data,
      commissionPercent: 10,
      releaseAt: released ? isoDaysAgo(12) : new Date(new Date(ev.data).getTime() + 7 * DAY).toISOString(),
      released,
      salesCents: sales,
      commissionCents: commission,
      refundsCents: refunds,
      chargebacksCents: chargebacks,
      netCents: net,
      withdrawnCents: withdrawn,
      inTransitCents: inTransit,
      custodyCents: released ? 0 : net,
      availableCents: released ? Math.max(0, net - withdrawn - inTransit) : 0,
    };
  });
  const active = events.find((e) => e.inTransitCents > 0);
  const chargebackRows = STATEMENT_ROWS.filter((r) => r.type === "CHARGEBACK" && (eventId ? r.eventId === eventId : true));
  const custody = events.filter((e) => e.custodyCents > 0);
  return {
    events,
    totals: { availableCents: events.reduce((s, e) => s + e.availableCents, 0), custodyCents: events.reduce((s, e) => s + e.custodyCents, 0), inTransitCents: events.reduce((s, e) => s + e.inTransitCents, 0), custodyEventCount: custody.length, nextReleaseAt: custody.map((e) => e.releaseAt).sort()[0] ?? null },
    activeWithdrawal: active ? { id: 77, amountCents: active.inTransitCents, status: "IN_PROGRESS", requestedAt: isoDaysAgo(1), eventId: active.eventId, eventName: active.eventName } : null,
    chargebacks: { count: chargebackRows.length, totalCents: chargebackRows.reduce((s, r) => s + r.netCents, 0) },
  };
}

function statement(params: Record<string, string>) {
  let rows = [...STATEMENT_ROWS];
  if (params.eventId) rows = rows.filter((r) => r.eventId === Number(params.eventId));
  if (params.type) rows = rows.filter((r) => r.type === params.type);
  if (params.status) rows = rows.filter((r) => r.status === params.status);
  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter((r) => r.reference.toLowerCase().includes(q) || (r.buyerName ?? "").toLowerCase().includes(q));
  }
  if (!params.allTime) {
    const days = params.quickPeriod === "TODAY" ? 1 : params.quickPeriod === "LAST_7_DAYS" ? 7 : 30;
    rows = rows.filter((r) => new Date(r.occurredAt).getTime() > Date.now() - days * DAY);
  }
  const sort = params.sort ?? "date";
  const dir = params.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => (sort === "gross" ? (a.grossCents - b.grossCents) * dir : sort === "net" ? (a.netCents - b.netCents) * dir : (new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()) * dir));
  const perPage = Number(params.perPage ?? 10);
  const page = Number(params.page ?? 1);
  const inCents = rows.filter((r) => r.type === "SALE").reduce((s, r) => s + r.grossCents, 0);
  const outCents = rows.filter((r) => r.type === "REFUND" || r.type === "CHARGEBACK").reduce((s, r) => s + r.grossCents, 0);
  const feeCents = rows.filter((r) => r.type !== "WITHDRAWAL").reduce((s, r) => s + r.feeCents, 0);
  return {
    rows: rows.slice((page - 1) * perPage, page * perPage),
    total: rows.length,
    page,
    perPage,
    summary: { inCents, outCents, feeCents, netCents: inCents + outCents - feeCents, fees: { commissionCents: rows.reduce((s, r) => s + r.fees.commissionCents, 0), producerGatewayFeeCents: rows.reduce((s, r) => s + r.fees.producerGatewayFeeCents, 0), buyerServiceFeeCents: rows.reduce((s, r) => s + Math.abs(r.fees.buyerServiceFeeCents), 0), buyerGatewayFeeCents: rows.reduce((s, r) => s + r.fees.buyerGatewayFeeCents, 0) } },
  };
}

// ── Promotores ─────────────────────────────────────────────────────────────
const PROMOTERS: OrganizationPromoter[] = [
  { id: 1, inviteEmail: "lucas@promo.com", status: "ACTIVE" as const, invitedAt: isoDaysAgo(40), acceptedAt: isoDaysAgo(39), suspendedAt: null, removedAt: null, promoterProfile: { id: 501, displayName: "Lucas Promo", userId: 21 }, invitedBy: { id: 1, nome: "Vitor Reis" } },
  { id: 2, inviteEmail: "bia.eventos@gmail.com", status: "ACTIVE" as const, invitedAt: isoDaysAgo(25), acceptedAt: isoDaysAgo(24), suspendedAt: null, removedAt: null, promoterProfile: { id: 502, displayName: "Bia Eventos", userId: 22 }, invitedBy: { id: 1, nome: "Vitor Reis" } },
  { id: 3, inviteEmail: "thiago@night.club", status: "INVITED" as const, invitedAt: isoDaysAgo(2), acceptedAt: null, suspendedAt: null, removedAt: null, promoterProfile: null, invitedBy: { id: 1, nome: "Vitor Reis" } },
  { id: 4, inviteEmail: "carol@influ.me", status: "SUSPENDED" as const, invitedAt: isoDaysAgo(70), acceptedAt: isoDaysAgo(69), suspendedAt: isoDaysAgo(5), removedAt: null, promoterProfile: { id: 504, displayName: "Carol Influencer", userId: 24 }, invitedBy: { id: 1, nome: "Vitor Reis" } },
];
const assignmentBase = { commissionType: "PERCENTAGE" as const, commissionPercentageBasisPoints: 1000, commissionFixedCents: null, discountType: "PERCENTAGE" as const, discountBasisPoints: 1000, discountFixedCents: null, discountScope: "ORDER" as const, discountTrigger: "BOTH" as const, discountMaxUses: null, discountMaxUsesPerCustomer: 1, discountMaxDiscountCentsPerUse: null, discountMaxTicketsPerUse: null, discountMinOrderValueCents: null, attributionWindowDays: 30, startsAt: null, endsAt: null, eligibleTickets: [] as { eventTicketId: number }[] };
const ASSIGNMENTS: EventPromoterAssignment[] = [
  { id: 11, eventId: 101, status: "ACTIVE" as const, linkEnabled: true, codeEnabled: true, code: "LUCAS10", publicToken: "tk-lucas-101", commissionEnabled: true, discountEnabled: true, createdAt: isoDaysAgo(30), organizationPromoter: { id: 1, inviteEmail: "lucas@promo.com", promoterProfile: { displayName: "Lucas Promo", userId: 21 } }, ...assignmentBase },
  { id: 12, eventId: 102, status: "ACTIVE" as const, linkEnabled: true, codeEnabled: false, code: null, publicToken: "tk-bia-102", commissionEnabled: true, discountEnabled: false, createdAt: isoDaysAgo(20), organizationPromoter: { id: 2, inviteEmail: "bia.eventos@gmail.com", promoterProfile: { displayName: "Bia Eventos", userId: 22 } }, ...assignmentBase },
  { id: 13, eventId: 101, status: "PAUSED" as const, linkEnabled: false, codeEnabled: true, code: "CAROL15", publicToken: "tk-carol-101", commissionEnabled: false, discountEnabled: true, createdAt: isoDaysAgo(60), organizationPromoter: { id: 4, inviteEmail: "carol@influ.me", promoterProfile: { displayName: "Carol Influencer", userId: 24 } }, ...assignmentBase },
];
const promoterSales = Array.from({ length: 14 }, (_, i) => {
  const a = ASSIGNMENTS[i % 2];
  const ev = MOCK_EVENTS.find((e) => Number(e.id) === a.eventId)!;
  const net = (8000 + (i % 3) * 4000) * ((i % 2) + 1);
  return { attributionId: 700 + i, orderId: 2000 + i, orderCode: `PED-${2000 + i}`, status: "PAID", eventId: a.eventId, eventName: ev.nome, source: (i % 3 === 0 ? "CODE" : "LINK") as "CODE" | "LINK", promoterOrganizationPromoterId: a.organizationPromoter.id, promoterDisplayName: a.organizationPromoter.promoterProfile?.displayName, originalNominalCents: net + 800, discountAppliedCents: 800, netNominalCentsAfterDiscount: net, commissionCents: Math.round(net * 0.1), commissionStatus: (["PENDING", "AVAILABLE", "SETTLED", "AVAILABLE"] as const)[i % 4], attributedAt: isoDaysAgo(i * 1.7) };
});
const SETTLEMENTS: PromoterSettlement[] = [
  { id: 41, organizationId: 1, promoterProfileId: 501, periodStart: isoDaysAgo(60), periodEnd: isoDaysAgo(30), totalCommissionCents: 48000, status: "PAID_MANUALLY" as const, notes: "Pix enviado", confirmedAt: isoDaysAgo(28), paidAt: isoDaysAgo(27), createdAt: isoDaysAgo(29), promoterProfile: { id: 501, displayName: "Lucas Promo" }, _count: { entries: 6 } },
  { id: 42, organizationId: 1, promoterProfileId: 501, periodStart: isoDaysAgo(30), periodEnd: isoDaysAgo(1), totalCommissionCents: 32000, status: "CONFIRMED" as const, notes: null, confirmedAt: isoDaysAgo(1), paidAt: null, createdAt: isoDaysAgo(2), promoterProfile: { id: 501, displayName: "Lucas Promo" }, _count: { entries: 4 } },
  { id: 43, organizationId: 1, promoterProfileId: 502, periodStart: isoDaysAgo(30), periodEnd: isoDaysAgo(1), totalCommissionCents: 15600, status: "DRAFT" as const, notes: null, confirmedAt: null, paidAt: null, createdAt: isoDaysAgo(1), promoterProfile: { id: 502, displayName: "Bia Eventos" }, _count: { entries: 2 } },
];

// ── CRM ────────────────────────────────────────────────────────────────────
const CONTACT_NAMES = ["Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Alves", "Eduarda Reis", "Felipe Costa", "Gabriela Nunes", "Henrique Dias", "Isabela Rocha", "João Pedro", "Karina Melo", "Leonardo Brito", "Mariana Freitas", "Nicolas Prado", "Olívia Campos", "Paulo Sérgio", "Quésia Lopes", "Rodrigo Faria", "Sabrina Teles", "Tiago Moura", "Úrsula Pinto", "Vanessa Cruz", "Wesley Ramos", "Yasmin Duarte"];
function channelState(eligible: boolean, reason: "NO_ADDRESS" | "OPTED_OUT" | "SUPPRESSED" | null = null) {
  return { eligible, reason: eligible ? null : reason, legalBasis: eligible ? ("LEGITIMATE_INTEREST" as const) : null, preference: reason === "OPTED_OUT" ? ("OPTED_OUT" as const) : ("NOT_ASKED" as const), suppressionReason: reason === "SUPPRESSED" ? ("BOUNCE" as const) : null };
}
const CONTACTS = CONTACT_NAMES.map((name, i) => {
  const first = name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  const orders = (i % 5) + (i % 7 === 0 ? 4 : 0);
  const hasPhone = i % 3 !== 1;
  return {
    id: 100 + i,
    hasAccount: i % 4 !== 3,
    name,
    email: i % 9 === 8 ? null : `${first}@exemplo.com`,
    phone: hasPhone ? `+55119${String(90000000 + i * 1237).slice(0, 8)}` : null,
    createdAt: isoDaysAgo(120 - i * 3),
    sources: (i % 4 === 3 ? ["IMPORT"] : i % 2 ? ["PURCHASE", "TICKET_RECEIVED"] : ["PURCHASE"]) as ("PURCHASE" | "TICKET_RECEIVED" | "IMPORT" | "SIGNUP")[],
    ordersCount: orders,
    eventsCount: Math.min(orders, 3),
    spentCents: orders * 9800,
    firstPurchaseAt: orders ? isoDaysAgo(100 - i) : null,
    lastPurchaseAt: orders ? isoDaysAgo(i % 6 === 0 ? 95 : i * 2) : null,
    channels: { EMAIL: channelState(i % 9 !== 8 && i % 11 !== 5, i % 9 === 8 ? "NO_ADDRESS" : "OPTED_OUT"), WHATSAPP: channelState(hasPhone && i % 13 !== 4, !hasPhone ? "NO_ADDRESS" : "SUPPRESSED") },
  };
});
const crmCounts = (list: typeof CONTACTS) => ({ total: list.length, emailEligible: list.filter((c) => c.channels.EMAIL.eligible).length, whatsappEligible: list.filter((c) => c.channels.WHATSAPP.eligible).length });
function filterContacts(params: Record<string, string>) {
  let list = [...CONTACTS];
  if (params.search) list = list.filter((c) => `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(params.search.toLowerCase()));
  if (params.sources) list = list.filter((c) => params.sources.split(",").some((s) => c.sources.includes(s as never)));
  if (params.minOrders) list = list.filter((c) => c.ordersCount >= Number(params.minOrders));
  if (params.inactiveDays) list = list.filter((c) => !c.lastPurchaseAt || new Date(c.lastPurchaseAt).getTime() < Date.now() - Number(params.inactiveDays) * DAY);
  if (params.eligibleChannel) list = list.filter((c) => c.channels[params.eligibleChannel as "EMAIL" | "WHATSAPP"].eligible);
  const sort = params.sort ?? "lastPurchase";
  const dir = params.dir === "asc" ? 1 : -1;
  list.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) * dir : sort === "spent" ? (a.spentCents - b.spentCents) * dir : sort === "orders" ? (a.ordersCount - b.ordersCount) * dir : ((new Date(a.lastPurchaseAt ?? 0).getTime() || 0) - (new Date(b.lastPurchaseAt ?? 0).getTime() || 0)) * dir));
  return list;
}
function contactDetail(id: number) {
  const c = CONTACTS.find((x) => x.id === id);
  if (!c) return null;
  const ev = MOCK_EVENTS[id % MOCK_EVENTS.length];
  return {
    ...c,
    sourceDetails: c.sources.map((type, i) => ({ type, occurredAt: isoDaysAgo(30 + i * 10), eventId: type === "IMPORT" ? null : Number(ev.id), eventName: type === "IMPORT" ? null : ev.nome, import: type === "IMPORT" ? { id: 9, fileName: "lista-festa.csv", originDescription: "Lista da festa de aniversário", createdAt: isoDaysAgo(40) } : null })),
    preferences: c.channels.EMAIL.preference === "OPTED_OUT" ? [{ channel: "EMAIL" as const, status: "OPTED_OUT" as const, legalBasis: null, evidence: "Link de descadastro", updatedAt: isoDaysAgo(8) }] : [],
    purchases: Array.from({ length: Math.min(c.ordersCount, 3) }, (_, i) => ({ orderId: 3000 + id + i, code: `PED-${3000 + id + i}`, boughtAt: isoDaysAgo(10 + i * 20), paymentMethod: i % 2 ? "PIX" : "CARD", eventId: Number(ev.id), eventName: ev.nome, items: [{ ticketType: "Pista", quantity: (i % 2) + 1 }], ticketsValueCents: 8000 * ((i % 2) + 1) })),
    tickets: Array.from({ length: Math.min(c.ordersCount, 3) }, (_, i) => ({ ticketId: 7000 + id + i, eventId: Number(ev.id), eventName: ev.nome, eventDate: ev.data, ticketType: "Pista", attended: i === 0, received: i === 1 })),
  };
}
const SEGMENTS: CrmSegment[] = [
  { id: 1, name: "Recorrentes", description: "Quem comprou 2+ vezes", filters: { minOrders: 2 }, createdAt: isoDaysAgo(30), updatedAt: isoDaysAgo(3), counts: crmCounts(filterContacts({ minOrders: "2" })) },
  { id: 2, name: "Sumidos há 90 dias", description: null, filters: { inactiveDays: 90 }, createdAt: isoDaysAgo(20), updatedAt: isoDaysAgo(20), counts: crmCounts(filterContacts({ inactiveDays: "90" })) },
  { id: 3, name: "Importados da lista", description: "Base importada do CSV", filters: { sources: ["IMPORT"] }, createdAt: isoDaysAgo(10), updatedAt: isoDaysAgo(10), counts: crmCounts(filterContacts({ sources: "IMPORT" })) },
];
const emailTemplate = (id: number, name: string, status: "DRAFT" | "APPROVED") => ({ id, channel: "EMAIL" as const, name, status, content: { subject: "Vem pro Baile Neon! 🎉", preheader: "Último lote liberado", accentColor: "#e5179c", blocks: [{ type: "heading" as const, text: "O Baile Neon tá chegando" }, { type: "text" as const, text: "Sábado, 17 de outubro, Galpão 21. Três pistas, visual mapping e open bar até 2h." }, { type: "image" as const, url: posterUrl("baile-neon"), alt: "Baile Neon" }, { type: "button" as const, label: "Garantir ingresso", href: "https://www.noktatickets.com.br/evento/baile-neon" }, { type: "divider" as const }, { type: "text" as const, text: "Você está recebendo porque já comprou com a gente." }] }, problems: status === "DRAFT" ? ["Falta remetente verificado"] : [], rejectionReason: null, submitted: status === "APPROVED", statusSyncedAt: isoDaysAgo(1), updatedAt: isoDaysAgo(2) });
const TEMPLATES: CrmTemplate[] = [
  emailTemplate(1, "Lançamento do último lote", "APPROVED"),
  emailTemplate(2, "Lembrete véspera", "DRAFT"),
  { id: 3, channel: "WHATSAPP" as const, name: "Aviso de abertura dos portões", status: "IN_REVIEW" as const, content: { category: "MARKETING" as const, language: "pt_BR", headerText: "Baile Neon", body: "Oi {{1}}! Os portões abrem às 23h. Chega cedo pra não pegar fila 💜", footer: "Nokta Tickets", buttons: [{ type: "URL" as const, text: "Ver ingresso", url: "https://www.noktatickets.com.br/meus-ingressos" }] }, problems: [], rejectionReason: null, submitted: true, statusSyncedAt: isoDaysAgo(1), updatedAt: isoDaysAgo(4) },
];
const CAMPAIGNS: CrmCampaign[] = [
  { id: 1, kind: "BROADCAST" as const, channel: "EMAIL" as const, name: "Último lote — Baile Neon", status: "COMPLETED" as const, templateId: 1, templateName: "Lançamento do último lote", segmentId: 1, segmentName: "Recorrentes", filters: { minOrders: 2 }, scheduledAt: isoDaysAgo(6), startedAt: isoDaysAgo(6), finishedAt: isoDaysAgo(6), estimatedRecipients: 18, unitCostMicros: 4000, estimatedCostMicros: 72000, results: { recipients: 18, sent: 18, delivered: 17, opened: 11, clicked: 6, failed: 1, skipped: 0, unsubscribed: 1 }, lastError: null, createdAt: isoDaysAgo(7) },
  { id: 2, kind: "BROADCAST" as const, channel: "WHATSAPP" as const, name: "Portões abertos", status: "SCHEDULED" as const, templateId: 3, templateName: "Aviso de abertura dos portões", segmentId: null, segmentName: null, filters: { purchasedEventIds: [101] }, scheduledAt: isoDaysFromNow(3), startedAt: null, finishedAt: null, estimatedRecipients: 14, unitCostMicros: 380000, estimatedCostMicros: 5320000, results: { recipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0, skipped: 0, unsubscribed: 0 }, lastError: null, createdAt: isoDaysAgo(1) },
  { id: 3, kind: "BROADCAST" as const, channel: "EMAIL" as const, name: "Reativação — sumidos", status: "DRAFT" as const, templateId: 2, templateName: "Lembrete véspera", segmentId: 2, segmentName: "Sumidos há 90 dias", filters: { inactiveDays: 90 }, scheduledAt: null, startedAt: null, finishedAt: null, estimatedRecipients: null, unitCostMicros: null, estimatedCostMicros: null, results: { recipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0, skipped: 0, unsubscribed: 0 }, lastError: null, createdAt: isoDaysAgo(0.2) },
  { id: 4, kind: "BROADCAST" as const, channel: "EMAIL" as const, name: "Pré-venda Sunset", status: "FAILED" as const, templateId: 1, templateName: "Lançamento do último lote", segmentId: null, segmentName: null, filters: {}, scheduledAt: isoDaysAgo(15), startedAt: isoDaysAgo(15), finishedAt: isoDaysAgo(15), estimatedRecipients: 24, unitCostMicros: 4000, estimatedCostMicros: 96000, results: { recipients: 24, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 24, skipped: 0, unsubscribed: 0 }, lastError: "Remetente não verificado no momento do envio", createdAt: isoDaysAgo(16) },
];
const CHANNELS = {
  email: { available: true, ready: true, pending: [], sender: { status: "CONNECTED" as const, address: "festa@nokta.live", fromName: "Nokta Eventos", domain: "nokta.live", localPart: "festa", replyTo: "contato@nokta.live", records: [{ purpose: "DKIM" as const, type: "CNAME" as const, name: "nk1._domainkey.nokta.live", value: "nk1.dkim.amazonses.com", required: true }, { purpose: "SPF" as const, type: "TXT" as const, name: "nokta.live", value: "v=spf1 include:amazonses.com ~all", required: true }, { purpose: "DMARC" as const, type: "TXT" as const, name: "_dmarc.nokta.live", value: "v=DMARC1; p=none;", required: false }], dkimStatus: "SUCCESS", lastCheckedAt: isoDaysAgo(0.1), lastError: null } },
  whatsapp: { available: true, sendingEnabled: true, signup: { appId: "123", configId: "456", graphVersion: "v20.0" }, ready: false, pending: ["Adicionar método de pagamento na Meta"], account: { status: "CONNECTED" as const, phoneNumber: "+55 11 99999-0000", verifiedName: "Nokta Eventos", businessName: "Nokta Eventos LTDA", hasFunding: false, qualityRating: "GREEN", messagingLimitTier: "TIER_1K", lastCheckedAt: isoDaysAgo(0.3), lastError: null } },
};
const CREDITS = { email: { freeMonthly: 2000, freeUsed: 342, freeRemaining: 1658, paidBalance: 5000, available: 6658, creditPriceMicros: 4000 }, whatsapp: { marketingRateMicros: 380000, utilityRateMicros: 40000, ratesCheckedAt: isoDaysAgo(0.5) } };
const IMPORTS = [{ id: 9, fileName: "lista-festa.csv", originDescription: "Lista da festa de aniversário", consentEmail: true, consentWhatsapp: false, purpose: "Convites de próximas edições", legalBasis: "CONSENT" as const, totalRows: 80, createdCount: 62, mergedCount: 11, invalidCount: 5, duplicateCount: 2, createdAt: isoDaysAgo(40) }];

// ── Conta / verificação ────────────────────────────────────────────────────
const financeData = { tipoPessoa: "PF" as const, cpf: "12345678909", cnpj: null as string | null, chavePix: "vitor@nokta.live", telefone: "+5511999999999", telefoneVerificado: true, nivelProdutor: 2, platformFeePercent: 10, withdrawalDelayDays: 7, solicitacaoAtual: { id: 7, status: 2 as 1 | 2 | 3, tipo: "NIVEL_2", createdAt: isoDaysAgo(30), dataResposta: isoDaysAgo(28) } };

// ── Convidados ─────────────────────────────────────────────────────────────
const GUESTS = [
  { userTicketId: 8001, status: 1, guest: { id: 31, nome: "Marina Castro", email: "marina@exemplo.com" }, createdAt: isoDaysAgo(3), qrSentAt: isoDaysAgo(3) },
  { userTicketId: 8002, status: 2, guest: { id: 32, nome: "Rafael Torres", email: "rafael@exemplo.com" }, createdAt: isoDaysAgo(5), qrSentAt: isoDaysAgo(5) },
  { userTicketId: 8003, status: 1, guest: { id: 33, nome: "Júlia Antunes", email: "julia@exemplo.com" }, createdAt: isoDaysAgo(1), qrSentAt: null },
  { userTicketId: 8004, status: 4, guest: { id: 34, nome: "Caio Martins", email: "caio@exemplo.com" }, createdAt: isoDaysAgo(8), qrSentAt: isoDaysAgo(8) },
];

const P = "/produtor/eventos";

export const eventsAdminHandlers: MockHandler[] = [
  // ── upload ──
  { test: /\/upload$/, method: "post", handle: () => ok({ data: [posterUrl("garden-party")] }) },

  // ── eventos ──
  { test: /\/produtor\/eventos$/, method: "get", handle: ({ params }) => ok(listEvents(params)) },
  { test: /\/produtor\/eventos$/, method: "post", handle: () => ({ status: 201, data: { id: 113 } }) },
  { test: /\/produtor\/eventos\/\d+$/, method: "get", handle: ({ url }) => (adminEvent(num(url)) ? ok(adminEvent(num(url))) : notFound("Evento não encontrado")) },
  {
    test: /\/produtor\/eventos\/\d+$/,
    method: "put",
    handle: ({ url, body }) => {
      const id = num(url);
      const b = body as { ingressos?: AdminLote[] } | null;
      if (b?.ingressos) lotesStore.set(id, b.ingressos.map((l, i) => ({ ...l, id: l.id ?? id * 10 + 20 + i, vipToken: l.vip ? (l.vipToken ?? `vip-${id}-${i}`) : null })));
      return ok(adminEvent(id));
    },
  },
  { test: /\/produtor\/eventos\/\d+$/, method: "delete", handle: ({ url }) => { deleted.add(num(url)); return ok(); } },
  { test: new RegExp(`${P}/\\d+/publicar$`), method: "patch", handle: ({ url }) => { eventStatus.set(num(url, 2), 2); return ok(); } },
  { test: new RegExp(`${P}/\\d+/despublicar$`), method: "patch", handle: ({ url }) => { eventStatus.set(num(url, 2), 1); return ok(); } },
  { test: new RegExp(`${P}/\\d+/cancelar$`), method: "patch", handle: ({ url }) => { eventStatus.set(num(url, 2), 3); return ok(); } },
  { test: new RegExp(`${P}/\\d+/ingressos$`), method: "get", handle: ({ url }) => ok({ data: getLotes(num(url, 2)) }) },
  { test: new RegExp(`${P}/\\d+/lista-vip/\\d+$`), method: "delete", handle: ({ url }) => { const id = num(url, 3); lotesStore.set(id, getLotes(id).filter((l) => l.id !== num(url))); return ok(); } },
  { test: new RegExp(`${P}/\\d+/vendas$`), method: "get", handle: ({ url }) => ok(vendas(num(url, 2))) },

  // ── cupons ──
  { test: new RegExp(`${P}/\\d+/cupons$`), method: "get", handle: ({ url }) => ok(getCupons(num(url, 2))) },
  {
    test: new RegExp(`${P}/\\d+/cupons$`),
    method: "post",
    handle: ({ url, body }) => {
      const eventoId = num(url, 2);
      const b = body as Partial<Cupom>;
      const cupom: Cupom = { id: ++cupomSeq, eventoId, codigo: String(b.codigo ?? "").toUpperCase(), tipo: b.tipo ?? "PERCENTUAL", desconto: Number(b.desconto ?? 0), maxDesconto: b.maxDesconto ?? null, valorMinimoCompra: b.valorMinimoCompra ?? null, aplicacao: b.aplicacao ?? "EVENTO", loteNumero: b.loteNumero ?? null, tipoIngressoId: b.tipoIngressoId ?? null, inicio: b.inicio ?? null, fim: b.fim ?? null, limiteUso: b.limiteUso ?? null, limitePorUsuario: b.limitePorUsuario ?? null, totalUsado: 0, ativo: b.ativo ?? true, descricao: b.descricao ?? null, deletedAt: null, createdAt: new Date().toISOString() };
      getCupons(eventoId).unshift(cupom);
      return { status: 201, data: cupom };
    },
  },
  {
    test: new RegExp(`${P}/\\d+/cupons/\\d+$`),
    method: "put",
    handle: ({ url, body }) => {
      const list = getCupons(num(url, 3));
      const idx = list.findIndex((c) => c.id === num(url));
      if (idx < 0) return notFound();
      list[idx] = { ...list[idx], ...(body as Partial<Cupom>), codigo: String((body as Partial<Cupom>).codigo ?? list[idx].codigo).toUpperCase() };
      return ok(list[idx]);
    },
  },
  { test: new RegExp(`${P}/\\d+/cupons/\\d+/toggle$`), method: "patch", handle: ({ url }) => { const c = getCupons(num(url, 4)).find((x) => x.id === num(url, 2)); if (!c) return notFound(); c.ativo = !c.ativo; return ok(c); } },
  { test: new RegExp(`${P}/\\d+/cupons/\\d+$`), method: "delete", handle: ({ url }) => { const id = num(url, 3); cuponsStore.set(id, getCupons(id).filter((c) => c.id !== num(url))); return ok(); } },

  // ── equipe ──
  { test: new RegExp(`${P}/\\d+/equipe$`), method: "get", handle: ({ url }) => ok({ data: getEquipe(num(url, 2)) }) },
  { test: new RegExp(`${P}/\\d+/equipe$`), method: "post", handle: ({ url, body }) => { const email = String((body as { email?: string })?.email ?? ""); getEquipe(num(url, 2)).push({ id: ++equipeSeq, userId: equipeSeq, nome: email.split("@")[0], email, adicionadoEm: new Date().toISOString() }); return ok(); } },
  { test: new RegExp(`${P}/\\d+/equipe/\\d+$`), method: "delete", handle: ({ url }) => { const id = num(url, 3); equipeStore.set(id, getEquipe(id).filter((o) => o.id !== num(url))); return ok(); } },

  // ── saque ──
  { test: new RegExp(`${P}/\\d+/solicitar-saque$`), method: "post", handle: () => ok({ saque: { id: 99, amount: 1200 }, preview: { transferFeeCents: 0, estimatedNetAmountCents: 120000, bankAccountLast4: null } }) },
  { test: new RegExp(`${P}/\\d+/confirmar-saque$`), method: "post", handle: () => ok() },

  // ── métricas / conta ──
  { test: /\/produtor\/metrics$/, handle: () => ok({ ingressosVendidos: 2184, ingressosDisponiveis: 1296, arrecadacaoTotal: 168420.5, eventosCriados: MOCK_EVENTS.length }) },
  { test: /\/produtor\/vendas-mensais$/, handle: () => ok({ months: { Maio: 180, Junho: 262, Julho: 318, Agosto: 290, Setembro: 404, Outubro: 730 } }) },
  { test: /\/produtor\/dados-financeiros$/, method: "get", handle: () => ok(financeData) },
  { test: /\/produtor\/dados-financeiros$/, method: "put", handle: ({ body }) => ok({ ...financeData, ...(body as object) }) },
  { test: /\/produtor\/minha-verificacao$/, handle: () => ok({ solicitacao: null, dadosAtuais: { tipoPessoa: null, cpf: null, cnpj: null, chavePix: null, telefone: "+5511999999999", telefoneVerificado: false, nivelProdutor: 1 } }) },
  { test: /\/produtor\/atualizar-telefone-sms$/, method: "put", handle: () => ok() },
  { test: /\/produtor\/enviar-sms-n2$/, method: "post", handle: () => ok() },
  { test: /\/produtor\/verificar-sms-n2$/, method: "post", handle: ({ body }) => ok({ valid: /^\d{6}$/.test(String((body as { code?: string })?.code ?? "")) }) },
  { test: /\/produtor\/solicitar-verificacao$/, method: "post", handle: () => ok() },

  // ── convidados ──
  { test: /\/guests$/, method: "get", handle: () => ok(GUESTS) },
  { test: /\/guests\/invite$/, method: "post", handle: ({ body }) => { const email = String((body as { email?: string })?.email ?? ""); GUESTS.unshift({ userTicketId: 8000 + GUESTS.length + 10, status: 1, guest: { id: 40 + GUESTS.length, nome: email.split("@")[0], email }, createdAt: new Date().toISOString(), qrSentAt: null }); return ok({ userTicketId: 8099, message: "Cortesia enviada! O convidado já vê o ingresso na conta dele." }); } },

  // ── acesso ao módulo tickets (OWNER completo: promotores, CRM, financeiro) ──
  // dashboard.ts também responde esta rota com uma lista menor; como este
  // arquivo vem antes no index, vale este. Consolidar lá quando a frente D fechar.
  { test: /\/organizations\/\d+\/me\/tickets-access$/, handle: () => ok({ organizationId: 1, membershipId: 1, membershipStatus: "ACTIVE", organizationRole: "OWNER", modules: { tickets: { role: "OWNER", permissions: ["tickets.finance.view", "tickets.events.manage", "tickets.checkin", "tickets.promoters.view", "tickets.promoters.manage", "tickets.promoters.assignments.manage", "tickets.promoters.export", "tickets.promoters.settlements.manage", "tickets.crm.view", "tickets.crm.manage", "tickets.crm.export", "tickets.crm.campaigns.manage", "tickets.crm.channels.manage"] } } }) },

  // ── promotores ──
  { test: /\/organizations\/\d+\/promoters$/, method: "get", handle: () => ok(PROMOTERS) },
  { test: /\/organizations\/\d+\/promoters\/invite$/, method: "post", handle: ({ body }) => { PROMOTERS.push({ id: PROMOTERS.length + 1, inviteEmail: String((body as { email?: string })?.email ?? ""), status: "INVITED", invitedAt: new Date().toISOString(), acceptedAt: null, suspendedAt: null, removedAt: null, promoterProfile: null, invitedBy: { id: 1, nome: "Vitor Reis" } }); return ok(); } },
  { test: /\/organizations\/\d+\/promoters\/\d+\/(resend-invite|cancel-invite|suspend|reactivate|remove)$/, method: "post", handle: ({ url }) => { const action = seg(url); const p = PROMOTERS.find((x) => x.id === num(url, 2)); if (p) p.status = action === "suspend" ? "SUSPENDED" : action === "reactivate" ? "ACTIVE" : action === "remove" || action === "cancel-invite" ? "REMOVED" : p.status; return ok(); } },
  { test: /\/organizations\/\d+\/promoters\/events$/, handle: () => ok(MOCK_EVENTS.slice(0, 6).map((e) => ({ id: Number(e.id), slug: e.slug, nome: e.nome, data: e.data, status: eventStatus.get(Number(e.id)) ?? 2, tickets: getLotes(Number(e.id)).filter((l) => !l.vip).map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, lote: l.lote, valor: String(l.valor) })) }))) },
  { test: /\/organizations\/\d+\/promoters\/assignments$/, method: "get", handle: ({ params }) => ok(ASSIGNMENTS.filter((a) => (params.eventId ? a.eventId === Number(params.eventId) : true))) },
  { test: /\/organizations\/\d+\/promoters\/assignments$/, method: "post", handle: ({ body }) => { const b = body as { organizationPromoterId: number; eventId: number } & Partial<EventPromoterAssignment>; const p = PROMOTERS.find((x) => x.id === b.organizationPromoterId)!; const a = { ...ASSIGNMENTS[0], ...b, id: 20 + ASSIGNMENTS.length, status: "ACTIVE" as const, publicToken: `tk-${Date.now()}`, createdAt: new Date().toISOString(), organizationPromoter: { id: p.id, inviteEmail: p.inviteEmail, promoterProfile: p.promoterProfile ? { displayName: p.promoterProfile.displayName, userId: p.promoterProfile.userId } : null } }; ASSIGNMENTS.push(a); return ok(a); } },
  { test: /\/organizations\/\d+\/promoters\/assignments\/\d+$/, method: "patch", handle: ({ url, body }) => { const a = ASSIGNMENTS.find((x) => x.id === num(url)); if (!a) return notFound(); Object.assign(a, body as object); return ok(a); } },
  { test: /\/organizations\/\d+\/promoters\/assignments\/\d+\/(pause|reactivate|regenerate-token)$/, method: "post", handle: ({ url }) => { const action = seg(url); const a = ASSIGNMENTS.find((x) => x.id === num(url, 2)); if (!a) return notFound(); if (action === "pause") a.status = "PAUSED"; if (action === "reactivate") a.status = "ACTIVE"; if (action === "regenerate-token") a.publicToken = `tk-${Date.now()}`; return ok({ id: a.id, publicToken: a.publicToken }); } },
  { test: /\/organizations\/\d+\/promoters\/sales$/, handle: ({ params }) => ok(promoterSales.filter((s) => (params.eventId ? s.eventId === Number(params.eventId) : true))) },
  { test: /\/organizations\/\d+\/promoters\/analytics$/, handle: () => ok({ promotersAtivos: 2, linksAtivos: 2, codigosAtivos: 1, cliquesBrutos: 1840, cliquesUnicosEstimados: 1210, atribuicoes: 96, reservas: 40, pedidosPagos: 14, ingressos: 23, originalNominalCents: 182000, discountAppliedCents: 11200, netNominalCentsAfterDiscount: 170800, commissionPendingCents: 4800, commissionAvailableCents: 7200, commissionSettledCents: 48000, commissionReversedCents: 0, commissionAdjustmentCents: -800, netBalanceCents: 54400, taxaConversaoAtribuicaoParaPagamento: 0.146 }) },
  { test: /\/organizations\/\d+\/promoters\/settlements\/available-entries$/, handle: () => ok(Array.from({ length: 4 }, (_, i) => ({ id: 60 + i, type: i === 3 ? "ADJUSTMENT" : "EARNED", eventId: 101, orderId: 2010 + i, orderItemId: null, userTicketId: null, grossTicketValueCents: 16000, commissionCents: i === 3 ? -800 : 1600, reason: i === 3 ? "Estorno após acerto" : null, createdAt: isoDaysAgo(i + 1) }))) },
  { test: /\/organizations\/\d+\/promoters\/settlements$/, method: "get", handle: ({ params }) => ok(SETTLEMENTS.filter((s) => (params.promoterProfileId ? s.promoterProfileId === Number(params.promoterProfileId) : true))) },
  { test: /\/organizations\/\d+\/promoters\/settlements$/, method: "post", handle: ({ body }) => { const b = body as { promoterProfileId: number; periodStart: string; periodEnd: string; commissionEntryIds: number[] }; const s = { id: 40 + SETTLEMENTS.length + 10, organizationId: 1, promoterProfileId: b.promoterProfileId, periodStart: b.periodStart, periodEnd: b.periodEnd, totalCommissionCents: b.commissionEntryIds.length * 1600, status: "DRAFT" as const, notes: null, confirmedAt: null, paidAt: null, createdAt: new Date().toISOString(), promoterProfile: { id: b.promoterProfileId, displayName: PROMOTERS.find((p) => p.promoterProfile?.id === b.promoterProfileId)?.promoterProfile?.displayName ?? null }, _count: { entries: b.commissionEntryIds.length } }; SETTLEMENTS.unshift(s); return ok(s); } },
  { test: /\/organizations\/\d+\/promoters\/settlements\/\d+\/(confirm|pay-manually|cancel)$/, method: "post", handle: ({ url }) => { const action = seg(url); const s = SETTLEMENTS.find((x) => x.id === num(url, 2)); if (!s) return notFound(); s.status = action === "confirm" ? "CONFIRMED" : action === "pay-manually" ? "PAID_MANUALLY" : "CANCELLED"; if (action === "confirm") s.confirmedAt = new Date().toISOString(); if (action === "pay-manually") s.paidAt = new Date().toISOString(); return ok(s); } },

  // ── CRM ──
  { test: /\/organizations\/\d+\/crm\/overview$/, handle: () => ok({ ...crmCounts(CONTACTS), recurring: filterContacts({ minOrders: "2" }).length, inactive90Days: filterContacts({ inactiveDays: "90" }).length }) },
  { test: /\/organizations\/\d+\/crm\/filter-options$/, handle: () => ok({ events: MOCK_EVENTS.slice(0, 5).map((e) => ({ id: Number(e.id), name: e.nome, date: e.data, ticketTypes: getLotes(Number(e.id)).filter((l) => !l.vip).map((l) => ({ id: l.id, name: `${l.nome} · ${l.lote}º lote` })) })) }) },
  { test: /\/organizations\/\d+\/crm\/contacts$/, method: "get", handle: ({ params }) => { const list = filterContacts(params); const page = Number(params.page ?? 1); const perPage = Number(params.perPage ?? 25); return ok({ items: list.slice((page - 1) * perPage, page * perPage), page, perPage, total: list.length, counts: crmCounts(list) }); } },
  { test: /\/organizations\/\d+\/crm\/contacts\/\d+$/, method: "get", handle: ({ url }) => (contactDetail(num(url)) ? ok(contactDetail(num(url))) : notFound()) },
  { test: /\/organizations\/\d+\/crm\/contacts\/\d+$/, method: "delete", handle: () => ok() },
  { test: /\/organizations\/\d+\/crm\/contacts\/\d+\/(consent|unsubscribe|block)$/, method: "post", handle: ({ url }) => ok(contactDetail(num(url, 2))) },
  { test: /\/organizations\/\d+\/crm\/contacts\/\d+\/block$/, method: "delete", handle: ({ url }) => ok(contactDetail(num(url, 2))) },
  { test: /\/organizations\/\d+\/crm\/contacts\/\d+\/messages$/, method: "post", handle: () => ok({ campaign: { ...CAMPAIGNS[0], id: 90, kind: "INDIVIDUAL", status: "COMPLETED" }, recipient: null }) },
  { test: /\/organizations\/\d+\/crm\/segments$/, method: "get", handle: () => ok(SEGMENTS) },
  { test: /\/organizations\/\d+\/crm\/segments$/, method: "post", handle: ({ body }) => { const b = body as { name: string; description?: string; filters: Record<string, string> }; const s = { id: SEGMENTS.length + 1, name: b.name, description: b.description ?? null, filters: b.filters, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), counts: crmCounts(CONTACTS) }; SEGMENTS.push(s); return ok(s); } },
  { test: /\/organizations\/\d+\/crm\/segments\/\d+$/, method: "delete", handle: () => ok() },
  { test: /\/organizations\/\d+\/crm\/imports$/, method: "get", handle: () => ok(IMPORTS) },
  { test: /\/organizations\/\d+\/crm\/imports\/preview$/, method: "post", handle: () => ok({ totalRows: 40, willCreate: 31, willMerge: 6, suppressed: 1, problems: { EMAIL_INVALIDO: 2 }, problemSamples: [{ line: 7, problem: "EMAIL_INVALIDO" }, { line: 19, problem: "EMAIL_INVALIDO" }], rows: CONTACTS.slice(0, 6).map((c, i) => ({ line: i + 2, name: c.name, email: c.email, phone: c.phone, status: i % 2 ? "EXISTING" : "NEW" })) }) },
  { test: /\/organizations\/\d+\/crm\/imports$/, method: "post", handle: () => ok({ importId: 10, totalRows: 40, willCreate: 31, willMerge: 6, suppressed: 1, problems: {}, problemSamples: [], rows: [] }) },
  { test: /\/organizations\/\d+\/crm\/channels$/, method: "get", handle: () => ok(CHANNELS) },
  { test: /\/organizations\/\d+\/crm\/channels\/email$/, method: "put", handle: () => ok(CHANNELS) },
  { test: /\/organizations\/\d+\/crm\/channels\/email\/verify$/, method: "post", handle: () => ok(CHANNELS) },
  { test: /\/organizations\/\d+\/crm\/channels\/email$/, method: "delete", handle: () => ok({ ...CHANNELS, email: { ...CHANNELS.email, ready: false, sender: null } }) },
  { test: /\/organizations\/\d+\/crm\/channels\/whatsapp\/(connect|sync)$/, method: "post", handle: () => ok(CHANNELS) },
  { test: /\/organizations\/\d+\/crm\/channels\/whatsapp$/, method: "delete", handle: () => ok({ ...CHANNELS, whatsapp: { ...CHANNELS.whatsapp, ready: false, account: null } }) },
  { test: /\/organizations\/\d+\/crm\/credits$/, handle: () => ok(CREDITS) },
  { test: /\/organizations\/\d+\/crm\/templates$/, method: "get", handle: ({ params }) => ok(TEMPLATES.filter((t) => (params.channel ? t.channel === params.channel : true))) },
  { test: /\/organizations\/\d+\/crm\/templates$/, method: "post", handle: ({ body }) => { const b = body as { channel: "EMAIL" | "WHATSAPP"; name: string; content: never }; const t = { id: TEMPLATES.length + 1, channel: b.channel, name: b.name, status: "DRAFT" as const, content: b.content, problems: [], rejectionReason: null, submitted: false, statusSyncedAt: null, updatedAt: new Date().toISOString() }; TEMPLATES.push(t as unknown as CrmTemplate); return ok(t); } },
  { test: /\/organizations\/\d+\/crm\/templates\/preview$/, method: "post", handle: ({ body }) => { const b = body as { channel: "EMAIL" | "WHATSAPP"; content: { subject?: string; blocks?: { type: string; text?: string; label?: string; href?: string; url?: string }[]; headerText?: string; body?: string; footer?: string; buttons?: unknown[] } }; if (b.channel === "WHATSAPP") return ok({ channel: "WHATSAPP", headerText: b.content.headerText ?? null, body: (b.content.body ?? "").replace("{{1}}", "Ana"), footer: b.content.footer ?? null, buttons: b.content.buttons ?? [], problems: [] }); const html = `<div style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto">${(b.content.blocks ?? []).map((bl) => (bl.type === "heading" ? `<h1 style="font-size:22px">${bl.text}</h1>` : bl.type === "text" ? `<p style="line-height:1.5">${bl.text}</p>` : bl.type === "button" ? `<a href="${bl.href}" style="display:inline-block;background:#e5179c;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${bl.label}</a>` : bl.type === "image" ? `<img src="${bl.url}" style="width:100%;border-radius:12px" />` : bl.type === "divider" ? `<hr style="border:0;border-top:1px solid #eee" />` : `<div style="height:24px"></div>`)).join("")}</div>`; return ok({ channel: "EMAIL", subject: b.content.subject ?? "", html, text: "", problems: [] }); } },
  { test: /\/organizations\/\d+\/crm\/templates\/\d+$/, method: "patch", handle: ({ url, body }) => { const t = TEMPLATES.find((x) => x.id === num(url)); if (!t) return notFound(); Object.assign(t, body as object, { updatedAt: new Date().toISOString() }); return ok(t); } },
  { test: /\/organizations\/\d+\/crm\/templates\/\d+$/, method: "delete", handle: () => ok() },
  { test: /\/organizations\/\d+\/crm\/templates\/\d+\/test$/, method: "post", handle: () => ok({ sentTo: "vitor@nokta.live" }) },
  { test: /\/organizations\/\d+\/crm\/templates\/\d+\/(submit|sync)$/, method: "post", handle: ({ url }) => { const t = TEMPLATES.find((x) => x.id === num(url, 2)); if (!t) return notFound(); t.submitted = true; return ok(t); } },
  { test: /\/organizations\/\d+\/crm\/campaigns$/, method: "get", handle: () => ok(CAMPAIGNS) },
  { test: /\/organizations\/\d+\/crm\/campaigns$/, method: "post", handle: ({ body }) => { const b = body as { name: string; channel: "EMAIL" | "WHATSAPP"; templateId?: number | null; segmentId?: number | null; filters?: object }; const c = { ...CAMPAIGNS[2], id: CAMPAIGNS.length + 1, name: b.name, channel: b.channel, templateId: b.templateId ?? null, templateName: TEMPLATES.find((t) => t.id === b.templateId)?.name ?? null, segmentId: b.segmentId ?? null, segmentName: SEGMENTS.find((s) => s.id === b.segmentId)?.name ?? null, filters: b.filters ?? {}, status: "DRAFT" as const, createdAt: new Date().toISOString() }; CAMPAIGNS.unshift(c); return ok(c); } },
  { test: /\/organizations\/\d+\/crm\/campaigns\/estimate$/, method: "post", handle: ({ body }) => { const b = body as { channel: "EMAIL" | "WHATSAPP" }; const unit = b.channel === "EMAIL" ? 4000 : 380000; const eligible = b.channel === "EMAIL" ? 19 : 14; return ok({ audience: { total: 24, eligible, recentlyContacted: 3, willReceive: eligible - 3 }, cost: { channel: b.channel, recipients: eligible - 3, unitCostMicros: unit, totalCostMicros: unit * (eligible - 3), chargedBy: b.channel === "EMAIL" ? "NOKTA" : "META", credits: b.channel === "EMAIL" ? { needed: eligible - 3, fromFree: eligible - 3, fromPaid: 0, missing: 0, balance: CREDITS.email } : null, ratesCheckedAt: isoDaysAgo(0.5) }, blockers: b.channel === "WHATSAPP" ? ["Adicione um método de pagamento na Meta"] : [] }); } },
  { test: /\/organizations\/\d+\/crm\/campaigns\/\d+$/, method: "get", handle: ({ url }) => { const c = CAMPAIGNS.find((x) => x.id === num(url)); return c ? ok(c) : notFound(); } },
  { test: /\/organizations\/\d+\/crm\/campaigns\/\d+$/, method: "patch", handle: ({ url, body }) => { const c = CAMPAIGNS.find((x) => x.id === num(url)); if (!c) return notFound(); Object.assign(c, body as object); return ok(c); } },
  { test: /\/organizations\/\d+\/crm\/campaigns\/\d+$/, method: "delete", handle: () => ok() },
  { test: /\/organizations\/\d+\/crm\/campaigns\/\d+\/recipients$/, handle: ({ url }) => { const c = CAMPAIGNS.find((x) => x.id === num(url, 2)); const items = CONTACTS.slice(0, c?.results.recipients ?? 0).map((ct, i) => ({ id: 500 + i, contactId: ct.id, name: ct.name, address: ct.email ?? ct.phone ?? "", status: (i === 5 ? "FAILED" : i % 3 === 0 ? "DELIVERED" : "SENT") as "FAILED" | "DELIVERED" | "SENT", skipReason: null, error: i === 5 ? "Caixa cheia" : null, sentAt: isoDaysAgo(6), deliveredAt: i % 3 === 0 ? isoDaysAgo(6) : null, openedAt: i % 2 === 0 ? isoDaysAgo(5) : null, clickedAt: i % 4 === 0 ? isoDaysAgo(5) : null })); return ok({ items, total: items.length, page: 1, perPage: 50 }); } },
  { test: /\/organizations\/\d+\/crm\/campaigns\/\d+\/(schedule|cancel)$/, method: "post", handle: ({ url, body }) => { const c = CAMPAIGNS.find((x) => x.id === num(url, 2)); if (!c) return notFound(); const action = seg(url); c.status = action === "cancel" ? "CANCELLED" : "SCHEDULED"; if (action === "schedule") c.scheduledAt = (body as { scheduledAt?: string })?.scheduledAt ?? new Date().toISOString(); return ok(c); } },

  // ── financeiro de ingressos (`timeline` e `me/tickets-access` já vêm de dashboard.ts) ──
  { test: /\/organizations\/\d+\/tickets\/finance\/overview$/, handle: ({ params }) => ok(financeOverview(params.eventId ? Number(params.eventId) : undefined)) },
  { test: /\/organizations\/\d+\/tickets\/finance\/statement$/, handle: ({ params }) => ok(statement(params)) },
];
