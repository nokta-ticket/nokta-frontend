"use client";

import { CheckCircle2 } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useUrlTab } from "../../_hooks/use-url-tab";
import { useBusinessProfile, usePlatformNavigation } from "../../_hooks/use-platform";
import { StepNegocio } from "./step-negocio";
import { StepOperacao } from "./step-operacao";
import { StepCapacidades } from "./step-capacidades";
import { StepRevisao } from "./step-revisao";

const STEPS = ["negocio", "operacao", "capacidades", "revisao"] as const;
type StepKey = (typeof STEPS)[number];

const STEP_LABEL: Record<StepKey, string> = {
  negocio: "Negócio",
  operacao: "Operação",
  capacidades: "Capacidades",
  revisao: "Revisão",
};

function Stepper({ step }: { step: StepKey }) {
  const currentIndex = STEPS.indexOf(step);
  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {STEPS.map((key, i) => {
        const active = key === step;
        const done = i < currentIndex;
        return (
          <div
            key={key}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
              active ? "border-violet-600 bg-violet-50 text-violet-700" : done ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-black/10 text-black/50"
            }`}
          >
            {done ? <CheckCircle2 size={13} /> : <span>{i + 1}</span>}
            {STEP_LABEL[key]}
          </div>
        );
      })}
    </div>
  );
}

const TITLE = "Bem-vindo à Nokta";
const DESCRIPTION = "Conte como o seu negócio funciona para recomendarmos as funcionalidades certas. Você pode sair e voltar quando quiser.";

export function OnboardingContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const orgId = currentOrg?.id ?? null;
  const [step, setStep] = useUrlTab<StepKey>(STEPS, "negocio");

  const { data: navigation, isLoading: loadingNav } = usePlatformNavigation(orgId);
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile(orgId);

  if (loadingOrgs) {
    return (
      <PageContainer>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (loadingNav || loadingProfile || !profile) {
    return (
      <PageContainer>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!navigation?.canExplore) {
    return (
      <PageContainer>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <EmptyState
          title="Sem acesso a esta etapa"
          description="Só o proprietário ou um gerente autorizado pode configurar o perfil da organização."
        />
      </PageContainer>
    );
  }

  const goTo = (s: StepKey) => setStep(s);

  return (
    <PageContainer>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <Stepper step={step} />

      {step === "negocio" ? <StepNegocio orgId={orgId} profile={profile} onNext={() => goTo("operacao")} /> : null}
      {step === "operacao" ? <StepOperacao orgId={orgId} profile={profile} onNext={() => goTo("capacidades")} onBack={() => goTo("negocio")} /> : null}
      {step === "capacidades" ? <StepCapacidades orgId={orgId} onNext={() => goTo("revisao")} onBack={() => goTo("operacao")} /> : null}
      {step === "revisao" ? <StepRevisao orgId={orgId} onBack={() => goTo("capacidades")} /> : null}
    </PageContainer>
  );
}
