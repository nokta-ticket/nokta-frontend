"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { usePeriod } from "@/context/PeriodContext";
import { selectFinanceDispatch } from "../../_lib/finance-dispatch";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { InsightsExportDialog } from "./_components/insights-export-menu";
import { DEFAULT_INSIGHTS_FILTER, InsightsToolbar, toInsightsApiParams, type InsightsFilterValue } from "./_components/insights-filter-bar";
import { TabSkeleton } from "./_components/insights-states";
import { EstoqueTab } from "./_components/tabs/estoque-tab";
import { FinanceiroTab } from "./_components/tabs/financeiro-tab";
import { OperacaoTab } from "./_components/tabs/operacao-tab";
import { ProdutosTab } from "./_components/tabs/produtos-tab";
import { ReservasTab } from "./_components/tabs/reservas-tab";
import { VendasTab } from "./_components/tabs/vendas-tab";
import { VisaoGeralTab } from "./_components/tabs/visao-geral-tab";

type TabKey = "geral" | "vendas" | "operacao" | "produtos" | "reservas" | "estoque" | "financeiro";

const TABS: { value: TabKey; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "vendas", label: "Vendas" },
  { value: "operacao", label: "Operação" },
  { value: "produtos", label: "Produtos" },
  { value: "reservas", label: "Reservas" },
  { value: "estoque", label: "Estoque" },
  { value: "financeiro", label: "Financeiro" },
];

/**
 * Insights do bar (módulo Venue). O período vem do seletor global do topbar;
 * comparação, unidade e granularidade ficam na toolbar local. Quando a
 * organização também tem Ingressos, a página de Insights empilha os dois
 * blocos — aí este vira uma seção ("Bar e restaurante"), não um h1.
 */
export default function VenueInsightsPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { period } = usePeriod();
  const [tab, setTab] = useState<TabKey>("geral");
  const [filter, setFilter] = useState<InsightsFilterValue>(DEFAULT_INSIGHTS_FILTER);

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");
  const standalone = selectFinanceDispatch(activeModuleKeys) !== "both";
  const locationsQuery = useVenueLocations(venueActive ? orgId : null);
  const locations = locationsQuery.data;

  // Trocou de organização → volta pra "Todas as unidades".
  useEffect(() => {
    setFilter((f) => (f.locationId === null ? f : { ...f, locationId: null }));
  }, [orgId]);

  // Trocou o período global → granularidade volta pra automática.
  useEffect(() => {
    setFilter((f) => (f.granularity === null ? f : { ...f, granularity: null }));
  }, [period]);

  const params = useMemo(() => toInsightsApiParams(filter, period), [filter, period]);

  const header = (actions?: ReactNode) => (standalone ? <PageHeader title="Insights" actions={actions} /> : <SectionHeader title="Bar e restaurante" icon="utensils" action={actions} />);

  if (loadingOrgs || loadingModules || (venueActive && orgId !== null && !locations && !locationsQuery.isError)) {
    return (
      <div className="w-full space-y-6">
        {header()}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full max-w-sm rounded-pill" />
          <Skeleton className="h-10 w-full max-w-60 rounded-input" />
        </div>
        <Skeleton className="h-10 w-full max-w-xl" />
        <TabSkeleton />
      </div>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <div className="w-full space-y-6">
        {header()}
        <EmptyState
          icon="store"
          title="Operação do bar não está ativa"
          description="Ative a Operação em Explore a Nokta pra acompanhar vendas, produtos, reservas, estoque e financeiro do bar."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/explorar">Explorar a Nokta</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (locationsQuery.isError || !locations) {
    return (
      <div className="w-full space-y-6">
        {header()}
        <ErrorState title="Não deu pra carregar as unidades" description="Confira a conexão e tenta de novo em alguns segundos." onRetry={() => void locationsQuery.refetch()} />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="w-full space-y-6">
        {header()}
        <OnboardingLocation orgId={orgId} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {header(<InsightsExportDialog orgId={orgId} params={params} />)}

      <InsightsToolbar value={filter} onChange={setFilter} period={period} locations={locations} showGranularity={tab === "vendas"} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList variant="line" aria-label="Seções dos insights">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral">
          <VisaoGeralTab orgId={orgId} params={params} hasMultipleLocations={locations.length > 1} />
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
    </div>
  );
}
