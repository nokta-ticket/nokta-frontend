"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { centsToInputValue, inputValueToCents } from "@/services/venue-menu";

/**
 * Campo em reais que só converte pra centavos (fonte de verdade) ao perder o
 * foco — nunca guarda float como estado intermediário. `autoSelect` seleciona
 * o conteúdo ao focar (garçom digita por cima sem apagar).
 */
export function MoneyInput({ id, cents, onChange, placeholder = "0,00", autoFocus, disabled, className, "aria-invalid": ariaInvalid }: { id?: string; cents: number; onChange: (cents: number) => void; placeholder?: string; autoFocus?: boolean; disabled?: boolean; className?: string; "aria-invalid"?: boolean }) {
  const [text, setText] = useState(() => centsToInputValue(cents));

  useEffect(() => {
    setText(centsToInputValue(cents));
  }, [cents]);

  return (
    <Input
      id={id}
      inputMode="decimal"
      prefix="R$"
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      className={className}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const parsed = inputValueToCents(text);
        setText(centsToInputValue(parsed));
        onChange(parsed);
      }}
    />
  );
}
