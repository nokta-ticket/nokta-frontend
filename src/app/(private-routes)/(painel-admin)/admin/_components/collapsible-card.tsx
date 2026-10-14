"use client";

import { useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/** Card que abre e fecha (seções do dossiê). Título à esquerda, resumo opcional e seta à direita. */
export function CollapsibleCard({ title, summary, defaultOpen = false, accent, children, className }: { title: string; summary?: ReactNode; defaultOpen?: boolean; accent?: boolean; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card accent={accent} className={cn("overflow-hidden", className)}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2/60">
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-base font-semibold text-foreground">{title}</span>
            {summary ? <span className="text-caption text-muted-foreground">{summary}</span> : null}
          </span>
          <Icon name="chevron-down" size={13} className={cn("shrink-0 text-muted-foreground transition-transform duration-300 ease-out-soft", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-5 py-5">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
