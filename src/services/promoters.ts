import api from "@/lib/axios";

// ==================== TIPOS ====================
// Espelham exatamente as respostas do domínio Promoters (nokta-api, Fase 6).
// Todo valor monetário é sempre centavos inteiros — nunca reais/decimal.

export type OrganizationPromoterStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type AssignmentStatus = "ACTIVE" | "PAUSED" | "ENDED";
export type PromoterSource = "LINK" | "CODE";
export type CommissionType = "PERCENTAGE" | "FIXED_PER_TICKET";
export type DiscountType = "PERCENTAGE" | "FIXED";
export type DiscountScope = "ORDER" | "PER_TICKET";
export type DiscountTrigger = "LINK" | "CODE" | "BOTH";
export type SettlementStatus = "DRAFT" | "CONFIRMED" | "PAID_MANUALLY" | "CANCELLED";
export type CommissionEntryStatus = "PENDING" | "AVAILABLE" | "REVERSED" | "SETTLED" | null;

export interface OrganizationPromoter {
  id: number;
  inviteEmail: string;
  status: OrganizationPromoterStatus;
  invitedAt: string;
  acceptedAt: string | null;
  suspendedAt: string | null;
  removedAt: string | null;
  promoterProfile: { id: number; displayName: string | null; userId: number } | null;
  invitedBy: { id: number; nome: string };
}

export interface EventPromoterAssignment {
  id: number;
  eventId: number;
  status: AssignmentStatus;
  linkEnabled: boolean;
  codeEnabled: boolean;
  code: string | null;
  publicToken: string | null;
  commissionEnabled: boolean;
  commissionType: CommissionType | null;
  commissionPercentageBasisPoints: number | null;
  commissionFixedCents: number | null;
  discountEnabled: boolean;
  discountType: DiscountType | null;
  discountBasisPoints: number | null;
  discountFixedCents: number | null;
  discountScope: DiscountScope | null;
  discountTrigger: DiscountTrigger | null;
  discountMaxUses: number | null;
  discountMaxUsesPerCustomer: number | null;
  discountMaxDiscountCentsPerUse: number | null;
  discountMaxTicketsPerUse: number | null;
  discountMinOrderValueCents: number | null;
  attributionWindowDays: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  organizationPromoter: { id: number; inviteEmail: string; promoterProfile: { displayName: string | null; userId: number } | null };
  eligibleTickets: { eventTicketId: number }[];
}

export interface PromoterOrganizationEvent {
  id: number;
  nome: string;
  data: string;
  status: number;
  tickets: { id: number; nome: string | null; tipo: number; lote: number; valor: string }[];
}

export interface UpsertAssignmentPayload {
  organizationPromoterId?: number;
  eventId?: number;
  linkEnabled?: boolean;
  codeEnabled?: boolean;
  code?: string;
  commissionEnabled?: boolean;
  commissionType?: CommissionType;
  commissionPercentageBasisPoints?: number;
  commissionFixedCents?: number;
  discountEnabled?: boolean;
  discountType?: DiscountType;
  discountBasisPoints?: number;
  discountFixedCents?: number;
  discountScope?: DiscountScope;
  discountTrigger?: DiscountTrigger;
  discountMaxUses?: number;
  discountMaxUsesPerCustomer?: number;
  discountMaxDiscountCentsPerUse?: number;
  discountMaxTicketsPerUse?: number;
  discountMinOrderValueCents?: number;
  attributionWindowDays?: number;
  startsAt?: string;
  endsAt?: string;
  eligibleTicketIds?: number[];
}

export interface PromoterSale {
  attributionId: number;
  orderId?: number;
  orderCode?: string;
  status: string;
  eventId: number;
  eventName: string;
  source: PromoterSource;
  promoterOrganizationPromoterId?: number;
  promoterDisplayName?: string;
  buyerName?: string;
  buyerEmail?: string;
  originalNominalCents: number;
  discountAppliedCents: number;
  netNominalCentsAfterDiscount: number;
  commissionCents: number;
  commissionStatus: CommissionEntryStatus;
  attributedAt: string;
}

export interface OrganizationPromoterMetrics {
  promotersAtivos: number;
  linksAtivos: number;
  codigosAtivos: number;
  cliquesBrutos: number;
  cliquesUnicosEstimados: number;
  atribuicoes: number;
  reservas: number;
  pedidosPagos: number;
  ingressos: number;
  originalNominalCents: number;
  discountAppliedCents: number;
  netNominalCentsAfterDiscount: number;
  commissionPendingCents: number;
  commissionAvailableCents: number;
  commissionSettledCents: number;
  commissionReversedCents: number;
  /** Sempre <= 0 — soma dos ajustes (estorno/chargeback/bloqueio recebidos após um settlement já pago). */
  commissionAdjustmentCents: number;
  /** Disponível + liquidado + ajustes. Pode ser negativo (nunca clampado em zero). */
  netBalanceCents: number;
  taxaConversaoAtribuicaoParaPagamento: number;
}

