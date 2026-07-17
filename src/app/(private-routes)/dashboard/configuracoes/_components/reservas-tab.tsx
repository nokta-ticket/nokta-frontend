"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVenueLocations } from "../../venue/operacao/_hooks/use-venue-locations";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";

export function ReservasTab({ orgId }: { orgId: number }) {
  const { data: locations, isLoading } = useVenueLocations(orgId);

  if (isLoading) return <BlockSkeleton className="h-72" />;
  if (!locations || locations.length === 0) {
    return <EmptyState title="Nenhuma unidade" description="Crie uma unidade na aba Unidades para configurar reservas." />;
  }

  return (
    <div className="space-y-4">
      {locations.map((loc) => (
        <Card key={loc.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {loc.nome}
              {loc.isMain ? <Badge variant="secondary">Principal</Badge> : null}
            </CardTitle>
            <CardDescription>Editável na aba &quot;Unidades&quot;.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Duração padrão" value={`${loc.defaultReservationDurationMinutes} min`} />
            <Field
              label="Antecedência mínima"
              value={loc.reservationMinAdvanceMinutes > 0 ? `${loc.reservationMinAdvanceMinutes} min` : "Sem restrição"}
            />
            <Field
              label="Tolerância de atraso"
              value={loc.reservationLateToleranceMinutes ? `${loc.reservationLateToleranceMinutes} min` : "Não definida"}
            />
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-black/40">
        A marcação de não comparecimento continua sempre manual — estas preferências só orientam a equipe.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-black/50">{label}</p>
      <p className="mt-0.5 text-sm text-black/90">{value}</p>
    </div>
  );
}
