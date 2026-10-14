"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Chamado quando todas as caixas estão preenchidas. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  /** `numeric` (padrão) só aceita dígitos; `alphanumeric` pra códigos de recuperação. */
  mode?: "numeric" | "alphanumeric";
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Código de uso único em caixas (OTP de WhatsApp/SMS, TOTP). Uma caixa por
 * caractere, avança sozinho, aceita colar o código inteiro e o autofill do
 * celular (`autoComplete="one-time-code"`). Controlado: `value`/`onChange`.
 */
export function OtpInput({ value, onChange, onComplete, length = 6, disabled, autoFocus, mode = "numeric", invalid, className, "aria-label": ariaLabel = "Código de verificação" }: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const chars = React.useMemo(() => Array.from({ length }, (_, i) => value[i] ?? ""), [value, length]);

  React.useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const sanitize = (raw: string) => (mode === "numeric" ? raw.replace(/\D/g, "") : raw.toUpperCase().replace(/[^A-Z0-9]/g, ""));

  const commit = (next: string) => {
    const clipped = next.slice(0, length);
    onChange(clipped);
    if (clipped.length === length) onComplete?.(clipped);
  };

  const handleChange = (idx: number, raw: string) => {
    const clean = sanitize(raw);
    if (!clean) {
      commit(value.slice(0, idx) + value.slice(idx + 1));
      return;
    }
    // Autofill/colar numa caixa só: distribui a partir dela.
    const next = (value.slice(0, idx) + clean + value.slice(idx + clean.length)).slice(0, length);
    commit(next);
    const focusIdx = Math.min(idx + clean.length, length - 1);
    refs.current[focusIdx]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (chars[idx]) {
        commit(value.slice(0, idx) + value.slice(idx + 1));
      } else if (idx > 0) {
        commit(value.slice(0, idx - 1) + value.slice(idx));
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = sanitize(e.clipboardData.getData("text")).slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex justify-center gap-2", className)} onPaste={handlePaste}>
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode={mode === "numeric" ? "numeric" : "text"}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${ariaLabel}, caractere ${i + 1} de ${length}`}
          value={ch}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "tnum h-14 w-11 rounded-input border bg-surface-2 text-center text-xl font-semibold text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-transparent focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-10 sm:text-lg",
            ch ? "border-border-strong" : "border-border",
            invalid && "border-danger ring-2 ring-danger-ring",
          )}
        />
      ))}
    </div>
  );
}
