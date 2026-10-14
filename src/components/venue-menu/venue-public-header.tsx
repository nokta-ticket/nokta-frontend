import Image from "next/image";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";

export function venueInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Cabeçalho das páginas públicas do estabelecimento (cardápio, home,
 * avaliação): banner 430×190 com degradê de leitura, logo redonda sobreposta
 * e nome. Mesmo vocabulário nas três telas — nunca um terceiro fallback.
 * Sem banner, o fundo é a superfície com grão e o nome em display.
 */
export function VenuePublicHeader({ name, logoUrl, bannerUrl, actions, children, className }: { name: string; logoUrl: string | null; bannerUrl: string | null; actions?: ReactNode; children?: ReactNode; className?: string }) {
  const banner = bannerUrl ? resolveMediaUrl(bannerUrl, null) : null;
  const logo = logoUrl ? resolveMediaUrl(logoUrl, null) : null;
  return (
    <header className={cn("relative", className)}>
      <div className={cn("grain relative overflow-hidden bg-surface", banner ? "aspect-[430/190]" : "flex aspect-[430/150] items-center justify-center md:aspect-[430/120]")}>
        {banner ? (
          <>
            <Image src={banner} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" unoptimized />
            <div className="poster-fade absolute inset-0" aria-hidden />
          </>
        ) : (
          <>
            <span className="ambient-blob -top-10 right-0 [--blob-blur:48px]" aria-hidden />
            <p className="relative px-6 text-center font-display text-display uppercase tracking-[0.12em] text-foreground/80">{name}</p>
          </>
        )}
      </div>

      <div className="relative z-10 -mt-10 flex items-end gap-4 px-4 md:px-6">
        <div className={cn("relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 ring-4 ring-background shadow-card md:size-24", !logo && "bg-brand text-brand-foreground")}>
          {logo ? <Image src={logo} alt={name} fill sizes="96px" className="object-cover" unoptimized /> : <span className="text-lg font-semibold tracking-[0.1em]">{venueInitials(name)}</span>}
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h1 className="truncate text-title font-semibold tracking-tight text-foreground md:text-display">{name}</h1>
        </div>
      </div>

      {actions ? <div className="mt-3 flex flex-wrap items-center gap-2 px-4 md:px-6">{actions}</div> : null}
      {children}
    </header>
  );
}

/** Botão redondo de ação do cabeçalho público (44px, toque confortável). */
export function HeaderAction({ href, onClick, label, icon, external }: { href?: string; onClick?: () => void; label: string; icon: Parameters<typeof Icon>[0]["name"]; external?: boolean }) {
  const cls = "press inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-foreground ring-1 ring-inset ring-border transition-colors hover:bg-surface-3";
  if (href) {
    return (
      <a href={href} title={label} aria-label={label} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <Icon name={icon} size={16} />
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={cls}>
      <Icon name={icon} size={16} />
    </button>
  );
}

/** Rodapé discreto das páginas públicas: razão social da Nokta + Instagram do estabelecimento. */
export function VenuePublicFooter({ instagramUrl }: { instagramUrl: string | null }) {
  return (
    <footer className="mt-10 flex items-center justify-between gap-3 border-t border-border px-4 py-4 pb-safe text-micro text-subtle-foreground md:px-6">
      <span>Nokta Tecnologia LTDA · CNPJ 59.386.582/0001-39</span>
      <a href={instagramUrl || "https://instagram.com"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:text-foreground">
        <Icon name="instagram" size={14} />
      </a>
    </footer>
  );
}
