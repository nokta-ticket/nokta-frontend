"use client";

import { cn } from "@/lib/cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SelectInputOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select de formulário no vocabulário do design system (mesma altura, raio,
 * superfície e foco do `Input`): 44px no celular, 40 no desktop. Envolve o
 * Radix Select existente — use com `Field` pra rótulo/erro.
 */
export function SelectInput({ id, value, onValueChange, options, placeholder = "Selecione", disabled, className, "aria-invalid": ariaInvalid }: { id?: string; value?: string; onValueChange: (value: string) => void; options: SelectInputOption[]; placeholder?: string; disabled?: boolean; className?: string; "aria-invalid"?: boolean }) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        aria-invalid={ariaInvalid || undefined}
        className={cn(
          "w-full rounded-input border-border bg-surface-2 px-3.5 text-[15px] text-foreground shadow-none data-[size=default]:h-11 md:text-sm md:data-[size=default]:h-10",
          "dark:bg-surface-2 dark:hover:bg-surface-2 data-[placeholder]:text-subtle-foreground",
          "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-brand",
          "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger-ring",
          "[&_svg]:text-muted-foreground [&_svg]:opacity-100",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[80] rounded-card border-border bg-surface p-1.5 text-foreground shadow-3">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled} className="cursor-pointer rounded-lg py-2.5 pl-3 pr-9 text-sm focus:bg-surface-2 focus:text-foreground md:py-2">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
