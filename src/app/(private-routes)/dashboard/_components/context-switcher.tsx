"use client";

import { Store, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useProductContext,
  type ProductContextKey,
} from "@/context/ProductContext";

const CONTEXTS: Record<
  ProductContextKey,
  { label: string; Icon: typeof Ticket }
> = {
  tickets: { label: "Tickets", Icon: Ticket },
  venue: { label: "Venue", Icon: Store },
};

/**
 * Switcher de contexto de produto (Tickets | Venue), no topo da sidebar.
 * Só aparece quando a org tem 2+ contextos ativos.
 */
export function ContextSwitcher() {
  const { available, active, setActive, showSwitcher } = useProductContext();

  if (!showSwitcher) return null;

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {available.map((key) => {
        const { label, Icon } = CONTEXTS[key];
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition",
              isActive
                ? "bg-violet-600 text-white"
                : "text-white/60 hover:bg-white/10",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
