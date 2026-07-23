import api from "@/lib/axios";

// ── Perfil operacional ──

export const ORG_SEGMENTS = [
  "EVENT_PRODUCER",
  "BAR",
  "RESTAURANT",
  "NIGHTCLUB",
  "BEACH_CLUB",
  "EVENT_VENUE",
  "FESTIVAL",
  "CAFE",
  "ENTERTAINMENT",
  "OTHER",
] as const;
export type OrgSegment = (typeof ORG_SEGMENTS)[number];

export const ORG_SEGMENT_LABEL: Record<OrgSegment, string> = {
  EVENT_PRODUCER: "Produtora de eventos",
  BAR: "Bar",
  RESTAURANT: "Restaurante",
  NIGHTCLUB: "Casa noturna",
  BEACH_CLUB: "Beach club",
  EVENT_VENUE: "Espaço de eventos",
  FESTIVAL: "Festival",
  CAFE: "Café",
  ENTERTAINMENT: "Entretenimento",
  OTHER: "Outro",
};

export const ORG_OPERATION_MODES = [
  "TICKETING",
  "GUEST_LIST",
  "RESERVATIONS",
  "TABLE_SERVICE",
  "COUNTER_SERVICE",
  "TAB_SERVICE",
  "QUICK_SERVICE",
  "EVENT_CONSUMPTION",
  "MULTI_LOCATION",
] as const;
export type OrgOperationMode = (typeof ORG_OPERATION_MODES)[number];

export const ORG_OPERATION_MODE_LABEL: Record<OrgOperationMode, string> = {
  TICKETING: "Vendo ingressos antecipadamente",
  GUEST_LIST: "Trabalho com convidados ou listas",
  RESERVATIONS: "Aceito reservas",
  TABLE_SERVICE: "Atendo por mesas",
  COUNTER_SERVICE: "Atendo no balcão",
  TAB_SERVICE: "Trabalho com comandas",
  QUICK_SERVICE: "Atendimento rápido / balcão",
  EVENT_CONSUMPTION: "Vendo consumo dentro de eventos",
  MULTI_LOCATION: "Possuo várias unidades",
};

export interface BusinessProfile {
  organizationId: number;
  exists: boolean;
  segments: OrgSegment[];
  operationModes: OrgOperationMode[];
  hasPhysicalVenue: boolean;
  numberOfLocations: number | null;
  sellsAdvanceTickets: boolean;
  acceptsReservations: boolean;
  usesGuestLists: boolean;
  usesTables: boolean;
  usesTabs: boolean;
  usesCounterService: boolean;
  sellsFoodOrBeverages: boolean;
  usesPreparationStations: boolean;
  controlsInventory: boolean;
  worksWithPromoters: boolean;
  wantsFinancialManagement: boolean;
  wantsBusinessInsights: boolean;
  profileCompletedAt: string | null;
  reviewedAt: string | null;
}

export type SaveBusinessProfilePayload = Partial<
  Omit<BusinessProfile, "organizationId" | "exists" | "profileCompletedAt" | "reviewedAt">
> & { markCompleted?: boolean };

// ── Capacidades ──

export type CapabilityGroup = "CORE" | "EVENTS" | "RELATIONSHIP" | "OPERATION" | "PRODUCTS" | "MANAGEMENT";

export const CAPABILITY_GROUP_LABEL: Record<CapabilityGroup, string> = {
  CORE: "Plataforma",
  EVENTS: "Eventos",
  RELATIONSHIP: "Relacionamento",
  OPERATION: "Operação",
  PRODUCTS: "Produtos",
  MANAGEMENT: "Gestão",
};

export type CapabilityStatus = "ACTIVE" | "AVAILABLE" | "DISABLED" | "COMING_SOON" | "LOCKED_FUTURE";

export interface Capability {
  key: string;
  label: string;
  description: string;
  group: CapabilityGroup;
  technicalModule: string;
  route: string;
  dependencies: string[];
  status: CapabilityStatus;
  source: string | null;
  activatedAt: string | null;
  deactivatedAt: string | null;
}

// ── Explore a Nokta ──

export interface ExploreRequirement {
  key: string;
  label: string;
  active: boolean;
}

export interface ExploreCard {
  key: string;
  name: string;
  description: string;
  problemSolved: string;
  status: CapabilityStatus;
  isActive: boolean;
  requirements: ExploreRequirement[];
  dependenciesMet: boolean;
  configureRoute: string;
}

export interface ExploreGroup {
  group: CapabilityGroup;
  groupLabel: string;
  cards: ExploreCard[];
}

// ── Recomendações ──

export interface Recommendation {
  capabilityKey: string;
  label: string;
  priority: number;
  reason: string;
  route: string;
  dismissible: true;
}