export interface PromoterMetrics {
  cliquesBrutos: number;
  atribuicoes: number;
  pedidosPagos: number;
  ingressos: number;
  commissionPendingCents: number;
  commissionAvailableCents: number;
  commissionSettledCents: number;
  commissionReversedCents: number;
  commissionAdjustmentCents: number;
  netBalanceCents: number;
}

export type CommissionEntryType = 'EARNED' | 'ADJUSTMENT';

export interface CommissionEntry {
  id: number;
  /** EARNED (venda) ou ADJUSTMENT (correção negativa de uma comissão já liquidada). */
  type: CommissionEntryType;
  eventId: number;
  orderId: number;
  orderItemId: number | null;
  userTicketId: number | null;
  grossTicketValueCents: number;
  commissionCents: number;
  reason: string | null;
  createdAt: string;
}

export interface PromoterSettlement {
  id: number;
  organizationId: number;
  promoterProfileId: number;
  periodStart: string;
  periodEnd: string;
  totalCommissionCents: number;
  status: SettlementStatus;
  notes: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  promoterProfile?: { id: number; displayName: string | null };
  _count?: { entries: number };
}

export interface CreateSettlementDraftPayload {
  promoterProfileId: number;
  periodStart: string;
  periodEnd: string;
  commissionEntryIds: number[];
}

export interface PromoterOrganizationLink {
  id: number;
  status: OrganizationPromoterStatus;
  invitedAt: string;
  acceptedAt: string | null;
  suspendedAt: string | null;
  removedAt: string | null;
  organization: { id: number; nome: string };
}

export interface PromoterEventLink {
  id: number;
  eventId: number;
  linkEnabled: boolean;
  codeEnabled: boolean;
  code: string | null;
  publicToken: string;
  discountEnabled: boolean;
  commissionEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  event: { id: number; nome: string; data: string };
}

// ==================== API — PRODUTOR ====================

const base = (organizationId: number) => `/organizations/${organizationId}/promoters`;

export const promotersApi = {
  list: (organizationId: number) => api.get<OrganizationPromoter[]>(base(organizationId)).then((r) => r.data),
  invite: (organizationId: number, email: string) => api.post(`${base(organizationId)}/invite`, { email }).then((r) => r.data),
  resendInvite: (organizationId: number, organizationPromoterId: number) =>
    api.post(`${base(organizationId)}/${organizationPromoterId}/resend-invite`).then((r) => r.data),
  cancelInvite: (organizationId: number, organizationPromoterId: number) =>
    api.post(`${base(organizationId)}/${organizationPromoterId}/cancel-invite`).then((r) => r.data),
  suspend: (organizationId: number, organizationPromoterId: number) =>
    api.post(`${base(organizationId)}/${organizationPromoterId}/suspend`).then((r) => r.data),
  reactivate: (organizationId: number, organizationPromoterId: number) =>
    api.post(`${base(organizationId)}/${organizationPromoterId}/reactivate`).then((r) => r.data),
  remove: (organizationId: number, organizationPromoterId: number) =>
    api.post(`${base(organizationId)}/${organizationPromoterId}/remove`).then((r) => r.data),

  listOrganizationEvents: (organizationId: number) =>
    api.get<PromoterOrganizationEvent[]>(`${base(organizationId)}/events`).then((r) => r.data),

  listAssignments: (organizationId: number, eventId?: number) =>
    api.get<EventPromoterAssignment[]>(`${base(organizationId)}/assignments`, { params: eventId ? { eventId } : undefined }).then((r) => r.data),
  createAssignment: (organizationId: number, payload: UpsertAssignmentPayload) =>
    api.post<EventPromoterAssignment>(`${base(organizationId)}/assignments`, payload).then((r) => r.data),
  updateAssignment: (organizationId: number, assignmentId: number, payload: UpsertAssignmentPayload) =>
    api.patch<EventPromoterAssignment>(`${base(organizationId)}/assignments/${assignmentId}`, payload).then((r) => r.data),
  pauseAssignment: (organizationId: number, assignmentId: number) =>
    api.post(`${base(organizationId)}/assignments/${assignmentId}/pause`).then((r) => r.data),
  reactivateAssignment: (organizationId: number, assignmentId: number) =>
    api.post(`${base(organizationId)}/assignments/${assignmentId}/reactivate`).then((r) => r.data),
  regenerateToken: (organizationId: number, assignmentId: number) =>
    api.post<{ id: number; publicToken: string }>(`${base(organizationId)}/assignments/${assignmentId}/regenerate-token`).then((r) => r.data),

  listSales: (organizationId: number, params?: { eventId?: number; organizationPromoterId?: number }) =>
    api.get<PromoterSale[]>(`${base(organizationId)}/sales`, { params }).then((r) => r.data),
  getAnalytics: (organizationId: number, eventId?: number) =>
    api.get<OrganizationPromoterMetrics>(`${base(organizationId)}/analytics`, { params: eventId ? { eventId } : undefined }).then((r) => r.data),

  listAvailableEntries: (organizationId: number, promoterProfileId: number) =>
    api.get<CommissionEntry[]>(`${base(organizationId)}/settlements/available-entries`, { params: { promoterProfileId } }).then((r) => r.data),
  listSettlements: (organizationId: number, params?: { promoterProfileId?: number; status?: SettlementStatus }) =>
    api.get<PromoterSettlement[]>(`${base(organizationId)}/settlements`, { params }).then((r) => r.data),
  getSettlement: (organizationId: number, settlementId: number) =>
    api.get<PromoterSettlement>(`${base(organizationId)}/settlements/${settlementId}`).then((r) => r.data),
  createSettlementDraft: (organizationId: number, payload: CreateSettlementDraftPayload) =>
    api.post<PromoterSettlement>(`${base(organizationId)}/settlements`, payload).then((r) => r.data),
  confirmSettlement: (organizationId: number, settlementId: number) =>
    api.post<PromoterSettlement>(`${base(organizationId)}/settlements/${settlementId}/confirm`).then((r) => r.data),
  markSettlementPaid: (organizationId: number, settlementId: number, notes?: string) =>
    api.post<PromoterSettlement>(`${base(organizationId)}/settlements/${settlementId}/pay-manually`, { notes }).then((r) => r.data),
  cancelSettlement: (organizationId: number, settlementId: number) =>
    api.post<PromoterSettlement>(`${base(organizationId)}/settlements/${settlementId}/cancel`).then((r) => r.data),

  csvUrl: (organizationId: number, kind: "promoters" | "sales" | "commissions" | "settlements") => `${base(organizationId)}/export/${kind}.csv`,
};

