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
import { useOrganizations } from "@/context/OrganizationContext";
import { useRequireWorkspace } from "../_components/require-workspace-provider";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { EmptyState } from "../_components/states/empty-state";
import { BlockSkeleton } from "../_components/states/loading-state";
import { useVenueLocations } from "./_hooks/use-venue-locations";
import { OnboardingLocation } from "./_components/onboarding-location";
import { OperacaoUnificadaView } from "./_components/operacao-unificada-view";
import { TabDetailSheet } from "./_components/tab-detail-sheet";

/**
 * Operação virou uma única tela unificada (mesa + comanda + balcão, abertos
 * e encerrados hoje) — antes era um conjunto de abas (Mesas/Comandas/
 * Pedidos/Caixa/Terminais). Pedidos, Caixa e Terminais saíram daqui e viraram
 * páginas próprias com item dedicado no menu lateral (ver
 * dashboard/operacao/pedidos, /caixa, /terminais e unified-sidebar.tsx).
 */
export default function VenueOperacaoPage() {
  return (
    <Suspense fallback={<PageContainer><BlockSkeleton className="h-96" /></PageContainer>}>
      <VenueOperacaoPageContent />
    </Suspense>
  );
}

function VenueOperacaoPageContent() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const { guard } = useRequireWorkspace();
  const searchParams = useSearchParams();
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [detailTabId, setDetailTabId] = useState<number | null>(null);

  const orgId = currentOrg?.id ?? null;

  const { data: locations } = useVenueLocations(orgId);

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
    if (paramTabId) setDetailTabId(paramTabId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Acompanhe mesas, comandas e vendas de balcão do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader
          title="Operação"
          description="Acompanhe mesas, comandas e vendas de balcão do estabelecimento."
          actions={
            <Button onClick={() => guard(() => {})}>
              <Plus size={16} /> Nova comanda
            </Button>
          }
        />
        <EmptyState
          title="Nenhuma comanda ainda"
          description="Crie seu workspace para começar a operar mesas, comandas e caixa."
          actionLabel="Nova comanda"
          onAction={() => guard(() => {})}
        />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Acompanhe mesas, comandas e vendas de balcão do estabelecimento." />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId) {
    return (
      <PageContainer>
        <PageHeader title="Operação" description="Acompanhe mesas, comandas e vendas de balcão do estabelecimento." />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {locations && locations.length > 1 ? (
        <div className="flex justify-end">
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
        </div>
      ) : null}

      <OperacaoUnificadaView orgId={orgId} locationId={selectedLocationId} onOpenTabDetail={setDetailTabId} />

      {detailTabId !== null ? (
        <TabDetailSheet
          orgId={orgId}
          locationId={selectedLocationId}
          tabId={detailTabId}
          open={detailTabId !== null}
          onOpenChange={(v) => !v && setDetailTabId(null)}
        />
      ) : null}
    </PageContainer>
  );
}
