import api from "@/lib/axios";
import type { VenueTab } from "./venue-operation";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do VenueReservationsModule (nokta-api).

export type VenueReservationStatus = "PENDING" | "CONFIRMED" | "SEATED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
export type VenueReservationSource = "PHONE" | "WHATSAPP" | "INSTAGRAM" | "WEBSITE" | "WALK_IN" | "INTERNAL" | "OTHER";
export type VenueWaitlistStatus = "WAITING" | "NOTIFIED" | "SEATED" | "LEFT" | "CANCELED";

export interface VenueReservationTableInfo {
  id: number;
  reservationId: number;
  tableId: number;
  isPrimary: boolean;
  createdAt: string;
  table: { id: number; nome: string; areaId: number };
}

export interface VenueReservationTabInfo {
  id: number;
  publicCode: string;
  status: string;
}

export interface VenueReservation {
  id: number;
  organizationId: number;
  locationId: number;
  publicCode: string;
  status: VenueReservationStatus;
  source: VenueReservationSource;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  partySize: number;
  startAt: string;
  endAt: string;
  preferredAreaId: number | null;
  notes: string | null;
  internalNotes: string | null;
  cancelReason: string | null;
  version: number;
  createdByUserId: number;
  confirmedByUserId: number | null;
  seatedByUserId: number | null;
  canceledByUserId: number | null;
  noShowByUserId: number | null;
  completedByUserId: number | null;
  confirmedAt: string | null;
  seatedAt: string | null;
  canceledAt: string | null;
  noShowAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tables: VenueReservationTableInfo[];
  preferredArea: { id: number; nome: string } | null;
  tab: VenueReservationTabInfo | null;
}

export interface VenueWaitlistEntry {
  id: number;
  organizationId: number;
  locationId: number;
  publicCode: string;
  status: VenueWaitlistStatus;
  customerName: string;
  customerPhone: string;
  partySize: number;
  preferredAreaId: number | null;
  estimatedWaitMinutes: number | null;
  notes: string | null;
  version: number;
  createdByUserId: number;
  notifiedByUserId: number | null;
  seatedByUserId: number | null;
  canceledByUserId: number | null;
  notifiedAt: string | null;
  seatedAt: string | null;
  canceledAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  preferredArea: { id: number; nome: string } | null;
  tab: VenueReservationTabInfo | null;
}

export interface VenueAvailabilityTable {
  id: number;
  nome: string;
  capacidade: number | null;
  available: boolean;
  occupiedByOpenTab: boolean;
  blockedByReservation: boolean;
}

export interface VenueAvailabilityArea {
  id: number;
  nome: string;
  tables: VenueAvailabilityTable[];
}

export interface VenueAvailabilityResponse {
  locationId: number;
  partySize: number;
  startAt: string;
  endAt: string;
  areas: VenueAvailabilityArea[];
  suggestedCombination: number[] | null;
}

export interface VenueReservationsSummary {
  date: string;
  totalReservations: number;
  expectedPeople: number;
  pending: number;
  confirmed: number;
  seated: number;
  completed: number;
  canceled: number;
  noShow: number;
  waitlistCount: number;
  averageWaitMinutes: number | null;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

// ==================== PAYLOADS ====================

export interface CreateVenueReservationPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  startAt: string;
  endAt?: string;
  source?: VenueReservationSource;
  preferredAreaId?: number;
  tableIds?: number[];
  primaryTableId?: number;
  notes?: string;
  internalNotes?: string;
  confirmed?: boolean;
}

export interface UpdateVenueReservationPayload {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize?: number;
  startAt?: string;
  endAt?: string;
  source?: VenueReservationSource;
  preferredAreaId?: number;
  notes?: string;
  internalNotes?: string;
  version: number;
}

export interface SetReservationTablesPayload {
  tableIds: number[];
  primaryTableId?: number;
  version: number;
}

export interface CancelReservationPayload {
  reason: string;
}

export interface NoShowReservationPayload {
  force?: boolean;
}

export interface SeatReservationPayload {
  tableIds?: number[];
  primaryTableId?: number;
}

export interface ReservationQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: VenueReservationStatus;
  source?: VenueReservationSource;
  search?: string;
  areaId?: number;
  tableId?: number;
  page?: number;
  limit?: number;
}

export interface AvailabilityQueryParams {
  locationId: number;
  startAt: string;
  endAt?: string;
  partySize: number;
  areaId?: number;
  reservationId?: number;
}

export interface CreateVenueWaitlistEntryPayload {
  customerName: string;
  customerPhone: string;
  partySize: number;
  preferredAreaId?: number;
  estimatedWaitMinutes?: number;
  notes?: string;
}

export interface UpdateVenueWaitlistEntryPayload {
  customerName?: string;
  customerPhone?: string;
  partySize?: number;
  preferredAreaId?: number;
  estimatedWaitMinutes?: number;
  notes?: string;
  version: number;
}

export interface SeatWaitlistEntryPayload {
  tableIds: number[];
  primaryTableId?: number;
}

export interface CancelWaitlistEntryPayload {
  reason: string;
}

