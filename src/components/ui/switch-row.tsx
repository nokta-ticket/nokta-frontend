"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Switch } from "@/components/ui/switch";

/**
 * Linha de opção com interruptor: rótulo + descrição à esquerda, `Switch`
 * à direita, numa caixa rebaixada que acende quando ligada. Pra "disponível
 * para venda", "cupom ativo", "lista aberta" etc.
 */
export function SwitchRow({ label, description, checked, onCheckedChange, disabled, className, id }: { label: ReactNode; description?: ReactNode; checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean; className?: string; id?: string }) {
  const autoId = useId();
  const switchId = id ?? autoId;
  return (
    <label htmlFor={switchId} className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors duration-150", checked ? "border-brand-ring bg-brand-soft/60" : "surface-inset", disabled && "cursor-not-allowed opacity-60", className)}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description ? <span className="mt-0.5 block text-caption text-muted-foreground">{description}</span> : null}
      </span>
      <Switch id={switchId} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="shrink-0" />
    </label>
  );
}
