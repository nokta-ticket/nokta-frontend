"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { NOT_INFORMED } from "@/components/ui/detail-list";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { formatDateTime, formatPhone } from "../_lib/format";

interface DeletedAccountRow {
  id: number;
  userId: number;
  email: string;
  nome: string;
  telefone: string | null;
  accountCreatedAt: string | null;
  deletedByEmail: string | null;
  deletedAt: string;
  summary: { pedidos?: number; ingressos?: number; ingressosUtilizados?: number; organizacoes?: number; eventos?: number };
}

export default function ContasExcluidasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 350);
  const list = useAdminList<DeletedAccountRow>("/admin/contas-excluidas", { search: debounced || undefined }, { fallbackError: "Não foi possível carregar as contas excluídas." });
  const rows = list.rows ?? [];

  const emptyTitle = debounced ? "Nenhuma conta excluída pra essa busca" : "Nenhuma conta foi excluída ainda";
  const sum = (key: "pedidos" | "ingressos" | "organizacoes") => rows.reduce((acc, r) => acc + (r.summary[key] ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Contas excluídas" description="Registro permanente de cada conta apagada, com tudo o que ela tinha no momento da exclusão." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Contas excluídas" icon="history" value={list.rows ? list.paginate.total : null} hint={debounced ? "Com a busca atual" : "Desde que o registro começou"} />
        <StatCard label="Pedidos arquivados" icon="cart" value={list.rows ? sum("pedidos") : null} hint="Nesta página" />
        <StatCard label="Ingressos arquivados" icon="ticket" value={list.rows ? sum("ingressos") : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, e-mail, telefone ou CPF" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar as contas excluídas" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={6} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Conta</DataTableHeadCell>
                  <DataTableHeadCell>Telefone</DataTableHeadCell>
                  <DataTableHeadCell align="right">Pedidos</DataTableHeadCell>
                  <DataTableHeadCell align="right">Ingressos</DataTableHeadCell>
                  <DataTableHeadCell align="right">Organizações</DataTableHeadCell>
                  <DataTableHeadCell>Excluída em</DataTableHeadCell>
                  <DataTableHeadCell>Excluída por</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={7} icon="history" title={emptyTitle} />
                ) : (
                  rows.map((row, i) => (
                    <DataTableRow key={row.id} index={i} onClick={() => router.push(`/admin/contas-excluidas/${row.id}`)}>
                      <DataTableCell>
                        <p className="font-medium">{row.nome || "Sem nome"}</p>
                        <p className="break-all text-caption text-muted-foreground">{row.email}</p>
                      </DataTableCell>
                      <DataTableCell className="tnum text-muted-foreground">{row.telefone ? formatPhone(row.telefone) : <span className="text-subtle-foreground">{NOT_INFORMED}</span>}</DataTableCell>
                      <DataTableCell num>{row.summary.pedidos ?? 0}</DataTableCell>
                      <DataTableCell num>
                        {row.summary.ingressos ?? 0}
                        {row.summary.ingressos ? <span className="text-caption text-muted-foreground"> ({row.summary.ingressosUtilizados ?? 0} usados)</span> : null}
                      </DataTableCell>
                      <DataTableCell num>{row.summary.organizacoes ?? 0}</DataTableCell>
                      <DataTableCell className="tnum text-caption text-muted-foreground">{formatDateTime(row.deletedAt)}</DataTableCell>
                      <DataTableCell className="break-all text-caption text-muted-foreground">{row.deletedByEmail ?? <span className="text-subtle-foreground">{NOT_INFORMED}</span>}</DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            rows.length === 0 ? (
              <EmptyState compact icon="history" title={emptyTitle} />
            ) : (
              <MobileCardList>
                {rows.map((row, i) => (
                  <MobileCard
                    key={row.id}
                    index={i}
                    href={`/admin/contas-excluidas/${row.id}`}
                    title={row.nome || "Sem nome"}
                    subtitle={row.email}
                    meta={[
                      { label: "Excluída em", value: formatDateTime(row.deletedAt), num: true },
                      { label: "Por", value: row.deletedByEmail ?? NOT_INFORMED },
                      { label: "Pedidos", value: row.summary.pedidos ?? 0, num: true },
                      { label: "Ingressos", value: row.summary.ingressos ?? 0, num: true },
                    ]}
                  />
                ))}
              </MobileCardList>
            )
          }
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="contas" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}
    </div>
  );
}