export interface WaitlistQueryParams {
  status?: VenueWaitlistStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/venue/reservations`;

export const venueReservationsApi = {
  // ---- Reservas ----
  list: (orgId: number, locationId: number, params: ReservationQueryParams = {}) =>
    api
      .get<Paginated<VenueReservation>>(`${base(orgId)}/locations/${locationId}`, { params })
      .then((r) => r.data),
  create: (orgId: number, locationId: number, payload: CreateVenueReservationPayload) =>
    api.post<VenueReservation>(`${base(orgId)}/locations/${locationId}`, payload).then((r) => r.data),
  getOne: (orgId: number, reservationId: number) =>
    api.get<VenueReservation>(`${base(orgId)}/${reservationId}`).then((r) => r.data),
  update: (orgId: number, reservationId: number, payload: UpdateVenueReservationPayload) =>
    api.patch<VenueReservation>(`${base(orgId)}/${reservationId}`, payload).then((r) => r.data),
  confirm: (orgId: number, reservationId: number) =>
    api.post<VenueReservation>(`${base(orgId)}/${reservationId}/confirm`).then((r) => r.data),
  cancel: (orgId: number, reservationId: number, payload: CancelReservationPayload) =>
    api.post<VenueReservation>(`${base(orgId)}/${reservationId}/cancel`, payload).then((r) => r.data),
  noShow: (orgId: number, reservationId: number, payload: NoShowReservationPayload) =>
    api.post<VenueReservation>(`${base(orgId)}/${reservationId}/no-show`, payload).then((r) => r.data),
  seat: (orgId: number, reservationId: number, payload: SeatReservationPayload) =>
    api
      .post<{ reservation: VenueReservation; tab: VenueTab }>(`${base(orgId)}/${reservationId}/seat`, payload)
      .then((r) => r.data),
  complete: (orgId: number, reservationId: number) =>
    api.post<VenueReservation>(`${base(orgId)}/${reservationId}/complete`).then((r) => r.data),
  setTables: (orgId: number, reservationId: number, payload: SetReservationTablesPayload) =>
    api.put<VenueReservation>(`${base(orgId)}/${reservationId}/tables`, payload).then((r) => r.data),

  // ---- Disponibilidade ----
  availability: (orgId: number, params: AvailabilityQueryParams) =>
    api.get<VenueAvailabilityResponse>(`${base(orgId)}/availability`, { params }).then((r) => r.data),

  // ---- Resumo ----
  summary: (orgId: number, locationId: number, date: string) =>
    api
      .get<VenueReservationsSummary>(`${base(orgId)}/locations/${locationId}/summary`, { params: { date } })
      .then((r) => r.data),

  // ---- Fila de espera ----
  listWaitlist: (orgId: number, locationId: number, params: WaitlistQueryParams = {}) =>
    api
      .get<Paginated<VenueWaitlistEntry>>(`${base(orgId)}/locations/${locationId}/waitlist`, { params })
      .then((r) => r.data),
  createWaitlistEntry: (orgId: number, locationId: number, payload: CreateVenueWaitlistEntryPayload) =>
    api.post<VenueWaitlistEntry>(`${base(orgId)}/locations/${locationId}/waitlist`, payload).then((r) => r.data),
  getWaitlistEntry: (orgId: number, entryId: number) =>
    api.get<VenueWaitlistEntry>(`${base(orgId)}/waitlist/${entryId}`).then((r) => r.data),
  updateWaitlistEntry: (orgId: number, entryId: number, payload: UpdateVenueWaitlistEntryPayload) =>
    api.patch<VenueWaitlistEntry>(`${base(orgId)}/waitlist/${entryId}`, payload).then((r) => r.data),
  notifyWaitlistEntry: (orgId: number, entryId: number) =>
    api.post<VenueWaitlistEntry>(`${base(orgId)}/waitlist/${entryId}/notify`).then((r) => r.data),
  seatWaitlistEntry: (orgId: number, entryId: number, payload: SeatWaitlistEntryPayload) =>
    api
      .post<{ entry: VenueWaitlistEntry; tab: VenueTab }>(`${base(orgId)}/waitlist/${entryId}/seat`, payload)
      .then((r) => r.data),
  markWaitlistEntryLeft: (orgId: number, entryId: number) =>
    api.post<VenueWaitlistEntry>(`${base(orgId)}/waitlist/${entryId}/left`).then((r) => r.data),
  cancelWaitlistEntry: (orgId: number, entryId: number, payload: CancelWaitlistEntryPayload) =>
    api.post<VenueWaitlistEntry>(`${base(orgId)}/waitlist/${entryId}/cancel`, payload).then((r) => r.data),
};

// ==================== HELPERS ====================

export const VENUE_RESERVATION_STATUS_LABEL: Record<VenueReservationStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  SEATED: "Sentado",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  NO_SHOW: "No-show",
};

export const VENUE_RESERVATION_SOURCE_LABEL: Record<VenueReservationSource, string> = {
  PHONE: "Telefone",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  WEBSITE: "Site",
  WALK_IN: "Walk-in",
  INTERNAL: "Interno",
  OTHER: "Outro",
};

export const VENUE_WAITLIST_STATUS_LABEL: Record<VenueWaitlistStatus, string> = {
  WAITING: "Aguardando",
  NOTIFIED: "Avisado",
  SEATED: "Sentado",
  LEFT: "Desistiu",
  CANCELED: "Cancelado",
};
