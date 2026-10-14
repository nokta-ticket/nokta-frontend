"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { centsToInputValue, inputValueToCents } from "@/services/venue-menu";

/**
 * Input em reais que só converte para centavos (fonte de verdade) ao perder
 * foco/confirmar — nunca guarda float como estado intermediário do preço.
 * API estável (usada também pela Operação e pelo Estoque).
 */
export function MoneyField({
  id,
  label,
  cents,
  onChange,
  placeholder = "0,00",
  disabled,
}: {
  id?: string;
  label?: string;
  cents: number;
  onChange: (cents: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(() => centsToInputValue(cents));

  // Sincroniza se o valor externo mudar (ex.: reset de formulário).
  useEffect(() => {
    setText(centsToInputValue(cents));
  }, [cents]);

  const input = (
    <Input
      id={id}
      inputMode="decimal"
      prefix="R$"
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      aria-label={label ? undefined : "Valor em reais"}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      onBlur={() => {
        const parsedCents = inputValueToCents(text);
        setText(centsToInputValue(parsedCents));
        onChange(parsedCents);
      }}
    />
  );

  if (!label) return input;
  return (
    <Field label={label} htmlFor={id}>
      {input}
    </Field>
  );
}
