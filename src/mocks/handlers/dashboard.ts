import { notFound, type MockHandler, type MockResult } from "./types";

/**
 * Shell do painel, início, explorar, onboarding, equipe, configurações
 * (frente D edita aqui). Tudo escopado na organização fictícia id 1 ("Nokta
 * Eventos", ver account.ts). Estado mutável em memória: ativar capacidade,
 * convidar membro, salvar perfil etc. refletem na UI até o F5.
 *
 * Cookie de desenvolvimento `nokta_mock_venue=0` desliga o módulo Venue
 * (org só de Tickets → Início do produtor em vez da Início do bar). A rota
 * /api/dev/login?venue=0 grava esse cookie.
 */

const ORG_ID = 1;
const NOW = Date.now();
const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString();
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

function venueEnabled(): boolean {
  if (typeof document === "undefined") return true;
  if (/(^|;\s*)nokta_mock_venue=0(;|$)/.test(document.cookie)) return false;
  // Alternativa num cookie só (scripts/shot.mjs grava apenas um): `user={...,"mockVenue":false}`.
  const raw = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("user="));
  try {
    return JSON.parse(decodeURIComponent(raw?.slice(5) ?? "{}")).mockVenue !== false;
  } catch {
    return true;
  }
}

const idFrom = (url: URL, position: number) => Number(url.pathname.split("/").filter(Boolean).at(position));

// ── Catálogo de capacidades (espelha CAPABILITY_CATALOG do backend) ─────────

type Group = "CORE" | "EVENTS" | "RELATIONSHIP" | "OPERATION" | "PRODUCTS" | "MANAGEMENT";
type Need = "EVENTS_TICKETING" | "RELATIONSHIP" | "OPERATION" | "MENU_PRODUCTS" | "STOCK_PURCHASING" | "MANAGEMENT";

interface CatalogEntry {
  key: string;
  label: string;
  description: string;
  group: Group;
  route: string;
  need: Need | null;
  module: "core" | "tickets" | "venue" | "finance" | "insights";
  requires?: string[];
  venueOnly?: boolean;
}

const CATALOG: CatalogEntry[] = [
  { key: "PLATFORM_HOME", label: "Início", description: "Visão geral do negócio.", group: "CORE", route: "/dashboard/inicio", need: null, module: "core" },
  { key: "TEAM", label: "Equipe", description: "Membros, papéis e convites.", group: "CORE", route: "/dashboard/equipe", need: null, module: "core" },
  { key: "SETTINGS", label: "Configurações", description: "Dados e preferências da organização.", group: "CORE", route: "/dashboard/configuracoes", need: null, module: "core" },
  { key: "EVENTS", label: "Eventos", description: "Cadastre e publique seus eventos.", group: "EVENTS", route: "/dashboard/eventos", need: "EVENTS_TICKETING", module: "tickets" },
  { key: "TICKETING", label: "Eventos e ingressos", description: "Venda ingressos online com repasse automático.", group: "EVENTS", route: "/dashboard/ingressos", need: "EVENTS_TICKETING", module: "tickets", requires: ["EVENTS"] },
  { key: "TICKET_TYPES", label: "Tipos de ingresso", description: "Pista, VIP, camarote — cada um com preço e limite.", group: "EVENTS", route: "/dashboard/ingressos/tipos", need: "EVENTS_TICKETING", module: "tickets", requires: ["TICKETING"] },
  { key: "LOTS", label: "Lotes", description: "Preços que mudam por data ou quantidade.", group: "EVENTS", route: "/dashboard/ingressos/lotes", need: "EVENTS_TICKETING", module: "tickets", requires: ["TICKETING"] },
  { key: "CHECK_IN", label: "Check-in", description: "Valide ingressos na portaria pelo celular.", group: "EVENTS", route: "/dashboard/check-in", need: "EVENTS_TICKETING", module: "tickets", requires: ["TICKETING"] },
  { key: "PROMOTERS", label: "Promotores", description: "Links de venda e comissão por promotor.", group: "EVENTS", route: "/dashboard/promotores", need: "EVENTS_TICKETING", module: "tickets", requires: ["TICKETING"] },
  { key: "CUSTOMERS", label: "CRM", description: "Base de clientes e campanhas.", group: "RELATIONSHIP", route: "/dashboard/crm", need: "RELATIONSHIP", module: "tickets" },
  { key: "RESERVATIONS", label: "Reservas", description: "Agenda de mesas e confirmação por WhatsApp.", group: "RELATIONSHIP", route: "/dashboard/reservas", need: "RELATIONSHIP", module: "venue", venueOnly: true },
  { key: "WAITLIST", label: "Fila de espera", description: "Fila digital com aviso quando a mesa libera.", group: "RELATIONSHIP", route: "/dashboard/reservas?tab=fila", need: "RELATIONSHIP", module: "venue", requires: ["RESERVATIONS"], venueOnly: true },
  { key: "GUEST_LISTS", label: "Convidados", description: "Listas de cortesia e convidados por evento.", group: "RELATIONSHIP", route: "/dashboard/convidados", need: "RELATIONSHIP", module: "tickets" },
  { key: "REVIEWS", label: "Avaliações", description: "Avaliações dos clientes depois da visita.", group: "RELATIONSHIP", route: "/dashboard/avaliacoes", need: "RELATIONSHIP", module: "venue", venueOnly: true },
  { key: "TABLES", label: "Mesas", description: "Mapa de mesas e ocupação ao vivo.", group: "OPERATION", route: "/dashboard/operacao", need: "OPERATION", module: "venue", venueOnly: true },
  { key: "TABS", label: "Comandas", description: "Comandas por mesa ou por pessoa.", group: "OPERATION", route: "/dashboard/operacao", need: "OPERATION", module: "venue", venueOnly: true },
  { key: "ORDERS", label: "Pedidos", description: "Lançamento e acompanhamento de pedidos.", group: "OPERATION", route: "/dashboard/operacao/pedidos", need: "OPERATION", module: "venue", requires: ["TABS"], venueOnly: true },
  { key: "PREPARATION", label: "Preparo", description: "Fila de preparo para cozinha e bar.", group: "OPERATION", route: "/dashboard/operacao/pedidos", need: "OPERATION", module: "venue", requires: ["ORDERS"], venueOnly: true },
  { key: "CASH_REGISTER", label: "Caixa", description: "Abertura, fechamento e sangria.", group: "OPERATION", route: "/dashboard/operacao/caixa", need: "OPERATION", module: "venue", venueOnly: true },
  { key: "VENUE_PAYMENTS", label: "Pagamentos", description: "Pix, cartão e dinheiro na comanda.", group: "OPERATION", route: "/dashboard/operacao/caixa", need: "OPERATION", module: "venue", requires: ["CASH_REGISTER"], venueOnly: true },
  { key: "MENUS", label: "Cardápios", description: "Cardápio digital com QR na mesa.", group: "PRODUCTS", route: "/dashboard/cardapio", need: "MENU_PRODUCTS", module: "venue", venueOnly: true },
  { key: "PRODUCTS", label: "Produtos", description: "Catálogo de produtos e preços.", group: "PRODUCTS", route: "/dashboard/cardapio?tab=produtos", need: "MENU_PRODUCTS", module: "venue", requires: ["MENUS"], venueOnly: true },
  { key: "MODIFIERS", label: "Adicionais", description: "Complementos e variações de produto.", group: "PRODUCTS", route: "/dashboard/cardapio?tab=adicionais", need: "MENU_PRODUCTS", module: "venue", requires: ["PRODUCTS"], venueOnly: true },
  { key: "INVENTORY", label: "Estoque", description: "Entradas, saídas e alertas de mínimo.", group: "PRODUCTS", route: "/dashboard/estoque", need: "STOCK_PURCHASING", module: "venue", venueOnly: true },
  { key: "PURCHASES", label: "Compras", description: "Pedidos de compra e recebimento.", group: "PRODUCTS", route: "/dashboard/estoque?tab=compras", need: "STOCK_PURCHASING", module: "venue", requires: ["INVENTORY"], venueOnly: true },
  { key: "SUPPLIERS", label: "Fornecedores", description: "Cadastro e histórico de fornecedores.", group: "PRODUCTS", route: "/dashboard/estoque?tab=fornecedores", need: "STOCK_PURCHASING", module: "venue", requires: ["INVENTORY"], venueOnly: true },
  { key: "FINANCE", label: "Financeiro", description: "Saldo, extrato, saques e contas a pagar.", group: "MANAGEMENT", route: "/dashboard/financeiro", need: "MANAGEMENT", module: "finance" },
  { key: "INSIGHTS", label: "Insights", description: "Indicadores e comparativos do negócio.", group: "MANAGEMENT", route: "/dashboard/insights", need: "MANAGEMENT", module: "insights" },
  { key: "EXPORTS", label: "Exportações", description: "Relatórios em planilha e PDF.", group: "MANAGEMENT", route: "/dashboard/configuracoes/exportacoes", need: "MANAGEMENT", module: "finance" },
];

