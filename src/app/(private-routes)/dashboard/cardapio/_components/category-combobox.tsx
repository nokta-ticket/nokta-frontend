"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { VenueMenuCategory } from "@/services/venue-menu";

/**
 * Combobox de categoria com "Criar categoria [nome]" inline — nunca sai do
 * formulário pra criar uma categoria nova. A deduplicação por nome
 * equivalente é garantida pelo backend (constraint única em normalizedName).
 */
export function CategoryCombobox({
  categories,
  value,
  onSelectExisting,
  onCreateNew,
  disabled,
  placeholder = "Selecione ou crie uma categoria",
  id,
}: {
  categories: VenueMenuCategory[];
  value: number | null;
  onSelectExisting: (categoryId: number) => void;
  onCreateNew: (nome: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
    else setSearch("");
  }, [open]);

  const selected = categories.find((c) => c.id === value);
  const q = search.trim().toLowerCase();
  const filtered = categories.filter((c) => c.nome.toLowerCase().includes(q));
  const exactMatch = categories.some((c) => c.nome.trim().toLowerCase() === q);
  const showCreate = q.length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" role="combobox" aria-expanded={open} aria-controls={listId} disabled={disabled} className={cn(inputClassName, "items-center justify-between gap-2 text-left disabled:opacity-50")}>
          <span className={cn("truncate", !selected && "text-subtle-foreground")}>{selected ? selected.nome : placeholder}</span>
          <Icon name="chevron-down" size={11} className="shrink-0 text-subtle-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="z-[80] w-[--radix-popover-trigger-width] min-w-64 overflow-hidden rounded-card border-border bg-surface p-0 shadow-3">
        <div className="p-2">
          <div className="relative flex items-center">
            <Icon name="search" size={13} className="pointer-events-none absolute left-3 text-subtle-foreground" />
            <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ou criar…" className={cn(inputClassName, "h-9 pl-9 md:h-9")} />
          </div>
        </div>
        <ul id={listId} className="max-h-60 overflow-y-auto overscroll-contain border-t border-border py-1" role="listbox">
          {filtered.length === 0 && !showCreate ? <li className="px-4 py-5 text-center text-caption text-muted-foreground">Nenhuma categoria encontrada</li> : null}
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === value}
                onClick={() => {
                  onSelectExisting(c.id);
                  setOpen(false);
                }}
                className={cn("flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2", c.id === value ? "text-foreground" : "text-muted-foreground")}
              >
                <span className="flex-1 truncate">{c.nome}</span>
                {c.section === "TOBACCO" ? <span className="text-micro uppercase tracking-wider text-subtle-foreground">tabacaria</span> : null}
                {c.id === value ? <Icon name="check" size={12} className="text-brand" /> : null}
              </button>
            </li>
          ))}
          {showCreate ? (
            <li className="border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onCreateNew(search.trim());
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
              >
                <Icon name="plus" size={12} />
                Criar categoria &quot;{search.trim()}&quot;
              </button>
            </li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
