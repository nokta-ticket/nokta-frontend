"use client";

import { Suspense } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { VenueInicioPageContent } from "../venue/inicio/page";
import { InicioContent } from "./_components/inicio-content";

/**
 * Início unificada (Fase 3). Organização com Venue ativo: reaproveita
 * `VenueInicioPage` inteira (já resolve o redirect por papel operacional —
 * WAITER/KITCHEN_BAR/STOCK vão direto pra tela que usam o dia todo — e tem
 * o painel mais completo, com checklist de configuração). Organização
 * só-Tickets (ou híbrida, nesta fase): `InicioContent`, orientada pelo
 * endpoint Home v1. Unificar de verdade os dois pra híbridas é trabalho de
 * uma fase futura — ver docs/platform/unified-navigation.md "Home".
 */
function InicioDispatcher() {
  const { activeModuleKeys, loadingModules } = useOrganizations();

  if (loadingModules) {
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
