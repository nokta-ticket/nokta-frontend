"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EventoAPI } from "@/interfaces/events";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { cityLabel, formatEventDate, formatTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

export const LAST_CALL_PERCENT = 80;

export function eventHref(event: Pick<EventoAPI, "id" | "slug">) {
  return `/evento/${event.slug ?? event.id}`;
}

export function isLastCall(event: Pick<EventoAPI, "ultimoLote" | "percentualVendido">) {
  return event.ultimoLote === true || (event.percentualVendido ?? 0) >= LAST_CALL_PERCENT;
}

/**
 * Arte do evento. Imagens lazy entram com fade quando terminam de carregar
 * (em vez de "piscar" sobre o fundo); as `priority` (acima da dobra)
 * aparecem direto, sem esperar o JS.
 */
export function EventPoster({ event, sizes, priority, className }: { event: EventoAPI; sizes: string; priority?: boolean; className?: string }) {
  const cover = resolveThumbnailUrl(event.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(Boolean(priority));
  // Imagem que já veio do cache antes da hidratação não dispara onLoad.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  return (
    <Image
      ref={imgRef}
      src={cover}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      onLoad={() => setLoaded(true)}
      className={cn("object-cover", !priority && "transition-[opacity,scale] duration-500 ease-out-soft", !priority && !loaded && "scale-[1.02] opacity-0", className)}
      unoptimized
    />
  );
}

export function FavoriteButton({ active, onToggle, className }: { active: boolean; onToggle?: () => void; className?: string }) {
  if (!onToggle) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={active}
      className={cn("press flex size-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60", active && "text-brand", className)}
    >
      <Icon name={active ? "heart" : "heart-outline"} size={16} />
    </button>
  );
}

/**
 * Card de evento "pôster primeiro": imagem quadrada, título forte, data em
 * rosa, local discreto. Usado no carrossel de destaques e nas grades.
 */
export function EventCard({ event, onToggleFavorite, priority, className, style, size = "md" }: { event: EventoAPI; onToggleFavorite?: (id: string, favorite: boolean) => void; priority?: boolean; className?: string; style?: React.CSSProperties; size?: "sm" | "md" | "lg" }) {
  const favorite = event.isFavorite ?? event.favorito ?? false;
  const time = formatTime(event.horario);
  const lastCall = isLastCall(event);

  return (
    <Link href={eventHref(event)} className={cn("group press block", className)} style={style}>
      <div className="relative aspect-video overflow-hidden rounded-card bg-surface-2 shadow-card">
        <EventPoster event={event} priority={priority} sizes={size === "lg" ? "(max-width:1024px) 100vw, 33vw" : "(max-width:640px) 60vw, 25vw"} className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]" />
        {lastCall ? (
          <span className="absolute left-2.5 top-2.5 rounded-pill bg-brand px-2.5 py-1 text-micro font-bold uppercase tracking-wider text-brand-foreground">Tá acabando</span>
        ) : null}
        <FavoriteButton active={favorite} onToggle={onToggleFavorite ? () => onToggleFavorite(event.id, !favorite) : undefined} className="absolute right-2.5 top-2.5" />
      </div>
      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className={cn("line-clamp-2 font-semibold leading-snug text-foreground", size === "sm" ? "text-sm" : "text-[15px]")}>{event.nome}</h3>
        <p className="text-caption font-semibold text-brand">
          {formatEventDate(event.data)}
          {time ? ` · ${time}` : ""}
        </p>
        <p className="truncate text-caption text-muted-foreground">{event.local || cityLabel(event.endereco)}</p>
      </div>
    </Link>
  );
}

/**
 * Linha de lista (celular): miniatura quadrada + texto. Pra listas longas.
 */
export function EventRow({ event, onToggleFavorite, className }: { event: EventoAPI; onToggleFavorite?: (id: string, favorite: boolean) => void; className?: string }) {
  const favorite = event.isFavorite ?? event.favorito ?? false;
  return (
    <Link href={eventHref(event)} className={cn("press group flex items-center gap-3.5 rounded-card bg-surface p-2.5 shadow-card transition-colors hover:bg-surface-2", className)}>
      <div className="relative aspect-video w-[108px] shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <EventPoster event={event} sizes="108px" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{event.nome}</h3>
        <p className="mt-0.5 text-caption font-semibold text-brand">{formatEventDate(event.data)}</p>
        <p className="truncate text-caption text-muted-foreground">{event.local || cityLabel(event.endereco)}</p>
      </div>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(event.id, !favorite);
          }}
          aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground", favorite && "text-brand")}
        >
          <Icon name={favorite ? "heart" : "heart-outline"} size={16} />
        </button>
      ) : (
        <Icon name="chevron-right" size={14} className="mr-1 shrink-0 text-subtle-foreground" />
      )}
    </Link>
  );
}

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="skeleton-shimmer aspect-video rounded-card" />
      <div className="space-y-2 px-0.5">
        <div className="skeleton-shimmer h-4 w-4/5 rounded-md" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
        <div className="skeleton-shimmer h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

export function EventRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-card bg-surface p-2.5">
      <div className="skeleton-shimmer aspect-video w-[108px] rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}
