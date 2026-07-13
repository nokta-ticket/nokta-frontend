"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePeriod } from "@/context/PeriodContext";

const OPTIONS: { key: string; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

/**
 * Filtro de período global. A infra (contexto + persistência) já existe, mas o
 * controle fica DESABILITADO até o backend suportar range de datas ("em breve").
 */
export function PeriodFilter() {
  const { period } = usePeriod();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 rounded-lg border border-black/10 bg-white p-1 opacity-60">
            {OPTIONS.map((o) => (
              <Button
                key={o.key}
                variant={period.key === o.key ? "secondary" : "ghost"}
                size="sm"
                disabled
                className="h-7 px-2 text-xs"
              >
                {o.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="h-7 gap-1 px-2 text-xs"
            >
              <CalendarRange size={14} />
              <span className="hidden sm:inline">Personalizado</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>Filtro por período — em breve</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
