import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Título de seção. Sem eyebrow, sem ícone em caixinha — quando há ícone,
 * ele fica inline, na cor do título.
 */
export function SectionHeader({ title, description, icon, action, className, as: Tag = "h2" }: { title: string; description?: string; icon?: IconName; action?: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <Tag className="flex items-center gap-2 text-title font-semibold tracking-tight text-foreground">
          {icon ? <Icon name={icon} size={18} /> : null}
          <span className="truncate">{title}</span>
        </Tag>
        {description ? <p className="mt-1 text-body text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
