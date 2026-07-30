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

export interface CompanyAddress {
  street: string;
  complementary: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  referencePoint: string | null;
}

export interface CompanyPhone {
  ddd: string;
  number: string;
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
  // Dados PJ (contrato v5 da Pagar.me) — não sensíveis, retornados em
  // claro para permitir edição incremental. Só preenchidos para legalType
  // COMPANY; document/CPF do representante nunca aparece cru, só mascarado.
  company: {
    siteUrl: string | null;
    annualRevenue: string | null;
    corporationType: string | null;
    foundingDate: string | null;
    address: CompanyAddress | null;
    phone: CompanyPhone | null;
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

export interface SubmitCompanyAddressPayload {
  street: string;
  complementary: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  referencePoint: string;
}

export interface SubmitCompanyPhonePayload {
  ddd: string;
  number: string;
}

export interface SubmitCompanyRepresentativePayload {
  document: string;
  motherName: string;
  birthdate: string;
  monthlyIncome: string;
  professionalOccupation: string;
  address: SubmitCompanyAddressPayload;
  phone: SubmitCompanyPhonePayload;
}

/** Submit único do fluxo PJ (tela de 5 seções em 1 página) — cria/atualiza o perfil E dispara a criação do recipient na Pagar.me no mesmo request. */
export interface SubmitCompanyRecipientPayload {
  legalName: string;
  tradeName?: string;
  document: string;
  siteUrl?: string;
  annualRevenue: string;
  corporationType?: string;
  foundingDate?: string;
  address: SubmitCompanyAddressPayload;
  phone: SubmitCompanyPhonePayload;
  representative: SubmitCompanyRepresentativePayload;
  bankAccount: SetBankAccountPayload;
}

export interface SubmitCompanyRecipientResult {
  organizationId: number;
  verificationStatus: VerificationStatus;
  recipient: { attempted: boolean; created: boolean; error?: string };
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

  submitCompanyRecipient: (organizationId: number, payload: SubmitCompanyRecipientPayload) =>
    api.post<SubmitCompanyRecipientResult>(`${base(organizationId)}/company-recipient`, payload).then((r) => r.data),
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
