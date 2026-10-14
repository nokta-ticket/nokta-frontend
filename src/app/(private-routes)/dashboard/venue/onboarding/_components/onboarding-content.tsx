"use client";

import { useEffect } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { StatusBadge } from "@/components/ui/badge";
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

const TITLE = "Primeiros passos";

function Frame({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader title={TITLE} description="Configure o estabelecimento passo a passo. Pode sair e voltar quando quiser." badge={badge} />
      {children}
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

  if (loadingOrgs || loadingAccess || (orgId && (loadingStatus || loadingLocations || !status))) {
    return (
      <Frame>
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </Frame>
    );
  }

  if (!orgId) {
    return (
      <Frame>
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Escolha uma organização no menu lateral pra continuar." />
      </Frame>
    );
  }

  if (!can("organization.settings.manage")) {
    return (
      <Frame>
        <EmptyState icon="lock" title="Sem acesso a esta etapa" description="O responsável pela organização ainda está concluindo a configuração do Venue." />
      </Frame>
    );
  }

  if (!status) return null;

  const mainLocation = locations?.find((l) => l.isMain) ?? locations?.[0] ?? null;
  const doneSteps = new Set<StepKey>();
  if (status.requiredItems.find((i) => i.key === "active_location")?.done) doneSteps.add("sobre");
  if (status.requiredItems.find((i) => i.key === "operational_structure")?.done && status.requiredItems.find((i) => i.key === "cash_register")?.done) doneSteps.add("estrutura");
  if (status.requiredItems.find((i) => i.key === "published_menu")?.done) doneSteps.add("cardapio");
  if (status.recommendedItems.find((i) => i.key === "team")?.done) doneSteps.add("equipe");

  const goTo = (s: StepKey) => setStep(s);
  const currentIndex = STEPS.indexOf(step);
  const stepperSteps: StepperStep[] = STEPS.map((key, i) => ({
    label: STEP_LABEL[key],
    status: key === step ? "current" : doneSteps.has(key) || i < currentIndex ? "done" : "upcoming",
  }));

  return (
    <Frame badge={<StatusBadge tone={status.readyToOperate ? "success" : "brand"}>{status.progress}% pronto</StatusBadge>}>
      <nav aria-label="Etapas" className="rounded-card border border-border bg-surface p-4 shadow-card md:p-5">
        {/* Desktop: linha do tempo; celular: chips clicáveis (a linha vertical ocuparia a tela inteira). */}
        <div className="hidden md:block">
          <Stepper orientation="horizontal" steps={stepperSteps} />
        </div>
        <div className="scrollbar-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 md:hidden">
          {STEPS.map((key, i) => {
            const state = stepperSteps[i].status;
            return (
              <button key={key} type="button" onClick={() => goTo(key)} aria-current={state === "current" ? "step" : undefined} className={cn("press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-3 text-caption font-semibold transition-colors", state === "current" ? "bg-brand text-brand-foreground" : state === "done" ? "bg-success-bg text-success" : "bg-surface-2 text-muted-foreground")}>
                {state === "done" ? <Icon name="check" size={10} /> : <span className="tnum">{i + 1}</span>}
                {STEP_LABEL[key]}
              </button>
            );
          })}
        </div>
      </nav>

      {step === "sobre" ? <Step1Sobre orgId={orgId} status={status} mainLocation={mainLocation} onNext={() => goTo("estrutura")} /> : null}

      {step === "estrutura" ? (
        mainLocation ? (
          <Step2Estrutura orgId={orgId} locationId={mainLocation.id} operationMode={status.profile?.operationMode ?? null} onNext={() => goTo("cardapio")} onBack={() => goTo("sobre")} />
        ) : (
          <EmptyState icon="store" title="Crie a unidade primeiro" description="Volte à etapa Sobre e crie a unidade principal." />
        )
      ) : null}

      {step === "cardapio" ? <Step3Cardapio orgId={orgId} status={status} onNext={() => goTo("equipe")} onBack={() => goTo("estrutura")} /> : null}

      {step === "equipe" ? <Step4Equipe onNext={() => goTo("preferencias")} onBack={() => goTo("cardapio")} /> : null}

      {step === "preferencias" ? <Step5Preferencias orgId={orgId} onNext={() => goTo("revisao")} onBack={() => goTo("equipe")} /> : null}

      {step === "revisao" ? <Step6Revisao orgId={orgId} status={status} onBack={() => goTo("preferencias")} /> : null}
    </Frame>
  );
}
