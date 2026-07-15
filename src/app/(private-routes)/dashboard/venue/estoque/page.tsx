"use client";

import { useEffect, useState } from "react";
import { Boxes, PackageX, Plus, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { formatCents } from "@/services/venue-stock";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton, MetricsSkeleton } from "../../_components/states/loading-state";
import { MetricCard } from "../../_components/metric-card";
import { useVenueLocations } from "../operacao/_hooks/use-venue-locations";
import { OnboardingLocation } from "../operacao/_components/onboarding-location";
import { useVenueStockCategories, useVenueStockSummary } from "./_hooks/use-venue-stock-catalog";
import { VisaoGeralTab } from "./_components/visao-geral-tab";
import { ItensTab } from "./_components/itens-tab";
import { ComprasTab } from "./_components/compras-tab";
import { MovimentacoesTab } from "./_components/movimentacoes-tab";
import { InventarioTab } from "./_components/inventario-tab";
import { FornecedoresTab } from "./_components/fornecedores-tab";
import { ItemFormDialog } from "./_components/item-form-dialog";
import { PurchaseFormDialog } from "./_components/purchase-form-dialog";
import { useVenueStockSuppliers } from "./_hooks/use-venue-stock-catalog";

type TabKey = "geral" | "itens" | "compras" | "movimentacoes" | "inventario" | "fornecedores";

export default function VenueEstoquePage() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const [tab, setTab] = useState<TabKey>("geral");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: locations } = useVenueLocations(venueActive ? orgId : null);
  const { data: categories } = useVenueStockCategories(orgId);
  const { data: suppliers } = useVenueStockSuppliers(orgId);

  useEffect(() => {
    setSelectedLocationId(null);
  }, [orgId]);

  useEffect(() => {
    if (selectedLocationId !== null || !locations || locations.length === 0) return;
    const main = locations.find((l) => l.isMain) ?? locations[0];
    setSelectedLocationId(main.id);
  }, [locations, selectedLocationId]);

  const { data: summary, isLoading: loadingSummary } = useVenueStockSummary(orgId, selectedLocationId);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Estoque" description="Controle insumos, entradas, perdas, inventários e necessidades de reposição." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader title="Estoque" description="Controle insumos, entradas, perdas, inventários e necessidades de reposição." />
        <EmptyState title="Venue não está ativo" description="O módulo Venue precisa estar ativo nesta organização para gerenciar estoque." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Estoque" description="Controle insumos, entradas, perdas, inventários e necessidades de reposição." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId) {
    return (
      <PageContainer>
        <PageHeader title="Estoque" description="Controle insumos, entradas, perdas, inventários e necessidades de reposição." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Estoque"
        description="Controle insumos, entradas, perdas, inventários e necessidades de reposição."
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
            <Button variant="outline" onClick={() => setPurchaseFormOpen(true)}>
              <Plus size={16} /> Registrar compra
            </Button>
            <Button onClick={() => setItemFormOpen(true)}>
              <Plus size={16} /> Novo item
            </Button>
          </div>
        }
      />

      {loadingSummary ? (
        <MetricsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total de itens" value={String(summary?.totalItems ?? 0)} icon={<Boxes size={18} />} />
          <MetricCard label="Estoque baixo" value={String(summary?.lowStockCount ?? 0)} icon={<TrendingDown size={18} />} />
          <MetricCard label="Sem estoque" value={String(summary?.outOfStockCount ?? 0)} icon={<PackageX size={18} />} />
          <MetricCard label="Valor estimado" value={formatCents(summary?.estimatedValueCents ?? 0)} />
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            <TabsTrigger value="geral">Visão geral</TabsTrigger>
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="compras">Compras</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="inventario">Inventário</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral">
          <VisaoGeralTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
        <TabsContent value="itens">
          <ItensTab orgId={orgId} locations={locations ?? []} />
        </TabsContent>
        <TabsContent value="compras">
          <ComprasTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
        <TabsContent value="movimentacoes">
          <MovimentacoesTab orgId={orgId} locationId={selectedLocationId} locations={locations ?? []} />
        </TabsContent>
        <TabsContent value="inventario">
          <InventarioTab orgId={orgId} locationId={selectedLocationId} />
        </TabsContent>
        <TabsContent value="fornecedores">
          <FornecedoresTab orgId={orgId} />
        </TabsContent>
      </Tabs>

      <ItemFormDialog
        orgId={orgId}
        locations={locations ?? []}
        categories={categories ?? []}
        item={null}
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
      />
      <PurchaseFormDialog
        orgId={orgId}
        locationId={selectedLocationId}
        suppliers={suppliers ?? []}
        open={purchaseFormOpen}
        onOpenChange={setPurchaseFormOpen}
      />
    </PageContainer>
  );
}
