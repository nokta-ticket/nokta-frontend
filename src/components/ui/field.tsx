import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Rótulo + controle + dica/erro. O `htmlFor` casa com o `id` do controle.
 * Erro substitui a dica (nunca os dois ao mesmo tempo).
 */
export function Field({ label, htmlFor, hint, error, required, optional, className, children, action }: { label?: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; error?: React.ReactNode; required?: boolean; optional?: boolean; className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  const labelNode = label ? (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {label}
      {required ? <span className="ml-0.5 text-brand">*</span> : null}
      {optional ? <span className="ml-1.5 text-caption font-normal text-subtle-foreground">opcional</span> : null}
    </label>
  ) : null;
  const footer = error ? (
    <p role="alert" className="text-caption text-danger">
      {error}
    </p>
  ) : hint ? (
    <p className="text-caption text-muted-foreground">{hint}</p>
  ) : null;

  // Com `action` (ex.: "Esqueci a senha"), a ação aparece na linha do rótulo
  // mas vem DEPOIS do campo no HTML: o Tab vai do campo anterior direto para
  // este campo, e só depois para a ação.
  if (label && action) {
    return (
      <div className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5", className)}>
        {labelNode}
        <div className="col-span-2 row-start-2 flex flex-col">{children}</div>
        <div className="col-start-2 row-start-1 text-caption">{action}</div>
        {footer ? <div className="col-span-2">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {labelNode ? <div className="flex items-center justify-between gap-3">{labelNode}</div> : null}
      {children}
      {footer}
    </div>
  );
}

export function FieldGroup({ className, children, columns = 1 }: { className?: string; children: React.ReactNode; columns?: 1 | 2 | 3 }) {
  return <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}>{children}</div>;
}
