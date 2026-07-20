"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  VENUE_INSIGHTS_COMPARISON_LABEL,
  VENUE_INSIGHTS_GRANULARITY_LABEL,
  VENUE_INSIGHTS_QUICK_PERIOD_LABEL,
  type VenueInsightsComparison,
  type VenueInsightsGranularity,
  type VenueInsightsQuickPeriod,
} from "@/services/venue-insights";

export interface InsightsFilterValue {
  locationId: number | null;
  quickPeriod: VenueInsightsQuickPeriod | "CUSTOM";
  startDate: string;
  endDate: string;
  comparison: VenueInsightsComparison;
  granularity: VenueInsightsGranularity;
}

export function InsightsFilterBar({
  value,
  onChange,
  locations,
  showGranularity = true,
}: {
  value: InsightsFilterValue;
  onChange: (v: InsightsFilterValue) => void;
  locations: { id: number; nome: string; isMain: boolean }[];
  showGranularity?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {locations.length > 1 ? (
        <Select
          value={value.locationId === null ? "all" : String(value.locationId)}
          onValueChange={(v) => onChange({ ...value, locationId: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger className="w-48"><SelectValue placeholder="Unidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.nome} {loc.isMain ? "· Principal" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select value={value.quickPeriod} onValueChange={(v) => onChange({ ...value, quickPeriod: v as InsightsFilterValue["quickPeriod"] })}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(VENUE_INSIGHTS_QUICK_PERIOD_LABEL) as VenueInsightsQuickPeriod[]).map((k) => (
            <SelectItem key={k} value={k}>{VENUE_INSIGHTS_QUICK_PERIOD_LABEL[k]}</SelectItem>
          ))}
          <SelectItem value="CUSTOM">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {value.quickPeriod === "CUSTOM" ? (
        <div className="flex items-center gap-1">
          <Input type="date" className="w-36" value={value.startDate} onChange={(e) => onChange({ ...value, startDate: e.target.value })} />
          <span className="text-xs text-black/40">até</span>
          <Input type="date" className="w-36" value={value.endDate} onChange={(e) => onChange({ ...value, endDate: e.target.value })} />
        </div>
      ) : null}

      <Select value={value.comparison} onValueChange={(v) => onChange({ ...value, comparison: v as VenueInsightsComparison })}>
        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(VENUE_INSIGHTS_COMPARISON_LABEL) as VenueInsightsComparison[]).map((k) => (
            <SelectItem key={k} value={k}>{VENUE_INSIGHTS_COMPARISON_LABEL[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showGranularity ? (
        <Select value={value.granularity} onValueChange={(v) => onChange({ ...value, granularity: v as VenueInsightsGranularity })}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(VENUE_INSIGHTS_GRANULARITY_LABEL) as VenueInsightsGranularity[]).map((k) => (
              <SelectItem key={k} value={k}>{VENUE_INSIGHTS_GRANULARITY_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

export function toInsightsApiParams(value: InsightsFilterValue) {
  const period =
    value.quickPeriod === "CUSTOM"
      ? { startDate: value.startDate || undefined, endDate: value.endDate || undefined }
      : { quickPeriod: value.quickPeriod };
  return {
    locationId: value.locationId ?? undefined,
    ...period,
    comparison: value.comparison,
    granularity: value.granularity,
  };
}
