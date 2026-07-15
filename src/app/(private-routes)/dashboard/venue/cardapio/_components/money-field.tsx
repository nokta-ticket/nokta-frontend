"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centsToInputValue, inputValueToCents } from "@/services/venue-menu";

/**
 * Input em reais que só converte para centavos (fonte de verdade) ao perder
 * foco/confirmar — nunca guarda float como estado intermediário do preço.
 */
export function MoneyField({
  id,
  label,
  cents,
  onChange,
  placeholder = "0,00",
}: {
  id?: string;
  label?: string;
  cents: number;
  onChange: (cents: number) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => centsToInputValue(cents));

  // Sincroniza se o valor externo mudar (ex.: reset de formulário).
  useEffect(() => {
    setText(centsToInputValue(cents));
  }, [cents]);

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-black/50">
          R$
        </span>
        <Input
          id={id}
          inputMode="decimal"
          className="pl-9"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            const parsedCents = inputValueToCents(text);
            setText(centsToInputValue(parsedCents));
            onChange(parsedCents);
          }}
        />
      </div>
    </div>
  );
}
