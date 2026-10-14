import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

/** Texto padrão pra valor ausente — `null` nunca vira "0" nem "—" mudo. */
export const NOT_INFORMED = "Não informado";

function isEmpty(value: ReactNode): boolean {
  return value === null || value === undefined || value === "" || value === "—";
}

/**
 * Grade de pares rótulo/valor pra páginas de detalhe do painel. Cada item é
 * uma caixa rebaixada (`surface-inset`), rótulo em micro caps e valor em
 * `text-sm font-medium`. Valor vazio vira "Não informado" apagado.
 */
export function DetailGrid({ children, columns = 3, className }: { children: ReactNode; columns?: 2 | 3 | 4; className?: string }) {
  return <dl className={cn("grid gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 lg:grid-cols-3", columns === 4 && "grid-cols-2 lg:grid-cols-4", className)}>{children}</dl>;
}

export function DetailItem({ label, value, icon, mono, span, className, children }: { label: ReactNode; value?: ReactNode; icon?: IconName; mono?: boolean; span?: boolean; className?: string; children?: ReactNode }) {
  const empty = children === undefined && isEmpty(value);
  return (
    <div className={cn("surface-inset min-w-0 rounded-xl px-3.5 py-3", span && "sm:col-span-2 lg:col-span-full", className)}>
      <dt className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
        {icon ? <Icon name={icon} size={11} /> : null}
        {label}
      </dt>
      <dd className={cn("mt-1 break-words text-sm font-medium text-foreground", mono && "font-mono text-[13px]", empty && "font-normal text-subtle-foreground")}>{children ?? (empty ? NOT_INFORMED : value)}</dd>
    </div>
  );
}

/** Sim/Não com ícone e tom semântico. `invert` quando "sim" é ruim (ex.: bloqueado). */
export function BooleanValue({ value, yes = "Sim", no = "Não", invert }: { value: boolean | null | undefined; yes?: string; no?: string; invert?: boolean }) {
  if (value === null || value === undefined) return <span className="font-normal text-subtle-foreground">{NOT_INFORMED}</span>;
  const positive = invert ? !value : value;
  return (
    <span className={cn("inline-flex items-center gap-1.5", positive ? "text-success" : "text-danger")}>
      <Icon name={positive ? "check-circle" : "x-circle"} size={13} />
      {value ? yes : no}
    </span>
  );
}
