"use client";

import { useOrganizations } from "@/context/OrganizationContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { selectFinanceDispatch } from "../_lib/finance-dispatch";
import TicketsInsightsPage from "./_tickets/tickets-insights-content";
import VenueInsightsPage from "./_venue/venue-insights-content";

/** Rota canônica de Insights — mesma lógica de composição do Financeiro (nunca mistura origem). */
export default function InsightsPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();

  if (loadingOrgs || loadingModules) {
    return (
      <div className="space-y-6">
        <PageHeader title="Insights" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="space-y-6">
        <PageHeader title="Insights" />
        <EmptyState icon="chart-line" title="Nada por aqui ainda" description="Crie seu workspace para analisar o desempenho comercial e operacional do negócio." action={<Button onClick={() => guard(() => undefined)}>Criar workspace</Button>} />
      </div>
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
    <div className="space-y-6">
      <PageHeader title="Insights" />
      <EmptyState icon="chart-line" title="Nada ativo ainda" description="Ative Eventos e ingressos ou a Operação em Explore a Nokta para ver os Insights." />
    </div>
  );
}
