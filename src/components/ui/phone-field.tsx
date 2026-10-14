"use client";

import * as React from "react";
import { getCountries, getCountryCallingCode, type Country } from "react-phone-number-input";
import flagComponents from "react-phone-number-input/flags";
import ptBR from "react-phone-number-input/locale/pt-BR.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";
import { formatPhone } from "@/components/ui/phone-input";
import { cn } from "@/lib/cn";

type FlagMap = Record<string, React.ComponentType<React.SVGProps<SVGSVGElement> & { title?: string }>>;
const Flags = flagComponents as unknown as FlagMap;
const LABELS = ptBR as Record<string, string>;

const PRIORITY: Country[] = ["BR", "US", "AR", "PT", "ES", "MX", "CO", "CL", "GB", "FR", "DE", "IT", "JP", "CA"];
const ALL = getCountries();
const COUNTRIES: Country[] = [...PRIORITY.filter((c) => ALL.includes(c)), ...ALL.filter((c) => !PRIORITY.includes(c)).sort((a, b) => (LABELS[a] || a).localeCompare(LABELS[b] || b, "pt-BR"))];

function Flag({ country, className }: { country: Country; className?: string }) {
  const Cmp = Flags[country];
  return (
    <span className={cn("inline-flex h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] bg-surface-3 hairline", className)}>
      {Cmp ? <Cmp title={country} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
    </span>
  );
}

export interface PhoneFieldProps {
  id?: string;
  value: string;
  country: Country;
  onChange: (display: string, country: Country) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Telefone com seletor de país (bandeira + DDI) na mesma caixa do `Input`.
 * A máscara/validação vem de `phone-input` (`formatPhone`/`validatePhone`),
 * que já trata o autofill com +55 — este componente é só a casca no
 * vocabulário do design system. `value` é o número local já formatado.
 */
export function PhoneField({ id, value, country, onChange, onBlur, invalid, disabled, className }: PhoneFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? COUNTRIES.filter((c) => (LABELS[c] || c).toLowerCase().includes(q) || `+${getCountryCallingCode(c)}`.includes(q) || c.toLowerCase().startsWith(q)) : COUNTRIES;
  const mask = formatPhone("0000000000000", country).replace(/\d/g, "0");

  return (
    <div
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-input border border-border bg-surface-2 transition-[border-color,box-shadow] duration-150 focus-within:border-transparent focus-within:ring-2 focus-within:ring-brand aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger-ring md:h-10",
        disabled && "opacity-50",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" disabled={disabled} aria-label="Selecionar país" className="flex shrink-0 items-center gap-2 border-r border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-3 hover:text-foreground">
            <Flag country={country} />
            <span className="tnum font-medium">+{getCountryCallingCode(country)}</span>
            <Icon name="chevron-down" size={10} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="z-[80] w-80 overflow-hidden rounded-card border-border bg-surface p-0 shadow-3">
          <div className="p-2.5">
            <div className="relative flex items-center">
              <Icon name="search" size={13} className="pointer-events-none absolute left-3 text-subtle-foreground" />
              <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar país ou DDI" className={cn(inputClassName, "h-9 pl-9 md:h-9")} />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain border-t border-border py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-caption text-muted-foreground">Nenhum país encontrado</li>
            ) : (
              filtered.map((c) => {
                const selected = c === country;
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange("", c);
                        setOpen(false);
                      }}
                      className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2", selected ? "text-foreground" : "text-muted-foreground")}
                    >
                      <Flag country={c} />
                      <span className="flex-1 truncate font-medium">{LABELS[c] || c}</span>
                      <span className="tnum text-caption text-subtle-foreground">+{getCountryCallingCode(c)}</span>
                      {selected ? <Icon name="check" size={12} className="text-brand" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        disabled={disabled}
        placeholder={mask || "Número"}
        value={value}
        onChange={(e) => onChange(formatPhone(e.target.value, country), country)}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-subtle-foreground md:text-sm"
      />
    </div>
  );
}
