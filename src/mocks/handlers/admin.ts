import { MOCK_EVENTS } from "../fixtures";
import { notFound, paginate, type MockHandler } from "./types";

/**
 * Painel administrativo (frente G edita aqui). Dados fictícios plausíveis
 * pra navegar o /admin sem backend. Estado em memória: bloquear, aprovar
 * etc. muda a lista até o reload da página.
 *
 * Atenção: `GET /admin/eventos` e `PUT /admin/eventos/:id` são capturados
 * antes pelos handlers públicos (`/\/eventos$/` e `/\/eventos\/[^/]+$/`
 * em public.ts, que vêm primeiro na ordem) — os handlers daqui pra essas
 * rotas só respondem se aquele regex ficar mais restrito.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
const lastSegment = (url: URL, offset = 1) => decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-offset) ?? "");
const idOf = (url: URL, offset = 1) => Number(lastSegment(url, offset));

/* ---------- usuários ---------- */

type Genero = "MASCULINO" | "FEMININO" | "OUTRO";
interface MockUser {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  genero: Genero | null;
  role: "COMUM" | "PRODUTOR";
  ativo: boolean;
  bloqueado: boolean;
  bloqueadoMotivo: string | null;
  nivelProdutor: number | null;
  qtdIngressos: number;
  qtdCompras: number;
  createdAt: string;
  emailVerificado: boolean;
  telefoneVerificado: boolean;
  totpEnabled: boolean;
  ultimoIp: string | null;
  falhasRecentes: number;
}

