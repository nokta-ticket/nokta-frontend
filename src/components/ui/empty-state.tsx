import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

export function EmptyState({ icon = "inbox", title, description, action, className, compact }: { icon?: IconName; title: string; description?: string; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong px-6 text-center", compact ? "py-8" : "py-14", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2 text-subtle-foreground">
        <Icon name={icon} size={22} />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-body text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Algo deu errado", description = "Tenta de novo em alguns segundos.", onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <EmptyState
      icon="warning"
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <button type="button" onClick={onRetry} className="btn-lift inline-flex h-10 items-center gap-2 rounded-pill bg-brand px-5 text-sm font-semibold text-brand-foreground">
            <Icon name="refresh" size={14} />
            Tentar de novo
          </button>
        ) : undefined
      }
    />
  );
}
