"use client";

import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { periodLabel, periodToFinanceParams, type PeriodState } from "@/context/PeriodContext";
import { VENUE_INSIGHTS_COMPARISON_LABEL, type VenueInsightsComparison, type VenueInsightsFilterParams, type VenueInsightsGranularity } from "@/services/venue-insights";

/**
 * Filtros locais dos Insights. O período vem do seletor global do topbar
 * (`PeriodContext`); aqui ficam só comparação, unidade e granularidade.
 * `granularity: null` = automática pelo tamanho do período.
 */
export interface InsightsFilterValue {
  locationId: number | null;
  comparison: VenueInsightsComparison;
  granularity: VenueInsightsGranularity | null;
}

export const DEFAULT_INSIGHTS_FILTER: InsightsFilterValue = { locationId: null, comparison: "PREVIOUS_PERIOD", granularity: null };

const COMPARISON_OPTIONS: SegmentedOption<VenueInsightsComparison>[] = [
  { value: "PREVIOUS_PERIOD", label: "Anterior" },
  { value: "SAME_PERIOD_LAST_WEEK", label: "Semana passada" },
  { value: "SAME_PERIOD_LAST_MONTH", label: "Mês passado" },
  { value: "NONE", label: "Nenhuma" },
];

const GRANULARITY_OPTIONS: SegmentedOption<VenueInsightsGranularity>[] = [
  { value: "HOUR", label: "Hora" },
  { value: "DAY", label: "Dia" },
  { value: "WEEK", label: "Semana" },
  { value: "MONTH", label: "Mês" },
];

/** Texto curto do pill de tendência ("vs. período anterior"). `null` quando não há comparação. */
export const COMPARISON_HINT: Record<VenueInsightsComparison, string | null> = {
  PREVIOUS_PERIOD: "vs. período anterior",
  SAME_PERIOD_LAST_WEEK: "vs. semana passada",
  SAME_PERIOD_LAST_MONTH: "vs. mês passado",
  NONE: null,
};

export const GRANULARITY_DESCRIPTION: Record<VenueInsightsGranularity, string> = {
  HOUR: "Vendas confirmadas por hora",
  DAY: "Vendas confirmadas por dia",
  WEEK: "Vendas confirmadas por semana",
  MONTH: "Vendas confirmadas por mês",
};

/** Quantos dias o período global cobre (1 pra "Hoje"). */
export function periodDayCount(period: PeriodState): number {
  if (period.key === "today") return 1;
  if (period.key === "7d") return 7;
  if (period.key === "30d") return 30;
  if (period.range.from && period.range.to) {
    const from = new Date(`${period.range.from}T00:00:00Z`).getTime();
    const to = new Date(`${period.range.to}T00:00:00Z`).getTime();
    return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
  }
  return 1;
}

/** Granularidade que deixa a linha do tempo legível pro tamanho do período. */
export function defaultGranularity(period: PeriodState): VenueInsightsGranularity {
  const days = periodDayCount(period);
  if (days <= 1) return "HOUR";
  if (days <= 62) return "DAY";
  if (days <= 180) return "WEEK";
  return "MONTH";
}

export function effectiveGranularity(value: InsightsFilterValue, period: PeriodState): VenueInsightsGranularity {
  return value.granularity ?? defaultGranularity(period);
}

/** Filtro local + período global → query string da API de Insights. */
export function toInsightsApiParams(value: InsightsFilterValue, period: PeriodState): VenueInsightsFilterParams {
  return {
    locationId: value.locationId ?? undefined,
    ...periodToFinanceParams(period),
    comparison: value.comparison,
    granularity: effectiveGranularity(value, period),
  };
}

export function InsightsToolbar({
  value,
  onChange,
  period,
  locations,
  showGranularity = false,
}: {
  value: InsightsFilterValue;
  onChange: (value: InsightsFilterValue) => void;
  period: PeriodState;
  locations: { id: number; nome: string; isMain: boolean }[];
  showGranularity?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5">
      <p className="inline-flex items-center gap-2 text-caption font-medium text-muted-foreground">
        <Icon name="calendar" size={12} />
        {periodLabel(period)}
      </p>

      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-caption font-medium text-muted-foreground">Comparar com</span>
        {/* Abaixo de `sm` as quatro opções não cabem na largura do celular: vira select nativo. */}
        <NativeSelect aria-label="Comparar com" className="sm:hidden" value={value.comparison} onChange={(e) => onChange({ ...value, comparison: e.target.value as VenueInsightsComparison })}>
          {COMPARISON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {VENUE_INSIGHTS_COMPARISON_LABEL[opt.value]}
            </option>
          ))}
        </NativeSelect>
        <div className="hidden sm:block">
          <SegmentedControl size="sm" value={value.comparison} onChange={(comparison) => onChange({ ...value, comparison })} options={COMPARISON_OPTIONS} />
        </div>
      </div>

      {locations.length > 1 ? (
        <NativeSelect aria-label="Unidade" className="lg:w-60" value={value.locationId === null ? "all" : String(value.locationId)} onChange={(e) => onChange({ ...value, locationId: e.target.value === "all" ? null : Number(e.target.value) })}>
          <option value="all">Todas as unidades</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.nome}
              {loc.isMain ? " · Principal" : ""}
            </option>
          ))}
        </NativeSelect>
      ) : null}

      {showGranularity ? (
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2">
          <span className="text-caption font-medium text-muted-foreground">Agrupar por</span>
          <SegmentedControl size="sm" value={effectiveGranularity(value, period)} onChange={(granularity) => onChange({ ...value, granularity })} options={GRANULARITY_OPTIONS} />
        </div>
      ) : null}
    </div>
  );
}
