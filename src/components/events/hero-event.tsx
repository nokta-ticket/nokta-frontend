"use client";

import Link from "next/link";
import type { EventoAPI } from "@/interfaces/events";
import { Icon } from "@/components/ui/icon";
import { cityLabel, formatEventDate, formatTime } from "@/lib/format";
import { EventPoster, eventHref, isLastCall } from "./event-card";

/**
 * Destaque principal da home.
 * Celular: o banner do evento inteiro (proporção real 818×355, nunca
 * cortado) num card arredondado, com título/data/local logo abaixo — o
 * evento é a estrela, como num flyer.
 * Desktop: faixa full-bleed com o banner desfocado ao fundo, grão, título
 * em display e CTAs em pílula.
 */
export function HeroEvent({ event }: { event: EventoAPI }) {
  const time = formatTime(event.horario);
  const lastCall = isLastCall(event);
  const href = eventHref(event);

  return (
    <section aria-label="Evento em destaque">
      {/* celular / tablet */}
      <div className="px-4 pt-2 lg:hidden">
        <Link href={href} className="press group block">
          <div className="relative aspect-[818/355] overflow-hidden rounded-[20px] bg-surface-2 shadow-card-hover ring-1 ring-white/5">
            <EventPoster event={event} priority sizes="100vw" className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]" />
            {lastCall ? (
              <span className="absolute left-3 top-3 rounded-pill bg-brand px-3 py-1.5 text-micro font-bold uppercase tracking-wider text-brand-foreground">Tá acabando</span>
            ) : (
              <span className="absolute left-3 top-3 rounded-pill bg-black/40 px-3 py-1.5 text-micro font-bold uppercase tracking-wider text-white backdrop-blur-md">Destaque</span>
            )}
          </div>
          <div className="px-1 pt-3.5">
            <h2 className="font-display text-[1.9rem] uppercase leading-[0.95] text-foreground">{event.nome}</h2>
            <p className="mt-2 text-[15px] font-semibold text-brand">
              {formatEventDate(event.data)}
              {time ? ` · ${time}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {event.local}
              {cityLabel(event.endereco) ? ` — ${cityLabel(event.endereco)}` : ""}
            </p>
          </div>
        </Link>
      </div>

      {/* desktop */}
      <div className="relative hidden min-h-[520px] overflow-hidden lg:block">
        <div className="absolute inset-0">
          <EventPoster event={event} priority sizes="100vw" className="scale-110 blur-2xl brightness-[0.4] saturate-150" />
        </div>
        <div className="grain absolute inset-0" />
        <div className="hero-fade absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-[1fr_1.15fr] items-center gap-12 px-6 py-16">
          <div className="slide-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3.5 py-1.5 text-caption font-semibold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-brand" />
              {lastCall ? "Últimos ingressos" : "Em destaque"}
            </p>
            <h1 className="font-display text-hero uppercase text-white">{event.nome}</h1>
            <p className="mt-5 text-lg font-semibold text-brand">
              {formatEventDate(event.data)}
              {time ? ` · ${time}` : ""}
            </p>
            <p className="mt-1 flex items-center gap-2 text-base text-white/75">
              <Icon name="map-pin" size={14} className="text-white/60" />
              {event.local}
              {cityLabel(event.endereco) ? ` — ${cityLabel(event.endereco)}` : ""}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link href={href} className="btn-lift inline-flex h-12 items-center gap-2 rounded-pill bg-brand px-6 text-[15px] font-bold text-brand-foreground">
                <Icon name="ticket" size={16} />
                Ver ingressos
              </Link>
              <Link href="/eventos" className="inline-flex h-12 items-center rounded-pill bg-white/12 px-6 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20">
                Explorar eventos
              </Link>
            </div>
          </div>
          <Link href={href} className="slide-up [--i:2] group relative block aspect-[818/355] w-full overflow-hidden rounded-[24px] shadow-3 ring-1 ring-white/10">
            <EventPoster event={event} priority sizes="720px" className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroEventSkeleton() {
  return (
    <section>
      <div className="px-4 pt-2 lg:hidden">
        <div className="skeleton-shimmer aspect-[818/355] rounded-[20px]" />
        <div className="space-y-2 px-1 pt-4">
          <div className="skeleton-shimmer h-8 w-4/5 rounded-md" />
          <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded-md" />
        </div>
      </div>
      <div className="hidden min-h-[520px] lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_1.15fr] items-center gap-12 px-6 py-16">
          <div className="space-y-5">
            <div className="skeleton-shimmer h-7 w-32 rounded-pill" />
            <div className="skeleton-shimmer h-20 w-3/4 rounded-xl" />
            <div className="skeleton-shimmer h-20 w-1/2 rounded-xl" />
            <div className="skeleton-shimmer h-5 w-1/3 rounded-md" />
            <div className="skeleton-shimmer h-12 w-48 rounded-pill" />
          </div>
          <div className="skeleton-shimmer aspect-[818/355] w-full rounded-[24px]" />
        </div>
      </div>
    </section>
  );
}
