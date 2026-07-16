import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";

export interface InsightsTableColumn<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  /** Se omitido, a coluna não aparece na visão em cartão (mobile) — use para colunas secundárias. */
  mobileLabel?: string;
}

/**
 * Tabela/ranking responsiva: tabela normal em telas ≥ sm, lista de cartões
 * empilhados abaixo disso (primeira coluna vira o título do cartão).
 */
export function InsightsRankingTable<T>({
  rows,
  columns,
  keyExtractor,
  isLoading,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: InsightsTableColumn<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (isLoading) return <TableSkeleton />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const [titleColumn, ...restColumns] = columns;
  const mobileColumns = restColumns.filter((c) => c.mobileLabel);

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white sm:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c, i) => (
                  <TableHead key={i} className={c.align === "right" ? "text-right" : undefined}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={keyExtractor(row, i)}>
                  {columns.map((c, j) => (
                    <TableCell key={j} className={c.align === "right" ? "text-right" : undefined}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2 sm:hidden">
        {rows.map((row, i) => (
          <div key={keyExtractor(row, i)} className="rounded-lg border border-black/10 bg-white p-3">
            <div className="font-medium text-gray-900">{titleColumn.render(row)}</div>
            {mobileColumns.length > 0 ? (
              <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-black/60">
                {mobileColumns.map((c, j) => (
                  <div key={j} className="flex justify-between gap-2">
                    <span className="text-black/40">{c.mobileLabel}</span>
                    <span className="font-medium text-gray-900">{c.render(row)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
