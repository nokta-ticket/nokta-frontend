"use client";

import { useEffect, useId, useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Input decimal (quantidade em unidade-base ou embalagem) — mantém o texto
 * livre enquanto digita e só valida/normaliza no blur. A fonte de verdade
 * final é sempre a string decimal enviada ao backend (nunca float local).
 */
export function QuantityField({
  id,
  label,
  value,
  onChange,
  suffix,
  placeholder = "0",
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const input = (
    <Input
      id={inputId}
      inputMode="decimal"
      suffix={suffix}
      placeholder={placeholder}
      aria-label={label ? undefined : "Quantidade"}
      value={text}
      onChange={(e) => setText(e.target.value.replace(",", "."))}
      onBlur={() => {
        const normalized = text.trim() === "" ? "" : text.replace(",", ".");
        const isValid = normalized !== "" && !Number.isNaN(Number(normalized));
        setText(isValid ? normalized : "");
        onChange(isValid ? normalized : "");
      }}
    />
  );

  if (!label) return input;
  return (
    <Field label={label} htmlFor={inputId}>
      {input}
    </Field>
  );
}
