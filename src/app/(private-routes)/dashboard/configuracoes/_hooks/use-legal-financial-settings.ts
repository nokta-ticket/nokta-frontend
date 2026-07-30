"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  legalFinancialApi,
  type BankAccountPayload,
  type PatchAddressPayload,
  type PatchEntityDetailsPayload,
  type PatchLegalRepresentativePayload,
  type PatchResponsibleTypePayload,
  type SetFinancialDestinationPayload,
} from "@/services/venue-legal-financial";

const legalFinancialKeys = {
  profile: (orgId: number) => ["legal-financial", orgId, "profile"] as const,
  draft: (orgId: number) => ["legal-financial", orgId, "draft"] as const,
  recipient: (orgId: number) => ["legal-financial", orgId, "recipient"] as const,
};

export function useLegalFinancialProfile(orgId: number | null) {
  return useQuery({
    queryKey: legalFinancialKeys.profile(orgId ?? -1),
    queryFn: () => legalFinancialApi.getProfile(orgId as number),
    enabled: orgId !== null,
  });
}

// ── Wizard (rascunho persistido por etapa) ────────────────────────────────
export function useLegalFinancialDraft(orgId: number | null) {
  return useQuery({
    queryKey: legalFinancialKeys.draft(orgId ?? -1),
    queryFn: () => legalFinancialApi.getDraft(orgId as number),
    enabled: orgId !== null,
  });
}

function useDraftMutation<TPayload>(orgId: number, fn: (orgId: number, payload: TPayload) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TPayload) => fn(orgId, payload),
    onSuccess: (data) => {
      qc.setQueryData(legalFinancialKeys.draft(orgId), data);
    },
  });
}

export function usePatchResponsibleType(orgId: number) {
  return useDraftMutation<PatchResponsibleTypePayload>(orgId, legalFinancialApi.patchResponsibleType);
}

export function usePatchEntityDetails(orgId: number) {
  return useDraftMutation<PatchEntityDetailsPayload>(orgId, legalFinancialApi.patchEntityDetails);
}

export function usePatchLegalRepresentative(orgId: number) {
  return useDraftMutation<PatchLegalRepresentativePayload>(orgId, legalFinancialApi.patchLegalRepresentative);
}

export function usePatchAddress(orgId: number) {
  return useDraftMutation<PatchAddressPayload>(orgId, legalFinancialApi.patchAddress);
}

export function usePatchBankAccount(orgId: number) {
  return useDraftMutation<BankAccountPayload>(orgId, legalFinancialApi.patchBankAccount);
}

export function useSubmitLegalFinancialProfile(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => legalFinancialApi.submit(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: legalFinancialKeys.draft(orgId) });
      qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) });
      qc.invalidateQueries({ queryKey: legalFinancialKeys.recipient(orgId) });
    },
  });
}

// ── Destino financeiro (Pix) ───────────────────────────────────────────────
export function useSetFinancialDestination(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetFinancialDestinationPayload) => legalFinancialApi.setFinancialDestination(orgId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: legalFinancialKeys.profile(orgId) }),
  });
}

// ── Recipient (leitura + retry manual) ─────────────────────────────────────
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

// ── Prova de vida / KYC ─────────────────────────────────────────────────────
export function useGenerateKycLink(orgId: number) {
  return useMutation({
    mutationFn: () => legalFinancialApi.generateKycLink(orgId),
  });
}
