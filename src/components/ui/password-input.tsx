"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  leftIcon?: IconName;
}

/**
 * Campo de senha com botão de mostrar/ocultar (mesma caixa do `Input`).
 */
export function PasswordInput({ className, leftIcon, disabled, ...props }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      {leftIcon ? <Icon name={leftIcon} size={14} className="pointer-events-none absolute left-3.5 text-subtle-foreground" /> : null}
      <input type={show ? "text" : "password"} data-slot="input" disabled={disabled} className={cn(inputClassName, "pr-12", leftIcon && "pl-10")} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={show}
        className="absolute right-1.5 flex size-8 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-50"
      >
        <Icon name={show ? "eye-slash" : "eye"} size={14} />
      </button>
    </div>
  );
}
