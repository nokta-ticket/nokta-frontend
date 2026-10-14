import { MOCK_EVENTS, MOCK_RESALES, mockEventDetails } from "../fixtures";
import { notFound, paginate, unauthorized, type MockHandler } from "./types";

/**
 * Sessão e área do comprador (frente C edita aqui).
 *
 * Sessão fictícia: o AuthContext grava o cookie `user` no signIn (igual à
 * produção); aqui "estar logado" = esse cookie existir. Qualquer e-mail e
 * senha entram. Pra testar como comprador comum, use um e-mail que contenha
 * "comprador" (role COMUM); senão a sessão é de produtor. No login admin, um
 * e-mail com "2fa" cai na etapa TOTP (qualquer código de 6 dígitos passa).
 */
export function hasMockSession(): boolean {
  return typeof document !== "undefined" && /(^|;\s*)user=/.test(document.cookie);
}

type MockRole = "COMUM" | "PRODUTOR" | "ADMIN" | "SUPER_ADMIN" | "SUPPORT";
const STAFF_ROLES: MockRole[] = ["ADMIN", "SUPER_ADMIN", "SUPPORT"];

function mockRole(): MockRole {
  if (typeof document === "undefined") return "COMUM";
  const raw = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("user="));
  try {
    const parsed = JSON.parse(decodeURIComponent(raw?.slice(5) ?? "{}"));
    if (parsed.role === "PRODUTOR" || STAFF_ROLES.includes(parsed.role)) return parsed.role;
    return "COMUM";
  } catch {
    return "COMUM";
  }
}

let mockFotoPerfil: string | null = null;

