"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { DRAFT_STEP_ORDER, type DraftStep, type LegalFinancialDraft, type LegalFinancialProfile } from "@/services/venue-legal-financial";
import {
  useLegalFinancialDraft,
  usePatchAddress,
  usePatchBankAccount,
  usePatchEntityDetails,
  usePatchLegalRepresentative,
  usePatchResponsibleType,
  useSubmitLegalFinancialProfile,
} from "../../_hooks/use-legal-financial-settings";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { WizardStepper } from "./_sections/wizard-stepper";
import { StepResponsibleType } from "./_steps/step-responsible-type";
import { StepEntityDetails, emptyEntityDetails } from "./_steps/step-entity-details";
import { StepLegalRepresentative, emptyLegalRepresentative } from "./_steps/step-legal-representative";
import { StepAddress, emptyAddressStep } from "./_steps/step-address";
import { StepBankAccount, emptyBankAccount } from "./_steps/step-bank-account";
import { StepReview } from "./_steps/step-review";
import { StepStatus } from "./_steps/step-status";

const STEP_LABELS: Record<DraftStep, string> = {
  RESPONSIBLE_TYPE: "Responsável",
  ENTITY_DETAILS: "Dados",
  LEGAL_REPRESENTATIVE: "Representante",
  ADDRESS: "Endereço",
  BANK_ACCOUNT: "Conta",
  REVIEW: "Revisão",
};

/**
 * Wizard PF/PJ com rascunho persistido no backend por etapa (nunca no
 * localStorage — GET .../draft sempre reflete o estado real do servidor,
 * cross-check automático a cada carregamento). draft.draftStep é a etapa
 * mais avançada já salva; `viewedStep` (estado local) é a etapa
 * atualmente EXIBIDA — pode ser uma etapa anterior, quando o usuário
 * clica "Voltar" pra revisar/corrigir algo sem perder o progresso das
 * etapas seguintes já preenchidas. Reenviar o PATCH de uma etapa anterior
 * apenas atualiza aqueles campos, nunca reseta draftStep pra trás.
 */