// ==================== API — PRÓPRIO PROMOTER ====================

export const myPromoterApi = {
  getProfile: () => api.get<{ id: number; displayName: string | null; status: string; createdAt: string }>(`/me/promoter/profile`).then((r) => r.data),
  listOrganizations: () => api.get<PromoterOrganizationLink[]>(`/me/promoter/organizations`).then((r) => r.data),
  listEvents: () => api.get<PromoterEventLink[]>(`/me/promoter/events`).then((r) => r.data),
  listSales: (params?: { eventId?: number }) => api.get<PromoterSale[]>(`/me/promoter/sales`, { params }).then((r) => r.data),
  getAnalytics: (eventId?: number) => api.get<PromoterMetrics[]>(`/me/promoter/analytics`, { params: eventId ? { eventId } : undefined }).then((r) => r.data),
  listSettlements: () => api.get<PromoterSettlement[]>(`/me/promoter/settlements`).then((r) => r.data),
  getSettlement: (settlementId: number) => api.get<PromoterSettlement>(`/me/promoter/settlements/${settlementId}`).then((r) => r.data),
};

// ==================== API — CONVITE E TRACKING PÚBLICOS ====================

export interface PromoterInvitationPreview {
  organizationNome: string;
  email: string;
  expiresAt: string;
}

export const promoterInvitationApi = {
  preview: (token: string) => api.get<PromoterInvitationPreview>(`/promoter-invitations/${token}/preview`).then((r) => r.data),
  accept: (token: string) => api.post<{ organizationId: number; promoterProfileId: number }>(`/promoter-invitations/${token}/accept`).then((r) => r.data),
};

export const promoterTrackingApi = {
  resolveLink: (publicToken: string, eventSlugOrId: string, utm?: { utmSource?: string; utmMedium?: string; utmCampaign?: string }) =>
    api.post<{ valid: boolean }>(`/promoter-tracking/link`, { publicToken, eventSlugOrId, referrer: typeof document !== "undefined" ? document.referrer : undefined, ...utm }).then((r) => r.data),
  validateCode: (eventSlugOrId: string, code: string, items: { ticketId: number; quantity: number }[]) =>
    api.post<{ valid: boolean; discountApplicableCents: number; message: string }>(`/promoter-tracking/code/validate`, { eventSlugOrId, code, items }).then((r) => r.data),
};

// ==================== ACESSO (RBAC do módulo Tickets) ====================

export type TicketsRoleKey = "OWNER" | "MANAGER";

export interface TicketsMeAccess {
  organizationId: number;
  membershipId: number;
  membershipStatus: string;
  organizationRole: string;
  modules: { tickets: { role: TicketsRoleKey; permissions: string[] } | null };
}

export const ticketsAccessApi = {
  getAccess: (organizationId: number) => api.get<TicketsMeAccess>(`/organizations/${organizationId}/me/tickets-access`).then((r) => r.data),
};

// ==================== HELPERS ====================

export const ORG_PROMOTER_STATUS_LABEL: Record<OrganizationPromoterStatus, string> = {
  INVITED: "Convidado",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  REMOVED: "Removido",
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  ENDED: "Encerrado",
};

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  PAID_MANUALLY: "Pago manualmente",
  CANCELLED: "Cancelado",
};

export const COMMISSION_STATUS_LABEL: Record<Exclude<CommissionEntryStatus, null>, string> = {
  PENDING: "Pendente",
  AVAILABLE: "Disponível",
  REVERSED: "Revertida",
  SETTLED: "Acertada",
};

/** Formata centavos como reais — nunca chamar comissão calculada de comissão paga. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
