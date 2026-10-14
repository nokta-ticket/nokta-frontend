import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Tone } from "@/components/ui/badge";

const ICON: Record<Tone, IconName> = { brand: "info", info: "info", success: "check-circle", warning: "warning", danger: "exclamation-circle", neutral: "info" };
const TEXT: Record<Tone, string> = { brand: "text-brand", info: "text-info", success: "text-success", warning: "text-warning", danger: "text-danger", neutral: "text-muted-foreground" };
const BG: Record<Tone, string> = { brand: "bg-callout-info", info: "bg-callout-info", success: "bg-callout-success", warning: "bg-callout-warning", danger: "bg-callout-danger", neutral: "bg-callout-neutral" };
const HAIR: Record<Tone, string> = { brand: "[--hairline-color:var(--brand)]", info: "[--hairline-color:var(--brand)]", success: "[--hairline-color:var(--success)]", warning: "[--hairline-color:var(--warning)]", danger: "[--hairline-color:var(--danger)]", neutral: "[--hairline-color:var(--muted-foreground)]" };

/**
 * Alerta/aviso canônico: degradê horizontal tingido pelo tom (o mesmo
 * gesto do item ativo da sidebar) + hairline no topo. Nunca borda esquerda
 * colorida. Ícone inline, na cor do tom.
 */
export function Callout({ tone = "info", title, children, icon, action, className }: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: IconName; action?: ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("hairline-top relative flex items-start gap-3 rounded-card border border-border px-4 py-3.5", BG[tone], HAIR[tone], className)}>
      <Icon name={icon ?? ICON[tone]} size={16} className={cn("mt-0.5 shrink-0", TEXT[tone])} />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
        {children ? <div className={cn("text-body text-muted-foreground", title && "mt-0.5")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