// ── Navegação ──

export interface NavigationItem {
  key: string;
  label: string;
  route: string;
  group: CapabilityGroup;
}

export interface Navigation {
  items: NavigationItem[];
  /** true quando o membro é OWNER/MANAGER — só então "Explore a Nokta" deve aparecer. */
  canExplore: boolean;
}

// ── Home (v1) ──

export interface HomeChecklistItem {
  key: string;
  label: string;
  route: string;
  done: boolean;
}

export interface HomeChecklistGroup {
  title: string;
  items: HomeChecklistItem[];
}

export interface PlatformHome {
  organizationId: number;
  activeCapabilityKeys: string[];
  sections: {
    events?: { upcomingEventsCount: number; nextEvent: { id: number; nome: string; data: string } | null };
    operation?: { openTabsCount: number; openCashSessionsCount: number; activeLocationsCount: number };
    reservations?: { todayReservationsCount: number };
  };
  checklist: HomeChecklistGroup[];
}

// ── Necessidades do negócio (onboarding + Explore por grupos) ──

export type BusinessNeedKey = "EVENTS_TICKETING" | "RELATIONSHIP" | "OPERATION" | "MENU_PRODUCTS" | "STOCK_PURCHASING" | "MANAGEMENT";

export interface BusinessNeedCapability {
  key: string;
  label: string;
  description: string;
  /** Não pode ser desmarcada — é dependência obrigatória de outra capacidade já selecionada. */
  required: boolean;
  requiredReason: string | null;
}

export interface BusinessNeedGroup {
  key: BusinessNeedKey;
  label: string;
  description: string;
  defaultSelected: boolean;
  capabilities: BusinessNeedCapability[];
}

export interface BusinessNeedsActivationPreview {
  groups: { key: string; label: string; capabilityKeys: string[] }[];
  allCapabilityKeys: string[];
  autoIncludedKeys: string[];
}

export interface ActivateBusinessNeedsPayload {
  businessNeedKeys: string[];
  /** Omitir ativa todas as capacidades default dos grupos escolhidos. */
  capabilityKeys?: string[];
}

// ── /me/contexts ──

export interface MeContexts {
  personalAccount: { userId: number };
  organizations: { organizationId: number; name: string; isOwner: boolean }[];
  promoterContext: null;
}

// ── Cliente ──

const base = (organizationId: number) => `/organizations/${organizationId}`;

export const platformApi = {
  getBusinessProfile: (organizationId: number) => api.get<BusinessProfile>(`${base(organizationId)}/business-profile`).then((r) => r.data),
  saveBusinessProfile: (organizationId: number, payload: SaveBusinessProfilePayload) =>
    api.put<BusinessProfile>(`${base(organizationId)}/business-profile`, payload).then((r) => r.data),

  getCapabilities: (organizationId: number) => api.get<Capability[]>(`${base(organizationId)}/capabilities`).then((r) => r.data),
  activateCapability: (organizationId: number, key: string) =>
    api.post(`${base(organizationId)}/capabilities/${key}/activate`).then((r) => r.data),
  deactivateCapability: (organizationId: number, key: string) =>
    api.post(`${base(organizationId)}/capabilities/${key}/deactivate`).then((r) => r.data),

  getExplore: (organizationId: number) => api.get<ExploreGroup[]>(`${base(organizationId)}/explore`).then((r) => r.data),

  getRecommendations: (organizationId: number) => api.get<Recommendation[]>(`${base(organizationId)}/recommendations`).then((r) => r.data),
  dismissRecommendation: (organizationId: number, key: string) =>
    api.post(`${base(organizationId)}/recommendations/${key}/dismiss`).then((r) => r.data),

  getNavigation: (organizationId: number) => api.get<Navigation>(`${base(organizationId)}/me/navigation`).then((r) => r.data),

  getHome: (organizationId: number) => api.get<PlatformHome>(`${base(organizationId)}/platform-home`).then((r) => r.data),

  getMeContexts: () => api.get<MeContexts>("/me/contexts").then((r) => r.data),

  getBusinessNeedsCatalog: (organizationId: number) =>
    api.get<BusinessNeedGroup[]>(`${base(organizationId)}/capabilities/business-needs/catalog`).then((r) => r.data),
  previewBusinessNeedsActivation: (organizationId: number, payload: ActivateBusinessNeedsPayload) =>
    api.post<BusinessNeedsActivationPreview>(`${base(organizationId)}/capabilities/business-needs/preview`, payload).then((r) => r.data),
  activateBusinessNeeds: (organizationId: number, payload: ActivateBusinessNeedsPayload) =>
    api.post(`${base(organizationId)}/capabilities/activate-business-needs`, payload).then((r) => r.data),
};
