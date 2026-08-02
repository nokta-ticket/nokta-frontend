"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { VenueMenuCategory } from "@/services/venue-menu";

/**
 * Combobox de categoria com "Criar categoria [nome]" inline — nunca sai do
 * formulário pra criar uma categoria nova. A deduplicação por nome
 * equivalente (trim/case/espaços) é garantida pelo backend (constraint
 * única em normalizedName), então digitar "geral" quando já existe
 * "Geral" reaproveita a existente em vez de duplicar.
 */
export function CategoryCombobox({
  categories,
  value,
  onSelectExisting,
  onCreateNew,
  disabled,
}: {
  categories: VenueMenuCategory[];
  value: number | null;
  onSelectExisting: (categoryId: number) => void;
  onCreateNew: (nome: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = categories.find((c) => c.id === value);
  const exactMatch = categories.some((c) => c.nome.trim().toLowerCase() === search.trim().toLowerCase());
  const showCreateOption = search.trim().length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.nome : "Selecione ou crie uma categoria"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar categoria..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {categories
                .filter((c) => c.nome.toLowerCase().includes(search.trim().toLowerCase()))
                .map((category) => (
                  <CommandItem
                    key={category.id}
                    value={String(category.id)}
                    onSelect={() => {
                      onSelectExisting(category.id);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === category.id ? "opacity-100" : "opacity-0")} />
                    {category.nome}
                  </CommandItem>
                ))}
            </CommandGroup>
            {showCreateOption ? (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={() => {
                    onCreateNew(search.trim());
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar categoria &quot;{search.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
