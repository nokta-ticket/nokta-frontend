import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

export const inputClassName =
  "flex h-11 w-full min-w-0 rounded-input border border-border bg-surface-2 px-3.5 text-[15px] text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-subtle-foreground focus:border-transparent focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger-ring md:h-10 md:text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium";

export interface InputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
  leftIcon?: IconName;
  /** Texto curto à esquerda (R$, @) ou à direita (cm, %). */
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

/**
 * Campo de texto. 44px no celular (toque) e 40px no desktop; fonte de 16px
 * no celular pra o Safari não dar zoom. Com `leftIcon`/`prefix`/`suffix`
 * vira um grupo (wrapper relative) — a largura continua sendo do wrapper.
 */
function Input({ className, type, leftIcon, prefix, suffix, ...props }: InputProps) {
  if (!leftIcon && !prefix && !suffix) {
    return <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />;
  }
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      {leftIcon ? <Icon name={leftIcon} size={14} className="pointer-events-none absolute left-3.5 text-subtle-foreground" /> : null}
      {prefix ? <span className="pointer-events-none absolute left-3.5 select-none text-sm text-subtle-foreground">{prefix}</span> : null}
      <input type={type} data-slot="input" className={cn(inputClassName, (leftIcon || prefix) && "pl-10", suffix && "pr-12")} {...props} />
      {suffix ? <span className="pointer-events-none absolute right-3.5 select-none text-sm text-subtle-foreground">{suffix}</span> : null}
    </div>
  );
}

export { Input };
