"use client";

import { Clock } from "lucide-react";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useVenueBusinessHours } from "../../configuracoes/_hooks/use-venue-settings";

/**
 * Resumo do horário de funcionamento (unidade principal), só leitura —
 * nenhum cálculo de "aberto agora" aqui (isso é responsabilidade do
 * backend, ver venue-business-hours-status.util.ts usado pela Home
 * pública; duplicar essa lógica no client divergiria com o tempo).
 */
export function BusinessHoursSummary({ orgId, onClick }: { orgId: number; onClick: () => void }) {
  const { data: locations } = useVenueLocations(orgId);
  const mainLocation = locations?.find((l) => l.isMain) ?? locations?.[0] ?? null;
  const { data: hours } = useVenueBusinessHours(orgId, mainLocation?.id ?? null);

  const activeDays = new Set((hours ?? []).filter((h) => h.active !== false).map((h) => h.dayOfWeek)).size;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[42px] items-center gap-2 rounded-[11px] border border-black/10 bg-white px-4 text-sm font-medium text-foreground shadow-sm hover:bg-black/[0.015]"
    >
      <Clock size={16} className="text-black/50" />
      {activeDays > 0
        ? `Horário definido · ${activeDays} ${activeDays === 1 ? "dia" : "dias"}`
        : "Definir horário de funcionamento"}
    </button>
  );
}
