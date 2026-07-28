"use client";

import { useOrganizations } from "@/context/OrganizationContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { Button } from "@/components/ui/button";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { selectFinanceDispatch } from "../_lib/finance-dispatch";
import TicketsInsightsPage from "./_tickets/tickets-insights-content";
import VenueInsightsPage from "./_venue/venue-insights-content";

/** Rota canônica de Insights — mesma lógica de composição do Financeiro (nunca mistura origem). */
export default function InsightsPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Insights" />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!currentOrg) {
    return (
      <PageContainer>
        <PageHeader
          title="Insights"
          description="Analise o desempenho comercial e operacional do negócio."
          actions={
            <Button onClick={() => guard(() => {})}>Criar workspace</Button>
          }
        />
        <EmptyState
          title="Nada por aqui ainda"
          description="Crie seu workspace para analisar o desempenho comercial e operacional do negócio."
          actionLabel="Criar workspace"
          onAction={() => guard(() => {})}
        />
      </PageContainer>
    );
  }

  const dispatch = selectFinanceDispatch(activeModuleKeys);

  if (dispatch === "both") {
    return (
      <div className="space-y-10">
        <TicketsInsightsPage />
        <VenueInsightsPage />
      </div>
    );
  }
  if (dispatch === "venue") return <VenueInsightsPage />;
  if (dispatch === "tickets") return <TicketsInsightsPage />;

  return (
    <PageContainer>
      <PageHeader title="Insights" description="Analise o desempenho comercial e operacional do negócio." />
      <EmptyState title="Nada ativo ainda" description="Ative Eventos e ingressos ou a Operação em Explore a Nokta para ver os Insights." />
    </PageContainer>
  );
}