const NEED_META: Record<Need, { label: string; description: string; defaultSelected: boolean }> = {
  EVENTS_TICKETING: { label: "Eventos e bilheteria", description: "Vender ingressos, controlar a portaria e trabalhar com promotores.", defaultSelected: false },
  RELATIONSHIP: { label: "Relacionamento", description: "Clientes, reservas, convidados e avaliações.", defaultSelected: false },
  OPERATION: { label: "Operação do salão", description: "Mesas, comandas, pedidos e caixa.", defaultSelected: false },
  MENU_PRODUCTS: { label: "Cardápio e produtos", description: "Cardápio digital, produtos e adicionais.", defaultSelected: false },
  STOCK_PURCHASING: { label: "Estoque e compras", description: "Controle de estoque, compras e fornecedores.", defaultSelected: false },
  MANAGEMENT: { label: "Gestão e resultados", description: "Financeiro, indicadores e exportações.", defaultSelected: true },
};

const GROUP_LABEL: Record<Group, string> = { CORE: "Plataforma", EVENTS: "Eventos", RELATIONSHIP: "Relacionamento", OPERATION: "Operação", PRODUCTS: "Produtos", MANAGEMENT: "Gestão" };

const ACTIVE_WITH_VENUE = ["PLATFORM_HOME", "TEAM", "SETTINGS", "EVENTS", "TICKETING", "CHECK_IN", "PROMOTERS", "CUSTOMERS", "RESERVATIONS", "GUEST_LISTS", "TABLES", "TABS", "ORDERS", "CASH_REGISTER", "MENUS", "PRODUCTS", "INVENTORY", "FINANCE", "INSIGHTS"];
const ACTIVE_TICKETS_ONLY = ["PLATFORM_HOME", "TEAM", "SETTINGS", "EVENTS", "TICKETING", "CHECK_IN", "PROMOTERS", "CUSTOMERS", "GUEST_LISTS", "FINANCE", "INSIGHTS"];

// Estado mutável de capacidades: inicializado na primeira leitura (o cookie só é legível no browser).
let activeKeys: Set<string> | null = null;
function active(): Set<string> {
  if (!activeKeys) activeKeys = new Set(venueEnabled() ? ACTIVE_WITH_VENUE : ACTIVE_TICKETS_ONLY);
  return activeKeys;
}
const dismissedRecommendations = new Set<string>();

function visibleCatalog(): CatalogEntry[] {
  return venueEnabled() ? CATALOG : CATALOG.filter((c) => !c.venueOnly);
}

function capabilityStatus(key: string): "ACTIVE" | "AVAILABLE" {
  return active().has(key) ? "ACTIVE" : "AVAILABLE";
}

function businessNeedsCatalog() {
  return (Object.keys(NEED_META) as Need[]).map((need) => {
    const caps = visibleCatalog().filter((c) => c.need === need);
    return {
      key: need,
      ...NEED_META[need],
      capabilities: caps.map((c) => {
        const required = caps.some((other) => other.requires?.includes(c.key));
        return { key: c.key, label: c.label, description: c.description, required, requiredReason: required ? `Necessário para ${caps.filter((o) => o.requires?.includes(c.key)).map((o) => o.label).join(", ")} funcionar.` : null };
      }),
    };
  }).filter((g) => g.capabilities.length > 0);
}

function withDependencies(keys: string[]): { all: string[]; autoIncluded: string[] } {
  const all = new Set(keys);
  const autoIncluded: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of [...all]) {
      for (const dep of CATALOG.find((c) => c.key === key)?.requires ?? []) {
        if (!all.has(dep)) {
          all.add(dep);
          if (!active().has(dep)) autoIncluded.push(dep);
          changed = true;
        }
      }
    }
  }
  return { all: [...all], autoIncluded };
}

