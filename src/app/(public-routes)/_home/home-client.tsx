"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import type { EventoAPI, GetEvents } from "@/interfaces/events";
import { Icon } from "@/components/ui/icon";
import { EventRow, EventRowSkeleton } from "@/components/events/event-card";
import { HeroBanner } from "@/components/home/hero-banner";
import { EventCardLux, EventCardLuxSkeleton, FeaturedCarousel, FeaturedCarouselSkeleton } from "@/components/home/event-showcase";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";

type State = {
  featured: EventoAPI[] | null;
  events: EventoAPI[] | null;
  page: number;
  lastPage: number;
  loadingMore: boolean;
  error: boolean;
};

export function HomeClient() {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<State>({ featured: null, events: null, page: 1, lastPage: 1, loadingMore: false, error: false });

  const load = useCallback(async () => {
    try {
      const [featuredRes, eventsRes] = await Promise.all([api.get<EventoAPI[]>("/eventos/destaques"), api.get<GetEvents>("/eventos", { params: { page: 1 } })]);
      const featured = Array.isArray(featuredRes.data) ? featuredRes.data : [];
      setState((s) => ({ ...s, featured, events: eventsRes.data.data, page: 1, lastPage: eventsRes.data.paginate?.lastPage ?? eventsRes.data.paginate?.totalPages ?? 1, error: false }));
    } catch {
      setState((s) => ({ ...s, featured: [], events: [], error: true }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (state.loadingMore || state.page >= state.lastPage) return;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const next = state.page + 1;
      const res = await api.get<GetEvents>("/eventos", { params: { page: next } });
      setState((s) => ({ ...s, events: [...(s.events ?? []), ...res.data.data], page: next, loadingMore: false }));
    } catch {
      toast.error("Não deu pra carregar mais eventos agora.");
      setState((s) => ({ ...s, loadingMore: false }));
    }
  };

  const toggleFavorite = isAuthenticated
    ? async (id: string, favorite: boolean) => {
        const patch = (list: EventoAPI[] | null) => list?.map((e) => (e.id === id ? { ...e, isFavorite: favorite, favorito: favorite } : e)) ?? null;
        setState((s) => ({ ...s, featured: patch(s.featured), events: patch(s.events) }));
        try {
          await api.patch(`/eventos/${id}/favoritos`, { favorite });
        } catch {
          setState((s) => ({ ...s, featured: patch(s.featured), events: patch(s.events) }));
          toast.error("Não foi possível salvar o favorito.");
        }
      }
    : undefined;

  // O banner principal é a chamada pra produtores (ver HeroBanner) — todo
  // evento em destaque vai pro carrossel "Destaques".
  const featuredRest = state.featured;
  const upcoming = state.events;
  const loading = state.featured === null;

  return (
    <div className="pb-8">
      <HeroBanner />

      {/* Destaques */}
      {(loading || (featuredRest && featuredRest.length > 0)) && (
        <section className="mt-8 lg:mt-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHeader title="Destaques" action={<Link href="/eventos" className="text-sm font-semibold text-brand hover:underline">Ver todos</Link>} />
          </div>
          {/* celular: carrossel grande com snap */}
          <div className="mt-4 lg:hidden">{loading ? <FeaturedCarouselSkeleton /> : <FeaturedCarousel events={featuredRest!} onToggleFavorite={toggleFavorite} />}</div>
          {/* desktop: grade de cards premium */}
          <div className="mx-auto mt-6 hidden max-w-7xl grid-cols-4 gap-6 px-6 lg:grid">
            {loading ? Array.from({ length: 4 }).map((_, i) => <EventCardLuxSkeleton key={i} />) : featuredRest!.map((e, i) => <EventCardLux key={e.id} event={e} onToggleFavorite={toggleFavorite} index={i} priority={i < 4} />)}
          </div>
        </section>
      )}

      {/* Próximos eventos */}
      <section className="reveal mt-10 lg:mt-14">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionHeader title="Próximos eventos" action={<Link href="/eventos" className="text-sm font-semibold text-brand hover:underline">Buscar</Link>} />

          {state.error ? (
            <EmptyState icon="warning" title="Não deu pra carregar os eventos" description="Tenta de novo em alguns segundos." action={<button type="button" onClick={load} className="btn-lift inline-flex h-10 items-center gap-2 rounded-pill bg-brand px-5 text-sm font-semibold text-brand-foreground"><Icon name="refresh" size={14} />Tentar de novo</button>} className="mt-6" />
          ) : loading ? (
            <>
              <div className="mt-4 space-y-2.5 lg:hidden">{Array.from({ length: 5 }).map((_, i) => <EventRowSkeleton key={i} />)}</div>
              <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">{Array.from({ length: 8 }).map((_, i) => <EventCardLuxSkeleton key={i} />)}</div>
            </>
          ) : upcoming && upcoming.length > 0 ? (
            <>
              <div className="mt-4 space-y-2.5 lg:hidden">
                {upcoming.map((e, i) => (
                  <div key={e.id} className="row-in" style={{ ["--i" as string]: i } as never}>
                    <EventRow event={e} onToggleFavorite={toggleFavorite} />
                  </div>
                ))}
              </div>
              <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">
                {upcoming.map((e, i) => (
                  <EventCardLux key={e.id} event={e} onToggleFavorite={toggleFavorite} index={i} />
                ))}
              </div>
              {state.page < state.lastPage ? (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={loadMore} disabled={state.loadingMore} className="inline-flex h-11 items-center gap-2 rounded-pill border border-border-strong bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 disabled:opacity-60">
                    {state.loadingMore ? <Icon name="loader" size={14} className="animate-spin" /> : null}
                    Carregar mais eventos
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState icon="party" title="Nenhum evento por aqui ainda" description="Volta logo — novos rolês aparecem toda semana." className="mt-6" />
          )}
        </div>
      </section>

      {/* Chamada pra produtores */}
      <section className="reveal mx-auto mt-14 max-w-7xl px-4 lg:mt-20 lg:px-6">
        <div className="card-accent relative overflow-hidden rounded-[24px] border border-border bg-surface p-6 lg:flex lg:items-center lg:justify-between lg:p-10">
          <div className="ambient-blob -right-16 -top-16 size-64" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.75rem]">Crie seu evento com a gente</h2>
            <p className="mt-3 max-w-md text-body text-muted-foreground">Venda ingressos, controle a portaria pelo celular e receba direto na sua conta. Sem mensalidade.</p>
          </div>
          <Link href="/para-produtores" className="btn-lift relative mt-6 inline-flex h-12 items-center gap-2 rounded-pill bg-brand px-6 text-[15px] font-bold text-brand-foreground lg:mt-0">
            Quero produzir
            <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
