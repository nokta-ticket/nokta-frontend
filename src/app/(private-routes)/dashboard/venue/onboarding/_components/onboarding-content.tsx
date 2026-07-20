"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { PageContainer } from "../../../_components/page/page-container";
import { PageHeader } from "../../../_components/page/page-header";
import { EmptyState } from "../../../_components/states/empty-state";
import { BlockSkeleton } from "../../../_components/states/loading-state";
import { useUrlTab } from "../../../_hooks/use-url-tab";
import { useVenueLocations } from "../../../operacao/_hooks/use-venue-locations";
import { useVenueSetupLifecycle, useVenueSetupStatus } from "../../../configuracoes/_hooks/use-venue-settings";
import { Step1Sobre } from "./step-1-sobre";
import { Step2Estrutura } from "./step-2-estrutura";
import { Step3Cardapio } from "./step-3-cardapio";
import { Step4Equipe } from "./step-4-equipe";
import { Step5Preferencias } from "./step-5-preferencias";
import { Step6Revisao } from "./step-6-revisao";

const STEPS = ["sobre", "estrutura", "cardapio", "equipe", "preferencias", "revisao"] as const;
type StepKey = (typeof STEPS)[number];

const STEP_LABEL: Record<StepKey, string> = {
  sobre: "Sobre",
  estrutura: "Estrutura",
  cardapio: "Cardápio",
  equipe: "Equipe",
  preferencias: "Preferências",
  revisao: "Revisão",
};

function Stepper({ step, doneSteps }: { step: StepKey; doneSteps: Set<StepKey> }) {
  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {STEPS.map((key, i) => {
        const active = key === step;
        const done = doneSteps.has(key) && !active;
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

export function OnboardingContent() {
  const { currentOrg, loadingOrgs } = useOrganizations();
  const { can, loading: loadingAccess } = useVenueAccess();
  const orgId = currentOrg?.id ?? null;

  const [step, setStep] = useUrlTab<StepKey>(STEPS, "sobre");
  const { data: status, isLoading: loadingStatus } = useVenueSetupStatus(orgId);
  const { data: locations, isLoading: loadingLocations } = useVenueLocations(orgId);
  const { markWelcomeSeen } = useVenueSetupLifecycle(orgId ?? -1);

  useEffect(() => {
    if (orgId) markWelcomeSeen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (loadingOrgs || loadingAccess) {
    return (
      <PageContainer>
        <PageHeader title="Configuração guiada do Venue" description="Ative e configure seu estabelecimento passo a passo." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader title="Configuração guiada do Venue" description="Ative e configure seu estabelecimento passo a passo." />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para continuar." />
      </PageContainer>
    );
  }

  if (!can("organization.settings.manage")) {
    return (
      <PageContainer>
        <PageHeader title="Configuração guiada do Venue" description="Ative e configure seu estabelecimento passo a passo." />
        <EmptyState
          title="Sem acesso a esta etapa"
          description="O responsável pela organização ainda está concluindo a configuração do Venue."
        />
      </PageContainer>
    );
  }

  if (loadingStatus || loadingLocations || !status) {
    return (
      <PageContainer>
        <PageHeader title="Configuração guiada do Venue" description="Ative e configure seu estabelecimento passo a passo." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const mainLocation = locations?.find((l) => l.isMain) ?? locations?.[0] ?? null;
  const doneSteps = new Set<StepKey>();
  if (status.requiredItems.find((i) => i.key === "active_location")?.done) doneSteps.add("sobre");
  if (status.requiredItems.find((i) => i.key === "operational_structure")?.done && status.requiredItems.find((i) => i.key === "cash_register")?.done)
    doneSteps.add("estrutura");
  if (status.requiredItems.find((i) => i.key === "published_menu")?.done) doneSteps.add("cardapio");
  if (status.recommendedItems.find((i) => i.key === "team")?.done) doneSteps.add("equipe");

  const goTo = (s: StepKey) => setStep(s);

  return (
    <PageContainer>
      <PageHeader
        title="Configuração guiada do Venue"
        description="Ative e configure seu estabelecimento passo a passo. Você pode sair e voltar quando quiser."
      />

      <Stepper step={step} doneSteps={doneSteps} />

      {step === "sobre" ? (
        <Step1Sobre orgId={orgId} status={status} mainLocation={mainLocation} onNext={() => goTo("estrutura")} />
      ) : null}

      {step === "estrutura" ? (
        mainLocation ? (
          <Step2Estrutura
            orgId={orgId}
            locationId={mainLocation.id}
            operationMode={status.profile?.operationMode ?? null}
            onNext={() => goTo("cardapio")}
            onBack={() => goTo("sobre")}
          />
        ) : (
          <EmptyState title="Crie a unidade primeiro" description="Volte à etapa Sobre e crie a unidade principal." />
        )
      ) : null}

      {step === "cardapio" ? <Step3Cardapio orgId={orgId} status={status} onNext={() => goTo("equipe")} onBack={() => goTo("estrutura")} /> : null}

      {step === "equipe" ? <Step4Equipe onNext={() => goTo("preferencias")} onBack={() => goTo("cardapio")} /> : null}

      {step === "preferencias" ? (
        <Step5Preferencias orgId={orgId} onNext={() => goTo("revisao")} onBack={() => goTo("equipe")} />
      ) : null}

      {step === "revisao" ? <Step6Revisao orgId={orgId} status={status} onBack={() => goTo("preferencias")} /> : null}
    </PageContainer>
  );
}
