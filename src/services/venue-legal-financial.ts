import api from "@/lib/axios";

export type LegalType = "INDIVIDUAL" | "COMPANY";
export type VerificationStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "LEGACY_REVIEW_REQUIRED"
  | "FINANCIAL_REVIEW_REQUIRED";
export type FinancialDestinationStatus = "NOT_SET" | "UNVERIFIED" | "VERIFIED";
export type RecipientAttemptState =
  | "NOT_APPLICABLE"
  | "RECIPIENT_PENDING"
  | "RECIPIENT_IN_PROGRESS"
  | "RECIPIENT_ERROR"
  | "RECIPIENT_CREATED";

// Progresso do wizard (draftStep/formStatus) — nunca confundido com
// verificationStatus/recipientStatus/kycStatus, que refletem a Pagar.me.
export type DraftStep = "RESPONSIBLE_TYPE" | "ENTITY_DETAILS" | "LEGAL_REPRESENTATIVE" | "ADDRESS" | "BANK_ACCOUNT" | "REVIEW";
export type FormStatus = "DRAFT" | "READY_TO_SUBMIT" | "SUBMITTING" | "SUBMITTED";

export interface LegalFinancialAddress {
  street: string;
  complementary: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  referencePoint: string | null;
}

export interface LegalFinancialPhone {
  ddd: string;
  number: string;
}

export interface LegalFinancialDraft {
  organizationId: number;
  legalType: LegalType | null;
  draftStep: DraftStep;
  formStatus: FormStatus;
  draftUpdatedAt: string | null;
  legalName: string | null;
  tradeName: string | null;
  documentMasked: string | null;
  company: {
    siteUrl: string | null;
    annualRevenue: string | null;
    corporationType: string | null;
    foundingDate: string | null;
    address: LegalFinancialAddress | null;
    phone: LegalFinancialPhone | null;
  };
  representative: {
    documentMasked: string | null;
    motherName: string | null;
    birthdate: string | null;
    monthlyIncome: string | null;
    professionalOccupation: string | null;
  };
  bankAccountMasked: string | null;
  hasRecipient: boolean;
  recipientBlocked: boolean;
}

export interface LegalFinancialProfile {
  organizationId: number;
  legalType: LegalType | null;
  legalName: string | null;
  tradeName: string | null;
  documentMasked: string | null;
  representativeUserId: number | null;
  verificationStatus: VerificationStatus;
  recipientType: "individual" | "company" | null;
  recipientStatus: string | null;
  hasRecipient: boolean;
  recipientAttemptState: RecipientAttemptState;
  recipientLastError: string | null;
  recipientAttemptedAt: string | null;
  kycStatus: string | null;
  bankAccountMasked: string | null;
  financialDestinationStatus: FinancialDestinationStatus;
  financialDestinationMasked: string | null;
  financialActivationStatus: string;
  firstSaleAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
  company: {
    siteUrl: string | null;
    annualRevenue: string | null;
    corporationType: string | null;
    foundingDate: string | null;
    address: LegalFinancialAddress | null;
    phone: LegalFinancialPhone | null;
  };
  representative: {
    documentMasked: string | null;
    motherName: string | null;
    birthdate: string | null;
    monthlyIncome: string | null;
    professionalOccupation: string | null;
  };
  recipientBlocked: boolean;
  recipientBlockedAt: string | null;
  recipientBlockedReason: string | null;
}

export interface SetFinancialDestinationPayload {
  pixKey: string;
}

export interface BankAccountPayload {
  holderName: string;
  bank: string;
  branchNumber: string;
  branchCheckDigit?: string;
  accountNumber: string;
  accountCheckDigit: string;
  accountType: "checking" | "savings";
}

export interface RecipientStatus {
  hasRecipient: boolean;
  recipientType: "individual" | "company" | null;
  recipientStatus: string | null;
  kycStatus: string | null;
}

export interface KycLinkResult {
  url: string;
  expiresAt: string;
}

// ── Payloads do wizard (PATCH por etapa) ──────────────────────────────────
export interface PatchResponsibleTypePayload {
  legalType: LegalType;
}

