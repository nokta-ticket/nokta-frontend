"use client";

import { useEffect, useState } from "react";
import { Settings2, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import type { VenueFinancePeriodParams } from "@/services/venue-finance";
import { PeriodBasisFilter, type PeriodBasisValue } from "./_components/period-basis-filter";
import { ExportMenuButton } from "./_components/export-menu-button";
import { FinancialCategoriesManagerDialog } from "./_components/financial-categories-manager-dialog";
import { FeeRulesManagerDialog } from "./_components/fee-rules-manager-dialog";
import { VisaoGeralTab } from "./_components/visao-geral-tab";
import { VendasTab } from "./_components/vendas-tab";
import { DespesasTab } from "./_components/despesas-tab";
import { ContasAPagarTab } from "./_components/contas-a-pagar-tab";
import { CaixaTab } from "./_components/caixa-tab";
import { ConciliacaoTab } from "./_components/conciliacao-tab";

type TabKey = "geral" | "vendas" | "despesas" | "contas" | "caixa" | "conciliacao";

function toApiPeriod(value: PeriodBasisValue): VenueFinancePeriodParams {
  if (value.quickPeriod === "CUSTOM") {
    return { startDate: value.startDate || undefined, endDate: value.endDate || undefined, basis: value.basis };
  }
  return { quickPeriod: value.quickPeriod, basis: value.basis };
}

export default function VenueFinanceiroPage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const [tab, setTab] = useState<TabKey>("geral");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [feeRulesOpen, setFeeRulesOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodBasisValue>({ quickPeriod: "TODAY", startDate: "", endDate: "", basis: "CASH" });

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: locations } = useVenueLocations(venueActive ? orgId : null);

  useEffect(() => {
    setSelectedLocationId(null);
  }, [orgId]);

  useEffect(() => {
    if (selectedLocationId !== null || !locations || locations.length === 0) return;
    const main = locations.find((l) => l.isMain) ?? locations[0];
    setSelectedLocationId(main.id);
  }, [locations, selectedLocationId]);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Financeiro" description="Acompanhe vendas, caixas, despesas e o resultado do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader title="Financeiro" description="Acompanhe vendas, caixas, despesas e o resultado do estabelecimento." />
        <EmptyState title="Venue não está ativo" description="O módulo Venue precisa estar ativo nesta organização para ver o Financeiro." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Financeiro" description="Acompanhe vendas, caixas, despesas e o resultado do estabelecimento." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId) {
    return (
      <PageContainer>
        <PageHeader title="Financeiro" description="Acompanhe vendas, caixas, despesas e o resultado do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  const apiPeriod = toApiPeriod(period);

  return (
    <PageContainer>
      <PageHeader
        title="Financeiro"
        description="Visão gerencial baseada nos registros operacionais do estabelecimento — não substitui relatório contábil."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {locations && locations.length > 1 ? (
              <Select value={String(selectedLocationId)} onValueChange={(v) => setSelectedLocationId(Number(v))}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Unidade" /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.nome} {loc.isMain ? "· Principal" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button variant="outline" onClick={() => setCategoriesOpen(true)}>
              <Tags size={16} /> Categorias
            </Button>
            <Button variant="outline" onClick={() => setFeeRulesOpen(true)}>
              <Settings2 size={16} /> Taxas
            </Button>
            <ExportMenuButton orgId={orgId} locationId={selectedLocationId} period={apiPeriod} />
          </div>
        }
      />

      <PeriodBasisFilter value={period} onChange={setPeriod} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            <TabsTrigger value="geral">Visão geral</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="contas">Contas a pagar</TabsTrigger>
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
            <TabsTrigger value="conciliacao">Conciliação</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral">
          <VisaoGeralTab orgId={orgId} locationId={selectedLocationId} period={apiPeriod} hasMultipleLocations={(locations?.length ?? 0) > 1} />
        </TabsContent>
        <TabsContent value="vendas">
          <VendasTab orgId={orgId} locationId={selectedLocationId} period={apiPeriod} />
        </TabsContent>
        <TabsContent value="despesas">
          <DespesasTab orgId={orgId} locationId={selectedLocationId} locations={locations ?? []} />
        </TabsContent>
        <TabsContent value="contas">
          <ContasAPagarTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
        <TabsContent value="caixa">
          <CaixaTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
        <TabsContent value="conciliacao">
          <ConciliacaoTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
      </Tabs>

      <FinancialCategoriesManagerDialog orgId={orgId} open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <FeeRulesManagerDialog orgId={orgId} locations={locations ?? []} open={feeRulesOpen} onOpenChange={setFeeRulesOpen} />
    </PageContainer>
  );
}