function previewActivation(body: { businessNeedKeys?: string[]; capabilityKeys?: string[] }) {
  const needs = body.businessNeedKeys ?? [];
  const chosen = body.capabilityKeys ?? visibleCatalog().filter((c) => c.need && needs.includes(c.need)).map((c) => c.key);
  const { all, autoIncluded } = withDependencies(chosen);
  const groups = needs.map((need) => ({ key: need, label: NEED_META[need as Need]?.label ?? need, capabilityKeys: all.filter((k) => CATALOG.find((c) => c.key === k)?.need === need) }));
  return { groups, allCapabilityKeys: all, autoIncludedKeys: autoIncluded };
}

// ── Equipe ───────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  { key: "organization.team.view", description: "Ver a equipe" },
  { key: "organization.team.manage", description: "Convidar, suspender e remover membros" },
  { key: "organization.settings.view", description: "Ver as configurações" },
  { key: "organization.settings.manage", description: "Alterar as configurações" },
  { key: "organization.legal_profile.manage", description: "Gerenciar dados jurídicos e financeiros" },
  { key: "venue.menu.manage", description: "Editar cardápio e produtos" },
  { key: "venue.reservations.manage", description: "Criar e editar reservas" },
  { key: "venue.operation.tabs.open", description: "Abrir e fechar comandas" },
  { key: "venue.operation.tabs.void_after_close", description: "Estornar item depois de fechar a comanda" },
  { key: "venue.operation.cash.manage", description: "Abrir, fechar e sangrar o caixa" },
  { key: "venue.operation.devices.manage", description: "Parear e gerenciar terminais" },
  { key: "venue.stock.manage", description: "Movimentar estoque e registrar compras" },
  { key: "venue.finance.view", description: "Ver o financeiro" },
  { key: "venue.insights.view", description: "Ver os insights" },
  { key: "venue.reviews.view", description: "Ver avaliações" },
  { key: "venue.reviews.manage", description: "Responder avaliações" },
];
const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);
const ORG_PERMISSION_KEYS = ALL_PERMISSION_KEYS.filter((k) => k.startsWith("organization."));

const ROLES = [
  { key: "OWNER", label: "Proprietário", description: "Acesso total, inclusive financeiro e configurações." },
  { key: "MANAGER", label: "Gerente", description: "Opera tudo e gerencia a equipe, sem dados jurídicos." },
  { key: "RECEPTION", label: "Recepção", description: "Reservas, fila de espera e convidados." },
  { key: "WAITER", label: "Garçom", description: "Abre comandas e lança pedidos." },
  { key: "CASHIER", label: "Caixa", description: "Recebe pagamentos e fecha o caixa." },
  { key: "KITCHEN_BAR", label: "Cozinha/Bar", description: "Fila de preparo das estações atribuídas." },
  { key: "STOCK", label: "Estoque", description: "Entradas, saídas e compras." },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ALL_PERMISSION_KEYS,
  MANAGER: ALL_PERMISSION_KEYS.filter((k) => k !== "organization.legal_profile.manage"),
  RECEPTION: ["venue.reservations.manage", "venue.reviews.view"],
  WAITER: ["venue.operation.tabs.open"],
  CASHIER: ["venue.operation.tabs.open", "venue.operation.cash.manage"],
  KITCHEN_BAR: [],
  STOCK: ["venue.stock.manage"],
};

interface MockMember {
  memberId: number;
  userId: number;
  nome: string;
  email: string;
  fotoPerfil: null;
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";
  isOrgOwner: boolean;
  venueRole: string | null;
  createdAt: string;
  overrides: { permissionKey: string; effect: "ALLOW" | "DENY" }[];
  preparationStations: { id: number; nome: string }[];
}

const members: MockMember[] = [
  { memberId: 1, userId: 1, nome: "Vitor Reis", email: "vitor@nokta.live", fotoPerfil: null, status: "ACTIVE", isOrgOwner: true, venueRole: "OWNER", createdAt: iso(-180), overrides: [], preparationStations: [] },
  { memberId: 2, userId: 7, nome: "Marina Castro", email: "marina@nokta.live", fotoPerfil: null, status: "ACTIVE", isOrgOwner: false, venueRole: "MANAGER", createdAt: iso(-120), overrides: [], preparationStations: [] },
  { memberId: 3, userId: 12, nome: "Rafael Nunes", email: "rafael.nunes@gmail.com", fotoPerfil: null, status: "ACTIVE", isOrgOwner: false, venueRole: "CASHIER", createdAt: iso(-60), overrides: [{ permissionKey: "venue.operation.tabs.void_after_close", effect: "ALLOW" }], preparationStations: [] },
  { memberId: 4, userId: 15, nome: "Bianca Lopes", email: "bianca.lopes@outlook.com", fotoPerfil: null, status: "ACTIVE", isOrgOwner: false, venueRole: "KITCHEN_BAR", createdAt: iso(-45), overrides: [], preparationStations: [{ id: 1, nome: "Bar principal" }] },
  { memberId: 5, userId: 21, nome: "Diego Martins", email: "diego.m@gmail.com", fotoPerfil: null, status: "SUSPENDED", isOrgOwner: false, venueRole: "WAITER", createdAt: iso(-30), overrides: [], preparationStations: [] },
];

const STATIONS = [
  { id: 1, organizationId: ORG_ID, nome: "Bar principal", tipo: "BAR", displayOrder: 1, active: true, createdAt: iso(-90), updatedAt: iso(-10) },
  { id: 2, organizationId: ORG_ID, nome: "Cozinha", tipo: "KITCHEN", displayOrder: 2, active: true, createdAt: iso(-90), updatedAt: iso(-10) },
];

interface MockInvitation {
  id: number;
  email: string;
  module: string;
  roleKey: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy: { id: number; nome: string };
}

