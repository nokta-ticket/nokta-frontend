"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

/**
 * Opção selecionável em forma de card (pessoa física/jurídica, tipo de
 * contato…). Grupo com `role="radiogroup"` é responsabilidade de quem usa.
 */
export function ChoiceCard({ selected, onSelect, title, description, icon, disabled, className, children }: { selected: boolean; onSelect: () => void; title: ReactNode; description?: ReactNode; icon?: IconName; disabled?: boolean; className?: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "press relative flex w-full items-start gap-3 rounded-card border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-brand bg-brand-soft/60 shadow-card" : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
        className,
      )}
    >
      {icon ? <Icon name={icon} size={16} className={cn("mt-0.5 shrink-0", selected ? "text-brand" : "text-muted-foreground")} /> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        {description ? <span className="mt-0.5 block text-caption text-muted-foreground">{description}</span> : null}
        {children}
      </span>
      <span aria-hidden className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors", selected ? "border-brand bg-brand" : "border-border-strong")}>
        {selected ? <span className="size-1.5 rounded-full bg-brand-foreground" /> : null}
      </span>
    </button>
  );
}
