"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EventoAPI } from "@/interfaces/events";
import { Icon } from "@/components/ui/icon";
import { EventPoster, FavoriteButton, eventHref, isLastCall } from "@/components/events/event-card";
import { cn } from "@/lib/cn";
import { cityLabel, formatDateBadge, formatEventDate, formatTime } from "@/lib/format";

type ToggleFavorite = (id: string, favorite: boolean) => void;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Card de evento premium (desktop): inclina em 3D seguindo o mouse, brilho
 * rosa que acompanha o cursor, banner com zoom lento e a linha "Ver
 * ingressos" que se revela no hover. Banner na proporção 16:9 (nunca
 * quadrado — a arte do produtor é 818×355).
 */
export function EventCardLux({ event, onToggleFavorite, index = 0, priority, className }: { event: EventoAPI; onToggleFavorite?: ToggleFavorite; index?: number; priority?: boolean; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const favorite = event.isFavorite ?? event.favorito ?? false;
  const badge = formatDateBadge(event.data);
  const time = formatTime(event.horario);
  const lastCall = isLastCall(event);

  const setVars = (vars: Record<string, string>) => {
    const el = ref.current;
    if (!el) return;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  };

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setVars({ "--mx": `${px * 100}%`, "--my": `${py * 100}%`, "--ry": `${(px - 0.5) * 10}deg`, "--rx": `${(0.5 - py) * 8}deg`, "--ty": "-6px" });
  };
  const onLeave = () => setVars({ "--rx": "0deg", "--ry": "0deg", "--ty": "0px" });

  return (
    <Link ref={ref} href={eventHref(event)} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("group fade-up block [perspective:1100px]", className)} style={{ ["--i" as string]: index } as never}>
      <div className="relative overflow-hidden rounded-[20px] bg-surface shadow-card ring-1 ring-white/[0.06] transition-[transform,box-shadow] duration-300 ease-out-soft will-change-transform group-hover:shadow-card-hover" style={{ transform: "rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ty,0px))" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(380px circle at var(--mx,50%) var(--my,50%), color-mix(in oklab, var(--brand) 22%, transparent), transparent 60%)" }} />
        <div className="relative aspect-video overflow-hidden">
          <EventPoster event={event} priority={priority} sizes="(max-width:1280px) 33vw, 320px" className="transition-transform duration-700 ease-out-soft group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-transparent to-transparent" />
          {badge ? (
            <div className="absolute left-3 top-3 flex flex-col items-center rounded-xl bg-background/80 px-2.5 py-1.5 shadow-2 backdrop-blur-md">
              <span className="text-micro font-bold uppercase tracking-wider text-brand">{badge.month}</span>
              <span className="text-lg font-bold leading-none tnum text-foreground">{badge.day}</span>
            </div>
          ) : null}
          {lastCall ? <span className="absolute right-3 top-3 rounded-pill bg-brand px-2.5 py-1 text-micro font-bold uppercase tracking-wider text-brand-foreground">Tá acabando</span> : null}
          <FavoriteButton active={favorite} onToggle={onToggleFavorite ? () => onToggleFavorite(event.id, !favorite) : undefined} className={cn("absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100", favorite && "opacity-100")} />
        </div>
        <div className="relative px-4 pb-4 pt-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{event.nome}</h3>
          <p className="mt-1 truncate text-caption text-muted-foreground">
            <span className="font-semibold text-brand">
              {badge?.weekday}
              {time ? ` · ${time}` : ""}
            </span>
            {" · "}
            {event.local || cityLabel(event.endereco)}
          </p>
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out-soft group-hover:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="flex items-center justify-between pt-3">
                <span className="text-caption text-subtle-foreground">{cityLabel(event.endereco)}</span>
                <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-brand px-3.5 text-caption font-bold text-brand-foreground">
                  Ver ingressos
                  <Icon name="arrow-right" size={10} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Destaques no celular: carrossel com snap, um card grande por vez com
 * "espiada" do próximo. O banner 16:9 fica inteiro por cima de uma versão
 * desfocada dele mesmo (efeito pôster sem cortar a arte). Pontinhos
 * embaixo acompanham o scroll.
 */
export function FeaturedCarousel({ events, onToggleFavorite, className }: { events: EventoAPI[]; onToggleFavorite?: ToggleFavorite; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const first = el.firstElementChild as HTMLElement | null;
        if (!first) return;
        const step = first.offsetWidth + 12;
        setActive(Math.min(events.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [events.length]);

  return (
    <div className={className}>
      <div ref={scrollerRef} className="snap-row gap-3 px-4 pb-1">
        {events.map((event, i) => {
          const favorite = event.isFavorite ?? event.favorito ?? false;
          const time = formatTime(event.horario);
          const lastCall = isLastCall(event);
          return (
            <Link key={event.id} href={eventHref(event)} className="press fade-up w-[84vw] max-w-[380px] snap-center" style={{ ["--i" as string]: i } as never}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-surface-2 shadow-card-hover ring-1 ring-white/5">
                {/* fundo: a própria arte, desfocada e escurecida */}
                <EventPoster event={event} priority={i === 0} sizes="84vw" className="scale-125 blur-2xl brightness-[0.45] saturate-150" />
                {/* frente: a arte inteira, sem corte */}
                <div className="absolute inset-x-3 top-3 aspect-[818/355] overflow-hidden rounded-[14px] shadow-3 ring-1 ring-white/10">
                  <EventPoster event={event} priority={i === 0} sizes="84vw" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-16">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-pill bg-brand px-2.5 py-1 text-micro font-bold uppercase tracking-wider text-brand-foreground">{lastCall ? "Tá acabando" : formatEventDate(event.data)}</span>
                    {lastCall ? <span className="text-micro font-semibold uppercase tracking-wider text-white/80">{formatEventDate(event.data)}</span> : null}
                  </div>
                  <h3 className="line-clamp-2 font-display text-[1.75rem] uppercase leading-[0.95] text-white [text-shadow:0_2px_18px_rgba(0,0,0,.5)]">{event.nome}</h3>
                  <p className="mt-1.5 truncate text-sm text-white/80">
                    {time ? `${time} · ` : ""}
                    {event.local || cityLabel(event.endereco)}
                  </p>
                </div>
                <FavoriteButton active={favorite} onToggle={onToggleFavorite ? () => onToggleFavorite(event.id, !favorite) : undefined} className="absolute right-5 top-[calc(84vw*355/818+4px)] max-w-[380px]:top-auto" />
              </div>
            </Link>
          );
        })}
      </div>
      {events.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
          {events.map((e, i) => (
            <span key={e.id} className={cn("h-1.5 rounded-full transition-all duration-300 ease-out-soft", i === active ? "w-6 bg-brand" : "w-1.5 bg-border-strong")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FeaturedCarouselSkeleton() {
  return (
    <div className="snap-row gap-3 px-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer aspect-[4/5] w-[84vw] max-w-[380px] rounded-[22px]" />
      ))}
    </div>
  );
}

export function EventCardLuxSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-surface ring-1 ring-white/[0.06]">
      <div className="skeleton-shimmer aspect-video" />
      <div className="space-y-2 px-4 pb-4 pt-3">
        <div className="skeleton-shimmer h-4 w-4/5 rounded-md" />
        <div className="skeleton-shimmer h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}
