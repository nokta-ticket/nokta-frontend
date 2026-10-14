import api from "@/lib/axios";

export type CrmChannel = "EMAIL" | "WHATSAPP";
export type CrmSourceType = "PURCHASE" | "TICKET_RECEIVED" | "IMPORT" | "SIGNUP";
export type CrmIneligibleReason = "NO_ADDRESS" | "SUPPRESSED" | "OPTED_OUT" | "NO_CONSENT";
export type CrmSuppressionReason = "UNSUBSCRIBED" | "MANUAL_BLOCK" | "BOUNCE" | "COMPLAINT" | "INVALID";

export interface CrmChannelState {
  eligible: boolean;
  reason: CrmIneligibleReason | null;
  legalBasis: "CONSENT" | "LEGITIMATE_INTEREST" | null;
  preference: "NOT_ASKED" | "OPTED_IN" | "OPTED_OUT";
  suppressionReason: CrmSuppressionReason | null;
}

export interface CrmContact {
  id: number;
  hasAccount: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  sources: CrmSourceType[];
  ordersCount: number;
  eventsCount: number;
  spentCents: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
  channels: Record<CrmChannel, CrmChannelState>;
}

export interface CrmCounts {
  total: number;
  emailEligible: number;
  whatsappEligible: number;
}

export interface CrmOverview extends CrmCounts {
  recurring: number;
  inactive90Days: number;
}

/** Filtros de público. Todos combinam com E. Mesmo formato na lista e no público salvo. */
export interface CrmFilters {
  search?: string;
  sources?: CrmSourceType[];
  purchasedEventIds?: number[];
  attendedEventIds?: number[];
  ticketTypeIds?: number[];
  purchasedFrom?: string;
  purchasedTo?: string;
  inactiveDays?: number;
  minOrders?: number;
  eligibleChannel?: CrmChannel;
}

export type CrmContactSort = "name" | "lastPurchase" | "spent" | "orders" | "created";

export interface CrmContactList {
  items: CrmContact[];
  page: number;
  perPage: number;
  total: number;
  counts: CrmCounts;
  /** Preenchido quando a leitura de compras e VIPs falhou: a lista pode estar sem os contatos mais novos. */
  syncError?: string | null;
}

export interface CrmContactDetail extends CrmContact {
  sourceDetails: {
    type: CrmSourceType;
    occurredAt: string;
    eventId: number | null;
    eventName: string | null;
    import: { id: number; fileName: string; originDescription: string; createdAt: string } | null;
  }[];
  preferences: { channel: CrmChannel; status: "OPTED_IN" | "OPTED_OUT"; legalBasis: string | null; evidence: string | null; updatedAt: string }[];
  purchases: {
    orderId: number;
    code: string;
    boughtAt: string;
    paymentMethod: string | null;
    eventId: number | null;
    eventName: string | null;
    items: { ticketType: string | null; quantity: number }[];
    ticketsValueCents: number;
  }[];
  tickets: { ticketId: number; eventId: number | null; eventName: string | null; eventDate: string | null; ticketType: string | null; attended: boolean; received: boolean }[];
}

export interface CrmSegment {
  id: number;
  name: string;
  description: string | null;
  filters: CrmFilters;
  createdAt: string;
  updatedAt: string;
  counts: CrmCounts;
}

export interface CrmFilterOptions {
  events: { id: number; name: string; date: string; ticketTypes: { id: number; name: string }[] }[];
}

export type CrmImportProblem = "SEM_CONTATO" | "EMAIL_INVALIDO" | "TELEFONE_INVALIDO" | "DUPLICADO_NO_ARQUIVO";

export interface CrmImportPreview {
  totalRows: number;
  willCreate: number;
  willMerge: number;
  suppressed: number;
  problems: Partial<Record<CrmImportProblem, number>>;
  problemSamples: { line: number; problem: CrmImportProblem }[];
  /** Amostra das linhas que entram, na ordem do arquivo. */
  rows: { line: number; name: string; email: string | null; phone: string | null; status: "NEW" | "EXISTING" }[];
}

export type CrmImportLegalBasis = "CONSENT" | "LEGITIMATE_INTEREST" | "NONE";

export interface CrmImportDeclaration {
  originDescription: string;
  purpose: string;
  legalBasis: CrmImportLegalBasis;
  consentEmail: boolean;
  consentWhatsapp: boolean;
  legitimacyConfirmed: boolean;
}

