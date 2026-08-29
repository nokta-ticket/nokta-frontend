"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { useVenueLocations } from "../_hooks/use-venue-locations";
import { OnboardingLocation } from "../_components/onboarding-location";
import { PedidosTab } from "../_components/pedidos-tab";

/** Página própria (antes era uma aba dentro de Operação) — item dedicado no menu lateral, ver navigation-presentation.ts (ORDERS/PREPARATION). */
export default function OperacaoPedidosPage() {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const searchParams = useSearchParams();
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

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

  const description = "Acompanhe o preparo dos pedidos lançados em mesas, comandas e balcão.";

  if (loadingOrgs || loadingModules) {
    return (
      <PageContainer>
        <PageHeader title="Pedidos" description={description} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  if (!orgId) {
    return (
      <PageContainer>
        <PageHeader title="Pedidos" description={description} />
        <EmptyState title="Nenhuma organização selecionada" description="Selecione uma organização para ver os pedidos." />
      </PageContainer>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Pedidos" description={description} />
        <OnboardingLocation orgId={orgId} />
      </PageContainer>
    );
  }

  if (!selectedLocationId) {
    return (
      <PageContainer>
        <PageHeader title="Pedidos" description={description} />
        <BlockSkeleton className="h-96" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Pedidos"
        description={description}
        actions={
          locations && locations.length > 1 ? (
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
          ) : undefined
        }
      />
      <PedidosTab orgId={orgId} locationId={selectedLocationId} />
    </PageContainer>
  );
}
