"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import type { EventoAPI, GetEvents } from "@/interfaces/events";
import { normalizePagination } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { EventCard, EventCardSkeleton, EventRow, EventRowSkeleton } from "@/components/events/event-card";
import { CityPicker, type CityOption } from "@/components/home/city-picker";
import { citySlug } from "@/lib/agenda/city";
import type { AgendaEvent } from "@/lib/agenda/types";
import { readSavedCity, saveCity } from "@/lib/city-preference";
import { AgendaCard } from "../../agenda/_components/agenda-card";
import { AgendaDisclosure } from "../../agenda/_components/agenda-disclosure";

type Geo = { city: CityOption | null; ipCity: CityOption | null; cities: CityOption[]; events: AgendaEvent[] };

type State = {
  events: EventoAPI[] | null;
  page: number;
  lastPage: number;
  total: number;
  loadingMore: boolean;
  error: string | null;
};

const INITIAL: State = { events: null, page: 1, lastPage: 1, total: 0, loadingMore: false, error: null };

/**
 * Tela "Buscar": campo grande no topo, resultados em linhas no celular e
 * grade no desktop, "Carregar mais" no fim. O termo vive na URL (?name=)
 * pra o link ser compartilhável e o voltar do navegador funcionar.
 */
export function EventosClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const term = useDebouncedValue(name.trim(), 350);
  const [state, setState] = useState<State>(INITIAL);
  // Resposta de uma busca antiga nunca sobrescreve a mais nova.
  const requestId = useRef(0);
  // Cidade (mesma escolha da home) e eventos da agenda que batem com a busca.
  const [citySel, setCitySel] = useState<string | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    setCitySel(readSavedCity() ?? "auto");
  }, []);

  useEffect(() => {
    if (!citySel) return;
    let active = true;
    const qs = new URLSearchParams({ cidade: citySel, limit: "48" });
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
  }, [citySel, term]);

  const chooseCity = (slug: string) => {
    saveCity(slug);
    setCitySel(slug);
  };

  const load = useCallback(
    async (page: number, append: boolean) => {
      const rid = ++requestId.current;
      setState((s) => (append ? { ...s, loadingMore: true } : { ...s, events: null, error: null }));
      try {
        const res = await api.get<GetEvents>("/eventos", { params: { page, name: term } });
        if (rid !== requestId.current) return;
        const p = normalizePagination(res.data.paginate);
        setState((s) => ({ events: append ? [...(s.events ?? []), ...res.data.data] : res.data.data, page, lastPage: p.lastPage, total: p.total, loadingMore: false, error: null }));
      } catch (err) {
        if (rid !== requestId.current) return;
        if (append) {
          toast.error("Não deu pra carregar mais eventos agora.");
          setState((s) => ({ ...s, loadingMore: false }));
        } else {
          setState({ ...INITIAL, events: [], error: getErrorMessage(err, "Não foi possível carregar os eventos.") });
        }
      }
    },
    [term],
  );

  // Busca enquanto digita (com atraso) e espelha o termo na URL.
  useEffect(() => {
    load(1, false);
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("name", term);
    else params.delete("name");
    const next = params.toString();
    if (next !== searchParams.toString()) router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só o termo dispara a busca; a URL é efeito dela
  }, [term, load]);

  const toggleFavorite = isAuthenticated
    ? async (id: string, favorite: boolean) => {
        const patch = (list: EventoAPI[] | null) => list?.map((e) => (e.id === id ? { ...e, isFavorite: favorite, favorito: favorite } : e)) ?? null;
        setState((s) => ({ ...s, events: patch(s.events) }));
        try {
          await api.patch(`/eventos/${id}/favoritos`, { favorite });
        } catch {
          setState((s) => ({ ...s, events: patch(s.events) }));
          toast.error("Não foi possível salvar o favorito.");
        }
      }
    : undefined;

  const loading = state.events === null;
  const all = state.events ?? [];
  const noktaIn = (slug: string) => all.filter((e) => e.endereco?.localidade && citySlug(e.endereco.localidade) === slug);
  // Mesma regra da home: no automático, a cidade do IP vale se tiver evento.
  const city: CityOption | null = citySel === "brasil" || !geo ? null : (geo.city ?? (citySel === "auto" && geo.ipCity && noktaIn(geo.ipCity.slug).length > 0 ? geo.ipCity : null));
  const events = city ? noktaIn(city.slug) : all;
  const agenda = geo?.events ?? [];
  const cityOptions = useMemo(() => {
    const map = new Map<string, CityOption>();
    for (const c of geo?.cities ?? []) map.set(c.slug, { ...c });
    for (const e of state.events ?? []) {
      const n = e.endereco?.localidade;
      if (!n) continue;
      const slug = citySlug(n);
      const cur = map.get(slug) ?? { slug, name: n, count: 0 };
      map.set(slug, { ...cur, count: (cur.count ?? 0) + 1 });
    }
    return [...map.values()].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }, [geo?.cities, state.events]);
  const hasMore = state.page < state.lastPage;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <h1 className="font-display text-[2rem] uppercase leading-none text-foreground lg:text-display">Buscar</h1>
      <SearchInput id="busca-eventos" value={name} onChange={setName} placeholder="Nome do evento" className="mt-4 lg:max-w-2xl [&_button]:right-3 [&_input]:h-14 [&_input]:rounded-pill [&_input]:bg-surface [&_input]:pl-12 [&_input]:text-base [&_input]:shadow-card [&_svg]:left-5 [&_svg]:text-base" />

      <div className="mt-4">
        <CityPicker value={city} cities={cityOptions} detected={citySel === "auto"} onChange={chooseCity} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {term ? (
            <>
              Resultados pra <span className="font-semibold text-foreground">“{term}”</span>
            </>
          ) : (
            `Próximos eventos na Nokta${city ? ` em ${city.name}` : ""}`
          )}
          {!loading && !state.error && events.length > 0 ? <span className="tnum"> · {city ? events.length : state.total}</span> : null}
        </p>
      </div>

      {state.error ? (
        <ErrorState title="Não deu pra carregar os eventos" description={state.error} onRetry={() => load(1, false)} className="mt-4" />
      ) : loading ? (
        <>
          <div className="mt-4 space-y-2.5 lg:hidden">{Array.from({ length: 6 }).map((_, i) => <EventRowSkeleton key={i} />)}</div>
          <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">{Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}</div>
        </>
      ) : events.length === 0 && agenda.length > 0 ? (
        <p className="mt-3 rounded-card border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">{term ? `Nenhum evento da Nokta com “${term}”` : `Nenhum evento da Nokta${city ? ` em ${city.name}` : ""} ainda`}. Veja abaixo o que está na agenda.</p>
      ) : events.length === 0 ? (
        <EmptyState
          icon={term ? "search" : "party"}
          title={term ? "Nenhum rolê com esse nome ainda" : "Nenhum evento por aqui ainda"}
          description={term ? "Tenta outro nome ou dá uma olhada nos próximos eventos." : "Volta logo — novos rolês aparecem toda semana."}
          action={
            term ? (
              <Button variant="outline" shape="pill" onClick={() => setName("")}>
                Limpar busca
              </Button>
            ) : undefined
          }
          className="mt-4"
        />
      ) : (
        <>
          <div className="mt-4 space-y-2.5 lg:hidden">
            {events.map((e, i) => (
              <div key={e.id} className="row-in" style={{ ["--i" as string]: i % 12 } as React.CSSProperties}>
                <EventRow event={e} onToggleFavorite={toggleFavorite} />
              </div>
            ))}
          </div>
          <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">
            {events.map((e, i) => (
              <EventCard key={e.id} event={e} onToggleFavorite={toggleFavorite} className="fade-up" style={{ ["--i" as string]: i % 8 } as React.CSSProperties} />
            ))}
          </div>
          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" shape="pill" onClick={() => load(state.page + 1, true)} loading={state.loadingMore}>
                Carregar mais eventos
              </Button>
            </div>
          ) : null}
        </>
      )}

      {agenda.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-title font-semibold tracking-tight text-foreground">Na agenda{city ? ` em ${city.name}` : ""}</h2>
              <p className="mt-0.5 text-caption text-muted-foreground">Vendidos em outras plataformas. Você compra direto no site oficial.</p>
            </div>
            <Link href={city ? `/eventos/em/${city.slug}` : "/agenda"} className="shrink-0 text-sm font-semibold text-brand hover:underline">
              Ver tudo
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agenda.map((e, i) => (
              <AgendaCard key={e.id} event={e} index={i} />
            ))}
          </div>
          <AgendaDisclosure className="mt-8" />
        </section>
      ) : null}
    </div>
  );
}
