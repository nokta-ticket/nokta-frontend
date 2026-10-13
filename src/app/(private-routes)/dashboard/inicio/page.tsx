"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganizations } from "@/context/OrganizationContext";
import { useTicketsAccess } from "@/context/TicketsAccessContext";
import { writeBootHint } from "../_lib/boot-prefetch";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { VenueInicioPageContent } from "../venue/inicio/venue-inicio-content";
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
 * Onboarding pendente (sem organização OU sem nenhum módulo/capacidade
 * ativa) sempre volta pra `/dashboard/onboarding`, que por sua vez restaura
 * o passo salvo em localStorage. O middleware não pode decidir isso sozinho
 * — ele roda no Edge e só enxerga o cookie `user` (JWT), sem acesso a
 * organização/módulos (fonte de verdade é a API) — por isso o gate fica
 * aqui, no primeiro componente client que já tem `useOrganizations()`.
 */
function InicioDispatcher() {
  const router = useRouter();
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules, organizations } = useOrganizations();
  const { can: canTickets, loading: loadingTicketsAccess } = useTicketsAccess();

  const onboardingPending = !loadingOrgs && (currentOrg === null || (!loadingModules && activeModuleKeys.length === 0));

  useEffect(() => {
    if (onboardingPending) router.replace("/dashboard/onboarding");
  }, [onboardingPending, router]);

  // Organização sem bar e restaurante: a dica da próxima abertura sai daqui
  // (a do bar é gravada pela própria Início do bar, que conhece a unidade).
  const orgId = currentOrg?.id ?? null;
  const hasVenue = activeModuleKeys.includes("venue");
  const ready = !loadingOrgs && !loadingModules && !loadingTicketsAccess && !onboardingPending;
  const canTicketsFinance = canTickets("tickets.finance.view");
  useEffect(() => {
    if (!ready || orgId === null || hasVenue || organizations[0]?.id !== orgId) return;
    writeBootHint({ orgId, venue: false, locationId: null, venueFinance: false, ticketsFinance: canTicketsFinance, insights: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, orgId, hasVenue, canTicketsFinance]);

  if (loadingOrgs || onboardingPending || (currentOrg && loadingModules)) {
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
