import api from "@/lib/axios";

export const VENUE_BUSINESS_TYPES = ["BAR", "RESTAURANT", "BEACH_CLUB", "NIGHTCLUB", "EVENT_SPACE", "CAFE", "OTHER"] as const;
export type VenueBusinessType = (typeof VENUE_BUSINESS_TYPES)[number];

export const VENUE_BUSINESS_TYPE_LABEL: Record<VenueBusinessType, string> = {
  BAR: "Bar",
  RESTAURANT: "Restaurante",
  BEACH_CLUB: "Beach club",
  NIGHTCLUB: "Casa noturna",
  EVENT_SPACE: "Espaço de eventos",
  CAFE: "Café",
  OTHER: "Outro",
};

export const VENUE_OPERATION_MODES = ["TABLE_SERVICE", "COUNTER_SERVICE", "MIXED"] as const;
export type VenueOperationMode = (typeof VENUE_OPERATION_MODES)[number];

export const VENUE_OPERATION_MODE_LABEL: Record<VenueOperationMode, string> = {
  TABLE_SERVICE: "Só mesas",
  COUNTER_SERVICE: "Só balcão / comanda individual",
  MIXED: "Mesas e balcão",
};

export type VenueOnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED";

export interface VenueSetupChecklistItem {
  key: string;
  label: string;
  done: boolean;
  route: string;
}

export interface VenueSetupProfile {
  businessType: VenueBusinessType | null;
  operationMode: VenueOperationMode | null;
  status: VenueOnboardingStatus;
  lastStep: string | null;
  welcomeSeenAt: string | null;
  dismissedAt: string | null;
  completedAt: string | null;
}

export interface VenueSetupStatus {
  restricted: boolean;
  readyToOperate: boolean;
  progress: number;
  profile: VenueSetupProfile | null;
  requiredItems: VenueSetupChecklistItem[];
  recommendedItems: VenueSetupChecklistItem[];
  blockingItems: VenueSetupChecklistItem[];
  nextStep: string | null;
}

export interface SaveVenueSetupProfilePayload {
  businessType?: VenueBusinessType;
  operationMode?: VenueOperationMode;
  lastStep?: string;
}

const base = (organizationId: number) => `/organizations/${organizationId}/venue/setup`;

export const venueSetupApi = {
  getStatus: (organizationId: number) => api.get<VenueSetupStatus>(`${base(organizationId)}/status`).then((r) => r.data),
  saveProfile: (organizationId: number, payload: SaveVenueSetupProfilePayload) =>
    api.put<VenueSetupProfile>(`${base(organizationId)}/profile`, payload).then((r) => r.data),
  markWelcomeSeen: (organizationId: number) => api.post(`${base(organizationId)}/welcome-seen`).then((r) => r.data),
  dismiss: (organizationId: number) => api.post(`${base(organizationId)}/dismiss`).then((r) => r.data),
  complete: (organizationId: number) => api.post(`${base(organizationId)}/complete`).then((r) => r.data),
};