const FIRST = ["Ana", "Bruno", "Camila", "Diego", "Elisa", "Felipe", "Giovanna", "Henrique", "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Tatiane", "Vinícius", "Yasmin", "Thiago", "Larissa", "Gustavo"];
const LAST = ["Silva", "Souza", "Oliveira", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Ferreira", "Carvalho"];
const GENEROS: (Genero | null)[] = ["FEMININO", "MASCULINO", null, "OUTRO"];

const users: MockUser[] = Array.from({ length: 57 }, (_, i) => {
  const nome = FIRST[i % FIRST.length];
  const sobrenome = LAST[(i * 7) % LAST.length];
  const producer = i % 5 === 1;
  return {
    id: 1000 + i,
    nome,
    sobrenome,
    email: `${nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${sobrenome.toLowerCase()}${i}@exemplo.com`,
    cpf: i % 9 === 4 ? null : String(10000000000 + i * 987654321).slice(0, 11),
    telefone: i % 6 === 3 ? null : `+5511${String(900000000 + i * 12345).slice(0, 9)}`,
    dataNascimento: i % 7 === 2 ? null : new Date(1985 + (i % 20), i % 12, 1 + (i % 27)).toISOString(),
    genero: GENEROS[i % GENEROS.length],
    role: producer ? "PRODUTOR" : "COMUM",
    ativo: i % 11 !== 6,
    bloqueado: i % 13 === 8,
    bloqueadoMotivo: i % 13 === 8 ? "Chargebacks em sequência no mesmo cartão" : null,
    nivelProdutor: producer ? (i % 2 === 0 ? 2 : 1) : null,
    qtdIngressos: (i * 3) % 14,
    qtdCompras: (i * 2) % 9,
    createdAt: ago(10 + i * 4),
    emailVerificado: i % 4 !== 1,
    telefoneVerificado: i % 6 !== 3,
    totpEnabled: producer && i % 2 === 0,
    ultimoIp: i % 3 === 0 ? null : `187.45.${(i * 7) % 255}.${(i * 13) % 255}`,
    falhasRecentes: i % 10 === 7 ? 3 : 0,
  };
});

const findUser = (id: number) => users.find((u) => u.id === id);

const publicUser = (u: MockUser) => ({ id: u.id, nome: u.nome, sobrenome: u.sobrenome, email: u.email, cpf: u.cpf, telefone: u.telefone, dataNascimento: u.dataNascimento, genero: u.genero, role: u.role, ativo: u.ativo, bloqueado: u.bloqueado, bloqueadoMotivo: u.bloqueadoMotivo, nivelProdutor: u.nivelProdutor, qtdIngressos: u.qtdIngressos, qtdCompras: u.qtdCompras, createdAt: u.createdAt });

function userOrders(u: MockUser) {
  return Array.from({ length: u.qtdCompras }, (_, i) => {
    const ev = MOCK_EVENTS[(u.id + i) % MOCK_EVENTS.length];
    return { id: 50000 + u.id * 10 + i, evento: { id: Number(ev.id), nome: ev.nome }, valor: 60 + ((u.id + i) % 5) * 35.5, status: [2, 2, 1, 2, 3, 4, 5][(u.id + i) % 7], createdAt: ago(2 + i * 9) };
  });
}

function userTickets(u: MockUser) {
  return Array.from({ length: u.qtdIngressos }, (_, i) => {
    const ev = MOCK_EVENTS[(u.id + i * 3) % MOCK_EVENTS.length];
    return { id: 70000 + u.id * 20 + i, code: `NK-${String(u.id).slice(-2)}${String(1000 + i * 37).slice(-4)}`, status: [1, 1, 2, 1, 3, 4][(u.id + i) % 6], bloqueado: (u.id + i) % 9 === 2, createdAt: ago(1 + i * 6), evento: { id: Number(ev.id), nome: ev.nome } };
  });
}

const STAFF_EMAILS = ["root@nokta.live", "admin@nokta.live", "suporte@nokta.live"];
const AUDIT_ACTIONS = ["USER_BLOQUEADO", "USER_DESBLOQUEADO", "USER_ATIVADO", "SESSOES_INVALIDADAS", "INGRESSO_TRANSFERIDO", "INGRESSO_BLOQUEADO", "WORKSPACE_BLOQUEADO", "USER_EDITADO", "EVENTO_DESTAQUE", "TAXAS_ALTERADAS"];

function userAudit(u: MockUser) {
  return Array.from({ length: 3 + (u.id % 4) }, (_, i) => ({ id: 90000 + u.id * 10 + i, action: AUDIT_ACTIONS[(u.id + i) % 5], metadata: i === 0 ? { motivo: "Revisão de rotina" } : null, admin: { id: 99, nome: "Admin", email: STAFF_EMAILS[(u.id + i) % 3] }, createdAt: ago(i * 5, i) }));
}

/* ---------- equipe ---------- */

const staff = [
  { id: 1, nome: "Vitor", sobrenome: "Reis", email: STAFF_EMAILS[0], role: "SUPER_ADMIN", roleId: 4, bloqueado: false, isRoot: true, createdAt: ago(400) },
  { id: 2, nome: "Admin", sobrenome: "Nokta", email: STAFF_EMAILS[1], role: "ADMIN", roleId: 1, bloqueado: false, isRoot: false, createdAt: ago(210) },
  { id: 3, nome: "Suporte", sobrenome: "Nokta", email: STAFF_EMAILS[2], role: "SUPPORT", roleId: 5, bloqueado: false, isRoot: false, createdAt: ago(95) },
  { id: 4, nome: "Carla", sobrenome: "Menezes", email: "carla@nokta.live", role: "ADMIN", roleId: 1, bloqueado: true, isRoot: false, createdAt: ago(30) },
];
const ROLE_BY_ID: Record<number, string> = { 4: "SUPER_ADMIN", 1: "ADMIN", 5: "SUPPORT" };

/* ---------- workspaces ---------- */

interface MockWorkspace {
  id: number;
  nome: string;
  slug: string | null;
  documento: string | null;
  tipo: "PF" | "PJ";
  status: string;
  bloqueado: boolean;
  bloqueadoEm: string | null;
  bloqueadoMotivo: string | null;
  createdAt: string;
  onboardingCompleted: boolean;
  etapa: string;
  ownerId: number;
  modules: { module: string; ativo: boolean }[];
  taxaServicoPercent: number;
  legalFinancial: { verificationStatus: string; recipientStatus: string | null; recipientBlocked: boolean } | null;
  counts: { members: number; events: number; venueLocations: number; venueProducts: number; venueTabs: number; venueReservations: number; activeCapabilities: number };
}

const WS_NAMES = ["Nokta Eventos", "Galpão 21", "Casa Vereda", "Bar do Alto", "Coletivo Horizonte", "Rooftop SP", "Pontal Produções", "Cais Mauá Bar", "Sunset Crew", "Casa do Samba", "Techno Bunker", "Forró na Praça", "Vereda Noite", "Studio 44"];
const STAGES = ["CONCLUIDO", "CONCLUIDO", "OPERACAO", "CONCLUIDO", "TERMOS", "CONCLUIDO", "RESUMO", "CONCLUIDO"];

const workspaces: MockWorkspace[] = WS_NAMES.map((nome, i) => {
  const etapa = STAGES[i % STAGES.length];
  const blocked = i === 3 || i === 10;
  const hasVenue = i % 3 !== 1;
  return {
    id: 300 + i,
    nome,
    slug: etapa === "CONCLUIDO" ? nome.toLowerCase().replace(/[^a-z0-9]+/g, "-") : null,
    documento: i % 2 === 0 ? `12.345.${String(600 + i).padStart(3, "0")}/0001-${String(10 + i).padStart(2, "0")}` : String(12345678900 + i),
    tipo: i % 2 === 0 ? "PJ" : "PF",
    status: blocked ? "SUSPENDED" : "ACTIVE",
    bloqueado: blocked,
    bloqueadoEm: blocked ? ago(4) : null,
    bloqueadoMotivo: blocked ? "Denúncia de evento cancelado sem reembolso" : null,
    createdAt: ago(20 + i * 17),
    onboardingCompleted: etapa === "CONCLUIDO",
    etapa,
    ownerId: users[(i * 5 + 1) % users.length].id,
    modules: [
      { module: "tickets", ativo: true },
      { module: "venue", ativo: hasVenue },
    ],
    taxaServicoPercent: i === 0 ? 8 : 10,
    legalFinancial: etapa === "CONCLUIDO" ? { verificationStatus: ["VERIFIED", "PENDING", "UNDER_REVIEW", "VERIFIED"][i % 4], recipientStatus: i % 4 === 0 ? "active" : null, recipientBlocked: i === 10 } : null,
    counts: { members: 1 + (i % 6), events: (i * 2) % 9, venueLocations: hasVenue ? 1 + (i % 2) : 0, venueProducts: hasVenue ? 20 + i * 4 : 0, venueTabs: hasVenue ? 110 + i * 31 : 0, venueReservations: hasVenue ? 14 + i * 3 : 0, activeCapabilities: hasVenue ? 7 : 3 },
  };
});

const findWorkspace = (id: number) => workspaces.find((w) => w.id === id);

function ownerOf(ws: MockWorkspace) {
  const u = findUser(ws.ownerId);
  return u ? { id: u.id, nome: u.nome, sobrenome: u.sobrenome, email: u.email, telefone: u.telefone } : null;
}

function workspaceDetail(ws: MockWorkspace) {
  const owner = ownerOf(ws);
  const members = [
    ...(owner ? [{ id: ws.id * 10, userId: owner.id, nome: `${owner.nome} ${owner.sobrenome}`, email: owner.email, role: "OWNER", status: "ACTIVE" }] : []),
    ...Array.from({ length: Math.max(0, ws.counts.members - 1) }, (_, i) => {
      const u = users[(ws.id + i * 3) % users.length];
      return { id: ws.id * 10 + i + 1, userId: u.id, nome: `${u.nome} ${u.sobrenome}`, email: u.email, role: i === 0 ? "ADMIN" : "MEMBER", status: i === 2 ? "INVITED" : "ACTIVE" };
    }),
  ];
  return { ...ws, owner, members, taxas: { taxaServicoPercent: ws.taxaServicoPercent } };
}

function workspaceRows() {
  const wsRows = workspaces.map((ws) => {
    const owner = ownerOf(ws);
    return { kind: "workspace" as const, id: ws.id, nome: ws.nome, slug: ws.slug, tipo: ws.tipo, status: ws.status, etapa: ws.etapa, createdAt: ws.createdAt, owner: owner ? { id: owner.id, nome: owner.nome, sobrenome: owner.sobrenome, email: owner.email } : null, modules: ws.modules.filter((m) => m.ativo).map((m) => m.module), membersCount: ws.counts.members, eventsCount: ws.counts.events };
  });
  const leads = users.slice(40, 46).map((u, i) => ({ kind: "lead" as const, id: null, nome: null, slug: null, tipo: null, status: null, etapa: i % 2 === 0 ? "IDENTIFICACAO" : "CONTA_NAO_CONFIRMADA", createdAt: ago(1 + i), owner: { id: u.id, nome: u.nome, sobrenome: u.sobrenome, email: u.email }, modules: [] as string[], membersCount: 0, eventsCount: 0 }));
  return [...leads.slice(0, 2), ...wsRows, ...leads.slice(2)];
}

/* ---------- ingressos ---------- */

const tickets = Array.from({ length: 64 }, (_, i) => {
  const owner = users[(i * 7) % users.length];
  const ev = MOCK_EVENTS[i % MOCK_EVENTS.length];
  return { id: 80000 + i, code: `NK-${String(2400 + i * 53).slice(-4)}${String.fromCharCode(65 + (i % 26))}`, status: [1, 1, 1, 2, 1, 3, 4][i % 7], bloqueado: i % 11 === 5, bloqueadoMotivo: i % 11 === 5 ? "Suspeita de duplicidade" : null, createdAt: ago(i * 0.6, i % 24), dono: { id: owner.id, nome: owner.nome, sobrenome: owner.sobrenome, email: owner.email }, evento: { id: Number(ev.id), nome: ev.nome, data: ev.data } };
});

/* ---------- solicitações / jurídico ---------- */

const solicitacoes = users.filter((u) => u.role === "COMUM").slice(3, 11).map((u, i) => ({ id: String(600 + i), user: { cpf: u.cpf ?? "", email: u.email, nome: `${u.nome} ${u.sobrenome}` } }));

const pendingProfiles = workspaces
  .filter((ws) => ws.legalFinancial && ws.legalFinancial.verificationStatus !== "VERIFIED")
  .map((ws, i) => {
    const owner = ownerOf(ws);
    return { organizationId: ws.id, legalType: ws.tipo === "PJ" ? ("COMPANY" as const) : ("INDIVIDUAL" as const), legalName: ws.tipo === "PJ" ? `${ws.nome} Entretenimento Ltda.` : `${owner?.nome ?? "Produtor"} ${owner?.sobrenome ?? ""}`.trim(), tradeName: ws.tipo === "PJ" ? ws.nome : null, documentLast4: (ws.documento ?? "0000").replace(/\D/g, "").slice(-4), verificationStatus: ws.legalFinancial!.verificationStatus, createdAt: ago(2 + i * 3), organization: { nome: ws.nome }, representative: { nome: owner?.nome ?? "Produtor", sobrenome: owner?.sobrenome ?? null, email: owner?.email ?? "produtor@exemplo.com" } };
  });

/* ---------- auditoria global ---------- */

const auditLogs = Array.from({ length: 73 }, (_, i) => ({ id: 95000 + i, entityType: ["USER", "USER_TICKET", "ORGANIZATION", "EVENT"][i % 4], entityId: [users[i % users.length].id, tickets[i % tickets.length].id, workspaces[i % workspaces.length].id, Number(MOCK_EVENTS[i % MOCK_EVENTS.length].id)][i % 4], action: AUDIT_ACTIONS[i % AUDIT_ACTIONS.length], admin: { id: 1 + (i % 3), nome: ["Vitor", "Admin", "Suporte"][i % 3], email: STAFF_EMAILS[i % 3] }, metadata: i % 3 === 0 ? { motivo: "Solicitação do produtor via suporte" } : null, createdAt: ago(i * 0.4, i % 12) }));

/* ---------- gateway / adquirentes ---------- */

let gatewayConfig = { id: 1, name: "Pagar.me", pixRateBps: 109, pixFixedCents: 0, cardRateBps: [299, 349, 399, 449, 499, 549, 599, 649, 699, 749, 799, 849], cardFixedCents: 99, maxInstallments: 12, accept3dsAttempt: false, withdrawalFixedCents: 367, anticipationRateBps: 289, settlementDays: 15, updatedAt: ago(12) };
let cielo = { provider: "CIELO", clientId: "nokta-pos-7f3a9c", configured: true, updatedAt: ago(40) };

/* ---------- Nokta Protect ---------- */

function investigation(ticketId: number) {
  const t = tickets.find((x) => x.id === ticketId) ?? tickets[0];
  const owner = findUser(t.dono.id) ?? users[0];
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const used = t.status === 2;
  const risky = t.bloqueado || owner.falhasRecentes > 0;
  const score = used ? 92 : risky ? 38 : 71;
  return {
    ingresso: { id: t.id, codigo: t.code, status: used ? 1 : t.status, statusNome: used ? "Ativo" : t.status === 3 ? "Revendido" : t.status === 4 ? "Cancelado" : "Ativo", bloqueado: t.bloqueado, bloqueadoMotivo: t.bloqueadoMotivo, resaleAddCount: t.status === 3 ? 1 : 0, criadoEm: fmt(t.createdAt) },
    evento: { id: t.evento.id, nome: t.evento.nome, data: new Date(t.evento.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }), endereco: "Av. Francisco Matarazzo, 400 — Barra Funda, São Paulo/SP" },
    lote: { id: 12, nome: "2º lote · Pista", valor: "R$ 90,00", tipo: 1, lote: 2 },
    comprador: { id: owner.id, nome: `${owner.nome} ${owner.sobrenome}`, email: owner.email, cpf: owner.cpf ?? "não informado", telefone: owner.telefone ?? "não informado", telefoneVerificado: owner.telefoneVerificado, contaAtiva: owner.ativo, contaCriadaEm: fmt(owner.createdAt), bloqueado: owner.bloqueado },
    pedido: { id: 51000 + t.id, codigo: `PED-${String(t.id).slice(-5)}`, status: 2, statusNome: "Pago", valorTotal: "R$ 99,00", quantidade: 1, pagoEm: fmt(t.createdAt), criadoEm: fmt(t.createdAt), itens: 1, transacoes: 1, chargebacks: risky ? 1 : 0 },
    transferencias: t.status === 4 ? [{ id: 1, de: { id: owner.id, nome: `${owner.nome} ${owner.sobrenome}`, email: owner.email }, para: { id: users[3].id, nome: `${users[3].nome} ${users[3].sobrenome}`, email: users[3].email }, data: fmt(ago(3)) }] : [],
    revendas: t.status === 3 ? [{ id: 1, vendedor: { id: owner.id, nome: `${owner.nome} ${owner.sobrenome}`, email: owner.email }, comprador: null, precoOriginal: "R$ 90,00", precoRevenda: "R$ 90,00", status: 1, criadaEm: fmt(ago(2)), vendidaEm: "" }] : [],
    historicoComprador: { pedidosPagos: owner.qtdCompras, totalIngressos: owner.qtdIngressos, transferenciasRealizadas: 1, revendasRealizadas: t.status === 3 ? 1 : 0, chargebacks: risky ? 1 : 0, eventosComparecidos: Math.max(0, owner.qtdIngressos - 2) },
    indicadores: risky ? [{ tipo: "CHARGEBACK_PREVIO", severidade: "alto" as const, descricao: "Comprador já teve chargeback em outro pedido", valor: 1 }, { tipo: "LOGIN_FALHAS", severidade: "medio" as const, descricao: "Falhas de login recentes na conta", valor: owner.falhasRecentes }] : [],
    score: { total: score, maximo: 100, nivel: score >= 90 ? ("muito_forte" as const) : score >= 70 ? ("forte" as const) : score >= 50 ? ("moderado" as const) : ("fraco" as const), itens: [{ evidencia: "3DS autenticado", pontos: 20, ativo: true }, { evidencia: "Telefone verificado", pontos: 15, ativo: owner.telefoneVerificado }, { evidencia: "QR entregue no WhatsApp", pontos: 20, ativo: true }, { evidencia: "Check-in realizado", pontos: 30, ativo: used }, { evidencia: "Termos aceitos", pontos: 15, ativo: true }] },
    veredito: { tipo: score >= 70 ? ("defesa_recomendada" as const) : score >= 50 ? ("analisar_manualmente" as const) : ("alto_risco" as const), motivos: used ? ["Ingresso validado na portaria com fingerprint do dispositivo do comprador", "Pagamento autenticado via 3DS"] : risky ? ["Comprador com chargeback anterior", "Ingresso não utilizado"] : ["Pagamento autenticado via 3DS", "QR entregue e visualizado pelo comprador"] },
    evidenciasFavoraveis: [{ descricao: "Pagamento autenticado com 3DS", presente: true }, { descricao: "Telefone verificado por código", presente: owner.telefoneVerificado }, { descricao: "QR enviado por WhatsApp e entregue", presente: true }, { descricao: "QR visualizado pelo comprador", presente: !risky }, { descricao: "Check-in na portaria", presente: used }, { descricao: "Aceite dos termos registrado", presente: true }],
    timeline: [{ data: fmt(t.createdAt), tipo: "PEDIDO_CRIADO", descricao: "Pedido criado no checkout", ator: owner.email, ip: "187.45.12.9", fingerprint: "fp_8c1d" }, { data: fmt(t.createdAt), tipo: "PAGAMENTO_PAGO", descricao: "Pagamento aprovado (cartão, 3DS Y)", ator: "Pagar.me", ip: null, fingerprint: null }, { data: fmt(ago(1)), tipo: "QR_ENVIADO", descricao: "QR enviado por WhatsApp", ator: "sistema", ip: null, fingerprint: null }, ...(used ? [{ data: fmt(ago(0, 5)), tipo: "INGRESSO_VALIDADO", descricao: "Check-in realizado na portaria", ator: "operador #12", ip: "177.10.3.44", fingerprint: "fp_8c1d" }] : [])],
    checkin: used ? { utilizado: true, dataHora: fmt(ago(0, 5)), operadorId: 12, ip: "177.10.3.44", fingerprint: "fp_8c1d", tentativasAntes: 0 } : { utilizado: false, dataHora: null, operadorId: null, ip: null, fingerprint: null, tentativasAntes: 0 },
    auditoria: { totalRegistros: used ? 9 : 6, integridadeVerificada: true, cadeiaQuebrada: null },
    eventosSeguranca: owner.falhasRecentes > 0 ? [{ tipo: "LOGIN_FALHA", ip: "45.33.1.2", fingerprint: null, data: fmt(ago(2)) }] : [],
    contextoCheckout: { ip: "187.45.12.9", fingerprint: "fp_8c1d", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1", buyerPhoneVerified: owner.telefoneVerificado, buyerAccountActive: owner.ativo, buyerAccountAgeDays: Math.round((Date.now() - new Date(owner.createdAt).getTime()) / DAY) },
    gateway: { gatewayId: `ch_${String(t.id)}x9k`, threedsStatus: "Y", antifraudeStatus: "approved" },
    termosAceitos: { versao: "2026-02", aceiteEm: fmt(t.createdAt) },
    webhooks: [{ eventType: "charge.paid", signatureValid: true, processedOk: true, data: fmt(t.createdAt) }, { eventType: "order.paid", signatureValid: true, processedOk: true, data: fmt(t.createdAt) }],
    comunicacoes: [{ canal: "email", tipo: "Confirmação de compra", destinatario: owner.email, status: "entregue", data: fmt(t.createdAt) }, { canal: "whatsapp", tipo: "QR do ingresso", destinatario: owner.telefone ?? "sem telefone", status: "entregue", data: fmt(ago(1)) }],
    acessosIngresso: { totalAcessos: risky ? 0 : 4, qrViews: risky ? 0 : 2, ultimoAcesso: risky ? null : fmt(ago(0, 8)) },
  };
}

/* ---------- handlers ---------- */

export const adminHandlers: MockHandler[] = [
  // sessão de staff (qualquer e-mail/senha entra como ADMIN)
  { test: /\/auth\/admin\/login$/, method: "post", handle: ({ body }) => ({ data: { user: { userId: 99, id: 99, role: "ADMIN", nome: "Admin", email: String((body as { email?: string })?.email ?? STAFF_EMAILS[1]) } } }) },
  { test: /\/auth\/totp\/setup$/, method: "post", handle: () => ({ data: { otpauthUri: "otpauth://totp/Nokta%20Admin:admin@nokta.live?secret=JBSWY3DPEHPK3PXP&issuer=Nokta" } }) },
  { test: /\/auth\/totp\/verify-setup$/, method: "post", handle: () => ({ data: { backupCodes: ["7K2M-91QX", "B4ZP-0T6L", "QW8N-3HJD", "M2CV-77RA", "X9LD-5PKE", "T1AF-62NU", "H8RB-4GZC", "P3WY-19SM"] } }) },

  // dashboard
  { test: /\/admin\/dashboard$/, handle: () => ({ data: { users: 12480, events: 1312, ticketsSold: 88245, totalRevenue: 6184320.5 } }) },
  {
    test: /\/admin\/dashboard\/eventos-mensais$/,
    handle: () => {
      const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
      const now = new Date();
      const out: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()].charAt(0).toUpperCase() + months[d.getMonth()].slice(1);
        out[label] = [42, 55, 61, 48, 73, 90][5 - i];
      }
      return { data: { months: out } };
    },
  },

  // usuários
  {
    test: /\/admin\/usuarios$/,
    method: "get",
    handle: ({ params }) => {
      const q = (params.nameOrEmail ?? "").toLowerCase();
      const type = params.type;
      let items = users;
      if (type === "2") items = items.filter((u) => u.role === "COMUM");
      if (type === "3") items = items.filter((u) => u.role === "PRODUTOR");
      if (q) items = items.filter((u) => `${u.nome} ${u.sobrenome} ${u.email}`.toLowerCase().includes(q));
      return { data: paginate(items.map(publicUser), params, 20) };
    },
  },
  { test: /\/admin\/usuarios\/\d+\/pedidos$/, handle: ({ url, params }) => { const u = findUser(idOf(url, 2)); return u ? { data: paginate(userOrders(u), params, 10) } : notFound("Usuário não encontrado"); } },
  { test: /\/admin\/usuarios\/\d+\/ingressos$/, handle: ({ url, params }) => { const u = findUser(idOf(url, 2)); return u ? { data: paginate(userTickets(u), params, 10) } : notFound("Usuário não encontrado"); } },
  { test: /\/admin\/usuarios\/\d+\/auditoria$/, handle: ({ url, params }) => { const u = findUser(idOf(url, 2)); return u ? { data: paginate(userAudit(u), params, 10) } : notFound("Usuário não encontrado"); } },
  { test: /\/admin\/usuarios\/\d+\/seguranca$/, handle: ({ url }) => { const u = findUser(idOf(url, 2)); return u ? { data: { emailVerificado: u.emailVerificado, telefoneVerificado: u.telefoneVerificado, bloqueado: u.bloqueado, bloqueadoMotivo: u.bloqueadoMotivo, totpEnabled: u.totpEnabled, ultimoIp: u.ultimoIp, falhasRecentes: u.falhasRecentes } } : notFound("Usuário não encontrado"); } },
  { test: /\/admin\/usuarios\/\d+\/bloqueio$/, method: "patch", handle: ({ url, body }) => { const u = findUser(idOf(url, 2)); if (!u) return notFound("Usuário não encontrado"); const b = body as { bloqueado: boolean; motivo?: string }; u.bloqueado = b.bloqueado; u.bloqueadoMotivo = b.bloqueado ? (b.motivo ?? null) : null; return { data: publicUser(u) }; } },
  { test: /\/admin\/usuarios\/\d+\/status$/, method: "patch", handle: ({ url, body }) => { const u = findUser(idOf(url, 2)); if (!u) return notFound("Usuário não encontrado"); u.ativo = Boolean((body as { ativo: boolean }).ativo); return { data: publicUser(u) }; } },
  { test: /\/admin\/usuarios\/\d+\/invalidar-sessoes$/, method: "post", handle: () => ({ data: { ok: true, revoked: 2 } }) },
  { test: /\/admin\/usuarios\/\d+\/completo$/, method: "delete", handle: ({ url }) => { const i = users.findIndex((u) => u.id === idOf(url, 2)); if (i < 0) return notFound("Usuário não encontrado"); users.splice(i, 1); return { data: { ok: true } }; } },
  { test: /\/admin\/usuarios\/\d+$/, method: "get", handle: ({ url }) => { const u = findUser(idOf(url)); return u ? { data: publicUser(u) } : notFound("Usuário não encontrado"); } },
  { test: /\/admin\/usuarios\/\d+$/, method: "put", handle: ({ url, body }) => { const u = findUser(idOf(url)); if (!u) return notFound("Usuário não encontrado"); Object.assign(u, body as Partial<MockUser>); return { data: publicUser(u) }; } },

  // equipe
  { test: /\/admin\/equipe$/, method: "get", handle: () => ({ data: { canManage: true, rootEmail: STAFF_EMAILS[0], data: staff } }) },
  { test: /\/admin\/equipe$/, method: "post", handle: ({ body }) => { const b = body as { nome: string; sobrenome?: string; email: string; role: number }; staff.push({ id: 10 + staff.length, nome: b.nome, sobrenome: b.sobrenome ?? "", email: b.email, role: ROLE_BY_ID[b.role] ?? "ADMIN", roleId: b.role, bloqueado: false, isRoot: false, createdAt: new Date().toISOString() }); return { data: { ok: true } }; } },
  { test: /\/admin\/equipe\/\d+$/, method: "patch", handle: ({ url, body }) => { const m = staff.find((s) => s.id === idOf(url)); if (!m) return notFound(); const b = body as { role?: number }; if (b.role) { m.roleId = b.role; m.role = ROLE_BY_ID[b.role] ?? m.role; } return { data: { ok: true } }; } },
  { test: /\/admin\/equipe\/\d+$/, method: "delete", handle: ({ url }) => { const m = staff.find((s) => s.id === idOf(url)); if (!m) return notFound(); m.bloqueado = true; return { data: { ok: true } }; } },

  // contas excluídas
  {
    test: /\/admin\/contas-excluidas$/,
    handle: ({ params }) => {
      const q = (params.search ?? "").toLowerCase();
      const rows = Array.from({ length: 7 }, (_, i) => ({ id: 400 + i, userId: 2000 + i, email: `excluida${i}@exemplo.com`, nome: ["Marcos Teixeira", "Paula Dias", "Renato Gomes", "", "Bianca Rocha", "Caio Martins", "Letícia Prado"][i], telefone: i % 3 === 0 ? null : `+55119${String(81000000 + i * 1111).slice(0, 8)}`, accountCreatedAt: ago(300 + i * 20), deletedByEmail: STAFF_EMAILS[i % 2], deletedAt: ago(i * 6, i), summary: { pedidos: i * 2, ingressos: i * 3, ingressosUtilizados: i, organizacoes: i % 3 === 0 ? 1 : 0, eventos: i % 3 === 0 ? 2 : 0 } }));
      return { data: paginate(q ? rows.filter((r) => `${r.nome} ${r.email} ${r.telefone ?? ""}`.toLowerCase().includes(q)) : rows, params, 20) };
    },
  },
  {
    test: /\/admin\/contas-excluidas\/\d+$/,
    handle: ({ url }) => {
      const id = idOf(url);
      const ev = MOCK_EVENTS[0];
      return {
        data: {
          id,
          userId: 2000 + (id - 400),
          email: `excluida${id - 400}@exemplo.com`,
          nome: "Marcos Teixeira",
          deletedByEmail: STAFF_EMAILS[0],
          deletedAt: ago(3),
          summary: { pedidos: 2, ingressos: 3, apagados: { orders: 2, user_tickets: 3, sessions: 5, audit_logs: 4 } },
          snapshot: {
            conta: { nome: "Marcos", sobrenome: "Teixeira", email: `excluida${id - 400}@exemplo.com`, telefone: "+5511981000000", telefoneVerificado: true, cpf: "123.456.789-09", cnpj: null, dataNascimento: "1991-05-12T00:00:00.000Z", role: { role: 2 }, ativo: true, bloqueado: false, createdAt: ago(320), enderecoLogradouro: "Rua Augusta", enderecoNumero: "1200", enderecoBairro: "Consolação", enderecoCidade: "São Paulo", enderecoUf: "SP", enderecoCep: "01304-001", chavePix: null, oauthProvider: "google" },
            pedidos: [{ code: "PED-77120", items: [{ quantity: 2, ticket: { nome: "Pista", event: { nome: ev.nome } } }], totalValue: 198, paymentMethod: "credit_card", installments: 2, status: 2, createdAt: ago(40), paidAt: ago(40), refunds: [] }, { code: "PED-77988", items: [{ quantity: 1, ticket: { nome: "Camarote", event: { nome: MOCK_EVENTS[2].nome } } }], totalValue: 320, paymentMethod: "pix", installments: 1, status: 3, createdAt: ago(20), paidAt: null, refunds: [{ sentAmountCents: 32000, requestedAmountCents: 32000, status: "sent" }] }],
            ingressos: [{ id: 1, code: "NK-7712A", status: 2, bloqueado: false, createdAt: ago(40), ticket: { nome: "Pista", valor: 90, event: { nome: ev.nome, data: ev.data } }, order: { code: "PED-77120" }, compradoPelaConta: true }, { id: 2, code: "NK-7712B", status: 4, bloqueado: false, createdAt: ago(40), ticket: { nome: "Pista", valor: 90, event: { nome: ev.nome, data: ev.data } }, order: { code: "PED-77120" }, compradoPelaConta: true }, { id: 3, code: "NK-8801C", status: 1, bloqueado: true, createdAt: ago(10), ticket: { nome: "Camarote", valor: 320, event: { nome: MOCK_EVENTS[2].nome, data: MOCK_EVENTS[2].data } }, order: { code: "PED-77988" }, compradoPelaConta: false }],
            historicoIngressos: [{ createdAt: ago(39), ticketId: 1, eventType: "QR_VIEWED", ip: "187.45.12.9" }, { createdAt: ago(38), ticketId: 1, eventType: "CHECKIN", ip: "177.10.3.44" }],
            transferencias: [{ createdAt: ago(35), userTicketId: 2, fromEmail: `excluida${id - 400}@exemplo.com`, toEmail: users[5].email }],
            revendas: [],
            organizacoes: [{ id: 9, nome: "Marcos Produções", slug: "marcos-producoes", createdAt: ago(200), _count: { members: 2 }, eventos: [{ nome: "Festa de Lançamento", data: ago(100), status: 4 }, { nome: "Sunset de Verão", data: ago(-20), status: 1 }] }],
            participacoes: [{ organization: { nome: "Galpão 21" }, role: "MEMBER", status: "ACTIVE", createdAt: ago(150) }],
            auditoria: [{ createdAt: ago(60), action: "USER_DADOS_ALTERADOS", metadata: { alteracoes: { telefone: { de: "+5511980000000", para: "+5511981000000" } } }, autor: { propriaConta: true } }, { createdAt: ago(3), action: "USER_EXCLUIDO_COMPLETO", metadata: null, autor: { email: STAFF_EMAILS[0] } }],
            sessoes: [{ createdAt: ago(5), revokedAt: ago(3), revokedReason: "account_deleted", ip: "187.45.12.9", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1" }],
            seguranca: [{ createdAt: ago(8), type: "LOGIN_OK", ip: "187.45.12.9" }],
            comunicacoes: [{ createdAt: ago(40), channel: "email", type: "purchase_confirmation", recipient: `excluida${id - 400}@exemplo.com`, status: "delivered" }, { createdAt: ago(39), channel: "whatsapp", type: "ticket_qr", recipient: "+5511981000000", status: "delivered" }],
          },
        },
      };
    },
  },

  // workspaces
  {
    test: /\/admin\/workspaces$/,
    handle: ({ params }) => {
      const q = (params.search ?? "").toLowerCase();
      const etapa = params.etapa;
      let rows = workspaceRows();
      if (etapa === "SEM_WORKSPACE") rows = rows.filter((r) => r.kind === "lead");
      if (etapa === "EM_ANDAMENTO") rows = rows.filter((r) => r.kind === "workspace" && r.etapa !== "CONCLUIDO");
      if (etapa === "CONCLUIDO") rows = rows.filter((r) => r.etapa === "CONCLUIDO");
      if (etapa === "BLOQUEADO") rows = rows.filter((r) => r.status === "SUSPENDED");
      if (q) rows = rows.filter((r) => `${r.nome ?? ""} ${r.slug ?? ""} ${r.owner?.email ?? ""} ${r.owner?.nome ?? ""}`.toLowerCase().includes(q));
      return { data: paginate(rows, params, 20) };
    },
  },
  { test: /\/admin\/workspaces\/\d+\/bloqueio$/, method: "patch", handle: ({ url, body }) => { const ws = findWorkspace(idOf(url, 2)); if (!ws) return notFound("Workspace não encontrado"); const b = body as { bloqueado: boolean; motivo?: string }; ws.bloqueado = b.bloqueado; ws.status = b.bloqueado ? "SUSPENDED" : "ACTIVE"; ws.bloqueadoEm = b.bloqueado ? new Date().toISOString() : null; ws.bloqueadoMotivo = b.bloqueado ? (b.motivo ?? null) : null; return { data: workspaceDetail(ws) }; } },
  { test: /\/admin\/workspaces\/\d+\/modulos$/, method: "patch", handle: ({ url, body }) => { const ws = findWorkspace(idOf(url, 2)); if (!ws) return notFound("Workspace não encontrado"); const b = body as { module: string; ativo: boolean }; const m = ws.modules.find((x) => x.module === b.module); if (m) m.ativo = b.ativo; return { data: workspaceDetail(ws) }; } },
  { test: /\/admin\/workspaces\/\d+\/taxas$/, method: "patch", handle: ({ url, body }) => { const ws = findWorkspace(idOf(url, 2)); if (!ws) return notFound("Workspace não encontrado"); ws.taxaServicoPercent = Number((body as { taxaServicoPercent: number }).taxaServicoPercent); return { data: workspaceDetail(ws) }; } },
  { test: /\/admin\/workspaces\/\d+$/, method: "get", handle: ({ url }) => { const ws = findWorkspace(idOf(url)); return ws ? { data: workspaceDetail(ws) } : notFound("Workspace não encontrado"); } },
  { test: /\/admin\/workspaces\/\d+$/, method: "put", handle: ({ url, body }) => { const ws = findWorkspace(idOf(url)); if (!ws) return notFound("Workspace não encontrado"); Object.assign(ws, body as Partial<MockWorkspace>); return { data: workspaceDetail(ws) }; } },
  { test: /\/admin\/workspaces\/\d+$/, method: "delete", handle: ({ url }) => { const i = workspaces.findIndex((w) => w.id === idOf(url)); if (i < 0) return notFound("Workspace não encontrado"); workspaces.splice(i, 1); return { data: { ok: true } }; } },

  // ingressos
  {
    test: /\/admin\/ingressos$/,
    handle: ({ params }) => {
      const q = (params.search ?? "").toLowerCase();
      const items = q ? tickets.filter((t) => `${t.code} ${t.dono.email} ${t.evento.nome}`.toLowerCase().includes(q)) : tickets;
      return { data: paginate(items, params, 20) };
    },
  },
  { test: /\/admin\/ingressos\/\d+\/bloqueio$/, method: "patch", handle: ({ url, body }) => { const t = tickets.find((x) => x.id === idOf(url, 2)); if (!t) return notFound("Ingresso não encontrado"); t.bloqueado = Boolean((body as { bloqueado: boolean }).bloqueado); return { data: t }; } },
  { test: /\/admin\/ingressos\/\d+\/transferir$/, method: "post", handle: ({ url, body }) => { const t = tickets.find((x) => x.id === idOf(url, 2)); if (!t) return notFound("Ingresso não encontrado"); const target = users.find((u) => u.email === (body as { toEmail: string }).toEmail); if (!target) return { status: 404, data: { message: "Nenhuma conta ativa com esse e-mail." } }; t.dono = { id: target.id, nome: target.nome, sobrenome: target.sobrenome, email: target.email }; t.status = 4; return { data: t }; } },

  // eventos (capturados antes pelo public.ts — ver nota no topo)
  {
    test: /\/admin\/eventos$/,
    method: "get",
    handle: ({ params }) => {
      let items = MOCK_EVENTS;
      if (params.status === "1") items = items.filter((e) => e.ativo);
      if (params.status === "0") items = items.filter((e) => !e.ativo);
      if (params.destaque === "true") items = items.filter((e) => e.destaque);
      const q = (params.nameOrStreet ?? "").toLowerCase();
      if (q) items = items.filter((e) => `${e.nome} ${e.local} ${e.endereco.logradouro}`.toLowerCase().includes(q));
      return { data: paginate(items, params, 12) };
    },
  },
  { test: /\/admin\/eventos\/\d+$/, method: "put", handle: ({ url, body }) => { const ev = MOCK_EVENTS.find((e) => e.id === lastSegment(url)); if (!ev) return notFound("Evento não encontrado"); ev.destaque = Boolean((body as { destaque: boolean }).destaque); return { data: ev }; } },

  // pedidos de produtor
  { test: /\/admin\/solicitacoes$/, method: "get", handle: ({ params }) => { const q = (params.nameOrEmail ?? "").toLowerCase(); const items = q ? solicitacoes.filter((s) => `${s.user.nome} ${s.user.email}`.toLowerCase().includes(q)) : solicitacoes; return { data: paginate(items, params, 10) }; } },
  { test: /\/admin\/solicitacoes\/\d+$/, method: "put", handle: ({ url }) => { const i = solicitacoes.findIndex((s) => s.id === lastSegment(url)); if (i < 0) return notFound("Solicitação não encontrada"); solicitacoes.splice(i, 1); return { data: { ok: true } }; } },

  // jurídico-financeiro
  { test: /\/admin\/legal-financial-profiles\/pending$/, handle: () => ({ data: pendingProfiles }) },
  { test: /\/admin\/legal-financial-profiles\/\d+\/approve$/, method: "post", handle: ({ url }) => { const id = idOf(url, 2); const i = pendingProfiles.findIndex((p) => p.organizationId === id); if (i >= 0) pendingProfiles.splice(i, 1); const ws = findWorkspace(id); if (ws?.legalFinancial) ws.legalFinancial.verificationStatus = "VERIFIED"; return { data: { recipient: { attempted: true, created: id % 2 === 0, error: id % 2 === 0 ? null : "conta bancária pendente" } } }; } },
  { test: /\/admin\/legal-financial-profiles\/\d+\/reject$/, method: "post", handle: ({ url }) => { const id = idOf(url, 2); const i = pendingProfiles.findIndex((p) => p.organizationId === id); if (i >= 0) pendingProfiles.splice(i, 1); const ws = findWorkspace(id); if (ws?.legalFinancial) ws.legalFinancial.verificationStatus = "REJECTED"; return { data: { ok: true } }; } },
  { test: /\/admin\/organizations\/\d+\/recipient-overview$/, handle: ({ url }) => { const ws = findWorkspace(idOf(url, 2)); if (!ws) return notFound("Organização não encontrada"); return { data: { organizationId: ws.id, organizationName: ws.nome, hasRecipient: Boolean(ws.legalFinancial?.recipientStatus), recipientStatus: ws.legalFinancial?.recipientStatus ?? null, recipientBlocked: ws.legalFinancial?.recipientBlocked ?? false, recipientBlockedAt: ws.legalFinancial?.recipientBlocked ? ago(2) : null, recipientBlockedReason: ws.legalFinancial?.recipientBlocked ? "Chargeback rate acima do limite" : null } }; } },
  { test: /\/admin\/organizations\/\d+\/recipient-block$/, method: "patch", handle: ({ url, body }) => { const ws = findWorkspace(idOf(url, 2)); if (!ws?.legalFinancial) return notFound("Organização não encontrada"); ws.legalFinancial.recipientBlocked = Boolean((body as { blocked: boolean }).blocked); return { data: { ok: true } }; } },
  { test: /\/auth\/step-up\/challenge$/, method: "post", handle: () => ({ data: { grantId: "grant_mock", expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), method: "TOTP" } }) },
  { test: /\/auth\/step-up\/verify$/, method: "post", handle: () => ({ data: { stepUpToken: "stepup_mock_token", expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() } }) },

  // auditoria
  { test: /\/admin\/auditoria$/, handle: ({ params }) => ({ data: paginate(auditLogs, params, 20) }) },

  // taxas do gateway
  { test: /\/admin\/taxas-gateway$/, method: "get", handle: () => ({ data: { config: gatewayConfig } }) },
  { test: /\/admin\/taxas-gateway$/, method: "put", handle: ({ body }) => { gatewayConfig = { ...gatewayConfig, ...(body as Partial<typeof gatewayConfig>), updatedAt: new Date().toISOString() }; return { data: { config: gatewayConfig } }; } },

  // adquirentes
  { test: /\/admin\/payment-acquirers\/[A-Z]+$/, method: "get", handle: ({ url }) => (lastSegment(url) === "CIELO" ? { data: cielo } : { data: { provider: lastSegment(url), configured: false } }) },
  { test: /\/admin\/payment-acquirers\/[A-Z]+$/, method: "patch", handle: ({ body }) => { cielo = { ...cielo, clientId: String((body as { clientId: string }).clientId), configured: true, updatedAt: new Date().toISOString() }; return { data: cielo }; } },

  // Nokta Protect
  {
    test: /\/admin\/evidencias\/investigar$/,
    handle: ({ params }) => {
      const q = (params.q ?? "").toLowerCase();
      const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
      const hits = tickets.filter((t) => `${t.code} ${t.dono.nome} ${t.dono.sobrenome} ${t.dono.email} ${t.evento.nome}`.toLowerCase().includes(q)).slice(0, 12);
      return { data: hits.map((t) => ({ id: t.id, code: t.code, status: t.status, evento: t.evento.nome, comprador: `${t.dono.nome} ${t.dono.sobrenome}`, dataCompra: fmt(t.createdAt) })) };
    },
  },
  { test: /\/admin\/evidencias\/ingresso\/\d+$/, handle: ({ url }) => ({ data: investigation(idOf(url)) }) },
  {
    test: /\/admin\/evidencias\/dossie\/\d+$/,
    handle: ({ url }) => {
      const text = `Dossiê Nokta Protect — ingresso #${idOf(url)} (mock)`;
      return { data: typeof Blob !== "undefined" ? new Blob([text], { type: "application/pdf" }) : text };
    },
  },
];
