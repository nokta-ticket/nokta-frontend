import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do TeamModule (nokta-api).

export const VENUE_ROLE_KEYS = ["OWNER", "MANAGER", "RECEPTION", "WAITER", "CASHIER", "KITCHEN_BAR", "STOCK"] as const;
export type VenueRoleKey = (typeof VENUE_ROLE_KEYS)[number];

export type MemberStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
export type PermissionEffect = "ALLOW" | "DENY";

export interface VenueTeamMember {
  memberId: number;
  userId: number;
  nome: string;
  email: string;
  fotoPerfil: string | null;
  status: MemberStatus;
  isOrgOwner: boolean;
  venueRole: VenueRoleKey | null;
  createdAt: string;
}

export interface VenueTeamMemberDetail extends VenueTeamMember {
  effectivePermissions: string[];
  overrides: { permissionKey: string; effect: PermissionEffect }[];
  preparationStations: { id: number; nome: string }[];
}

export interface VenueRoleCatalogEntry {
  key: VenueRoleKey;
  label: string;
  description: string;
}

export interface VenuePermissionCatalogEntry {
  key: string;
  description: string;
}

export interface VenueTeamInvitation {
  id: number;
  email: string;
  module: string;
  roleKey: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy: { id: number; nome: string };
}

export interface VenueInvitationPreview {
  organizationNome: string;
  email: string;
  module: string;
  roleKey: string;
  roleLabel: string;
  expiresAt: string;
}

export interface VenueAccessModuleAccess {
  role: VenueRoleKey;
  permissions: string[];
  defaultRoute: string;
}

export interface VenueMeAccess {
  organizationId: number;
  membershipId: number;
  membershipStatus: MemberStatus;
  organizationRole: string;
  modules: { venue?: VenueAccessModuleAccess };
}

// ==================== PAYLOADS ====================

export interface CreateInvitationPayload {
  email: string;
  module: "venue";
  roleKey: VenueRoleKey;
}

export interface SetMemberPermissionsPayload {
  overrides: { permissionKey: string; effect: PermissionEffect }[];
}

// ==================== API ====================

const base = (organizationId: number) => `/organizations/${organizationId}/team`;

export const venueTeamApi = {
  getMyAccess: (organizationId: number) => api.get<VenueMeAccess>(`/organizations/${organizationId}/me/access`).then((r) => r.data),

  listMembers: (organizationId: number) => api.get<VenueTeamMember[]>(`${base(organizationId)}/members`).then((r) => r.data),
  getMember: (organizationId: number, memberId: number) =>
    api.get<VenueTeamMemberDetail>(`${base(organizationId)}/members/${memberId}`).then((r) => r.data),
  updateMemberStatus: (organizationId: number, memberId: number, status: "ACTIVE" | "SUSPENDED" | "REMOVED") =>
    api.patch(`${base(organizationId)}/members/${memberId}/status`, { status }).then((r) => r.data),
  updateMemberRole: (organizationId: number, memberId: number, roleKey: VenueRoleKey) =>
    api.patch(`${base(organizationId)}/members/${memberId}/module-roles/venue`, { roleKey }).then((r) => r.data),
  setMemberPermissions: (organizationId: number, memberId: number, payload: SetMemberPermissionsPayload) =>
    api.put<VenueTeamMemberDetail>(`${base(organizationId)}/members/${memberId}/permissions`, payload).then((r) => r.data),
  assignPreparationStations: (organizationId: number, memberId: number, stationIds: number[]) =>
    api.put(`${base(organizationId)}/members/${memberId}/preparation-stations`, { stationIds }).then((r) => r.data),
  removeMember: (organizationId: number, memberId: number) =>
    api.delete(`${base(organizationId)}/members/${memberId}`).then((r) => r.data),

  getRoles: (organizationId: number) =>
    api.get<{ roles: VenueRoleCatalogEntry[] }>(`${base(organizationId)}/roles`).then((r) => r.data.roles),
  getPermissions: (organizationId: number) =>
    api.get<VenuePermissionCatalogEntry[]>(`${base(organizationId)}/permissions`).then((r) => r.data),

  listInvitations: (organizationId: number) =>
    api.get<VenueTeamInvitation[]>(`${base(organizationId)}/invitations`).then((r) => r.data),
  createInvitation: (organizationId: number, payload: CreateInvitationPayload) =>
    api.post<VenueTeamInvitation>(`${base(organizationId)}/invitations`, payload).then((r) => r.data),
  resendInvitation: (organizationId: number, invitationId: number) =>
    api.post(`${base(organizationId)}/invitations/${invitationId}/resend`).then((r) => r.data),
  revokeInvitation: (organizationId: number, invitationId: number) =>
    api.post(`${base(organizationId)}/invitations/${invitationId}/revoke`).then((r) => r.data),

  previewInvitation: (token: string) =>
    api.get<VenueInvitationPreview>(`/organization-invitations/${token}/preview`).then((r) => r.data),
  acceptInvitation: (token: string) =>
    api.post<{ organizationId: number; module: string; roleKey: string }>(`/organization-invitations/${token}/accept`).then((r) => r.data),
};

// ==================== HELPERS ====================

export const VENUE_ROLE_LABEL: Record<VenueRoleKey, string> = {
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  RECEPTION: "Recepção",
  WAITER: "Garçom",
  CASHIER: "Caixa",
  KITCHEN_BAR: "Cozinha/Bar",
  STOCK: "Estoque",
};

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  SUSPENDED: "Suspenso",
  REMOVED: "Removido",
};

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  REVOKED: "Revogado",
  EXPIRED: "Expirado",
};