const invitations: MockInvitation[] = [
  { id: 1, email: "ana.souza@gmail.com", module: "venue", roleKey: "RECEPTION", status: "PENDING", expiresAt: iso(5), acceptedAt: null, revokedAt: null, createdAt: iso(-2), invitedBy: { id: 1, nome: "Vitor Reis" } },
  { id: 2, email: "carlos@bardocarlos.com.br", module: "venue", roleKey: "STOCK", status: "ACCEPTED", expiresAt: iso(-20), acceptedAt: iso(-25), revokedAt: null, createdAt: iso(-27), invitedBy: { id: 1, nome: "Vitor Reis" } },
  { id: 3, email: "julia.p@hotmail.com", module: "venue", roleKey: "WAITER", status: "EXPIRED", expiresAt: iso(-3), acceptedAt: null, revokedAt: null, createdAt: iso(-10), invitedBy: { id: 7, nome: "Marina Castro" } },
];
let nextInvitationId = 4;

function memberDetail(m: MockMember) {
  const base = new Set(m.isOrgOwner ? ALL_PERMISSION_KEYS : ROLE_PERMISSIONS[m.venueRole ?? ""] ?? []);
  for (const o of m.overrides) {
    if (o.effect === "ALLOW") base.add(o.permissionKey);
    else base.delete(o.permissionKey);
  }
  const { overrides, preparationStations, ...rest } = m;
  return { ...rest, effectivePermissions: [...base], overrides, preparationStations };
}

function memberSummary(m: MockMember) {
  const { overrides: _o, preparationStations: _s, ...rest } = m;
  void _o;
  void _s;
  return rest;
}

// ── Configurações ────────────────────────────────────────────────────────────

let businessProfile = {
  organizationId: ORG_ID,
  exists: true,
  segments: ["EVENT_PRODUCER", "BAR"],
  operationModes: ["TICKETING", "TABLE_SERVICE"],
  hasPhysicalVenue: true,
  numberOfLocations: 1,
  sellsAdvanceTickets: true,
  acceptsReservations: true,
  usesGuestLists: true,
  usesTables: true,
  usesTabs: true,
  usesCounterService: false,
  sellsFoodOrBeverages: true,
  usesPreparationStations: true,
  controlsInventory: true,
  worksWithPromoters: true,
  wantsFinancialManagement: true,
  wantsBusinessInsights: true,
  profileCompletedAt: iso(-90),
  reviewedAt: null as string | null,
};

let operationSettings = { organizationId: ORG_ID, defaultServiceChargeBps: 1000, requireOpenCashSessionForPayments: true, createdAt: iso(-90), updatedAt: iso(-5) };

