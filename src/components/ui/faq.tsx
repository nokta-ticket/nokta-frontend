import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export interface FaqItem {
  q: string;
  a: ReactNode;
}

/**
 * Perguntas frequentes com `<details>/<summary>` nativos: funciona sem JS
 * (páginas estáticas da LP e das legais), acessível por teclado, e `name`
 * faz o grupo abrir um item por vez nos navegadores que suportam.
 */
export function FaqList({ items, name = "faq", className }: { items: FaqItem[]; name?: string; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map((item, i) => (
        <details key={item.q} name={name} className="group rounded-card border border-border bg-surface shadow-card open:border-border-strong fade-up" style={{ ["--i" as string]: i } as never}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <span className="text-balance">{item.q}</span>
            <Icon name="chevron-down" size={14} className="shrink-0 text-muted-foreground transition-transform duration-300 ease-out-soft group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 text-body leading-6 text-muted-foreground">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
