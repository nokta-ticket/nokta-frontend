import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { ComparisonTable, type Cell } from "./content";

/**
 * Comparativo que se adapta à tela. No celular, cada recurso vira um cartão
 * com as colunas empilhadas (nada fica escondido atrás de rolagem lateral);
 * a partir de `sm`, usa a `ComparisonTable` normal. A nota sai uma vez só.
 * Mesma semântica de célula: `true` Sim, `false` Não, `null` Não informado.
 */
export function ResponsiveComparison({ columns, rows, caption, note }: { columns: string[]; rows: { label: string; cells: Cell[] }[]; caption: string; note?: ReactNode }) {
  const render = (c: Cell) =>
    c === true ? (
      <span className="inline-flex items-center gap-1.5 text-success">
        <Icon name="check-circle" size={13} />
        Sim
      </span>
    ) : c === false ? (
      <span className="inline-flex items-center gap-1.5 text-subtle-foreground">
        <Icon name="minus" size={12} />
        Não
      </span>
    ) : c === null ? (
      <span className="text-subtle-foreground">Não informado</span>
    ) : (
      <span className="text-foreground">{c}</span>
    );

  return (
    <div>
      <ul aria-label={caption} className="space-y-3 sm:hidden">
        {rows.map((r) => (
          <li key={r.label} className="rounded-card border border-border bg-surface p-4 shadow-card">
            <p className="text-[15px] font-semibold text-foreground">{r.label}</p>
            <dl className="mt-3 space-y-2 text-sm">
              {r.cells.map((c, i) => (
                <div key={columns[i]} className={cn("grid grid-cols-[6.5rem_1fr] gap-3 rounded-[10px] px-3 py-2", i === 0 ? "bg-brand-soft/40" : "bg-surface-2")}>
                  <dt className={cn("text-caption font-semibold uppercase tracking-[0.08em]", i === 0 ? "text-brand" : "text-subtle-foreground")}>{columns[i]}</dt>
                  <dd className="m-0">{render(c)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden sm:block">
        <ComparisonTable columns={columns} rows={rows} caption={caption} />
      </div>
      {note ? <p className="mt-3 text-caption leading-5 text-subtle-foreground">{note}</p> : null}
    </div>
  );
}
