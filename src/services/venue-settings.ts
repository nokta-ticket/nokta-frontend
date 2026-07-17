import api from "@/lib/axios";

export interface VenueOrganizationDetails {
  id: number;
  nome: string;
  tipo: "PF" | "PJ";
  documento: string | null;
  status: string;
  createdAt: string;
  owner: { id: number; nome: string; sobrenome: string | null; email: string };
  modules: { module: string; status: string }[];
}

export interface VenueOperationSettings {
  organizationId: number;
  defaultServiceChargeBps: number;
  requireOpenCashSessionForPayments: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVenueOperationSettingsPayload {
  defaultServiceChargeBps?: number;
  requireOpenCashSessionForPayments?: boolean;
}

export interface VenueBusinessHourInterval {
  id?: number;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  active?: boolean;
}

const base = (organizationId: number) => `/organizations/${organizationId}/venue/settings`;

export const venueSettingsApi = {
  getOrganization: (organizationId: number) => api.get<VenueOrganizationDetails>(`${base(organizationId)}/organization`).then((r) => r.data),

  getOperationSettings: (organizationId: number) => api.get<VenueOperationSettings>(`${base(organizationId)}/operation`).then((r) => r.data),
  updateOperationSettings: (organizationId: number, payload: UpdateVenueOperationSettingsPayload) =>
    api.put<VenueOperationSettings>(`${base(organizationId)}/operation`, payload).then((r) => r.data),

  getBusinessHours: (organizationId: number, locationId: number) =>
    api.get<VenueBusinessHourInterval[]>(`${base(organizationId)}/locations/${locationId}/business-hours`).then((r) => r.data),
  setBusinessHours: (organizationId: number, locationId: number, intervals: VenueBusinessHourInterval[]) =>
    api
      .put<VenueBusinessHourInterval[]>(`${base(organizationId)}/locations/${locationId}/business-hours`, { intervals })
      .then((r) => r.data),
};

export const WEEKDAY_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
