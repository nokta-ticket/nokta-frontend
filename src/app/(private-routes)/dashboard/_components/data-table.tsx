"use client";

import { useState, type ReactNode } from "react";
import { DataTable as UiDataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

/**
 * Tabela genérica do dashboard (colunas declarativas, paginação client-side
 * opcional via `pageSize`). Desktop: tabela que rola dentro do card; celular:
 * cards (a primeira coluna vira o título, as demais viram pares rótulo/valor).
 * @deprecated Prefira compor `DataTableShell` + `MobileCard` de
 * `@/components/ui/data-table` direto na página — dá controle do card do celular.
 */
export function DataTable<T extends Record<string, unknown>>({ columns, data, pageSize, empty = "Nada por aqui.", noun = "itens" }: { columns: Column<T>[]; data: T[]; pageSize?: number; empty?: ReactNode; noun?: string }) {
  const [page, setPage] = useState(1);
  const pageCount = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const current = Math.min(page, pageCount);
  const rows = pageSize ? data.slice((current - 1) * pageSize, current * pageSize) : data;
  const cell = (row: T, c: Column<T>) => (c.render ? c.render(row) : (row[c.key] as ReactNode));
  const [first, ...rest] = columns;

  if (rows.length === 0) {
    return typeof empty === "string" ? <EmptyState title={empty} compact /> : <>{empty}</>;
  }

  const footer = pageSize && pageCount > 1 ? <DataTablePagination page={current} lastPage={pageCount} total={data.length} perPage={pageSize} noun={noun} onPageChange={setPage} /> : undefined;

  return (
    <DataTableShell
      maxHeight="none"
      footer={footer}
      table={
        <UiDataTable>
          <DataTableHead>
            <tr>
              {columns.map((c) => (
                <DataTableHeadCell key={c.key} className={c.className}>
                  {c.header}
                </DataTableHeadCell>
              ))}
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.map((row, i) => (
              <DataTableRow key={i} index={i}>
                {columns.map((c) => (
                  <DataTableCell key={c.key} className={cn(c.className)}>
                    {cell(row, c)}
                  </DataTableCell>
                ))}
              </DataTableRow>
            ))}
          </DataTableBody>
        </UiDataTable>
      }
      mobile={
        <MobileCardList>
          {rows.map((row, i) => (
            <MobileCard key={i} index={i} title={first ? cell(row, first) : null} meta={rest.map((c) => ({ label: c.header, value: cell(row, c) }))} />
          ))}
        </MobileCardList>
      }
    />
  );
}
