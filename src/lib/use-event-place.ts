"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventoAPI } from "@/interfaces/events";
import type { AgendaEvent } from "@/lib/agenda/types";
import { citySlug } from "@/lib/agenda/city";
import { readSavedCity, saveCity } from "@/lib/city-preference";
import { inPlace, isUf, statePlace, type Place } from "@/lib/place";

type Geo = { place: Place | null; ipState: Place | null; states?: Place[]; cities?: Place[]; events: AgendaEvent[] };

/**
 * Lugar escolhido no seletor (home e busca) + agenda daquele lugar.
 * Escolha salva neste aparelho; sem escolha é "auto": o ESTADO do IP, e só se
 * houver evento nele (da agenda ou da Nokta). Cidade é sempre manual.
 */
export function useEventPlace({ nokta, term, limit, initialAgenda }: { nokta: EventoAPI[] | null; term?: string; limit?: number; initialAgenda?: AgendaEvent[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const [geo, setGeo] = useState<Geo | null>(initialAgenda ? { place: null, ipState: null, events: initialAgenda } : null);

  useEffect(() => {
    setSel(readSavedCity() ?? "auto");
  }, []);

  useEffect(() => {
    if (!sel) return;
    let active = true;
    const qs = new URLSearchParams({ cidade: sel });
    if (limit) qs.set("limit", String(limit));
    if (term) qs.set("q", term);
    fetch(`/api/agenda?${qs}`)
      .then((r) => (r.ok ? (r.json() as Promise<Geo>) : null))
      .then((data) => {
        if (active && data) setGeo(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [sel, term, limit]);

  const choose = useCallback((slug: string) => {
    saveCity(slug);
    setSel(slug);
  }, []);

  const noktaIn = useCallback((p: Place) => (nokta ?? []).filter((e) => inPlace(p, e.endereco?.localidade, e.endereco?.uf)), [nokta]);

  // Opções do seletor: agenda + eventos da Nokta, com contagem.
  const { states, cities } = useMemo(() => {
    const st = new Map<string, Place>();
    for (const s of geo?.states ?? []) if (s.uf) st.set(s.uf, { ...s });
    const ct = new Map<string, Place>();
    for (const c of geo?.cities ?? []) ct.set(c.slug, { ...c });
    for (const e of nokta ?? []) {
      const uf = e.endereco?.uf?.toUpperCase();
      if (isUf(uf)) {
        const cur = st.get(uf) ?? statePlace(uf, 0);
        st.set(uf, { ...cur, count: (cur.count ?? 0) + 1 });
      }
      const name = e.endereco?.localidade;
      if (!name) continue;
      const slug = citySlug(name);
      const cur = ct.get(slug) ?? { kind: "city" as const, slug, name, uf: isUf(uf) ? uf : null, count: 0 };
      ct.set(slug, { ...cur, count: (cur.count ?? 0) + 1 });
    }
    const byCount = (a: Place, b: Place) => (b.count ?? 0) - (a.count ?? 0);
    return { states: [...st.values()].sort(byCount), cities: [...ct.values()].sort(byCount) };
  }, [geo?.states, geo?.cities, nokta]);

  // Lugar que filtra a tela. No automático, o estado do IP vale se tiver
  // evento na agenda (a API já confere) ou evento da própria Nokta.
  const place: Place | null = useMemo(() => {
    if (sel === "brasil" || !geo) return null;
    if (geo.place) {
      if (geo.place.kind === "city") return cities.find((c) => c.slug === geo.place!.slug) ?? geo.place;
      return geo.place;
    }
    if (sel === "auto" && geo.ipState && noktaIn(geo.ipState).length > 0) return geo.ipState;
    return null;
  }, [sel, geo, cities, noktaIn]);

  return {
    place,
    /** Escolha veio do IP (mostra "Pela sua localização" no seletor). */
    detected: sel === "auto",
    states,
    cities,
    agenda: geo?.events ?? [],
    /** Lugar da agenda: pode ser null (Brasil) quando o estado do IP só tem eventos da Nokta. */
    agendaPlace: place && geo?.place && place.slug === geo.place.slug ? place : null,
    choose,
    /** Eventos da Nokta no lugar escolhido (todos, sem lugar; null carregando). */
    noktaEvents: nokta && place ? noktaIn(place) : nokta,
  };
}
