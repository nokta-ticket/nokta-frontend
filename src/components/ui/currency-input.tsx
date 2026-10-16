"use client";

import { useEffect, useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";

/** Valor em reais vira texto do campo: zero fica vazio (mostra o placeholder). */
function toText(value: number): string {
  return value > 0 ? value.toFixed(2).replace(".", ",") : "";
}

/** Só dígitos e uma vírgula com até 2 casas; ponto digitado vira vírgula. */
function sanitize(raw: string): string {
  const cleaned = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [int, ...rest] = cleaned.split(",");
  if (rest.length === 0) return int;
  return `${int},${rest.join("").slice(0, 2)}`;
}

function parse(text: string): number {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/**
 * Campo de preço em reais. Começa vazio quando o valor é zero (nunca "0"
 * na frente do que se digita), aceita "25", "25,5" ou "25.50" e formata
 * como "25,00" ao sair do campo. `onValueChange` recebe o número a cada tecla.
 */
export function CurrencyInput({ value, onValueChange, placeholder = "0,00", onBlur, ...props }: Omit<InputProps, "value" | "onChange" | "type" | "prefix"> & { value: number; onValueChange: (value: number) => void }) {
  const [text, setText] = useState(() => toText(value));

  useEffect(() => {
    setText((current) => (parse(current) === value ? current : toText(value)));
  }, [value]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      prefix="R$"
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const next = sanitize(e.target.value);
        setText(next);
        onValueChange(parse(next));
      }}
      onBlur={(e) => {
        setText(toText(parse(text)));
        onBlur?.(e);
      }}
    />
  );
}
