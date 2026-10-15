import type { StatusMeta } from "../../_lib/status-meta";

export type CampaignStatus = "SCHEDULED" | "PREPARING" | "SENDING" | "COMPLETED" | "PARTIALLY_FAILED" | "FAILED" | "CANCELED";
export type TemplateStatus = "NOT_SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED";

export const CAMPAIGN_STATUS_META: Record<CampaignStatus, StatusMeta> = {
  SCHEDULED: { label: "Agendada", tone: "info" },
  PREPARING: { label: "Preparando", tone: "info" },
  SENDING: { label: "Enviando", tone: "brand" },
  COMPLETED: { label: "Concluída", tone: "success" },
  PARTIALLY_FAILED: { label: "Concluída com falhas", tone: "warning" },
  FAILED: { label: "Falhou", tone: "danger" },
  CANCELED: { label: "Cancelada", tone: "neutral" },
};

export const TEMPLATE_STATUS_META: Record<TemplateStatus, StatusMeta> = {
  NOT_SUBMITTED: { label: "Não enviado", tone: "neutral" },
  IN_REVIEW: { label: "Em análise na Meta", tone: "info" },
  APPROVED: { label: "Aprovado pela Meta", tone: "success" },
  REJECTED: { label: "Recusado pela Meta", tone: "danger" },
  PAUSED: { label: "Pausado pela Meta", tone: "warning" },
  DISABLED: { label: "Desativado pela Meta", tone: "danger" },
};

export const SKIP_REASON_LABEL: Record<string, string> = {
  NO_LONGER_ELIGIBLE: "Desautorizou ou trocou de telefone antes do envio",
  STOPPED_ON_WHATSAPP: "Parou as mensagens da Nokta no WhatsApp",
};

export interface ChannelStatus {
  configured: boolean;
  sendingEnabled: boolean;
  metaAppConfigured: boolean;
  phone: {
    displayPhone: string | null;
    verifiedName: string | null;
    qualityRating: string | null;
    messagingLimitTier: string | null;
    status: string | null;
    appSubscribedAt: string | null;
    checkedAt: string | null;
    lastError: string | null;
  } | null;
  templates: {
    key: string;
    label: string;
    metaName: string;
    body: string;
    footer: string;
    buttons: string[];
    status: TemplateStatus;
    rejectedReason: string | null;
    submittedAt: string | null;
    checkedAt: string | null;
  }[];
  consent: { optedIn: number; optedOut: number; unknown: number };
}

export interface CampaignRow {
  id: number;
  status: CampaignStatus;
  eventId: number;
  eventName: string;
  organizationName: string;
  scheduledAt: string;
  recipientsTotal: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  optOutCount: number;
  priceCents: number | null;
  createdAt: string;
}

export interface MessagePreview {
  templateKey: string;
  imageUrl: string | null;
  body: string;
  footer: string;
  buttons: string[];
  link: string;
}

export interface PromoAudience {
  cities: string[];
  producerBuyers: boolean;
  allOptedIn: boolean;
  activeWithinDays: number | null;
  maxRecipients: number | null;
}

export interface CampaignDetail {
  id: number;
  status: CampaignStatus;
  event: { id: number; nome: string; organizationName: string };
  audience: PromoAudience;
  couponCode: string | null;
  priceCents: number | null;
  notes: string | null;
  scheduledAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  lastError: string | null;
  counters: { recipientsTotal: number; sent: number; delivered: number; read: number; failed: number; skipped: number; optOut: number; boughtAfter: number };
  breakdown: { status: string; skipReason: string | null; total: number }[];
  topErrors: { error: string | null; total: number }[];
  preview: MessagePreview;
  createdAt: string;
}

export interface EventOption {
  id: number;
  nome: string;
  slug: string | null;
  organizationId: number;
  organizationName: string;
  whenText: string;
  city: string | null;
  uf: string | null;
  imageUrl: string | null;
  salesOpen: boolean;
}

export interface Simulation {
  event: { id: number; nome: string; organizationName: string; city: string | null };
  preview: MessagePreview;
  counts: { matching: number; withTicket: number; frequencyCapped: number; willReceive: number } | null;
  problems: string[];
}

/** Qualidade do número como a Meta informa (GREEN/YELLOW/RED). */
export const QUALITY_META: Record<string, StatusMeta> = {
  GREEN: { label: "Qualidade alta", tone: "success" },
  YELLOW: { label: "Qualidade média", tone: "warning" },
  RED: { label: "Qualidade baixa", tone: "danger" },
};

export function percent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
