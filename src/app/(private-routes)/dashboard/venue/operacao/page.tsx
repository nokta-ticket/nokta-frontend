"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "./_hooks/use-venue-locations";
import { useVenueCashRegisters } from "./_hooks/use-venue-cash";
import { OnboardingLocation } from "./_components/onboarding-location";
import { MesasTab } from "./_components/mesas-tab";
import { ComandasTab } from "./_components/comandas-tab";
import { PedidosTab } from "./_components/pedidos-tab";
import { CaixaTab } from "./_components/caixa-tab";
import { CreateTabDialog } from "./_components/create-tab-dialog";
import { TabDetailSheet } from "./_components/tab-detail-sheet";
import { OrderBuilderSheet } from "./_components/order-builder-sheet";

type TabKey = "mesas" | "comandas" | "pedidos" | "caixa";

function CashStatusPill({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: registers } = useVenueCashRegisters(orgId, locationId);
  const anyOpen = (registers ?? []).some((r) => r.openSession !== null);
  if (!registers || registers.length === 0) return null;
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:flex ${
        anyOpen ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${anyOpen ? "bg-emerald-500" : "bg-gray-400"}`} />
      {anyOpen ? "Caixa aberto" : "Caixa fechado"}
    </span>
  );
}

export default function VenueOperacaoPage() {
  return (
    <Suspense fallback={<PageContainer><BlockSkeleton className="h-96" /></PageContainer>}>
      <VenueOperacaoPageContent />
    </Suspense>
  );
}

const TAB_PERMISSIONS: Record<TabKey, string[]> = {
  mesas: ["venue.operation.tables.view"],
  comandas: ["venue.operation.tabs.view"],
  pedidos: ["venue.operation.orders.view", "venue.operation.preparation.view"],
  caixa: ["venue.operation.cash.manage"],
};

const ALL_TABS: { key: TabKey; label: string }[] = [
  { key: "mesas", label: "Mesas" },
  { key: "comandas", label: "Comandas" },
  { key: "pedidos", label: "Pedidos" },
  { key: "caixa", label: "Caixa" },
];

function VenueOperacaoPageContent() {
  const { currentOrg, activeModuleKeys, loadingOrgs, loadingModules } = useOrganizations();
  const { can } = useVenueAccess();
  const visibleTabs = ALL_TABS.filter((t) => TAB_PERMISSIONS[t.key].some((p) => can(p)));
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => {
    const fromParam = searchParams.get("tab") as TabKey | null;
    if (fromParam && visibleTabs.some((t) => t.key === fromParam)) return fromParam;
    return visibleTabs[0]?.key ?? "mesas";
  });
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [createTabOpen, setCreateTabOpen] = useState(false);
  const [detailTabId, setDetailTabId] = useState<number | null>(null);
  const [orderBuilderTabId, setOrderBuilderTabId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;
  const venueActive = activeModuleKeys.includes("venue");

  const { data: locations } = useVenueLocations(venueActive ? orgId : null);

  useEffect(() => {
    setSelectedLocationId(null);
  }, [orgId]);

  useEffect(() => {
    if (selectedLocationId !== null || !locations || locations.length === 0) return;
    const paramLocationId = Number(searchParams.get("locationId"));
    const fromParam = paramLocationId ? locations.find((l) => l.id === paramLocationId) : undefined;
    const main = fromParam ?? locations.find((l) => l.isMain) ?? locations[0];
    setSelectedLocationId(main.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, selectedLocationId]);

  // Deep link vindo de Reservas/Fila ("dar entrada" abre direto o detalhe da comanda criada).
  useEffect(() => {
    const paramTabId = Number(searchParams.get("tabId"));
    if (paramTabId) {
      setDetailTabId(paramTabId);
      setTab("mesas");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Gerencie mesas, comandas, pedidos e o caixa do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId || !venueActive) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Gerencie mesas, comandas, pedidos e o caixa do estabelecimento." />
        <EmptyState
          title="Venue não está ativo"
          description="O módulo Venue precisa estar ativo nesta organização para operar mesas, comandas e caixa."
        />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Gerencie mesas, comandas, pedidos e o caixa do estabelecimento." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Gerencie mesas, comandas, pedidos e o caixa do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Operação"
        description="Gerencie mesas, comandas, pedidos e o caixa do estabelecimento."
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
            <CashStatusPill orgId={orgId} locationId={selectedLocationId} />
            {can("venue.operation.tabs.open") ? (
              <Button onClick={() => setCreateTabOpen(true)}>
                <Plus size={16} /> Nova comanda
              </Button>
            ) : null}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max min-w-full sm:w-fit">
            {visibleTabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {visibleTabs.some((t) => t.key === "mesas") ? (
          <TabsContent value="mesas">
            <MesasTab
              orgId={orgId}
              locationId={selectedLocationId}
              onOpenTabDetail={setDetailTabId}
              onAddOrder={setOrderBuilderTabId}
            />
          </TabsContent>
        ) : null}
        {visibleTabs.some((t) => t.key === "comandas") ? (
          <TabsContent value="comandas">
            <ComandasTab orgId={orgId} locationId={selectedLocationId} onOpenTabDetail={setDetailTabId} />
          </TabsContent>
        ) : null}
        {visibleTabs.some((t) => t.key === "pedidos") ? (
          <TabsContent value="pedidos">
            <PedidosTab orgId={orgId} locationId={selectedLocationId} />
          </TabsContent>
        ) : null}
        {visibleTabs.some((t) => t.key === "caixa") ? (
          <TabsContent value="caixa">
            <CaixaTab orgId={orgId} locationId={selectedLocationId} />
          </TabsContent>
        ) : null}
      </Tabs>

      <CreateTabDialog
        orgId={orgId}
        locationId={selectedLocationId}
        open={createTabOpen}
        onOpenChange={setCreateTabOpen}
        onCreated={(t) => setDetailTabId(t.id)}
      />

      {detailTabId !== null ? (
        <TabDetailSheet
          orgId={orgId}
          locationId={selectedLocationId}
          tabId={detailTabId}
          open={detailTabId !== null}
          onOpenChange={(v) => !v && setDetailTabId(null)}
        />
      ) : null}

      {orderBuilderTabId !== null ? (
        <OrderBuilderSheet
          orgId={orgId}
          tabId={orderBuilderTabId}
          open={orderBuilderTabId !== null}
          onOpenChange={(v) => !v && setOrderBuilderTabId(null)}
        />
      ) : null}
    </PageContainer>
  );
}
