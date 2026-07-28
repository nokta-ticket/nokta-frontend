"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import type { BusinessProfile } from "@/services/platform";
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

// Campos de operação da etapa 2 (StepOperacao) — mesma lista de FIELDS de lá.
// Repetida aqui (não importada) de propósito: acoplar as duas exigiria
// exportar a lista de UI só pra isso; qualquer um desses !== false já basta
// pra saber que a etapa foi ao menos aberta e salva uma vez.
const OPERATION_FIELDS: (keyof BusinessProfile)[] = [
  "sellsAdvanceTickets",
  "usesGuestLists",
  "acceptsReservations",
  "usesTables",
  "usesTabs",
  "usesCounterService",
  "sellsFoodOrBeverages",
  "usesPreparationStations",
  "controlsInventory",
  "worksWithPromoters",
];

/**
 * Retoma o onboarding na etapa onde o usuário parou, a partir do que já foi
 * persistido — não existe (nem precisa existir) um campo dedicado tipo
 * `onboardingStep`: as etapas 1 e 2 só avançam depois de salvar no backend
 * (ver StepNegocio/StepOperacao `handleNext`), então o próprio conteúdo do
 * profile já denuncia até onde o usuário chegou. A etapa "capacidades" não
 * persiste nada de seu no profile (ativa capacidades via endpoint próprio),
 * então uma vez que a etapa 2 esteja salva ela é sempre o próximo passo —
 * quem já passou dela usa os botões Voltar/Continuar do próprio stepper.
 */
function deriveResumeStep(profile: BusinessProfile): StepKey {
  if (!profile.exists || profile.segments.length === 0) return "negocio";
  if (!OPERATION_FIELDS.some((key) => profile[key] === true)) return "operacao";
  return "capacidades";
}

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
  const hasExplicitTab = useSearchParams().has("tab");

  const { data: navigation, isLoading: loadingNav } = usePlatformNavigation(orgId);
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile(orgId);

  // Retomar de onde parou: só pula pra etapa derivada quando o usuário
  // chegou aqui sem `?tab=` explícito (ex.: redirect automático da Início) —
  // um link direto pra uma etapa específica (ou navegação manual pelo
  // Stepper) nunca deve ser sobrescrito. Roda uma única vez por carregamento
  // do profile: sem o `ref`, `setStep` mudaria a URL e o efeito rodaria de
  // novo achando que ainda não tinha `tab`, entrando em loop.
  const didResume = useRef(false);
  useEffect(() => {
    if (didResume.current || hasExplicitTab || !profile) return;
    didResume.current = true;
    const resumeStep = deriveResumeStep(profile);
    if (resumeStep !== step) setStep(resumeStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, hasExplicitTab]);

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
