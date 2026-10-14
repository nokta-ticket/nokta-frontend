"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { RowsSkeleton, Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { formatBRLCents } from "@/lib/format";
import { useRequireWorkspace } from "../../_components/require-workspace-provider";
import { useUrlTab } from "../../_hooks/use-url-tab";
import { OnboardingLocation } from "../../operacao/_components/onboarding-location";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useVenueStockAlerts, useVenueStockCategories, useVenueStockSummary, useVenueStockSuppliers } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockPurchases } from "../_hooks/use-venue-stock-purchases";
import { VisaoGeralTab } from "./visao-geral-tab";
import { ItensTab } from "./itens-tab";
import { ComprasTab } from "./compras-tab";
import { MovimentacoesTab } from "./movimentacoes-tab";
import { InventarioTab } from "./inventario-tab";
import { FornecedoresTab } from "./fornecedores-tab";
import { ItemFormDialog } from "./item-form-dialog";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { plural } from "./stock-primitives";

const TABS = ["geral", "itens", "compras", "movimentacoes", "inventario", "fornecedores"] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABEL: Record<TabKey, string> = {
  geral: "Visão geral",
  itens: "Itens",
  compras: "Compras",
  movimentacoes: "Movimentações",
  inventario: "Inventário",
  fornecedores: "Fornecedores",
};

const TITLE = "Estoque";
const THIRTY_DAYS = 30 * 86_400_000;

export function EstoqueSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title={TITLE} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-card" />
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-2xl rounded-xl" />
      <RowsSkeleton rows={6} />
    </div>
  );
}

export function EstoqueContent() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const [tab, setTab] = useUrlTab<TabKey>(TABS, "geral");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false);

  const orgId = currentOrg?.id ?? null;

  const { data: locations } = useVenueLocations(orgId);
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
  const { data: alerts } = useVenueStockAlerts(orgId, selectedLocationId);
  const { data: receivedPurchases, isLoading: loadingPurchases } = useVenueStockPurchases(orgId, selectedLocationId, { status: "RECEIVED", limit: 100 });

  const recentPurchases = useMemo(() => {
    const since = Date.now() - THIRTY_DAYS;
    const rows = (receivedPurchases?.data ?? []).filter((p) => p.receivedAt && new Date(p.receivedAt).getTime() >= since);
    return { count: rows.length, totalCents: rows.reduce((sum, p) => sum + p.totalCostCents, 0) };
  }, [receivedPurchases]);

  if (loadingOrgs || loadingModules) return <EstoqueSkeleton />;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={TITLE}
          actions={
            <Button leftIcon="plus" onClick={() => guard(() => {})}>
              Novo item
            </Button>
          }
        />
        <EmptyState
          icon="warehouse"
          title="Nenhum item ainda"
          description="Crie seu workspace pra começar a controlar o estoque."
          action={
            <Button leftIcon="plus" onClick={() => guard(() => {})}>
              Novo item
            </Button>
          }
        />
      </div>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={TITLE} />
        <OnboardingLocation orgId={orgId} />
      </div>
    );
  }

  if (!selectedLocationId || !locations) return <EstoqueSkeleton />;

  const location = locations.find((l) => l.id === selectedLocationId) ?? locations[0];
  const locationName = location.nome;
  const outOfStock = summary?.outOfStockCount ?? 0;
  const lowStock = summary?.lowStockCount ?? 0;
  const alertCount = outOfStock + lowStock;
  const alertCostCents = (alerts ?? []).reduce((sum, a) => sum + a.estimatedReplenishmentCostCents, 0);
  const alertSummary = [outOfStock > 0 ? plural(outOfStock, "item zerado", "itens zerados") : null, lowStock > 0 ? plural(lowStock, "abaixo do mínimo", "abaixo do mínimo") : null].filter(Boolean).join(" e ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={TITLE}
        actions={
          <>
            {locations.length > 1 ? (
              <NativeSelect aria-label="Unidade" value={String(selectedLocationId)} onChange={(e) => setSelectedLocationId(Number(e.target.value))} className="w-full sm:w-60">
                {locations.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.nome}
                    {loc.isMain ? " · Principal" : ""}
                  </option>
                ))}
              </NativeSelect>
            ) : null}
            <Button variant="outline" leftIcon="truck" onClick={() => setPurchaseFormOpen(true)}>
              Registrar compra
            </Button>
            <Button leftIcon="plus" onClick={() => setItemFormOpen(true)}>
              Novo item
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Itens em alerta" icon="warning" value={alertCount} loading={loadingSummary} hint={loadingSummary ? undefined : alertCount > 0 ? alertSummary : `Tudo acima do mínimo em ${locationName}`} />
        <StatCard label="Valor em estoque" icon="warehouse" format="currency" value={summary ? summary.estimatedValueCents / 100 : undefined} loading={loadingSummary} hint={summary ? `${plural(summary.totalItems, "item com saldo", "itens com saldo")} em ${locationName}` : undefined} />
        <StatCard label="Compras em 30 dias" icon="truck" format="currency" value={loadingPurchases ? undefined : recentPurchases.totalCents / 100} loading={loadingPurchases} hint={loadingPurchases ? undefined : recentPurchases.count > 0 ? plural(recentPurchases.count, "compra recebida", "compras recebidas") : "Nenhuma compra recebida no período"} />
      </div>

      {alertCount > 0 && tab !== "geral" ? (
        <Callout
          tone="warning"
          title={alertSummary}
          action={
            <Button size="sm" variant="outline" onClick={() => setTab("geral")}>
              Ver alertas
            </Button>
          }
        >
          {alertCostCents > 0 ? `Repor tudo custa cerca de ${formatBRLCents(alertCostCents)} em ${locationName}.` : `Itens pra repor em ${locationName}.`}
        </Callout>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-5">
        <TabsList variant="line" aria-label="Seções do estoque" className="-mx-4 px-4 lg:mx-0 lg:px-0">
          {TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {TAB_LABEL[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral">
          <VisaoGeralTab orgId={orgId} locationId={selectedLocationId} locationName={locationName} />
        </TabsContent>
        <TabsContent value="itens">
          <ItensTab orgId={orgId} locationId={selectedLocationId} locationName={locationName} locations={locations} onCreate={() => setItemFormOpen(true)} />
        </TabsContent>
        <TabsContent value="compras">
          <ComprasTab orgId={orgId} locationId={selectedLocationId} suppliers={suppliers ?? []} onRegister={() => setPurchaseFormOpen(true)} />
        </TabsContent>
        <TabsContent value="movimentacoes">
          <MovimentacoesTab orgId={orgId} locationId={selectedLocationId} locations={locations} />
        </TabsContent>
        <TabsContent value="inventario">
          <InventarioTab orgId={orgId} locationId={selectedLocationId} locationName={locationName} />
        </TabsContent>
        <TabsContent value="fornecedores">
          <FornecedoresTab orgId={orgId} />
        </TabsContent>
      </Tabs>

      <ItemFormDialog orgId={orgId} locations={locations} categories={categories ?? []} item={null} open={itemFormOpen} onOpenChange={setItemFormOpen} />
      <PurchaseFormDialog orgId={orgId} locationId={selectedLocationId} suppliers={suppliers ?? []} open={purchaseFormOpen} onOpenChange={setPurchaseFormOpen} />
    </div>
  );
}
