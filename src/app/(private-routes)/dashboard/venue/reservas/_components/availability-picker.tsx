"use client";

import { cn } from "@/lib/utils";
import { useVenueAvailability } from "../_hooks/use-venue-availability";
import { BlockSkeleton } from "../../../_components/states/loading-state";

interface AvailabilityPickerProps {
  orgId: number;
  locationId: number;
  startAt: string;
  endAt?: string;
  partySize: number;
  areaId?: number;
  reservationId?: number;
  selectedTableIds: number[];
  primaryTableId?: number;
  onChange: (tableIds: number[], primaryTableId: number | undefined) => void;
}

export function AvailabilityPicker({
  orgId,
  locationId,
  startAt,
  endAt,
  partySize,
  areaId,
  reservationId,
  selectedTableIds,
  primaryTableId,
  onChange,
}: AvailabilityPickerProps) {
  const { data, isLoading, isError } = useVenueAvailability(orgId, {
    locationId,
    startAt,
    endAt,
    partySize,
    areaId,
    reservationId,
  });

  const toggleTable = (tableId: number, available: boolean, selected: boolean) => {
    if (!available && !selected) return;
    if (selected) {
      const next = selectedTableIds.filter((id) => id !== tableId);
      onChange(next, primaryTableId === tableId ? next[0] : primaryTableId);
    } else {
      const next = [...selectedTableIds, tableId];
      onChange(next, primaryTableId ?? next[0]);
    }
  };

  const selectedCapacity =
    data?.areas.flatMap((a) => a.tables).filter((t) => selectedTableIds.includes(t.id))
      .reduce((sum, t) => sum + (t.capacidade ?? 0), 0) ?? 0;

  if (isLoading) return <BlockSkeleton className="h-32" />;
  if (isError || !data) {
    return <p className="text-sm text-red-600">Não foi possível consultar a disponibilidade.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-black/60">
          Capacidade selecionada: <span className="font-semibold text-gray-900">{selectedCapacity}</span> / {partySize}
        </span>
        {selectedCapacity < partySize && selectedCapacity > 0 ? (
          <span className="text-xs text-amber-600">Capacidade abaixo do grupo</span>
        ) : null}
      </div>

      {data.suggestedCombination ? (
        <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
          Nenhuma mesa isolada comporta o grupo — sugestão: combinar mesas.
        </p>
      ) : null}

      {data.areas.map((area) => (
        <div key={area.id} className="space-y-1.5">
          <p className="text-xs font-semibold text-black/50">{area.nome}</p>
          <div className="flex flex-wrap gap-1.5">
            {area.tables.map((t) => {
              const selected = selectedTableIds.includes(t.id);
              const disabled = !t.available && !selected;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTable(t.id, t.available, selected)}
                  title={
                    t.occupiedByOpenTab
                      ? "Ocupada agora por uma comanda aberta"
                      : t.blockedByReservation
                        ? "Bloqueada por outra reserva nesse horário"
                        : undefined
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    selected
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : disabled
                        ? "cursor-not-allowed border-black/5 bg-black/5 text-black/30 line-through"
                        : "border-black/10 bg-white text-gray-700 hover:border-violet-300",
                  )}
                >
                  {t.nome}
                  {t.capacidade ? <span className="ml-1 text-xs opacity-60">({t.capacidade})</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedTableIds.length > 1 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-black/50">Mesa principal</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedTableIds.map((id) => {
              const table = data.areas.flatMap((a) => a.tables).find((t) => t.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange(selectedTableIds, id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs",
                    primaryTableId === id
                      ? "border-violet-400 bg-violet-100 text-violet-700"
                      : "border-black/10 bg-white text-black/60",
                  )}
                >
                  {table?.nome ?? id}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
