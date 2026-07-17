import api from "@/lib/axios";
import type { VenueSetupStatus } from "./venue-setup";

export interface VenueHomeReservation {
  id: number;
  publicCode: string;
  customerName: string;
  partySize: number;
  startAt: string;
  status: string;
}

export interface VenueHomeCashSession {
  id: number;
  openedAt: string;
  cashRegister: { id: number; nome: string };
}

export interface VenueHomeResponse {
  hasLocation: boolean;
  locations: { id: number; nome: string; isMain: boolean }[];
  location: { id: number; nome: string; timezone: string } | null;
  date: string | null;
  tables: { total: number; occupied: number } | null;
  openTabsCount: number | null;
  cashSessions: VenueHomeCashSession[] | null;
  todaysReservations: VenueHomeReservation[] | null;
  waitlistCount: number | null;
  ordersInPreparationCount: number | null;
  ordersReadyCount: number | null;
  lowStockCount: number | null;
  outOfStockCount: number | null;
  overduePayablesCount: number | null;
  cashDiscrepancyCount: number | null;
  financeSummary: { totalCents: number; paymentsCount: number } | null;
  onboarding: VenueSetupStatus;
  shortcuts: string[];
}

export const venueHomeApi = {
  get: (organizationId: number, params: { locationId?: number; date?: string } = {}) =>
    api
      .get<VenueHomeResponse>(`/organizations/${organizationId}/venue/home`, { params })
      .then((r) => r.data),
};
