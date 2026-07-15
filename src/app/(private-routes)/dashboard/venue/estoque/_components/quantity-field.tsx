"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          className={suffix ? "pr-12" : undefined}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value.replace(",", "."))}
          onBlur={() => {
            const normalized = text.trim() === "" ? "" : text.replace(",", ".");
            const isValid = normalized !== "" && !Number.isNaN(Number(normalized));
            setText(isValid ? normalized : "");
            onChange(isValid ? normalized : "");
          }}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-black/50">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
