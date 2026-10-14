"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

export interface ActionSheetItem {
  icon: IconName;
  label: string;
  description?: string;
  badge?: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * Folha inferior com uma lista de ações (ícone, rótulo, descrição). No
 * desktop fica centralizada na parte de baixo (max-w-md).
 */
export function ActionSheet({ open, onOpenChange, title, description, items, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; items: ActionSheetItem[]; children?: ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto sm:max-w-md sm:rounded-t-modal">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    onOpenChange(false);
                    item.onSelect();
                  }}
                  className={cn("press flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-2 disabled:opacity-40", item.danger && "text-danger hover:bg-danger-bg")}
                >
                  <Icon name={item.icon} size={18} fw className={item.danger ? "text-danger" : "text-muted-foreground"} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("text-[15px] font-semibold", item.danger ? "text-danger" : "text-foreground")}>{item.label}</span>
                      {item.badge ? <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-micro font-bold uppercase tracking-wider text-brand">{item.badge}</span> : null}
                    </span>
                    {item.description ? <span className="block text-caption text-muted-foreground">{item.description}</span> : null}
                  </span>
                  <Icon name="chevron-right" size={12} className="text-subtle-foreground" />
                </button>
              </li>
            ))}
          </ul>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
