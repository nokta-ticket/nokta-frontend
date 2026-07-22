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
  kycStatus: string | null;
  bankAccountMasked: string | null;
  financialDestinationStatus: FinancialDestinationStatus;
  financialDestinationMasked: string | null;
  financialActivationStatus: string;
  firstSaleAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
}

export interface StartLegalProfilePayload {
  legalType: LegalType;
  legalName: string;
  tradeName?: string;
  document: string;
}

export interface SetFinancialDestinationPayload {
  pixKey: string;
}

export interface SetBankAccountPayload {
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

const base = (organizationId: number) => `/organizations/${organizationId}/legal-financial-profile`;

export const legalFinancialApi = {
  getProfile: (organizationId: number) => api.get<LegalFinancialProfile>(base(organizationId)).then((r) => r.data),

  startProfile: (organizationId: number, payload: StartLegalProfilePayload) =>
    api.post<LegalFinancialProfile>(`${base(organizationId)}/start`, payload).then((r) => r.data),

  setFinancialDestination: (organizationId: number, payload: SetFinancialDestinationPayload) =>
    api.post<LegalFinancialProfile>(`${base(organizationId)}/financial-destination`, payload).then((r) => r.data),

  setBankAccount: (organizationId: number, payload: SetBankAccountPayload) =>
    api.post<LegalFinancialProfile>(`${base(organizationId)}/bank-account`, payload).then((r) => r.data),

  getRecipient: (organizationId: number) => api.get<RecipientStatus>(`${base(organizationId)}/recipient`).then((r) => r.data),

  createRecipient: (organizationId: number) => api.post<RecipientStatus>(`${base(organizationId)}/recipient`).then((r) => r.data),
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
