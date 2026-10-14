import Link from "next/link";
import type { EventoAPI } from "@/interfaces/events";
import { cn } from "@/lib/cn";
import { cityLabel, formatEventDate, formatTime } from "@/lib/format";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";

/**
 * Versão server-side do `EventCard` (src/components/events/event-card.tsx):
 * mesmo visual "pôster primeiro" (arte 16:9, título, data em rosa, local),
 * sem estado nem favorito — pra páginas indexáveis renderizadas no servidor
 * (ex.: eventos por cidade). Mantenha as classes em sincronia com o original.
 */
export function EventCardStatic({ event, className, style, priority }: { event: EventoAPI; className?: string; style?: React.CSSProperties; priority?: boolean }) {
  const cover = resolveThumbnailUrl(event.thumbnails?.[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  const time = formatTime(event.horario);
  const lastCall = event.ultimoLote === true || (event.percentualVendido ?? 0) >= 80;
  const place = [event.local, cityLabel(event.endereco)].filter(Boolean).join(" · ");

  return (
    <Link href={`/evento/${event.slug ?? event.id}`} className={cn("group press block", className)} style={style}>
      <div className="relative aspect-video overflow-hidden rounded-card bg-surface-2 shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- arte do produtor (storage), sem otimização como no EventPoster */}
        <img src={cover} alt={`Arte do evento ${event.nome}`} loading={priority ? "eager" : "lazy"} className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]" />
        {lastCall ? <span className="absolute left-2.5 top-2.5 rounded-pill bg-brand px-2.5 py-1 text-micro font-bold uppercase tracking-wider text-brand-foreground">Tá acabando</span> : null}
      </div>
      <div className="mt-3 space-y-0.5 px-0.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{event.nome}</h3>
        <p className="text-caption font-semibold text-brand">
          {formatEventDate(event.data)}
          {time ? ` · ${time}` : ""}
        </p>
        <p className="truncate text-caption text-muted-foreground">{place}</p>
      </div>
    </Link>
  );
}
