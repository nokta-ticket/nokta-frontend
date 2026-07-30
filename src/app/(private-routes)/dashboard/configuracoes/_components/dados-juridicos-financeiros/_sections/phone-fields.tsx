"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhoneForm } from "../types";

/** DDD + número separados (phone_numbers[] do payload v5) — não é o telefone internacional do PhoneInput genérico, este fluxo é sempre Brasil. */
export function PhoneFields({ value, onChange, idPrefix }: { value: PhoneForm; onChange: (next: PhoneForm) => void; idPrefix: string }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-ddd`}>DDD</Label>
        <Input
          id={`${idPrefix}-ddd`}
          value={value.ddd}
          onChange={(e) => onChange({ ...value, ddd: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          placeholder="11"
          inputMode="numeric"
          maxLength={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-number`}>Telefone</Label>
        <Input
          id={`${idPrefix}-number`}
          value={value.number}
          onChange={(e) => onChange({ ...value, number: e.target.value.replace(/\D/g, "").slice(0, 9) })}
          placeholder="988887777"
          inputMode="numeric"
          maxLength={9}
        />
      </div>
    </div>
  );
}
