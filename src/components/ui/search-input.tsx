"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";

/** Valor com atraso (busca enquanto digita sem bater na API a cada tecla). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Busca com ícone, botão de limpar e `type="search"`. Largura: quem usa
 * decide (`flex-1 max-w-xl` na toolbar de lista).
 */
export function SearchInput({ value, onChange, placeholder = "Buscar…", className, autoFocus, id }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; autoFocus?: boolean; id?: string }) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Icon name="search" size={14} className="pointer-events-none absolute left-3.5 text-subtle-foreground" />
      <input id={id} type="search" value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(inputClassName, "pl-10 pr-10")} />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Limpar busca" className="absolute right-2 flex size-7 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground">
          <Icon name="close" size={12} />
        </button>
      ) : null}
    </div>
  );
}
