"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export type CityOption = { slug: string; name: string; count?: number };

/**
 * Seletor de cidade da home. "Todo o Brasil" mostra tudo; uma cidade filtra
 * os próximos eventos e a agenda. O padrão vem do IP (ver /api/agenda).
 */
export function CityPicker({ value, cities, detected, onChange, className }: { value: CityOption | null; cities: CityOption[]; detected?: boolean; onChange: (slug: string) => void; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn("press inline-flex max-w-full items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand/50", className)} aria-label="Escolher cidade">
          <Icon name="map-pin" size={13} className="shrink-0 text-brand" />
          <span className="truncate">{value?.name ?? "Todo o Brasil"}</span>
          <Icon name="chevron-down" size={11} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
        {detected && value ? <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">Pela sua localização</DropdownMenuLabel> : null}
        <DropdownMenuItem onSelect={() => onChange("brasil")} className="gap-2">
          <Icon name="globe" size={13} className="text-muted-foreground" />
          Todo o Brasil
          {!value ? <Icon name="check" size={12} className="ml-auto text-brand" /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {cities.map((c) => (
          <DropdownMenuItem key={c.slug} onSelect={() => onChange(c.slug)} className="gap-2">
            <span className="truncate">{c.name}</span>
            {value?.slug === c.slug ? <Icon name="check" size={12} className="ml-auto text-brand" /> : c.count ? <span className="ml-auto tabular-nums text-caption text-muted-foreground">{c.count}</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
