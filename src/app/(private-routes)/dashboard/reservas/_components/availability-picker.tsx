"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { useVenueAvailability } from "../_hooks/use-venue-availability";

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

/**
 * Mesas livres no horário, por área. Mesa ocupada por comanda ou bloqueada por
 * outra reserva fica desabilitada (com o motivo no `title`). Quando nenhuma
 * mesa sozinha comporta o grupo, o backend sugere uma combinação — "Usar
 * sugestão" aplica de uma vez.
 */
export function AvailabilityPicker({ orgId, locationId, startAt, endAt, partySize, areaId, reservationId, selectedTableIds, primaryTableId, onChange }: AvailabilityPickerProps) {
  const { data, isLoading, isError, refetch } = useVenueAvailability(orgId, { locationId, startAt, endAt, partySize, areaId, reservationId });

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

  const allTables = data?.areas.flatMap((a) => a.tables) ?? [];
  const selectedCapacity = allTables.filter((t) => selectedTableIds.includes(t.id)).reduce((sum, t) => sum + (t.capacidade ?? 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Callout
        tone="danger"
        title="Não deu pra consultar a disponibilidade"
        action={
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        }
      />
    );
  }

  const belowCapacity = selectedCapacity > 0 && selectedCapacity < partySize;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          Lugares selecionados: <span className={cn("font-semibold tnum", belowCapacity ? "text-warning" : "text-foreground")}>{selectedCapacity}</span> <span className="tnum">/ {partySize}</span>
        </span>
        {belowCapacity ? (
          <span className="inline-flex items-center gap-1 text-caption font-medium text-warning">
            <Icon name="warning" size={11} /> Abaixo do tamanho do grupo
          </span>
        ) : null}
      </div>

      {data.suggestedCombination && data.suggestedCombination.length > 0 ? (
        <Callout
          tone="brand"
          icon="lightbulb"
          title="Nenhuma mesa sozinha comporta o grupo"
          action={
            <Button size="sm" variant="outline" onClick={() => onChange(data.suggestedCombination!, data.suggestedCombination![0])}>
              Usar sugestão
            </Button>
          }
        >
          Sugestão: juntar {data.suggestedCombination.map((id) => allTables.find((t) => t.id === id)?.nome ?? id).join(" + ")}.
        </Callout>
      ) : null}

      {data.areas.map((area) => (
        <section key={area.id} className="space-y-2">
          <h4 className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{area.nome}</h4>
          <div className="flex flex-wrap gap-2">
            {area.tables.map((t) => {
              const selected = selectedTableIds.includes(t.id);
              const disabled = !t.available && !selected;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => toggleTable(t.id, t.available, selected)}
                  title={t.occupiedByOpenTab ? "Ocupada agora por uma comanda aberta" : t.blockedByReservation ? "Bloqueada por outra reserva nesse horário" : undefined}
                  className={cn(
                    "press inline-flex h-11 items-center gap-1.5 rounded-input border px-3.5 text-sm font-medium transition-colors",
                    selected ? "border-transparent bg-brand-soft text-brand ring-2 ring-brand" : disabled ? "cursor-not-allowed border-border/60 bg-surface-2/50 text-subtle-foreground line-through opacity-60" : "border-border bg-surface-2 text-foreground hover:bg-surface-3",
                  )}
                >
                  {selected ? <Icon name="check" size={11} /> : null}
                  {t.nome}
                  {t.capacidade ? (
                    <span className={cn("inline-flex items-center gap-1 text-caption tnum", selected ? "opacity-80" : "text-muted-foreground")}>
                      <Icon name="chair" size={10} />
                      {t.capacidade}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {selectedTableIds.length > 1 ? (
        <section className="space-y-2">
          <h4 className="text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Mesa principal</h4>
          <div className="flex flex-wrap gap-2">
            {selectedTableIds.map((id) => {
              const table = allTables.find((t) => t.id === id);
              const active = primaryTableId === id;
              return (
                <button key={id} type="button" aria-pressed={active} onClick={() => onChange(selectedTableIds, id)} className={cn("press inline-flex h-9 items-center gap-1.5 rounded-pill border px-3 text-caption font-medium transition-colors", active ? "border-transparent bg-brand text-brand-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground")}>
                  {active ? <Icon name="star" size={10} /> : null}
                  {table?.nome ?? id}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