export interface PatchEntityDetailsPayload {
  legalName: string;
  tradeName?: string;
  document: string;
  siteUrl?: string;
  annualRevenue?: string;
  corporationType?: string;
  foundingDate?: string;
  phone?: LegalFinancialPhone;
}

export interface PatchLegalRepresentativePayload {
  document: string;
  motherName: string;
  birthdate: string;
  monthlyIncome: string;
  professionalOccupation: string;
}

export interface PatchAddressPayload {
  person?: LegalFinancialAddress;
  personPhone?: LegalFinancialPhone;
  representative?: LegalFinancialAddress;
  representativePhone?: LegalFinancialPhone;
}

export interface SubmitResult {
  organizationId: number;
  verificationStatus: VerificationStatus;
  recipient: { attempted: boolean; created: boolean; error?: string };
  draftStep: DraftStep;
  formStatus: FormStatus;
}

const base = (organizationId: number) => `/organizations/${organizationId}/legal-financial-profile`;

export const legalFinancialApi = {
  getProfile: (organizationId: number) => api.get<LegalFinancialProfile>(base(organizationId)).then((r) => r.data),

  // ── Wizard ──────────────────────────────────────────────────────────────
  getDraft: (organizationId: number) => api.get<LegalFinancialDraft>(`${base(organizationId)}/draft`).then((r) => r.data),

  patchResponsibleType: (organizationId: number, payload: PatchResponsibleTypePayload) =>
    api.patch<LegalFinancialDraft>(`${base(organizationId)}/draft/responsible-type`, payload).then((r) => r.data),

  patchEntityDetails: (organizationId: number, payload: PatchEntityDetailsPayload) =>
    api.patch<LegalFinancialDraft>(`${base(organizationId)}/draft/entity-details`, payload).then((r) => r.data),

  patchLegalRepresentative: (organizationId: number, payload: PatchLegalRepresentativePayload) =>
    api.patch<LegalFinancialDraft>(`${base(organizationId)}/draft/legal-representative`, payload).then((r) => r.data),

  patchAddress: (organizationId: number, payload: PatchAddressPayload) =>
    api.patch<LegalFinancialDraft>(`${base(organizationId)}/draft/address`, payload).then((r) => r.data),

  patchBankAccount: (organizationId: number, payload: BankAccountPayload) =>
    api.patch<LegalFinancialDraft>(`${base(organizationId)}/draft/bank-account`, payload).then((r) => r.data),

  submit: (organizationId: number) => api.post<SubmitResult>(`${base(organizationId)}/submit`).then((r) => r.data),

  // ── Destino financeiro (Pix) ──────────────────────────────────────────
  setFinancialDestination: (organizationId: number, payload: SetFinancialDestinationPayload) =>
    api.post<LegalFinancialProfile>(`${base(organizationId)}/financial-destination`, payload).then((r) => r.data),

  // ── Recipient (leitura + retry manual) ─────────────────────────────────
  getRecipient: (organizationId: number) => api.get<RecipientStatus>(`${base(organizationId)}/recipient`).then((r) => r.data),

  createRecipient: (organizationId: number) => api.post<RecipientStatus>(`${base(organizationId)}/recipient`).then((r) => r.data),

  // ── Prova de vida / KYC ─────────────────────────────────────────────────
  generateKycLink: (organizationId: number) => api.post<KycLinkResult>(`${base(organizationId)}/kyc-link`).then((r) => r.data),
};

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  NOT_STARTED: "Não iniciado",
  PENDING: "Em análise",
  UNDER_REVIEW: "Em revisão",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
  LEGACY_REVIEW_REQUIRED: "Regularização pendente",
  FINANCIAL_REVIEW_REQUIRED: "Correção em revisão",
};

export const DRAFT_STEP_ORDER: DraftStep[] = ["RESPONSIBLE_TYPE", "ENTITY_DETAILS", "LEGAL_REPRESENTATIVE", "ADDRESS", "BANK_ACCOUNT", "REVIEW"];
