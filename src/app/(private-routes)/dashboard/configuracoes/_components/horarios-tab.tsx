"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { WEEKDAY_LABEL, type VenueBusinessHourInterval } from "@/services/venue-settings";
import { SELECT_CONTENT_CLASS, SELECT_TRIGGER_CLASS } from "../../_lib/form-classes";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { useSetVenueBusinessHours, useVenueBusinessHours } from "../_hooks/use-venue-settings";

interface EditableInterval extends VenueBusinessHourInterval {
  _key: string;
}

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `new-${keyCounter}`;
}

export function HorariosTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: locations, isLoading: loadingLocations } = useVenueLocations(orgId);
  const [locationId, setLocationId] = useState<number | null>(null);

  useEffect(() => {
    if (locationId !== null || !locations || locations.length === 0) return;
    setLocationId((locations.find((l) => l.isMain) ?? locations[0]).id);
  }, [locations, locationId]);

  const { data: hours, isLoading: loadingHours } = useVenueBusinessHours(orgId, locationId);
  const setHours = useSetVenueBusinessHours(orgId, locationId ?? -1);
  const [intervals, setIntervals] = useState<EditableInterval[]>([]);

  useEffect(() => {
    if (hours) {
      setIntervals(hours.map((h) => ({ ...h, _key: `saved-${h.id}` })));
    }
  }, [hours]);

  if (loadingLocations) return <Skeleton className="h-72 rounded-card" />;
  if (!locations || locations.length === 0) {
    return <EmptyState icon="clock" title="Nenhuma unidade" description="Crie uma unidade na aba Unidades para definir horários." />;
  }

  const addInterval = (dayOfWeek: number) => {
    setIntervals((prev) => [...prev, { _key: newKey(), dayOfWeek, opensAt: "09:00", closesAt: "18:00", active: true }]);
  };
  const removeInterval = (key: string) => setIntervals((prev) => prev.filter((i) => i._key !== key));
  const updateInterval = (key: string, patch: Partial<EditableInterval>) => setIntervals((prev) => prev.map((i) => (i._key === key ? { ...i, ...patch } : i)));

  const handleSave = () => {
    setHours.mutate(
      intervals.map(({ _key, ...rest }) => rest),
      {
        onSuccess: () => toast.success("Horários de funcionamento salvos."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar os horários.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      {locations.length > 1 ? (
        <Field label="Unidade" htmlFor="hours-location" className="max-w-xs">
          <Select value={locationId ? String(locationId) : ""} onValueChange={(v) => setLocationId(Number(v))}>
            <SelectTrigger id="hours-location" className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {loadingHours ? (
        <Skeleton className="h-72 rounded-card" />
      ) : (
        <Card className="divide-y divide-border p-0">
          {WEEKDAY_LABEL.map((label, dayOfWeek) => {
            const dayIntervals = intervals.filter((i) => i.dayOfWeek === dayOfWeek);
            const closed = dayIntervals.length === 0;
            return (
              <div key={dayOfWeek} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-6 sm:px-5">
                <div className="flex items-center justify-between sm:w-32 sm:shrink-0 sm:pt-2.5">
                  <p className={cn("text-sm font-semibold", closed ? "text-muted-foreground" : "text-foreground")}>{label}</p>
                  {closed ? <span className="text-caption text-subtle-foreground sm:hidden">Fechado</span> : null}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {closed ? <p className="hidden pt-2.5 text-caption text-subtle-foreground sm:block">Fechado</p> : null}
                  {dayIntervals.map((interval) => {
                    const overnight = interval.closesAt <= interval.opensAt;
                    return (
                      <div key={interval._key} className="flex flex-wrap items-center gap-2">
                        <Input type="time" aria-label="Abre às" className="w-[7.5rem]" value={interval.opensAt} disabled={!canManage} onChange={(e) => updateInterval(interval._key, { opensAt: e.target.value })} />
                        <span className="text-caption text-subtle-foreground">até</span>
                        <Input type="time" aria-label="Fecha às" className="w-[7.5rem]" value={interval.closesAt} disabled={!canManage} onChange={(e) => updateInterval(interval._key, { closesAt: e.target.value })} />
                        {overnight ? (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-brand-soft px-2 py-0.5 text-micro font-semibold text-brand">
                            <Icon name="moon" size={9} />
                            vira o dia seguinte
                          </span>
                        ) : null}
                        {canManage ? (
                          <Button variant="subtle" size="icon-sm" aria-label="Remover intervalo" onClick={() => removeInterval(interval._key)} className="hover:bg-danger-bg hover:text-danger">
                            <Icon name="trash" size={13} />
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                  {canManage ? (
                    <Button variant="ghost" size="sm" leftIcon="plus" onClick={() => addInterval(dayOfWeek)} className="-ml-2 text-brand hover:text-brand">
                      Adicionar intervalo
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={setHours.isPending} disabled={loadingHours} leftIcon="save">
            Salvar horários
          </Button>
        </div>
      ) : null}
    </div>
  );
}