export function LegalFinancialWizard({ orgId, profile }: { orgId: number; profile: LegalFinancialProfile | undefined }) {
  const { user } = useAuth();
  const { data: draft, isLoading } = useLegalFinancialDraft(orgId);
  const [viewedStep, setViewedStep] = useState<DraftStep | null>(null);

  const patchResponsibleType = usePatchResponsibleType(orgId);
  const patchEntityDetails = usePatchEntityDetails(orgId);
  const patchLegalRepresentative = usePatchLegalRepresentative(orgId);
  const patchAddress = usePatchAddress(orgId);
  const patchBankAccount = usePatchBankAccount(orgId);
  const submit = useSubmitLegalFinancialProfile(orgId);

  if (isLoading || !draft) return <BlockSkeleton className="h-72" />;

  if (draft.formStatus === "SUBMITTED") {
    return <StepStatus orgId={orgId} profile={profile} />;
  }

  const steps: { key: DraftStep; label: string }[] = (
    draft.legalType === "COMPANY" ? DRAFT_STEP_ORDER : DRAFT_STEP_ORDER.filter((key) => key !== "LEGAL_REPRESENTATIVE")
  ).map((key) => ({ key, label: STEP_LABELS[key] }));

  const currentStep = viewedStep ?? draft.draftStep;
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  const goBack = () => {
    if (currentIndex <= 0) return;
    setViewedStep(steps[currentIndex - 1].key);
  };
  // Ao avançar de verdade (PATCH bem-sucedido), volta a seguir draft.draftStep automaticamente.
  const clearViewOverride = () => setViewedStep(null);

  const representativeName = user ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() : "";

  const handleSubmitFinal = () => {
    submit.mutate(undefined, {
      onSuccess: (result) => {
        if (result.recipient.created) {
          toast.success("Recebedor criado na Pagar.me.");
        } else {
          toast.error(
            getErrorMessage(result.recipient.error, "Dados salvos, mas não foi possível criar o recebedor agora. Tente novamente na tela de status."),
          );
        }
      },
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível enviar os dados. Tente novamente.")),
    });
  };

  return (
    <div className="space-y-4">
      <WizardStepper steps={steps} currentStep={currentStep} />

      {currentStep === "RESPONSIBLE_TYPE" ? (
        <StepResponsibleType
          submitting={patchResponsibleType.isPending}
          onChoose={(legalType) =>
            patchResponsibleType.mutate(
              { legalType },
              { onSuccess: clearViewOverride, onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")) },
            )
          }
        />
      ) : null}

      {currentStep === "ENTITY_DETAILS" && draft.legalType ? (
        <StepEntityDetails
          legalType={draft.legalType}
          initialValue={draftToEntityDetails(draft)}
          submitting={patchEntityDetails.isPending}
          onBack={goBack}
          onSubmit={(value) =>
            patchEntityDetails.mutate(
              {
                legalName: value.legalName,
                tradeName: value.tradeName || undefined,
                document: value.document,
                siteUrl: value.siteUrl || undefined,
                annualRevenue: value.annualRevenue || undefined,
                corporationType: value.corporationType || undefined,
                foundingDate: value.foundingDate || undefined,
                phone: draft.legalType === "COMPANY" ? value.phone : undefined,
              },
              { onSuccess: clearViewOverride, onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")) },
            )
          }
        />
      ) : null}

      {currentStep === "LEGAL_REPRESENTATIVE" ? (
        <StepLegalRepresentative
          initialValue={emptyLegalRepresentative()}
          representativeName={representativeName || "—"}
          representativeEmail={user?.email ?? "—"}
          submitting={patchLegalRepresentative.isPending}
          onBack={goBack}
          onSubmit={(value) =>
            patchLegalRepresentative.mutate(value, {
              onSuccess: clearViewOverride,
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")),
            })
          }
        />
      ) : null}

      {currentStep === "ADDRESS" && draft.legalType ? (
        <StepAddress
          legalType={draft.legalType}
          initialValue={draft.legalType === "INDIVIDUAL" ? draftToAddressStep(draft) : emptyAddressStep()}
          submitting={patchAddress.isPending}
          onBack={goBack}
          onSubmit={(value) => {
            const payload =
              draft.legalType === "COMPANY"
                ? { representative: value.address, representativePhone: value.phone }
                : { person: value.address, personPhone: value.phone };
            patchAddress.mutate(payload, { onSuccess: clearViewOverride, onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")) });
          }}
        />
      ) : null}

      {currentStep === "BANK_ACCOUNT" ? (
        <StepBankAccount
          initialValue={emptyBankAccount()}
          submitting={patchBankAccount.isPending}
          onBack={goBack}
          onSubmit={(value) =>
            patchBankAccount.mutate(value, { onSuccess: clearViewOverride, onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")) })
          }
        />
      ) : null}

      {currentStep === "REVIEW" ? <StepReview draft={draft} onSubmit={handleSubmitFinal} onBack={goBack} submitting={submit.isPending} /> : null}
    </div>
  );
}

function draftToAddressStep(draft: LegalFinancialDraft) {
  const base = emptyAddressStep();
  if (!draft.company.address) return base;
  return {
    address: {
      street: draft.company.address.street ?? "",
      complementary: draft.company.address.complementary ?? "",
      streetNumber: draft.company.address.streetNumber ?? "",
      neighborhood: draft.company.address.neighborhood ?? "",
      city: draft.company.address.city ?? "",
      state: draft.company.address.state ?? "",
      zipCode: draft.company.address.zipCode ?? "",
      referencePoint: draft.company.address.referencePoint ?? "",
    },
    phone: draft.company.phone ? { ddd: draft.company.phone.ddd, number: draft.company.phone.number } : base.phone,
  };
}

function draftToEntityDetails(draft: LegalFinancialDraft) {
  return {
    ...emptyEntityDetails(),
    legalName: draft.legalName ?? "",
    tradeName: draft.tradeName ?? "",
    siteUrl: draft.company.siteUrl ?? "",
    annualRevenue: draft.company.annualRevenue ?? "",
    corporationType: draft.company.corporationType ?? "",
    foundingDate: draft.company.foundingDate ? draft.company.foundingDate.slice(0, 10) : "",
    phone: draft.company.phone ? { ddd: draft.company.phone.ddd, number: draft.company.phone.number } : emptyEntityDetails().phone,
  };
}
