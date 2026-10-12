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
import { useStepUp, type StepUpPreviewField } from "@/components/session/step-up-modal";

/** Mensagem com que o modal de step-up rejeita quando o usuário cancela: não é erro para mostrar. */
export const STEP_UP_CANCELLED_MESSAGE = "Verificação de segurança cancelada.";

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
  const { openStepUp } = useStepUp();
  return useMutation({
    // Pede a confirmação de segurança antes do envio; cancelar rejeita com STEP_UP_CANCELLED_MESSAGE.
    mutationFn: async (preview: StepUpPreviewField[]) => {
      const stepUpToken = await openStepUp({
        action: "RECIPIENT_CREATE_OR_UPDATE",
        organizationId: orgId,
        actionParams: { organizationId: orgId },
        title: "Confirmar envio dos dados",
        description: "Revise antes de autorizar. Depois do envio, alterações só por correção com o suporte.",
        preview,
      });
      return legalFinancialApi.submit(orgId, stepUpToken);
    },
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
  const { openStepUp } = useStepUp();
  return useMutation({
    mutationFn: async (payload: SetFinancialDestinationPayload) => {
      const stepUpToken = await openStepUp({
        action: "FINANCIAL_DESTINATION_UPDATE",
        organizationId: orgId,
        actionParams: { organizationId: orgId },
        title: "Confirmar destino financeiro",
        description: "Esta alteração muda para onde o dinheiro da organização é enviado.",
        preview: [],
      });
      return legalFinancialApi.setFinancialDestination(orgId, payload, stepUpToken);
    },
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
  const { openStepUp } = useStepUp();
  return useMutation({
    mutationFn: async () => {
      const stepUpToken = await openStepUp({
        action: "RECIPIENT_CREATE_OR_UPDATE",
        organizationId: orgId,
        actionParams: { organizationId: orgId },
        title: "Confirmar criação do recebedor",
        preview: [],
      });
      return legalFinancialApi.createRecipient(orgId, stepUpToken);
    },
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
