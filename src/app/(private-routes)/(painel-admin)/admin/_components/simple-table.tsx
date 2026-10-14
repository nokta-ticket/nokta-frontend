"use client";

import type { ReactNode } from "react";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconName } from "@/components/ui/icon";

export interface SimpleColumn {
  label: string;
  align?: "left" | "right" | "center";
  num?: boolean;
  width?: number | string;
}

/**
 * Tabela de leitura (sem ações) a partir de `head` + `rows`: tabela no
 * desktop, cards no celular — a primeira coluna vira o título do card e as
 * demais viram pares rótulo/valor. Pra retratos, auditorias e listas de
 * detalhe onde cada linha é só dado.
 */
export function SimpleTable({ columns, rows, empty, emptyIcon = "inbox", maxHeight = "none", rowKey }: { columns: (string | SimpleColumn)[]; rows: ReactNode[][]; empty: string; emptyIcon?: IconName; maxHeight?: string; rowKey?: (row: ReactNode[], index: number) => string | number }) {
  const cols: SimpleColumn[] = columns.map((c) => (typeof c === "string" ? { label: c } : c));
  const keyOf = (row: ReactNode[], i: number) => (rowKey ? rowKey(row, i) : i);

  return (
    <DataTableShell
      maxHeight={maxHeight}
      table={
        <DataTable>
          <DataTableHead>
            <tr>
              {cols.map((c) => (
                <DataTableHeadCell key={c.label} align={c.align} width={c.width}>
                  {c.label}
                </DataTableHeadCell>
              ))}
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0 ? (
              <DataTableEmpty colSpan={cols.length} icon={emptyIcon} title={empty} />
            ) : (
              rows.map((cells, i) => (
                <DataTableRow key={keyOf(cells, i)} index={i}>
                  {cells.map((cell, j) => (
                    <DataTableCell key={j} align={cols[j]?.align} num={cols[j]?.num} className="text-sm">
                      {cell}
                    </DataTableCell>
                  ))}
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      }
      mobile={
        rows.length === 0 ? (
          <EmptyState compact icon={emptyIcon} title={empty} />
        ) : (
          <MobileCardList>
            {rows.map((cells, i) => (
              <MobileCard key={keyOf(cells, i)} index={i} title={cells[0]} meta={cols.slice(1).map((c, j) => ({ label: c.label, value: cells[j + 1] ?? "—", num: c.num }))} />
            ))}
          </MobileCardList>
        )
      }
    />
  );
}
