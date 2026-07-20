"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { VENUE_FINANCE_QUICK_PERIOD_LABEL, type VenueFinanceBasis, type VenueFinanceQuickPeriod } from "@/services/venue-finance";

export interface PeriodBasisValue {
  quickPeriod: VenueFinanceQuickPeriod | "CUSTOM";
  startDate: string;
  endDate: string;
  basis: VenueFinanceBasis;
}

/**
 * Filtro local da tela de Financeiro (período rápido + intervalo customizado
 * + regime Caixa/Competência). Não reaproveita o PeriodFilter da topbar —
 * aquele é global (afeta também o dashboard do Tickets), está desabilitado de
 * propósito, e seus períodos (Hoje/7d/30d) não cobrem Ontem/Este mês/Mês
 * anterior exigidos aqui. Manter os dois filtros separados evita qualquer
 * risco de mudar o comportamento do Tickets.
 */
export function PeriodBasisFilter({ value, onChange }: { value: PeriodBasisValue; onChange: (v: PeriodBasisValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.quickPeriod}
        onValueChange={(v) => onChange({ ...value, quickPeriod: v as PeriodBasisValue["quickPeriod"] })}
      >
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(VENUE_FINANCE_QUICK_PERIOD_LABEL) as VenueFinanceQuickPeriod[]).map((k) => (
            <SelectItem key={k} value={k}>{VENUE_FINANCE_QUICK_PERIOD_LABEL[k]}</SelectItem>
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

      <Select value={value.basis} onValueChange={(v) => onChange({ ...value, basis: v as VenueFinanceBasis })}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="CASH">Caixa</SelectItem>
          <SelectItem value="ACCRUAL">Competência</SelectItem>
        </SelectContent>
      </Select>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={16} className="text-black/30" />
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            Visão gerencial baseada nos registros operacionais do estabelecimento.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Label className="sr-only">Regime</Label>
    </div>
  );
}
