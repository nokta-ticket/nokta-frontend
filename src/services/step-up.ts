import api from "@/lib/axios";

export type StepUpAction =
  | "WITHDRAWAL_CONFIRM"
  | "REFUND_MANUAL_PROCESS"
  | "BANK_ACCOUNT_UPDATE"
  | "RECIPIENT_CREATE_OR_UPDATE"
  | "FINANCIAL_DESTINATION_UPDATE"
  | "LEGAL_FINANCIAL_CORRECTION"
  | "FINANCIAL_PERMISSION_CHANGE"
  | "LEGAL_DOCUMENT_CHANGE"
  | "RECIPIENT_BLOCK_TOGGLE"
  | "PAYMENT_ACQUIRER_CREDENTIALS_UPDATE";

export interface StepUpChallengeResult {
  grantId: string;
  expiresAt: string;
  method: "TOTP" | "OTP_SMS";
}

export interface StepUpVerifyResult {
  stepUpToken: string;
  expiresAt: string;
}

export const STEP_UP_TOKEN_HEADER = "X-Step-Up-Token";

export const stepUpApi = {
  challenge: async (action: StepUpAction, organizationId: number | null, actionParams: Record<string, unknown>) => {
    const res = await api.post<StepUpChallengeResult>("/auth/step-up/challenge", {
      action,
      organizationId: organizationId ?? undefined,
      actionParams,
    });
    return res.data;
  },
  verify: async (grantId: string, credential: string) => {
    const res = await api.post<StepUpVerifyResult>("/auth/step-up/verify", { grantId, credential });
    return res.data;
  },
};
