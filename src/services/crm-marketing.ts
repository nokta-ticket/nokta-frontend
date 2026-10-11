import api from "@/lib/axios";
import type { CrmChannel, CrmFilters } from "./crm";

// ── Canais ──

export type CrmAccountStatus = "PENDING" | "CONNECTED" | "ERROR" | "DISCONNECTED";

export interface CrmDnsRecord {
  purpose: "DKIM" | "SPF" | "MAIL_FROM" | "DMARC";
  type: "CNAME" | "TXT" | "MX";
  name: string;
  value: string;
  required: boolean;
}

export interface CrmChannelsOverview {
  email: {
    /** A Nokta já tem o provedor de e-mail habilitado. */
    available: boolean;
    ready: boolean;
    pending: string[];
    sender: {
      status: CrmAccountStatus;
      address: string;
      fromName: string | null;
      domain: string | null;
      localPart: string | null;
      replyTo: string | null;
      records: CrmDnsRecord[];
      dkimStatus: string | null;
      lastCheckedAt: string | null;
      lastError: string | null;
    } | null;
  };
  whatsapp: {
    available: boolean;
    sendingEnabled: boolean;
    signup: { appId: string; configId: string; graphVersion: string } | null;
    ready: boolean;
    pending: string[];
    account: {
      status: CrmAccountStatus;
      phoneNumber: string;
      verifiedName: string | null;
      businessName: string | null;
      hasFunding: boolean;
      qualityRating: string | null;
      messagingLimitTier: string | null;
      lastCheckedAt: string | null;
      lastError: string | null;
    } | null;
  };
}

export interface CrmCredits {
  email: { freeMonthly: number; freeUsed: number; freeRemaining: number; paidBalance: number; available: number; creditPriceMicros: number | null };
  whatsapp: { marketingRateMicros: number | null; utilityRateMicros: number | null; ratesCheckedAt: string | null };
}

// ── Modelos ──

export type CrmTemplateStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED";

export type EmailBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt?: string; href?: string }
  | { type: "button"; label: string; href: string }
  | { type: "divider" }
  | { type: "spacer" };

export interface EmailContent {
  subject: string;
  preheader?: string;
  accentColor?: string;
  blocks: EmailBlock[];
}

export type WhatsappButton = { type: "URL"; text: string; url: string } | { type: "QUICK_REPLY"; text: string };

export interface WhatsappContent {
  category: "MARKETING" | "UTILITY";
  language: string;
  headerText?: string;
  body: string;
  footer?: string;
  buttons: WhatsappButton[];
}

export interface CrmTemplate<C = EmailContent | WhatsappContent> {
  id: number;
  channel: CrmChannel;
  name: string;
  status: CrmTemplateStatus;
  content: C;
  /** O que falta para o modelo poder ser usado. */
  problems: string[];
  rejectionReason: string | null;
  submitted: boolean;
  statusSyncedAt: string | null;
  updatedAt: string;
}

export type CrmTemplatePreview =
  | { channel: "EMAIL"; subject: string; html: string; text: string; problems: string[] }
  | { channel: "WHATSAPP"; headerText: string | null; body: string; footer: string | null; buttons: WhatsappButton[]; problems: string[] };

// ── Campanhas ──

export type CrmCampaignStatus = "DRAFT" | "SCHEDULED" | "VALIDATING" | "QUEUED" | "SENDING" | "COMPLETED" | "PARTIALLY_FAILED" | "FAILED" | "CANCELLED";
export type CrmRecipientStatus = "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "FAILED" | "BOUNCED" | "COMPLAINED" | "SKIPPED";

export interface CrmCampaign {
  id: number;
  kind: "BROADCAST" | "INDIVIDUAL";
  channel: CrmChannel;
  name: string;
  status: CrmCampaignStatus;
  templateId: number | null;
  templateName: string | null;
  segmentId: number | null;
  segmentName?: string | null;
  filters: CrmFilters;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  estimatedRecipients: number | null;
  unitCostMicros: number | null;
  estimatedCostMicros: number | null;
  results: { recipients: number; sent: number; delivered: number; opened: number; clicked: number; failed: number; skipped: number; unsubscribed: number };
  lastError: string | null;
  createdAt: string;
}

export interface CrmCostEstimate {
  channel: CrmChannel;
  recipients: number;
  /** Micro-reais (1 real = 1.000.000). Nulo = preço ainda não definido. */
  unitCostMicros: number | null;
  totalCostMicros: number | null;
  chargedBy: "NOKTA" | "META";
  credits: { needed: number; fromFree: number; fromPaid: number; missing: number; balance: CrmCredits["email"] } | null;
  ratesCheckedAt: string | null;
}

export interface CrmCampaignEstimate {
  audience: { total: number; eligible: number; recentlyContacted: number; willReceive: number };
  cost: CrmCostEstimate;
  blockers: string[];
}

export interface CrmRecipient {
  id: number;
  contactId: number | null;
  name: string;
  address: string;
  status: CrmRecipientStatus;
  skipReason: string | null;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
}

export interface CrmCampaignInput {
  name?: string;
  channel?: CrmChannel;
  templateId?: number | null;
  segmentId?: number | null;
  filters?: CrmFilters;
}

