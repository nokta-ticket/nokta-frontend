"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  legalFinancialApi,
  type SetBankAccountPayload,
  type SetFinancialDestinationPayload,
  type StartLegalProfilePayload,
  type SubmitCompanyRecipientPayload,
} from "@/services/venue-legal-financial";

const legalFinancialKeys = {
  profile: (orgId: number) => ["legal-financial", orgId, "profile"] as const,
  recipient: (orgId: number) => ["legal-financial", orgId, "recipient"] as const,
};

export function useLegalFinancialProfile(orgId: number | null) {
  return useQuery({
    queryKey: legalFinancialKeys.profile(orgId ?? -1),
    queryFn: () => legalFinancialApi.getProfile(orgId as number),
    enabled: orgId !== null,
  });
}

export function useStartLegalProfile(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartLegalProfilePayload) => legalFinancialApi.startProfile(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) }),
  });
}

export function useSetFinancialDestination(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetFinancialDestinationPayload) => legalFinancialApi.setFinancialDestination(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) }),
  });
}

export function useSetBankAccount(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetBankAccountPayload) => legalFinancialApi.setBankAccount(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) }),
  });
}

export function useLegalFinancialRecipient(orgId: number | null) {
  return useQuery({
    queryKey: legalFinancialKeys.recipient(orgId ?? -1),
    queryFn: () => legalFinancialApi.getRecipient(orgId as number),
    enabled: orgId !== null,
  });
}

export function useCreateRecipient(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => legalFinancialApi.createRecipient(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legalFinancialKeys.recipient(orgId) });
      qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) });
    },
  });
}

/** Submit único do fluxo PJ (tela de 5 seções em 1 página) — persiste tudo e cria o recipient na Pagar.me no mesmo request. */
export function useSubmitCompanyRecipient(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitCompanyRecipientPayload) => legalFinancialApi.submitCompanyRecipient(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) });
      qc.invalidateQueries({ queryKey: legalFinancialKeys.recipient(orgId) });
    },
  });
}
