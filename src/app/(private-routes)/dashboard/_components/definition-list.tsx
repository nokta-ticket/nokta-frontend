import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pares rótulo/valor somente-leitura (dados da organização, revisão de
 * formulário). `null`/vazio vira "Não informado" — nunca "0" nem "—" solto.
 */
export function DefinitionList({ children, columns = 2, className }: { children: ReactNode; columns?: 1 | 2 | 3; className?: string }) {
  return <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", className)}>{children}</dl>;
}

export function DefinitionItem({ label, value, className, mono }: { label: string; value: ReactNode; className?: string; mono?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">{label}</dt>
      <dd className={cn("mt-1 text-sm text-foreground", empty && "text-subtle-foreground", mono && "font-mono tnum")}>{empty ? "Não informado" : value}</dd>
    </div>
  );
}