const base = (orgId: number) => `/organizations/${orgId}/crm`;
const data = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const crmMarketingApi = {
  channels: (orgId: number) => data(api.get<CrmChannelsOverview>(`${base(orgId)}/channels`)),
  credits: (orgId: number) => data(api.get<CrmCredits>(`${base(orgId)}/credits`)),
  saveEmailSender: (orgId: number, input: { domain: string; localPart: string; fromName: string; replyTo?: string }) =>
    data(api.put<CrmChannelsOverview>(`${base(orgId)}/channels/email`, input)),
  verifyEmailSender: (orgId: number) => data(api.post<CrmChannelsOverview>(`${base(orgId)}/channels/email/verify`)),
  removeEmailSender: (orgId: number) => data(api.delete<CrmChannelsOverview>(`${base(orgId)}/channels/email`)),
  connectWhatsapp: (orgId: number, input: { code: string; wabaId: string; phoneNumberId: string }) =>
    data(api.post<CrmChannelsOverview>(`${base(orgId)}/channels/whatsapp/connect`, input)),
  syncWhatsapp: (orgId: number) => data(api.post<CrmChannelsOverview>(`${base(orgId)}/channels/whatsapp/sync`)),
  disconnectWhatsapp: (orgId: number) => data(api.delete<CrmChannelsOverview>(`${base(orgId)}/channels/whatsapp`)),

  listTemplates: (orgId: number, channel?: CrmChannel) => data(api.get<CrmTemplate[]>(`${base(orgId)}/templates`, { params: channel ? { channel } : undefined })),
  createTemplate: (orgId: number, input: { channel: CrmChannel; name: string; content: EmailContent | WhatsappContent }) => data(api.post<CrmTemplate>(`${base(orgId)}/templates`, input)),
  updateTemplate: (orgId: number, id: number, input: { name?: string; content?: EmailContent | WhatsappContent }) => data(api.patch<CrmTemplate>(`${base(orgId)}/templates/${id}`, input)),
  removeTemplate: (orgId: number, id: number) => api.delete(`${base(orgId)}/templates/${id}`),
  previewTemplate: (orgId: number, channel: CrmChannel, content: EmailContent | WhatsappContent, recipientName?: string) =>
    data(api.post<CrmTemplatePreview>(`${base(orgId)}/templates/preview`, { channel, content, recipientName })),
  testTemplate: (orgId: number, id: number) => data(api.post<{ sentTo: string }>(`${base(orgId)}/templates/${id}/test`)),
  submitTemplate: (orgId: number, id: number) => data(api.post<CrmTemplate>(`${base(orgId)}/templates/${id}/submit`)),
  syncTemplate: (orgId: number, id: number) => data(api.post<CrmTemplate>(`${base(orgId)}/templates/${id}/sync`)),

  listCampaigns: (orgId: number) => data(api.get<CrmCampaign[]>(`${base(orgId)}/campaigns`)),
  getCampaign: (orgId: number, id: number) => data(api.get<CrmCampaign>(`${base(orgId)}/campaigns/${id}`)),
  campaignRecipients: (orgId: number, id: number, page = 1) =>
    data(api.get<{ items: CrmRecipient[]; total: number; page: number; perPage: number }>(`${base(orgId)}/campaigns/${id}/recipients`, { params: { page } })),
  createCampaign: (orgId: number, input: CrmCampaignInput & { name: string; channel: CrmChannel }) => data(api.post<CrmCampaign>(`${base(orgId)}/campaigns`, input)),
  updateCampaign: (orgId: number, id: number, input: CrmCampaignInput) => data(api.patch<CrmCampaign>(`${base(orgId)}/campaigns/${id}`, input)),
  removeCampaign: (orgId: number, id: number) => api.delete(`${base(orgId)}/campaigns/${id}`),
  estimate: (orgId: number, input: { channel: CrmChannel; templateId?: number | null; segmentId?: number | null; filters?: CrmFilters; contactId?: number }) =>
    data(api.post<CrmCampaignEstimate>(`${base(orgId)}/campaigns/estimate`, input)),
  scheduleCampaign: (orgId: number, id: number, scheduledAt?: string) => data(api.post<CrmCampaign>(`${base(orgId)}/campaigns/${id}/schedule`, scheduledAt ? { scheduledAt } : {})),
  cancelCampaign: (orgId: number, id: number) => data(api.post<CrmCampaign>(`${base(orgId)}/campaigns/${id}/cancel`)),

  sendIndividual: (orgId: number, contactId: number, input: { channel: CrmChannel; templateId: number }) =>
    data(api.post<{ campaign: CrmCampaign; recipient: CrmRecipient | null }>(`${base(orgId)}/contacts/${contactId}/messages`, input)),

  unsubscribeInfo: (token: string) => data(api.get<{ organizationName: string; channel: CrmChannel; unsubscribed: boolean }>(`/crm/unsubscribe/${token}`)),
  unsubscribe: (token: string) => data(api.post<{ unsubscribed: boolean }>(`/crm/unsubscribe/${token}`)),
};

export const crmMarketingKeys = {
  channels: (orgId: number) => ["crm", orgId, "channels"] as const,
  credits: (orgId: number) => ["crm", orgId, "credits"] as const,
  templates: (orgId: number) => ["crm", orgId, "templates"] as const,
  campaigns: (orgId: number) => ["crm", orgId, "campaigns"] as const,
  campaign: (orgId: number, id: number) => ["crm", orgId, "campaign", id] as const,
  recipients: (orgId: number, id: number, page: number) => ["crm", orgId, "campaign", id, "recipients", page] as const,
  estimate: (orgId: number, input: object) => ["crm", orgId, "estimate", input] as const,
};

/** Micro-reais em texto. Valores abaixo de 1 centavo mostram as casas necessárias (um e-mail custa fração de centavo). */
export function formatMicros(micros: number | null | undefined): string {
  if (micros === null || micros === undefined) return "";
  const reais = micros / 1_000_000;
  const small = reais !== 0 && Math.abs(reais) < 0.1;
  return `R$ ${reais.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: small ? 4 : 2 })}`;
}