export interface CrmImportRecord {
  id: number;
  fileName: string;
  originDescription: string;
  consentEmail: boolean;
  consentWhatsapp: boolean;
  purpose: string | null;
  legalBasis: "CONSENT" | "LEGITIMATE_INTEREST" | null;
  totalRows: number;
  createdCount: number;
  mergedCount: number;
  invalidCount: number;
  duplicateCount: number;
  createdAt: string;
}

const base = (orgId: number) => `/organizations/${orgId}/crm`;
/** O cliente HTTP manda JSON por padrão; arquivo precisa sair como multipart. */
const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

/** Listas viram "1,2,3" na query string (o backend aceita os dois formatos). */
function toParams(filters: CrmFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value.join(",");
    } else {
      out[key] = value as string | number;
    }
  }
  return out;
}

export const crmApi = {
  overview: (orgId: number) => api.get<CrmOverview>(`${base(orgId)}/overview`).then((r) => r.data),
  filterOptions: (orgId: number) => api.get<CrmFilterOptions>(`${base(orgId)}/filter-options`).then((r) => r.data),

  listContacts: (orgId: number, filters: CrmFilters, paging: { page: number; perPage: number; sort: CrmContactSort; dir: "asc" | "desc" }) =>
    api.get<CrmContactList>(`${base(orgId)}/contacts`, { params: { ...toParams(filters), ...paging } }).then((r) => r.data),
  getContact: (orgId: number, id: number) => api.get<CrmContactDetail>(`${base(orgId)}/contacts/${id}`).then((r) => r.data),
  exportContacts: (orgId: number, filters: CrmFilters) =>
    api.get<Blob>(`${base(orgId)}/contacts/export`, { params: toParams(filters), responseType: "blob" }).then((r) => r.data),

  recordConsent: (orgId: number, id: number, channel: CrmChannel, evidence: string) =>
    api.post<CrmContactDetail>(`${base(orgId)}/contacts/${id}/consent`, { channel, evidence }).then((r) => r.data),
  unsubscribe: (orgId: number, id: number, channel: CrmChannel) =>
    api.post<CrmContactDetail>(`${base(orgId)}/contacts/${id}/unsubscribe`, { channel }).then((r) => r.data),
  block: (orgId: number, id: number, note?: string) => api.post<CrmContactDetail>(`${base(orgId)}/contacts/${id}/block`, { note }).then((r) => r.data),
  unblock: (orgId: number, id: number) => api.delete<CrmContactDetail>(`${base(orgId)}/contacts/${id}/block`).then((r) => r.data),
  removeContact: (orgId: number, id: number) => api.delete(`${base(orgId)}/contacts/${id}`),

  listSegments: (orgId: number) => api.get<CrmSegment[]>(`${base(orgId)}/segments`).then((r) => r.data),
  createSegment: (orgId: number, input: { name: string; description?: string; filters: CrmFilters }) =>
    api.post<CrmSegment>(`${base(orgId)}/segments`, input).then((r) => r.data),
  removeSegment: (orgId: number, id: number) => api.delete(`${base(orgId)}/segments/${id}`),

  listImports: (orgId: number) => api.get<CrmImportRecord[]>(`${base(orgId)}/imports`).then((r) => r.data),
  previewImport: (orgId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<CrmImportPreview>(`${base(orgId)}/imports/preview`, form, MULTIPART).then((r) => r.data);
  },
  commitImport: (orgId: number, file: File, declaration: CrmImportDeclaration) => {
    const form = new FormData();
    form.append("file", file);
    for (const [key, value] of Object.entries(declaration)) form.append(key, String(value));
    return api.post<CrmImportPreview & { importId: number }>(`${base(orgId)}/imports`, form, MULTIPART).then((r) => r.data);
  },
};

export const crmKeys = {
  all: (orgId: number) => ["crm", orgId] as const,
  overview: (orgId: number) => ["crm", orgId, "overview"] as const,
  options: (orgId: number) => ["crm", orgId, "options"] as const,
  contacts: (orgId: number, params: object) => ["crm", orgId, "contacts", params] as const,
  contact: (orgId: number, id: number) => ["crm", orgId, "contact", id] as const,
  segments: (orgId: number) => ["crm", orgId, "segments"] as const,
  imports: (orgId: number) => ["crm", orgId, "imports"] as const,
};
