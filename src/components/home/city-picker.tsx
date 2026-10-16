"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import type { Place } from "@/lib/place";

/**
 * Seletor de lugar da home e da busca. "Todo o Brasil" mostra tudo; um estado
 * ou uma cidade filtra os eventos e a agenda. Pelo IP só vem o estado (ver
 * /api/agenda); a cidade a pessoa escolhe aqui.
 */
export function CityPicker({ value, states, cities, detected, onChange, className }: { value: Place | null; states: Place[]; cities: Place[]; detected?: boolean; onChange: (slug: string) => void; className?: string }) {
  // Cidades do estado em foco primeiro: quem está em SP procura Mauá, não Recife.
  const uf = value?.uf ?? null;
  const near = uf ? cities.filter((c) => c.uf === uf) : [];
  const others = uf ? cities.filter((c) => c.uf !== uf) : cities;

  const item = (p: Place) => (
    <DropdownMenuItem key={p.slug} onSelect={() => onChange(p.slug)} className="gap-2">
      <span className="truncate">{p.name}</span>
      {value?.slug === p.slug ? <Icon name="check" size={12} className="ml-auto text-brand" /> : p.count ? <span className="ml-auto tabular-nums text-caption text-muted-foreground">{p.count}</span> : null}
    </DropdownMenuItem>
  );
  const label = (text: string) => <DropdownMenuLabel className="text-caption font-normal text-muted-foreground">{text}</DropdownMenuLabel>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn("press inline-flex max-w-full items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand/50", className)} aria-label="Escolher estado ou cidade">
          <Icon name="map-pin" size={13} className="shrink-0 text-brand" />
          <span className="truncate">{value?.name ?? "Todo o Brasil"}</span>
          {value?.kind === "state" ? <span className="shrink-0 font-normal text-muted-foreground">· estado</span> : null}
          <Icon name="chevron-down" size={11} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[60vh] w-64 overflow-y-auto">
        {detected && value ? label("Pela sua localização") : null}
        <DropdownMenuItem onSelect={() => onChange("brasil")} className="gap-2">
          <Icon name="globe" size={13} className="text-muted-foreground" />
          Todo o Brasil
          {!value ? <Icon name="check" size={12} className="ml-auto text-brand" /> : null}
        </DropdownMenuItem>
        {states.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            {label("Estados")}
            {states.map(item)}
          </>
        ) : null}
        {near.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            {label(`Cidades em ${uf}`)}
            {near.map(item)}
          </>
        ) : null}
        {others.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            {label(near.length > 0 ? "Outras cidades" : "Cidades")}
            {others.map(item)}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