interface MockLocation {
  id: number;
  organizationId: number;
  nome: string;
  slug: string;
  descricao: string | null;
  endereco: string | null;
  telefone: string | null;
  active: boolean;
  isMain: boolean;
  timezone: string;
  defaultReservationDurationMinutes: number;
  reservationMinAdvanceMinutes: number;
  reservationLateToleranceMinutes: number | null;
  cieloMerchantCode: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const locations: MockLocation[] = [
  { id: 1, organizationId: ORG_ID, nome: "Unidade Pinheiros", slug: "pinheiros", descricao: "Casa principal", endereco: "R. dos Pinheiros, 1200 — São Paulo/SP", telefone: "(11) 3031-0000", active: true, isMain: true, timezone: "America/Sao_Paulo", defaultReservationDurationMinutes: 120, reservationMinAdvanceMinutes: 60, reservationLateToleranceMinutes: 15, cieloMerchantCode: "1006993336", archivedAt: null, createdAt: iso(-200), updatedAt: iso(-3) },
  { id: 2, organizationId: ORG_ID, nome: "Rooftop Vila Madalena", slug: "rooftop", descricao: null, endereco: "R. Harmonia, 85 — São Paulo/SP", telefone: null, active: true, isMain: false, timezone: "America/Sao_Paulo", defaultReservationDurationMinutes: 90, reservationMinAdvanceMinutes: 0, reservationLateToleranceMinutes: null, cieloMerchantCode: null, archivedAt: null, createdAt: iso(-60), updatedAt: iso(-1) },
];
let nextLocationId = 3;

const businessHours: Record<number, { id: number; dayOfWeek: number; opensAt: string; closesAt: string; active: boolean }[]> = {
  1: [
    { id: 1, dayOfWeek: 3, opensAt: "18:00", closesAt: "00:00", active: true },
    { id: 2, dayOfWeek: 4, opensAt: "18:00", closesAt: "01:00", active: true },
    { id: 3, dayOfWeek: 5, opensAt: "18:00", closesAt: "03:00", active: true },
    { id: 4, dayOfWeek: 6, opensAt: "16:00", closesAt: "03:00", active: true },
    { id: 5, dayOfWeek: 0, opensAt: "14:00", closesAt: "22:00", active: true },
  ],
  2: [{ id: 6, dayOfWeek: 6, opensAt: "17:00", closesAt: "02:00", active: true }],
};
let nextHourId = 7;

let setupProfile = { businessType: "BAR" as string | null, operationMode: "MIXED" as string | null, status: "IN_PROGRESS", lastStep: "menu", welcomeSeenAt: iso(-80), dismissedAt: null as string | null, completedAt: null as string | null };

const legalProfile = {
  organizationId: ORG_ID,
  legalType: null as string | null,
  legalName: null as string | null,
  tradeName: null as string | null,
  documentMasked: null as string | null,
  representativeUserId: 1,
  verificationStatus: "NOT_STARTED",
  recipientType: null,
  recipientStatus: null,
  hasRecipient: false,
  recipientAttemptState: "NOT_APPLICABLE",
  recipientLastError: null,
  recipientAttemptedAt: null,
  kycStatus: null,
  bankAccountMasked: null,
  financialDestinationStatus: "NOT_SET",
  financialDestinationMasked: null,
  financialActivationStatus: "INACTIVE",
  firstSaleAt: null,
  verifiedAt: null,
  rejectedAt: null,
  suspendedAt: null,
  company: { siteUrl: null, annualRevenue: null, corporationType: null, foundingDate: null, address: null, phone: null },
  representative: { documentMasked: null, motherName: null, birthdate: null, monthlyIncome: null, professionalOccupation: null },
  recipientBlocked: false,
  recipientBlockedAt: null,
  recipientBlockedReason: null,
};

const DRAFT_ORDER = ["RESPONSIBLE_TYPE", "ENTITY_DETAILS", "LEGAL_REPRESENTATIVE", "ADDRESS", "BANK_ACCOUNT", "REVIEW"];
const legalDraft = {
  organizationId: ORG_ID,
  legalType: null as string | null,
  draftStep: "RESPONSIBLE_TYPE",
  formStatus: "DRAFT",
  draftUpdatedAt: null as string | null,
  legalName: null as string | null,
  tradeName: null as string | null,
  documentMasked: null as string | null,
  company: { siteUrl: null as string | null, annualRevenue: null as string | null, corporationType: null as string | null, foundingDate: null as string | null, address: null as unknown, phone: null as unknown },
  representative: { documentMasked: null as string | null, motherName: null as string | null, birthdate: null as string | null, monthlyIncome: null as string | null, professionalOccupation: null as string | null },
  bankAccountMasked: null as string | null,
  hasRecipient: false,
  recipientBlocked: false,
};

function advanceDraft(after: string) {
  const current = DRAFT_ORDER.indexOf(legalDraft.draftStep);
  const target = DRAFT_ORDER.indexOf(after) + 1;
  // PJ passa pelo representante; PF pula essa etapa.
  const next = DRAFT_ORDER[Math.min(target, DRAFT_ORDER.length - 1)];
  const skipRep = legalDraft.legalType === "INDIVIDUAL" && next === "LEGAL_REPRESENTATIVE";
  const resolved = skipRep ? "ADDRESS" : next;
  if (DRAFT_ORDER.indexOf(resolved) > current) legalDraft.draftStep = resolved;
  legalDraft.draftUpdatedAt = new Date().toISOString();
}

const maskDoc = (doc: string) => (doc.length === 14 ? `${doc.slice(0, 2)}.***.***/****-${doc.slice(-2)}` : `***.${doc.slice(3, 6)}.***-${doc.slice(-2)}`);

interface MockToken {
  id: number;
  name: string;
  scope: "READ" | "READ_WRITE";
  tokenPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  createdBy: string;
}
const mcpTokens: MockToken[] = [{ id: 1, name: "Meu notebook", scope: "READ_WRITE", tokenPrefix: "nk_live_7f3a", lastUsedAt: iso(-0.1), createdAt: iso(-12), createdBy: "Vitor Reis" }];
let nextTokenId = 2;
const MCP_CAPABILITIES = [
  { key: "events", label: "Eventos e ingressos", read: ["Eventos publicados", "Vendas por evento", "Ingressos validados"], write: ["Criar cupons", "Pausar vendas"] },
  { key: "finance", label: "Financeiro", read: ["Saldo e extrato", "Faturamento por período"], write: [] },
  { key: "operation", label: "Operação", read: ["Comandas abertas", "Caixa do dia"], write: ["Lançar pedidos", "Abrir comanda"] },
  { key: "stock", label: "Estoque", read: ["Itens abaixo do mínimo", "Últimas compras"], write: ["Registrar entrada"] },
];

// ── Financeiro do Tickets (timeline da Início) ───────────────────────────────

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function timeline(params: Record<string, string>) {
  const end = params.endDate ?? today();
  let start = params.startDate ?? end;
  const quick = params.quickPeriod;
  if (quick === "LAST_7_DAYS") start = shiftDate(end, -6);
  if (quick === "LAST_30_DAYS") start = shiftDate(end, -29);
  if (quick === "YESTERDAY") start = shiftDate(end, -1);
  if (quick === "THIS_MONTH") start = `${end.slice(0, 7)}-01`;
  if (quick === "LAST_MONTH") {
    const firstThisMonth = new Date(`${end.slice(0, 7)}-01T00:00:00Z`);
    firstThisMonth.setUTCMonth(firstThisMonth.getUTCMonth() - 1);
    start = firstThisMonth.toISOString().slice(0, 10);
  }
  const endEff = quick === "YESTERDAY" ? start : quick === "LAST_MONTH" ? shiftDate(`${end.slice(0, 7)}-01`, -1) : end;
  const points: { date: string; revenueCents: number; resultCents: number; ordersCount: number }[] = [];
  for (let d = start, i = 0; d <= endEff && i < 400; d = shiftDate(d, 1), i++) {
    const seed = Number(d.replace(/-/g, "")) % 97;
    const weekend = [5, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay());
    const revenueCents = Math.round((weekend ? 420_000 : 160_000) + seed * 3_100);
    points.push({ date: d, revenueCents, resultCents: Math.round(revenueCents * 0.82), ordersCount: Math.round(revenueCents / 9_000) });
  }
  return points;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

const ok = (data: unknown): MockResult => ({ data });
const org = (suffix: string) => new RegExp(`/organizations/${ORG_ID}${suffix}$`);

export const dashboardHandlers: MockHandler[] = [
  // Módulos e acessos
  {
    test: org("/modules"),
    handle: () =>
      ok({
        organizationId: ORG_ID,
        modules: [{ module: "tickets", status: "ACTIVE" }, ...(venueEnabled() ? [{ module: "venue", status: "ACTIVE" }] : []), { module: "finance", status: "ACTIVE" }, { module: "insights", status: "ACTIVE" }],
      }),
  },
  {
    test: org("/me/access"),
    handle: () =>
      ok({
        organizationId: ORG_ID,
        membershipId: 1,
        membershipStatus: "ACTIVE",
        organizationRole: "OWNER",
        modules: venueEnabled() ? { venue: { role: "OWNER", permissions: ALL_PERMISSION_KEYS, defaultRoute: "/dashboard/venue/inicio" } } : {},
        organizationPermissions: ORG_PERMISSION_KEYS,
      }),
  },
  {
    test: org("/me/tickets-access"),
    handle: () => ok({ organizationId: ORG_ID, membershipId: 1, membershipStatus: "ACTIVE", organizationRole: "OWNER", modules: { tickets: { role: "OWNER", permissions: ["tickets.finance.view", "tickets.events.manage", "tickets.promoters.manage", "tickets.checkin"] } } }),
  },
  {
    test: org("/me/navigation"),
    handle: () => ok({ items: visibleCatalog().filter((c) => active().has(c.key)).map((c) => ({ key: c.key, label: c.label, route: c.route, group: c.group })), canExplore: true }),
  },
  { test: /\/me\/contexts$/, handle: () => ok({ personalAccount: { userId: 1 }, organizations: [{ organizationId: ORG_ID, name: "Nokta Eventos", isOwner: true }], promoterContext: null }) },

  // Início
  {
    test: org("/platform-home"),
    handle: () => {
      const venue = venueEnabled();
      return ok({
        organizationId: ORG_ID,
        activeCapabilityKeys: [...active()],
        sections: {
          events: { upcomingEventsCount: 3, nextEvent: { id: 1, nome: "Noite Neon — Open Bar", data: iso(4) } },
          ...(venue ? { operation: { openTabsCount: 7, openCashSessionsCount: 1, activeLocationsCount: locations.filter((l) => l.active).length } } : {}),
          ...(venue ? { reservations: { todayReservationsCount: 12 } } : {}),
        },
        checklist: [
          {
            title: "Eventos e bilheteria",
            items: [
              { key: "first-event", label: "Publique seu primeiro evento", route: "/dashboard/eventos", done: true },
              { key: "legal", label: "Complete os dados jurídicos e financeiros", route: "/dashboard/configuracoes?tab=juridico-financeiro", done: false },
              { key: "promoter", label: "Convide um promotor", route: "/dashboard/promotores", done: false },
            ],
          },
          {
            title: "Equipe",
            items: [
              { key: "team-invite", label: "Convide alguém da equipe", route: "/dashboard/equipe", done: true },
              { key: "team-roles", label: "Revise os papéis de cada pessoa", route: "/dashboard/equipe", done: false },
            ],
          },
        ],
      });
    },
  },
  {
    test: org("/recommendations"),
    handle: () => {
      const recs = [
        { capabilityKey: "RESERVATIONS", label: "Reservas", priority: 1, reason: "Você aceita reservas — organize a ocupação e evite overbooking.", route: "/dashboard/reservas", dismissible: true as const },
        { capabilityKey: "INVENTORY", label: "Estoque", priority: 2, reason: "Você vende bebidas e quer controlar estoque — receba alerta quando algo estiver acabando.", route: "/dashboard/estoque", dismissible: true as const },
        { capabilityKey: "EXPORTS", label: "Exportações", priority: 3, reason: "Com financeiro ativo, exporte relatórios em planilha pro seu contador.", route: "/dashboard/configuracoes/exportacoes", dismissible: true as const },
      ];
      return ok(recs.filter((r) => !active().has(r.capabilityKey) && !dismissedRecommendations.has(r.capabilityKey) && visibleCatalog().some((c) => c.key === r.capabilityKey)));
    },
  },
  {
    test: org("/recommendations/[A-Z_]+/dismiss"),
    method: "post",
    handle: ({ url }) => {
      dismissedRecommendations.add(url.pathname.split("/").at(-2) ?? "");
      return ok({ ok: true });
    },
  },
  { test: org("/tickets/finance/timeline"), handle: ({ params }) => ok(timeline(params)) },

  // Capacidades / Explore
  { test: org("/capabilities/business-needs/catalog"), handle: () => ok(businessNeedsCatalog()) },
  { test: org("/capabilities/business-needs/preview"), method: "post", handle: ({ body }) => ok(previewActivation((body as { businessNeedKeys?: string[]; capabilityKeys?: string[] }) ?? {})) },
  {
    test: org("/capabilities/activate-business-needs"),
    method: "post",
    handle: ({ body }) => {
      const preview = previewActivation((body as { businessNeedKeys?: string[]; capabilityKeys?: string[] }) ?? {});
      for (const key of preview.allCapabilityKeys) active().add(key);
      return ok({ activated: preview.allCapabilityKeys });
    },
  },
  {
    test: org("/capabilities/[A-Z_]+/activate"),
    method: "post",
    handle: ({ url }) => {
      const key = url.pathname.split("/").at(-2) ?? "";
      for (const k of withDependencies([key]).all) active().add(k);
      return ok({ key, status: "ACTIVE" });
    },
  },
  {
    test: org("/capabilities/[A-Z_]+/deactivate"),
    method: "post",
    handle: ({ url }) => {
      const key = url.pathname.split("/").at(-2) ?? "";
      active().delete(key);
      for (const c of CATALOG) if (c.requires?.includes(key)) active().delete(c.key);
      return ok({ key, status: "AVAILABLE" });
    },
  },
  {
    test: org("/capabilities"),
    handle: () =>
      ok(
        visibleCatalog().map((c) => ({
          key: c.key,
          label: c.label,
          description: c.description,
          group: c.group,
          technicalModule: c.module,
          route: c.route,
          dependencies: c.requires ?? [],
          status: capabilityStatus(c.key),
          source: active().has(c.key) ? "ONBOARDING" : null,
          activatedAt: active().has(c.key) ? iso(-90) : null,
          deactivatedAt: null,
        })),
      ),
  },
  {
    test: org("/explore"),
    handle: () =>
      ok(
        (["EVENTS", "RELATIONSHIP", "OPERATION", "PRODUCTS", "MANAGEMENT"] as Group[])
          .map((group) => ({
            group,
            groupLabel: GROUP_LABEL[group],
            cards: visibleCatalog()
              .filter((c) => c.group === group)
              .map((c) => ({
                key: c.key,
                name: c.label,
                description: c.description,
                problemSolved: c.description,
                status: capabilityStatus(c.key),
                isActive: active().has(c.key),
                requirements: (c.requires ?? []).map((r) => ({ key: r, label: CATALOG.find((x) => x.key === r)?.label ?? r, active: active().has(r) })),
                dependenciesMet: (c.requires ?? []).every((r) => active().has(r)),
                configureRoute: c.route,
              })),
          }))
          .filter((g) => g.cards.length > 0),
      ),
  },
  { test: org("/business-profile"), method: "get", handle: () => ok(businessProfile) },
  {
    test: org("/business-profile"),
    method: "put",
    handle: ({ body }) => {
      const { markCompleted, ...rest } = (body as Record<string, unknown>) ?? {};
      businessProfile = { ...businessProfile, ...(rest as Partial<typeof businessProfile>), exists: true, profileCompletedAt: markCompleted ? new Date().toISOString() : businessProfile.profileCompletedAt };
      return ok(businessProfile);
    },
  },

  // Onboarding
  { test: /\/organizations$/, method: "post", handle: ({ body }) => ok({ id: 2, nome: (body as { nome?: string })?.nome ?? "Nova organização", tipo: "PRODUTOR", status: "ACTIVE", slug: null, role: "OWNER", onboardingCompleted: false }) },
  { test: /\/organizations\/\d+\/onboarding-step$/, method: "patch", handle: () => ok({ ok: true }) },
  { test: /\/organizations\/\d+$/, method: "patch", handle: ({ body }) => ok({ id: ORG_ID, ...(body as object) }) },

  // Equipe
  { test: org("/team/members"), handle: () => ok(members.filter((m) => m.status !== "REMOVED").map(memberSummary)) },
  {
    test: org("/team/members/\\d+"),
    method: "get",
    handle: ({ url }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -1));
      return m ? ok(memberDetail(m)) : notFound("Membro não encontrado");
    },
  },
  {
    test: org("/team/members/\\d+/status"),
    method: "patch",
    handle: ({ url, body }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -2));
      if (!m) return notFound();
      m.status = (body as { status: MockMember["status"] }).status;
      return ok(memberSummary(m));
    },
  },
  {
    test: org("/team/members/\\d+/module-roles/venue"),
    method: "patch",
    handle: ({ url, body }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -3));
      if (!m) return notFound();
      m.venueRole = (body as { roleKey: string }).roleKey;
      return ok(memberSummary(m));
    },
  },
  {
    test: org("/team/members/\\d+/permissions"),
    method: "put",
    handle: ({ url, body }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -2));
      if (!m) return notFound();
      m.overrides = (body as { overrides: MockMember["overrides"] }).overrides ?? [];
      return ok(memberDetail(m));
    },
  },
  {
    test: org("/team/members/\\d+/preparation-stations"),
    method: "put",
    handle: ({ url, body }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -2));
      if (!m) return notFound();
      const ids = (body as { stationIds: number[] }).stationIds ?? [];
      m.preparationStations = STATIONS.filter((s) => ids.includes(s.id)).map((s) => ({ id: s.id, nome: s.nome }));
      return ok(memberDetail(m));
    },
  },
  {
    test: org("/team/members/\\d+"),
    method: "delete",
    handle: ({ url }) => {
      const m = members.find((x) => x.memberId === idFrom(url, -1));
      if (m) m.status = "REMOVED";
      return ok({ ok: true });
    },
  },
  { test: org("/team/roles"), handle: () => ok({ roles: ROLES }) },
  { test: org("/team/permissions"), handle: () => ok(PERMISSIONS) },
  { test: org("/team/invitations"), method: "get", handle: () => ok(invitations) },
  {
    test: org("/team/invitations"),
    method: "post",
    handle: ({ body }) => {
      const { email, roleKey, module } = body as { email: string; roleKey: string; module: string };
      const inv: MockInvitation = { id: nextInvitationId++, email, module, roleKey, status: "PENDING", expiresAt: iso(7), acceptedAt: null, revokedAt: null, createdAt: new Date().toISOString(), invitedBy: { id: 1, nome: "Vitor Reis" } };
      invitations.unshift(inv);
      return ok(inv);
    },
  },
  {
    test: org("/team/invitations/\\d+/resend"),
    method: "post",
    handle: ({ url }) => {
      const inv = invitations.find((x) => x.id === idFrom(url, -2));
      if (inv) inv.expiresAt = iso(7);
      return ok({ ok: true });
    },
  },
  {
    test: org("/team/invitations/\\d+/revoke"),
    method: "post",
    handle: ({ url }) => {
      const inv = invitations.find((x) => x.id === idFrom(url, -2));
      if (inv) {
        inv.status = "REVOKED";
        inv.revokedAt = new Date().toISOString();
      }
      return ok({ ok: true });
    },
  },
  { test: org("/venue/preparation-stations"), method: "get", handle: () => ok(STATIONS) },

  // Configurações
  {
    test: org("/venue/settings/organization"),
    handle: () =>
      ok({
        id: ORG_ID,
        nome: "Nokta Eventos",
        tipo: "PJ",
        documento: "12.345.678/0001-90",
        status: "ACTIVE",
        createdAt: iso(-200),
        owner: { id: 1, nome: "Vitor", sobrenome: "Reis", email: "vitor@nokta.live" },
        modules: [{ module: "tickets", status: "ACTIVE" }, ...(venueEnabled() ? [{ module: "venue", status: "ACTIVE" }] : []), { module: "finance", status: "ACTIVE" }, { module: "insights", status: "ACTIVE" }],
      }),
  },
  { test: org("/venue/settings/operation"), method: "get", handle: () => ok(operationSettings) },
  {
    test: org("/venue/settings/operation"),
    method: "put",
    handle: ({ body }) => {
      operationSettings = { ...operationSettings, ...(body as object), updatedAt: new Date().toISOString() };
      return ok(operationSettings);
    },
  },
  { test: org("/venue/settings/locations/\\d+/business-hours"), method: "get", handle: ({ url }) => ok(businessHours[idFrom(url, -2)] ?? []) },
  {
    test: org("/venue/settings/locations/\\d+/business-hours"),
    method: "put",
    handle: ({ url, body }) => {
      const id = idFrom(url, -2);
      const intervals = ((body as { intervals?: { id?: number; dayOfWeek: number; opensAt: string; closesAt: string; active?: boolean }[] })?.intervals ?? []).map((i) => ({ id: i.id ?? nextHourId++, dayOfWeek: i.dayOfWeek, opensAt: i.opensAt, closesAt: i.closesAt, active: i.active ?? true }));
      businessHours[id] = intervals;
      return ok(intervals);
    },
  },
  {
    test: org("/venue/setup/status"),
    handle: () =>
      ok({
        restricted: false,
        readyToOperate: false,
        progress: 70, // 0–100 (o checklist antigo usava `width: ${progress}%`)
        profile: setupProfile,
        requiredItems: [
          { key: "location", label: "Criar a primeira unidade", done: true, route: "/dashboard/configuracoes?tab=unidades" },
          { key: "menu", label: "Montar o cardápio", done: true, route: "/dashboard/cardapio" },
          { key: "tables", label: "Cadastrar mesas e áreas", done: false, route: "/dashboard/operacao" },
        ],
        recommendedItems: [{ key: "hours", label: "Definir horários de funcionamento", done: true, route: "/dashboard/configuracoes?tab=horarios" }],
        blockingItems: [],
        nextStep: "tables",
      }),
  },
  {
    test: org("/venue/setup/profile"),
    method: "put",
    handle: ({ body }) => {
      setupProfile = { ...setupProfile, ...(body as object) };
      return ok(setupProfile);
    },
  },
  { test: org("/venue/operation/locations"), method: "get", handle: () => ok(locations) },
  {
    test: org("/venue/operation/locations"),
    method: "post",
    handle: ({ body }) => {
      const payload = body as Partial<MockLocation>;
      const loc: MockLocation = {
        id: nextLocationId++,
        organizationId: ORG_ID,
        nome: payload.nome ?? "Nova unidade",
        slug: (payload.nome ?? "nova").toLowerCase().replace(/\s+/g, "-"),
        descricao: payload.descricao ?? null,
        endereco: payload.endereco ?? null,
        telefone: payload.telefone ?? null,
        active: true,
        isMain: locations.length === 0,
        timezone: payload.timezone ?? "America/Sao_Paulo",
        defaultReservationDurationMinutes: payload.defaultReservationDurationMinutes ?? 120,
        reservationMinAdvanceMinutes: payload.reservationMinAdvanceMinutes ?? 0,
        reservationLateToleranceMinutes: payload.reservationLateToleranceMinutes ?? null,
        cieloMerchantCode: null,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      locations.push(loc);
      return ok(loc);
    },
  },
  {
    test: org("/venue/operation/locations/\\d+/set-main"),
    method: "post",
    handle: ({ url }) => {
      const id = idFrom(url, -2);
      for (const l of locations) l.isMain = l.id === id;
      return ok(locations.find((l) => l.id === id));
    },
  },
  {
    test: org("/venue/operation/locations/\\d+/archive"),
    method: "post",
    handle: ({ url }) => {
      const loc = locations.find((l) => l.id === idFrom(url, -2));
      if (loc) {
        loc.active = false;
        loc.archivedAt = new Date().toISOString();
      }
      return ok(loc);
    },
  },
  {
    test: org("/venue/operation/locations/\\d+/cielo-merchant-code"),
    method: "post",
    handle: ({ url, body }) => {
      const loc = locations.find((l) => l.id === idFrom(url, -2));
      if (loc) loc.cieloMerchantCode = (body as { cieloMerchantCode: string }).cieloMerchantCode;
      return ok(loc);
    },
  },
  {
    test: org("/venue/operation/locations/\\d+"),
    method: "patch",
    handle: ({ url, body }) => {
      const loc = locations.find((l) => l.id === idFrom(url, -1));
      if (!loc) return notFound();
      Object.assign(loc, body as object, { updatedAt: new Date().toISOString() });
      return ok(loc);
    },
  },

  // Jurídico e financeiro
  { test: org("/legal-financial-profile"), method: "get", handle: () => ok(legalProfile) },
  { test: org("/legal-financial-profile/draft"), method: "get", handle: () => ok(legalDraft) },
  {
    test: org("/legal-financial-profile/draft/responsible-type"),
    method: "patch",
    handle: ({ body }) => {
      legalDraft.legalType = (body as { legalType: string }).legalType;
      advanceDraft("RESPONSIBLE_TYPE");
      return ok(legalDraft);
    },
  },
  {
    test: org("/legal-financial-profile/draft/entity-details"),
    method: "patch",
    handle: ({ body }) => {
      const b = body as { legalName: string; tradeName?: string; document?: string; siteUrl?: string; annualRevenue?: string; corporationType?: string; foundingDate?: string; phone?: unknown; address?: unknown };
      legalDraft.legalName = b.legalName;
      legalDraft.tradeName = b.tradeName ?? null;
      if (b.document) legalDraft.documentMasked = maskDoc(b.document);
      legalDraft.company = { siteUrl: b.siteUrl ?? null, annualRevenue: b.annualRevenue ?? null, corporationType: b.corporationType ?? null, foundingDate: b.foundingDate ?? null, address: b.address ?? legalDraft.company.address, phone: b.phone ?? legalDraft.company.phone };
      advanceDraft("ENTITY_DETAILS");
      return ok(legalDraft);
    },
  },
  {
    test: org("/legal-financial-profile/draft/legal-representative"),
    method: "patch",
    handle: ({ body }) => {
      const b = body as { document: string; motherName: string; birthdate: string; monthlyIncome: string; professionalOccupation: string };
      legalDraft.representative = { documentMasked: maskDoc(b.document), motherName: b.motherName, birthdate: b.birthdate, monthlyIncome: b.monthlyIncome, professionalOccupation: b.professionalOccupation };
      advanceDraft("LEGAL_REPRESENTATIVE");
      return ok(legalDraft);
    },
  },
  {
    test: org("/legal-financial-profile/draft/address"),
    method: "patch",
    handle: ({ body }) => {
      const b = body as { person?: unknown; personPhone?: unknown };
      if (b.person) legalDraft.company.address = b.person;
      if (b.personPhone) legalDraft.company.phone = b.personPhone;
      advanceDraft("ADDRESS");
      return ok(legalDraft);
    },
  },
  {
    test: org("/legal-financial-profile/draft/bank-account"),
    method: "patch",
    handle: ({ body }) => {
      const b = body as { bank: string; accountNumber: string; accountCheckDigit: string };
      legalDraft.bankAccountMasked = `Banco ${b.bank} · conta ****${b.accountNumber.slice(-4)}-${b.accountCheckDigit}`;
      advanceDraft("BANK_ACCOUNT");
      return ok(legalDraft);
    },
  },
  { test: org("/legal-financial-profile/recipient"), method: "get", handle: () => ok({ hasRecipient: false, recipientType: null, recipientStatus: null, kycStatus: null }) },

  // IA e conexões
  { test: org("/assistant/mcp-tokens"), method: "get", handle: () => ok({ tokens: mcpTokens, capabilities: MCP_CAPABILITIES }) },
  {
    test: org("/assistant/mcp-tokens"),
    method: "post",
    handle: ({ body }) => {
      const { name, scope } = body as { name: string; scope: MockToken["scope"] };
      const id = nextTokenId++;
      const token = `nk_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 18)}`;
      mcpTokens.unshift({ id, name, scope, tokenPrefix: token.slice(0, 12), lastUsedAt: null, createdAt: new Date().toISOString(), createdBy: "Vitor Reis" });
      return ok({ id, name, scope, tokenPrefix: token.slice(0, 12), createdAt: new Date().toISOString(), token });
    },
  },
  {
    test: org("/assistant/mcp-tokens/\\d+"),
    method: "delete",
    handle: ({ url }) => {
      const idx = mcpTokens.findIndex((t) => t.id === idFrom(url, -1));
      if (idx >= 0) mcpTokens.splice(idx, 1);
      return ok({ ok: true });
    },
  },
];
