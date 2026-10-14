"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { VenueLocation } from "@/services/venue-operation";
import { useVenueLocations } from "./use-venue-locations";

/**
 * Unidade selecionada nas telas operacionais (Mesas e comandas, Pedidos,
 * Caixa, Terminais, Reservas): `?locationId=` da URL vence, senão a
 * principal, senão a primeira. Troca de organização zera a escolha.
 * Precisa de `<Suspense>` no pai (useSearchParams).
 */
export function useSelectedLocation(orgId: number | null) {
  const searchParams = useSearchParams();
  const { data: locations, isLoading } = useVenueLocations(orgId);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

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

  const location: VenueLocation | null = locations?.find((l) => l.id === selectedLocationId) ?? null;

  return { locations, loadingLocations: isLoading, selectedLocationId, setSelectedLocationId, location };
}
