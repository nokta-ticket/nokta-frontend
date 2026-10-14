"use client";

import type { ReactNode } from "react";
import { useOrganizations } from "@/context/OrganizationContext";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { VenueLocation } from "@/services/venue-operation";
import { useSelectedLocation } from "../_hooks/use-selected-location";
import { OnboardingLocation } from "./onboarding-location";

export interface LocationGateContext {
  orgId: number;
  locationId: number;
  location: VenueLocation;
  locations: VenueLocation[];
  setLocationId: (id: number) => void;
}

/**
 * Estados comuns das telas por unidade (carregando organização, sem
 * organização, sem unidade cadastrada, unidade ainda não resolvida) — cada
 * página só escreve o conteúdo de verdade via `children(ctx)`.
 */
export function LocationGate({ title, skeleton, children }: { title: string; skeleton?: ReactNode; children: (ctx: LocationGateContext) => ReactNode }) {
  const { currentOrg, loadingOrgs, loadingModules } = useOrganizations();
  const orgId = currentOrg?.id ?? null;
  const { locations, selectedLocationId, setSelectedLocationId, location } = useSelectedLocation(orgId);

  const fallback = skeleton ?? (
    <div className="space-y-6">
      <PageHeader title={title} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
      <Skeleton className="h-80 rounded-card" />
    </div>
  );

  if (loadingOrgs || loadingModules) return fallback;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <EmptyState icon="building" title="Nenhuma organização selecionada" description="Escolha uma organização no menu lateral pra continuar." />
      </div>
    );
  }

  if (locations && locations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <OnboardingLocation orgId={orgId} />
      </div>
    );
  }

  if (!selectedLocationId || !location || !locations) return fallback;

  return <>{children({ orgId, locationId: selectedLocationId, location, locations, setLocationId: setSelectedLocationId })}</>;
}
