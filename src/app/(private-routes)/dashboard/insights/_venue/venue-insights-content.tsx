"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { InsightsFilterBar, toInsightsApiParams, type InsightsFilterValue } from "./_components/insights-filter-bar";
import { InsightsExportMenu } from "./_components/insights-export-menu";
import { VisaoGeralTab } from "./_components/tabs/visao-geral-tab";
import { VendasTab } from "./_components/tabs/vendas-tab";
import { OperacaoTab } from "./_components/tabs/operacao-tab";
import { ProdutosTab } from "./_components/tabs/produtos-tab";
import { ReservasTab } from "./_components/tabs/reservas-tab";
import { EstoqueTab } from "./_components/tabs/estoque-tab";
import { FinanceiroTab } from "./_components/tabs/financeiro-tab";

type TabKey = "geral" | "vendas" | "operacao" | "produtos" | "reservas" | "estoque" | "financeiro";

export default function VenueInsightsPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const [tab, setTab] = useState<TabKey>("geral");
  const [filter, setFilter] = useState<InsightsFilterValue>({
    locationId: null,
    quickPeriod: "TODAY",
    startDate: "",
    endDate: "",
    comparison: "PREVIOUS_PERIOD",
    granularity: "DAY",
  });

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: locations } = useVenueLocations(venueActive ? orgId : null);

  useEffect(() => {
    setFilter((f) => ({ ...f, locationId: null }));
  }, [orgId]);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Insights" description="Analise o desempenho operacional e comercial do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader title="Insights" description="Analise o desempenho operacional e comercial do estabelecimento." />
        <EmptyState title="Venue não está ativo" description="O módulo Venue precisa estar ativo nesta organização para ver os Insights." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Insights" description="Analise o desempenho operacional e comercial do estabelecimento." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!locations) {
    return (
      <PageContainer>
        <PageHeader title="Insights" description="Analise o desempenho operacional e comercial do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const params = toInsightsApiParams(filter);
  const hasMultipleLocations = locations.length > 1;

  return (
    <PageContainer>
      <PageHeader
        title="Insights"
        description="Leitura consolidada do que já acontece na Operação, Reservas, Estoque e Financeiro — não é uma nova fonte de dados."
        actions={<InsightsExportMenu orgId={orgId} params={params} />}
      />

      <InsightsFilterBar value={filter} onChange={setFilter} locations={locations} showGranularity={tab === "vendas"} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            <TabsTrigger value="geral">Visão geral</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="operacao">Operação</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral">
          <VisaoGeralTab orgId={orgId} params={params} hasMultipleLocations={hasMultipleLocations} />
        </TabsContent>
        <TabsContent value="vendas">
          <VendasTab orgId={orgId} params={params} />
        </TabsContent>
        <TabsContent value="operacao">
          <OperacaoTab orgId={orgId} params={params} />
        </TabsContent>
        <TabsContent value="produtos">
          <ProdutosTab orgId={orgId} params={params} />
        </TabsContent>
        <TabsContent value="reservas">
          <ReservasTab orgId={orgId} params={params} />
        </TabsContent>
        <TabsContent value="estoque">
          <EstoqueTab orgId={orgId} params={params} />
        </TabsContent>
        <TabsContent value="financeiro">
          <FinanceiroTab orgId={orgId} params={params} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
