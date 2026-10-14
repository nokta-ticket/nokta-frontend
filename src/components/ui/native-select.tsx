import * as React from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { inputClassName } from "@/components/ui/input";

/**
 * `<select>` nativo com o mesmo visual do `Input` (altura 44/40, fundo
 * `surface-2`, anel rosa no foco) e a seta própria. Pra listas curtas e
 * formulários simples — o Radix Select continua valendo pra buscas longas.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <select data-slot="select" className={cn(inputClassName, "appearance-none pr-10")} {...props}>
        {children}
      </select>
      <Icon name="chevron-down" size={12} className="pointer-events-none absolute right-3.5 text-subtle-foreground" />
    </div>
  );
}
