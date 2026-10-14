"use client";

import { Button } from "@/components/ui/button";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useVenueBusinessHours } from "../../configuracoes/_hooks/use-venue-settings";

/**
 * Resumo do horário de funcionamento (unidade principal), só leitura —
 * nenhum cálculo de "aberto agora" aqui (isso é do backend, ver
 * venue-business-hours-status.util.ts usado pela Home pública).
 */
export function BusinessHoursSummary({ orgId, onClick }: { orgId: number; onClick: () => void }) {
  const { data: locations } = useVenueLocations(orgId);
  const mainLocation = locations?.find((l) => l.isMain) ?? locations?.[0] ?? null;
  const { data: hours } = useVenueBusinessHours(orgId, mainLocation?.id ?? null);

  const activeDays = new Set((hours ?? []).filter((h) => h.active !== false).map((h) => h.dayOfWeek)).size;

  return (
    <Button variant="outline" leftIcon="clock" onClick={onClick}>
      {activeDays > 0 ? `Horário · ${activeDays} ${activeDays === 1 ? "dia" : "dias"}` : "Definir horário"}
    </Button>
  );
}
