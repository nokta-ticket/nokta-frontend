"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { WEEKDAY_LABEL, type VenueBusinessHourInterval } from "@/services/venue-settings";
import { useVenueLocations } from "../../operacao/_hooks/use-venue-locations";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
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

  if (loadingLocations) return <BlockSkeleton className="h-72" />;
  if (!locations || locations.length === 0) {
    return <EmptyState title="Nenhuma unidade" description="Crie uma unidade na aba Unidades para definir horários." />;
  }

  const addInterval = (dayOfWeek: number) => {
    setIntervals((prev) => [...prev, { _key: newKey(), dayOfWeek, opensAt: "09:00", closesAt: "18:00", active: true }]);
  };
  const removeInterval = (key: string) => setIntervals((prev) => prev.filter((i) => i._key !== key));
  const updateInterval = (key: string, patch: Partial<EditableInterval>) =>
    setIntervals((prev) => prev.map((i) => (i._key === key ? { ...i, ...patch } : i)));

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
        <Select value={locationId ? String(locationId) : ""} onValueChange={(v) => setLocationId(Number(v))}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {loadingHours ? (
        <BlockSkeleton className="h-72" />
      ) : (
        <div className="space-y-3">
          {WEEKDAY_LABEL.map((label, dayOfWeek) => {
            const dayIntervals = intervals.filter((i) => i.dayOfWeek === dayOfWeek);
            return (
              <div key={dayOfWeek} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">{label}</p>
                  {canManage ? (
                    <Button variant="ghost" size="sm" onClick={() => addInterval(dayOfWeek)}>
                      <Plus size={14} /> Adicionar intervalo
                    </Button>
                  ) : null}
                </div>
                {dayIntervals.length === 0 ? (
                  <p className="text-xs text-black/40">Fechado</p>
                ) : (
                  <div className="space-y-2">
                    {dayIntervals.map((interval) => (
                      <div key={interval._key} className="flex flex-wrap items-center gap-2">
                        <Input
                          type="time"
                          className="w-32"
                          value={interval.opensAt}
                          disabled={!canManage}
                          onChange={(e) => updateInterval(interval._key, { opensAt: e.target.value })}
                        />
                        <span className="text-xs text-black/40">até</span>
                        <Input
                          type="time"
                          className="w-32"
                          value={interval.closesAt}
                          disabled={!canManage}
                          onChange={(e) => updateInterval(interval._key, { closesAt: e.target.value })}
                        />
                        {interval.closesAt <= interval.opensAt ? (
                          <span className="text-xs text-violet-600">vira o dia seguinte</span>
                        ) : null}
                        {canManage ? (
                          <Button variant="ghost" size="sm" onClick={() => removeInterval(interval._key)}>
                            <Trash2 size={14} />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage ? (
        <Button onClick={handleSave} disabled={setHours.isPending || loadingHours}>
          {setHours.isPending ? "Salvando…" : "Salvar horários"}
        </Button>
      ) : null}
    </div>
  );
}
