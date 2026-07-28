"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { VenueInicioPageContent } from "../venue/inicio/venue-inicio-content";
import { useBusinessProfile, usePlatformNavigation } from "../_hooks/use-platform";
import { InicioContent } from "./_components/inicio-content";

/**
 * Início unificada (Fase 3). Organização com Venue ativo: reaproveita
 * `VenueInicioPage` inteira (já resolve o redirect por papel operacional —
 * WAITER/KITCHEN_BAR/STOCK vão direto pra tela que usam o dia todo — e tem
 * o painel mais completo, com checklist de configuração). Organização
 * só-Tickets (ou híbrida, nesta fase): `InicioContent`, orientada pelo
 * endpoint Home v1. Unificar de verdade os dois pra híbridas é trabalho de
 * uma fase futura — ver docs/platform/unified-navigation.md "Home".
 *
 * Onboarding pendente: `profile.profileCompletedAt` só é setado quando o
 * usuário confirma a etapa de Revisão (ver StepRevisao.handleFinish). Até
 * lá, a Início nunca é o destino certo — sem isso, quem fecha o app no meio
 * do onboarding (ex.: parou na etapa "Capacidades" sem confirmar) cai numa
 * Início vazia sem pista nenhuma de que falta terminar o cadastro, em vez
 * de retomar de onde parou (ver dashboard/onboarding/_components/
 * onboarding-content.tsx, que decide a etapa exata a partir do profile).
 * Só redireciona quem pode de fato configurar o perfil (`canExplore` =
 * owner/manager, mesmo gate usado dentro do próprio onboarding) — um membro
 * comum de organização com onboarding pendente não deve ser jogado numa
 * tela de "Sem acesso a esta etapa", só fica na Início vazia normal.
 */
function InicioDispatcher() {
  const router = useRouter();
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const orgId = currentOrg?.id ?? null;
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile(orgId);
  const { data: navigation, isLoading: loadingNav } = usePlatformNavigation(orgId);

  const onboardingPending =
    Boolean(orgId) &&
    !loadingProfile &&
    Boolean(profile) &&
    !profile?.profileCompletedAt &&
    !loadingNav &&
    Boolean(navigation?.canExplore);

  useEffect(() => {
    if (onboardingPending) {
      router.replace("/dashboard/onboarding");
    }
  }, [onboardingPending, router]);

  if (loadingOrgs || loadingModules || (orgId && (loadingProfile || loadingNav)) || onboardingPending) {
    return (
      <PageContainer>
        <PageHeader title="Início" />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (activeModuleKeys.includes("venue")) {
    return <VenueInicioPageContent />;
  }

  return <InicioContent />;
}

export default function InicioPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <PageHeader title="Início" />
          <BlockSkeleton className="h-96" />
        </PageContainer>
      }
    >
      <InicioDispatcher />
    </Suspense>
  );
}
