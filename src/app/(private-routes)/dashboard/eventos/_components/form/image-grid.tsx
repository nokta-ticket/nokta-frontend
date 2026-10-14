"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * Grade de imagens do evento: a capa em destaque na proporção do banner
 * público (818 × 355), as demais menores, e um slot tracejado pra adicionar.
 * Compartilhado pelo wizard (Finalizar) e pela seção Imagens do editor.
 */
export function ImageGrid({ paths, max, uploading, onAdd, onRemove, onMakeCover }: { paths: string[]; max: number; uploading?: boolean; onAdd: () => void; onRemove: (index: number) => void; onMakeCover?: (index: number) => void }) {
  const canAddMore = paths.length < max;

  if (paths.length === 0) {
    return (
      <button type="button" onClick={onAdd} disabled={uploading} className="card-glow group flex aspect-[818/355] w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border-strong bg-surface-2/40 text-center transition-colors hover:border-brand hover:bg-brand-soft/30 disabled:cursor-not-allowed disabled:opacity-60">
        {uploading ? (
          <>
            <Icon name="loader" size={22} className="animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">Enviando imagem…</p>
          </>
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-surface text-muted-foreground shadow-card transition-colors group-hover:text-brand">
              <Icon name="upload" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Adicionar imagem de capa</p>
              <p className="mt-0.5 text-caption text-muted-foreground">JPEG, PNG ou WebP · 818 × 355 px · até {max} imagens</p>
            </div>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {paths.map((src, i) => {
          const url = resolveMediaUrl(src) ?? src;
          const isCover = i === 0;
          return (
            <figure key={`${i}-${src}`} className={cn("group relative overflow-hidden rounded-card border border-border bg-surface-2 shadow-card", isCover ? "aspect-[818/355] sm:col-span-3" : "aspect-video")}>
              <Image src={url} alt={isCover ? "Capa do evento" : `Imagem ${i + 1}`} fill sizes={isCover ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 640px) 33vw, 100vw"} className="object-cover" />
              <div className="poster-fade pointer-events-none absolute inset-0" aria-hidden />
              <figcaption className="absolute left-3 top-3">
                <span className={cn("rounded-pill px-2.5 py-1 text-micro font-semibold uppercase tracking-wider backdrop-blur-sm", isCover ? "bg-brand text-brand-foreground" : "bg-background/70 text-foreground")}>{isCover ? "Capa" : `Imagem ${i + 1}`}</span>
              </figcaption>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-pill bg-background/80 p-1 backdrop-blur-sm">
                {!isCover && onMakeCover ? (
                  <Button variant="subtle" size="icon-sm" aria-label="Usar como capa" title="Usar como capa" className="size-8" onClick={() => onMakeCover(i)}>
                    <Icon name="star" size={12} />
                  </Button>
                ) : null}
                <Button variant="subtle" size="icon-sm" aria-label="Remover imagem" title="Remover" className="size-8 hover:bg-danger-bg hover:text-danger" onClick={() => onRemove(i)}>
                  <Icon name="trash" size={12} />
                </Button>
              </div>
            </figure>
          );
        })}

        {canAddMore ? (
          <button type="button" onClick={onAdd} disabled={uploading} className="flex aspect-video flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong bg-surface-2/40 text-muted-foreground transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60">
            {uploading ? <Icon name="loader" size={18} className="animate-spin" /> : <Icon name="plus" size={16} />}
            <span className="text-caption font-medium">{uploading ? "Enviando…" : "Adicionar"}</span>
          </button>
        ) : null}
      </div>
      <p className="text-caption text-subtle-foreground">
        {paths.length} de {max} · Recomendado 818 × 355 px · JPEG, PNG ou WebP
      </p>
    </div>
  );
}
