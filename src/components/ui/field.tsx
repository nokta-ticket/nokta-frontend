import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Rótulo + controle + dica/erro. O `htmlFor` casa com o `id` do controle.
 * Erro substitui a dica (nunca os dois ao mesmo tempo).
 */
export function Field({ label, htmlFor, hint, error, required, optional, className, children, action }: { label?: React.ReactNode; htmlFor?: string; hint?: React.ReactNode; error?: React.ReactNode; required?: boolean; optional?: boolean; className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
            {label}
            {required ? <span className="ml-0.5 text-brand">*</span> : null}
            {optional ? <span className="ml-1.5 text-caption font-normal text-subtle-foreground">opcional</span> : null}
          </label>
          {action ? <div className="text-caption">{action}</div> : null}
        </div>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FieldGroup({ className, children, columns = 1 }: { className?: string; children: React.ReactNode; columns?: 1 | 2 | 3 }) {
  return <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}>{children}</div>;
}
