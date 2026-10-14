"use client";

import { SelectInput } from "@/components/ui/select-input";
import type { VenueLocation } from "@/services/venue-operation";

/** Seletor de unidade — só aparece quando a organização tem mais de uma. */
export function LocationSelect({ locations, value, onChange, className }: { locations: VenueLocation[] | undefined; value: number | null; onChange: (id: number) => void; className?: string }) {
  if (!locations || locations.length <= 1) return null;
  return (
    <SelectInput
      className={className ?? "w-full sm:w-52"}
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
      placeholder="Unidade"
      options={locations.map((loc) => ({ value: String(loc.id), label: loc.isMain ? `${loc.nome} · Principal` : loc.nome }))}
    />
  );
}
