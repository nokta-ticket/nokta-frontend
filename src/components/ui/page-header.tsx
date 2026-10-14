import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

/**
 * Cabeçalho de página do painel. Título `font-medium` (nunca bold), sem
 * eyebrow. `description` é opcional — pule quando stat cards ou toolbar já
 * vêm logo abaixo. `back` aceita href ou função.
 */
export function PageHeader({ title, description, actions, back, badge, meta, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: string | (() => void); badge?: ReactNode; meta?: ReactNode; className?: string }) {
  const backEl =
    typeof back === "string" ? (
      <Link href={back} aria-label="Voltar" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
        <Icon name="arrow-left" size={16} />
      </Link>
    ) : typeof back === "function" ? (
      <button type="button" onClick={back} aria-label="Voltar" className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
        <Icon name="arrow-left" size={16} />
      </button>
    ) : null;

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-2">
        {backEl ? <div className="pt-0.5">{backEl}</div> : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-display font-medium tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description ? <p className="mt-1.5 max-w-2xl text-body text-muted-foreground">{description}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">{meta}</div> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
