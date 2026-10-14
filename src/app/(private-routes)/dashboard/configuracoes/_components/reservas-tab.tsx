"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DefinitionItem, DefinitionList } from "../../_components/definition-list";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";

export function ReservasTab({ orgId }: { orgId: number }) {
  const { data: locations, isLoading } = useVenueLocations(orgId);

  if (isLoading) return <Skeleton className="h-72 rounded-card" />;
  if (!locations || locations.length === 0) {
    return <EmptyState icon="map-pin" title="Nenhuma unidade" description="Crie uma unidade na aba Unidades para configurar reservas." />;
  }

  return (
    <div className="space-y-4">
      {locations.map((loc, i) => (
        <Card key={loc.id} className="fade-up" style={{ ["--i" as string]: i } as never}>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                {loc.nome}
                {loc.isMain ? <StatusBadge tone="brand" dot={false}>Principal</StatusBadge> : null}
              </CardTitle>
              <CardDescription>Editável na aba Unidades.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DefinitionList columns={3}>
              <DefinitionItem label="Duração padrão" value={`${loc.defaultReservationDurationMinutes} min`} />
              <DefinitionItem label="Antecedência mínima" value={loc.reservationMinAdvanceMinutes > 0 ? `${loc.reservationMinAdvanceMinutes} min` : "Sem restrição"} />
              <DefinitionItem label="Tolerância de atraso" value={loc.reservationLateToleranceMinutes ? `${loc.reservationLateToleranceMinutes} min` : "Não definida"} />
            </DefinitionList>
          </CardContent>
        </Card>
      ))}
      <Callout tone="neutral">A marcação de não comparecimento continua sempre manual — estas preferências só orientam a equipe.</Callout>
    </div>
  );
}
