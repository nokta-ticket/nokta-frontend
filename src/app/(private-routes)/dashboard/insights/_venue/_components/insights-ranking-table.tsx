"use client";

import type { ReactNode } from "react";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconName } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export interface InsightsColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Célula numérica (tabular, alinhada à direita). */
  num?: boolean;
  render: (row: T) => ReactNode;
  /** Rótulo no card do celular. Omitido = a coluna não aparece no celular (use pra colunas secundárias). */
  mobileLabel?: string;
  width?: number | string;
}

/**
 * Tabela responsiva dos Insights: `DataTable` no desktop e `MobileCard`s no
 * celular (primeira coluna vira o título do card; as outras entram como pares
 * rótulo/valor quando têm `mobileLabel`).
 */
export function InsightsTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  fetching,
  emptyTitle,
  emptyDescription,
  emptyIcon = "inbox",
  footer,
  title,
  subtitle,
  badge,
  maxHeight = "none",
}: {
  rows: T[];
  columns: InsightsColumn<T>[];
  rowKey: (row: T, index: number) => string | number;
  loading?: boolean;
  /** Atualizando com dados antigos na tela (busca/paginação) — só esmaece. */
  fetching?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: IconName;
  footer?: ReactNode;
  title?: (row: T) => ReactNode;
  subtitle?: (row: T) => ReactNode;
  badge?: (row: T) => ReactNode;
  maxHeight?: string;
}) {
  if (loading) return <RowsSkeleton rows={5} />;
  if (rows.length === 0) return <EmptyState compact icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;

  const [first, ...rest] = columns;
  const mobileColumns = rest.filter((c) => c.mobileLabel);

  return (
    <DataTableShell
      maxHeight={maxHeight}
      className={cn("transition-opacity duration-150", fetching && "opacity-60")}
      footer={footer}
      table={
        <DataTable>
          <DataTableHead>
            <tr>
              {columns.map((c) => (
                <DataTableHeadCell key={c.key} align={c.align ?? (c.num ? "right" : "left")} width={c.width}>
                  {c.header}
                </DataTableHeadCell>
              ))}
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.map((row, i) => (
              <DataTableRow key={rowKey(row, i)} index={i}>
                {columns.map((c) => (
                  <DataTableCell key={c.key} align={c.align} num={c.num}>
                    {c.render(row)}
                  </DataTableCell>
                ))}
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      }
      mobile={
        <MobileCardList>
          {rows.map((row, i) => (
            <MobileCard key={rowKey(row, i)} index={i} title={title ? title(row) : first.render(row)} subtitle={subtitle?.(row)} badge={badge?.(row)} meta={mobileColumns.map((c) => ({ label: c.mobileLabel as string, value: c.render(row), num: c.num }))} />
          ))}
        </MobileCardList>
      }
    />
  );
}
