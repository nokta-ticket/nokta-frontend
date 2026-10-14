"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatEventDateTime } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/badge";
import { EVENT_STATUS, eventStatusMeta } from "../_lib/event-meta";

export interface EventListItem {
  id: number;
  slug?: string | null;
  nome: string;
  data: string;
  horario: string;
  status: number;
  thumbnails: { id?: string | number; url: string }[];
  endereco?: { logradouro?: string; numero?: string; localidade?: string; uf?: string } | null;
  local?: string | null;
  percentualVendido?: number | null;
  ingressosVendidos?: number | null;
}

/**
 * Card de evento da lista do painel: banner 16:9 com degradê de leitura,
 * status, data, local, barra de vendas e ações inline (editar, ver página,
 * cancelar/excluir). Mesmo card no celular e no desktop.
 */
export function EventCard({ event, index = 0, onCancel, onDelete }: { event: EventListItem; index?: number; onCancel: (ev: EventListItem) => void; onDelete: (ev: EventListItem) => void }) {
  const meta = eventStatusMeta(event.status);
  const thumb = event.thumbnails?.[0]?.url;
  const src = thumb ? (resolveMediaUrl(thumb) ?? thumb) : null;
  const place = event.local || [event.endereco?.logradouro, event.endereco?.localidade].filter(Boolean).join(" · ");
  const pct = event.percentualVendido ?? null;
  const editHref = `/dashboard/eventos/${event.id}`;
  const publicHref = `/evento/${event.slug ?? event.id}`;
  const isDraft = event.status === EVENT_STATUS.DRAFT;
  const isPublished = event.status === EVENT_STATUS.PUBLISHED;

  return (
    <article className="fade-up card-hover group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card" style={{ ["--i" as string]: index } as never}>
      <Link href={editHref} className="relative block aspect-video w-full overflow-hidden bg-surface-2" aria-label={`Editar ${event.nome}`}>
        {src ? (
          <Image src={src} alt="" fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="grain object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-subtle-foreground">
            <Icon name="image" size={22} />
            <span className="text-caption">Sem imagem</span>
          </div>
        )}
        <div className="poster-fade pointer-events-none absolute inset-0" aria-hidden />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-caption font-semibold text-brand">
              <Icon name="calendar" size={11} />
              {event.data ? formatEventDateTime(event.data, event.horario) : "Data não definida"}
            </p>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </div>
          <h3 className="mt-1 truncate text-[15px] font-semibold leading-snug text-foreground">
            <Link href={editHref} className="outline-none focus-visible:underline">
              {event.nome || "Evento sem nome"}
            </Link>
          </h3>
          {place ? <p className="mt-0.5 truncate text-caption text-muted-foreground">{place}</p> : null}
        </div>

        {pct !== null ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-micro font-medium uppercase tracking-wider text-subtle-foreground">
              <span>Vendas</span>
              <span className="tnum text-foreground">{Math.round(pct)}%</span>
            </div>
            <ProgressBar value={pct} max={100} tone={pct >= 90 ? "success" : "brand"} label={`${Math.round(pct)}% vendido`} />
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-1 border-t border-border pt-3">
          <Button asChild variant="subtle" size="sm" className="-ml-2">
            <Link href={editHref}>
              <Icon name="edit" size={13} />
              Editar
            </Link>
          </Button>
          <div className="flex items-center gap-0.5">
            <Button asChild variant="subtle" size="icon-sm" title="Ver página pública">
              <Link href={publicHref} target="_blank" rel="noreferrer" aria-label="Ver página pública">
                <Icon name="external" size={13} />
              </Link>
            </Button>
            {isPublished ? (
              <Button variant="subtle" size="icon-sm" title="Cancelar evento" aria-label="Cancelar evento" className="hover:bg-danger-bg hover:text-danger" onClick={() => onCancel(event)}>
                <Icon name="ban" size={13} />
              </Button>
            ) : null}
            {isDraft ? (
              <Button variant="subtle" size="icon-sm" title="Excluir rascunho" aria-label="Excluir rascunho" className="hover:bg-danger-bg hover:text-danger" onClick={() => onDelete(event)}>
                <Icon name="trash" size={13} />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-surface shadow-card", className)}>
      <div className="skeleton-shimmer aspect-video w-full" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-md" />
        <div className="skeleton-shimmer mt-4 h-1.5 w-full rounded-pill" />
      </div>
    </div>
  );
}