export function mockUser() {
  const role = mockRole();
  if (STAFF_ROLES.includes(role)) {
    // Staff do admin: o AuthContext só usa nome/sobrenome/e-mail pra esses papéis.
    return { id: 99, nome: "Admin", sobrenome: "Nokta", email: "admin@nokta.live", role, nivelProdutor: null, sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() };
  }
  return {
    id: 1,
    nome: "Vitor",
    sobrenome: "Reis",
    email: role === "PRODUTOR" ? "vitor@nokta.live" : "comprador@exemplo.com",
    role,
    nivelProdutor: role === "PRODUTOR" ? 2 : null,
    cpf: "12345678909",
    cnpj: null,
    telefone: "+5511999999999",
    telefoneVerificado: true,
    nomeArtistico: role === "PRODUTOR" ? "Nokta Eventos" : null,
    tipoPessoa: "PF",
    chavePix: null,
    fotoPerfil: mockFotoPerfil,
    createdAt: "2025-03-12T14:20:00.000Z",
    endereco: { cep: "01311-927", logradouro: "Av. Paulista", numero: "1471", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", complemento: "Conj. 1110" },
    sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

const loginUser = (email: string, role: string = email.includes("comprador") ? "COMUM" : "PRODUTOR") => ({ id: 1, userId: 1, role, nivelProdutor: role === "PRODUTOR" ? 2 : null, nome: "Vitor", email });

export const MOCK_ORGANIZATION = { id: 1, nome: "Nokta Eventos", tipo: "PRODUTOR", status: "ACTIVE", slug: "nokta-eventos", role: "OWNER", onboardingCompleted: true };

// ── Ingressos do comprador ────────────────────────────────────────────────
const DAY = 24 * 60 * 60 * 1000;
const isoDaysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString();

type TicketSeed = { id: number; eventId: number; status: 1 | 2 | 3 | 4; lote: number; nome: string; tipo: number; valor: number; boughtDaysAgo: number; pastDays?: number };

// 3 eventos das fixtures (2 futuros + 1 passado) com os 4 status possíveis.
const TICKET_SEEDS: TicketSeed[] = [
  { id: 1001, eventId: 101, status: 1, lote: 2, nome: "Pista — 2º lote", tipo: 1, valor: 80, boughtDaysAgo: 2 },
  { id: 1002, eventId: 101, status: 1, lote: 2, nome: "Pista — Meia-entrada", tipo: 2, valor: 40, boughtDaysAgo: 2 },
  { id: 1003, eventId: 101, status: 3, lote: 1, nome: "Camarote Open Bar", tipo: 1, valor: 220, boughtDaysAgo: 9 },
  { id: 1004, eventId: 102, status: 1, lote: 1, nome: "Pista — 1º lote", tipo: 1, valor: 60, boughtDaysAgo: 1 },
  { id: 1005, eventId: 108, status: 2, lote: 1, nome: "Pista — 1º lote", tipo: 1, valor: 60, boughtDaysAgo: 40, pastDays: 20 },
  { id: 1006, eventId: 108, status: 4, lote: 1, nome: "Pista — Meia-entrada", tipo: 2, valor: 30, boughtDaysAgo: 40, pastDays: 20 },
];

function ticketCode(id: number) {
  return `NKT-${String(id).padStart(4, "0")}-${(id * 7919).toString(36).toUpperCase().slice(0, 4)}`;
}

function eventDate(seed: TicketSeed, ev: (typeof MOCK_EVENTS)[number]) {
  return seed.pastDays ? isoDaysAgo(seed.pastDays).slice(0, 10) : ev.data;
}

function mockTicketListItem(seed: TicketSeed) {
  const ev = MOCK_EVENTS.find((e) => Number(e.id) === seed.eventId)!;
  return {
    id: seed.id,
    code: ticketCode(seed.id),
    status: seed.status,
    createdAt: isoDaysAgo(seed.boughtDaysAgo),
    event: { id: Number(ev.id), nome: ev.nome, data: eventDate(seed, ev), horario: ev.horario, thumbnail: ev.thumbnails[0]?.url ?? null, endereco: { localidade: ev.endereco.localidade, uf: ev.endereco.uf } },
    ticket: { id: seed.eventId * 10 + seed.lote, nome: seed.nome, tipo: seed.tipo, valor: seed.valor, lote: seed.lote },
  };
}

function mockTicketDetail(id: number) {
  const seed = TICKET_SEEDS.find((t) => t.id === id);
  if (!seed) return null;
  const ev = MOCK_EVENTS.find((e) => Number(e.id) === seed.eventId)!;
  const details = mockEventDetails(ev.id);
  const base = mockTicketListItem(seed);
  return {
    ...base,
    orderId: 5000 + seed.id,
    event: { id: Number(ev.id), slug: ev.slug, nome: ev.nome, descricao: details?.descricao ?? null, data: eventDate(seed, ev), horario: ev.horario, local: ev.local, thumbnails: [{ id: Number(ev.id), path: ev.thumbnails[0]?.url ?? "" }], endereco: ev.endereco },
  };
}

const MOCK_MY_RESALES = MOCK_RESALES.map((r, i) => ({
  id: r.id,
  resalePrice: r.buyerPrice,
  originalPrice: r.originalPrice,
  status: ([1, 2, 1, 3, 4] as const)[i % 5],
  expiresAt: r.expiresAt,
  evento: { nome: r.evento.nome, data: r.evento.data, endereco: { localidade: r.evento.endereco.localidade, uf: r.evento.endereco.uf }, thumbnail: r.evento.thumbnails[0]?.url ?? null },
  ingresso: { nome: r.ingresso.nome, lote: r.ingresso.lote },
}));

const requireSession = <T>(data: T) => (hasMockSession() ? { data } : unauthorized());
const lastSegment = (url: URL, offset = 1) => decodeURIComponent(url.pathname.split("/").at(-offset) ?? "");

export const accountHandlers: MockHandler[] = [
  // ── sessão ──
  {
    test: /\/auth\/login$/,
    method: "post",
    handle: ({ body }) => {
      const email = String((body as { email?: string })?.email ?? "");
      // "naoconfirmado" simula conta sem telefone confirmado → modal OTP.
      if (email.includes("naoconfirmado")) return { status: 403, data: { code: "ACCOUNT_NOT_CONFIRMED", message: "Conta ainda não confirmada. Enviamos um novo código pro seu WhatsApp.", phone: "+5511999999999" } };
      return { data: { user: loginUser(email) } };
    },
  },
  { test: /\/auth\/logout$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/auth\/me$/, method: "get", handle: () => (hasMockSession() ? { data: mockUser() } : unauthorized()) },
  { test: /\/auth\/me$/, method: "put", handle: () => ({ data: mockUser() }) },
  {
    test: /\/auth\/me\/foto$/,
    method: "patch",
    handle: () => {
      mockFotoPerfil = "/mock/posters/garden-party.svg";
      return { data: { fotoPerfil: mockFotoPerfil } };
    },
  },
  { test: /\/auth\/reauthenticate$/, method: "post", handle: () => ({ data: { sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() } }) },
  { test: /\/me\/organizations$/, handle: () => (hasMockSession() && mockRole() === "PRODUTOR" ? { data: [MOCK_ORGANIZATION] } : { data: [] }) },
  { test: /\/me\/promoter\/profile$/, handle: () => notFound("Sem perfil de promoter") },

  // ── cadastro / confirmação / senha ──
  {
    test: /\/auth\/register$/,
    method: "post",
    handle: ({ body }) => {
      const email = String((body as { email?: string })?.email ?? "");
      if (email.includes("existe")) return { status: 409, data: { code: "EMAIL_ALREADY_REGISTERED", message: "Este e-mail já tem uma conta." } };
      return { status: 201, data: { ok: true } };
    },
  },
  {
    test: /\/auth\/confirmar-telefone$/,
    method: "post",
    handle: ({ body }) => {
      const token = String((body as { token?: string })?.token ?? "");
      if (!/^\d{6}$/.test(token)) return { status: 400, data: { message: "Código inválido" } };
      return { data: { user: loginUser("comprador@exemplo.com") } };
    },
  },
  { test: /\/auth\/reenviar-confirmacao$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/auth\/forgot-password$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/auth\/validate-reset-password-request\/[^/]+$/, method: "get", handle: ({ url }) => (lastSegment(url) === "expirado" ? { status: 410, data: { message: "Este link expirou. Peça um novo." } } : { data: { valid: true } }) },
  { test: /\/auth\/reset-password\/[^/]+$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/auth\/vincular-oauth$/, method: "post", handle: () => ({ data: { user: loginUser("comprador@exemplo.com") } }) },

  // ── admin ──
  {
    test: /\/auth\/admin\/login$/,
    method: "post",
    handle: ({ body }) => {
      const email = String((body as { email?: string })?.email ?? "");
      if (email.includes("2fa")) return { data: { requires2fa: true, twoFactorToken: "mock-2fa-token" } };
      return { data: { user: loginUser(email, "ADMIN") } };
    },
  },
  {
    test: /\/auth\/totp\/verify$/,
    method: "post",
    handle: ({ body }) => {
      const code = String((body as { code?: string })?.code ?? "");
      if (code.length < 6) return { status: 400, data: { message: "Código inválido" } };
      return { data: { user: loginUser("admin@nokta.live", "ADMIN"), sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() } };
    },
  },

  // ── ingressos ──
  { test: /\/tickets\/\d+\/qr-view$/, method: "post", handle: () => requireSession({ ok: true }) },
  { test: /\/tickets\/\d+\/transferir$/, method: "post", handle: () => requireSession({ ok: true }) },
  {
    test: /\/tickets\/\d+$/,
    method: "get",
    handle: ({ url }) => {
      if (!hasMockSession()) return unauthorized();
      const detail = mockTicketDetail(Number(lastSegment(url)));
      return detail ? { data: detail } : notFound("Ingresso não encontrado");
    },
  },
  { test: /\/tickets$/, method: "get", handle: ({ params }) => requireSession(paginate(TICKET_SEEDS.map(mockTicketListItem), params, 50)) },

  // ── revenda do comprador ──
  { test: /\/revenda\/meus$/, method: "get", handle: ({ params }) => requireSession(paginate(MOCK_MY_RESALES, params, 10)) },
  {
    test: /\/revenda\/preview\/\d+$/,
    method: "get",
    handle: ({ url }) => {
      const id = Number(lastSegment(url));
      const seed = TICKET_SEEDS.find((t) => t.id === id);
      if (!seed) return notFound("Ingresso não encontrado");
      // Sunset Sessions (42% vendido, 5 dias): revenda ainda não liberada.
      if (seed.eventId === 102) return requireSession({ activated: false, reason: "PERCENT_NOT_REACHED", canAdd: true, sellerAmount: seed.valor, buyerPrice: seed.valor * 1.1 });
      return requireSession({ activated: true, reason: null, canAdd: seed.status !== 3, sellerAmount: seed.valor, buyerPrice: Math.round(seed.valor * 1.1 * 100) / 100 });
    },
  },

  // ── reembolso ──
  { test: /\/orders\/\d+\/refunds$/, method: "get", handle: () => requireSession([]) },
  {
    test: /\/orders\/\d+\/refunds$/,
    method: "post",
    handle: ({ url, body }) => {
      const orderId = Number(url.pathname.split("/").at(-2));
      const payload = body as { userTicketIds?: number[]; policy?: string };
      return requireSession({ id: 7001, orderId, policy: payload.policy ?? "BUYER_REGRET_7_DAYS", status: "PENDING", requestedAmountCents: 8000, sentAmountCents: null, createdAt: new Date().toISOString(), completedAt: null, items: (payload.userTicketIds ?? []).map((userTicketId) => ({ userTicketId, ticketFaceValueRefundedCents: 8000 })) });
    },
  },

  // ── convites ──
  { test: /\/organization-invitations\/[^/]+\/preview$/, method: "get", handle: ({ url }) => (lastSegment(url, 2) === "expirado" ? { status: 410, data: { message: "Este convite expirou." } } : { data: { organizationNome: "Nokta Eventos", email: "convidado@exemplo.com", roleKey: "MANAGER", roleLabel: "Gerente", expiresAt: new Date(Date.now() + 3 * DAY).toISOString() } }) },
  { test: /\/organization-invitations\/[^/]+\/accept$/, method: "post", handle: () => requireSession({ ok: true }) },
  { test: /\/promoter-invitations\/[^/]+\/preview$/, method: "get", handle: ({ url }) => (lastSegment(url, 2) === "expirado" ? { status: 410, data: { message: "Este convite expirou." } } : { data: { organizationNome: "Nokta Eventos", email: "promoter@exemplo.com", expiresAt: new Date(Date.now() + 3 * DAY).toISOString() } }) },
  { test: /\/promoter-invitations\/[^/]+\/accept$/, method: "post", handle: () => requireSession({ organizationId: 1, promoterProfileId: 42 }) },

  // ── descadastro CRM ──
  { test: /\/crm\/unsubscribe\/[^/]+$/, method: "get", handle: ({ url }) => (lastSegment(url) === "invalido" ? notFound("Token inválido") : { data: { organizationName: "Nokta Eventos", channel: lastSegment(url).includes("wa") ? "WHATSAPP" : "EMAIL", unsubscribed: lastSegment(url) === "ja-saiu" } }) },
  { test: /\/crm\/unsubscribe\/[^/]+$/, method: "post", handle: () => ({ data: { unsubscribed: true } }) },
];
