import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatBRL, formatDateBadge } from "@/lib/format";
import { SOURCE_LABEL, type AgendaEvent } from "@/lib/agenda";

/** Atributos de todo link que leva pra venda oficial (afiliado). */
export const OFFICIAL_LINK_PROPS = { target: "_blank", rel: "sponsored nofollow noopener" } as const;

export function priceLabel(e: Pick<AgendaEvent, "priceMin">): string | null {
  return e.priceMin != null ? `A partir de ${formatBRL(e.priceMin)}` : null;
}

/** Selo "Vendido em <plataforma>": deixa claro que a venda não é da Nokta. */
export function SoldAtBadge({ event, className = "" }: { event: Pick<AgendaEvent, "source">; className?: string }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-pill border border-border bg-surface/80 px-2.5 py-0.5 text-caption font-semibold text-muted-foreground backdrop-blur-md ${className}`}>
      <Icon name="external" size={10} />
      Vendido em {SOURCE_LABEL[event.source]}
    </span>
  );
}

/**
 * Card da agenda. A arte vem do feed oficial; sem arte, um degradê da marca
 * com o nome do evento. O card abre a página do evento na Nokta (conteúdo
 * indexável); a compra acontece lá, no botão de venda oficial.
 */
export function AgendaCard({ event, index = 0 }: { event: AgendaEvent; index?: number }) {
  const badge = formatDateBadge(event.date);
  const price = priceLabel(event);
  return (
    <Link href={`/agenda/${event.id}`} className="group card-glow reveal flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-[translate,box-shadow] duration-300 ease-out-soft hover:-translate-y-1" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-from/40 via-surface to-brand-to/30">
        {event.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do feed oficial, servida pela própria fonte
          <img src={event.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-[scale] duration-500 ease-out-soft group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 flex items-end p-4">
            <p className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-foreground/80">{event.name}</p>
          </div>
        )}
        {badge ? (
          <div className="absolute left-3 top-3 flex min-w-12 flex-col items-center rounded-xl bg-background/85 px-2 py-1.5 text-center shadow-card backdrop-blur-md">
            <span className="text-lg font-bold leading-none tabular-nums text-foreground">{badge.day}</span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-brand">{badge.month}</span>
          </div>
        ) : null}
        <SoldAtBadge event={event} className="absolute bottom-3 right-3" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground">{event.name}</h3>
        <p className="line-clamp-1 text-caption text-muted-foreground">
          {[event.venue, event.city && `${event.city}${event.uf ? ` · ${event.uf}` : ""}`].filter(Boolean).join(" · ") || "Local a confirmar"}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-caption">
          <span className="font-semibold text-brand">{price ?? "Ver preços no site oficial"}</span>
          {event.time ? <span className="tabular-nums text-muted-foreground">{event.time}</span> : null}
        </div>
      </div>
    </Link>
  );
}
