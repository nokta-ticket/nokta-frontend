"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { formatDate, fullName } from "../_lib/format";
import { MODULE_LABEL, WorkspaceStageBadge, WorkspaceStatusBadge, stageInfo } from "./_components/workspace-labels";

type StageFilter = "" | "SEM_WORKSPACE" | "EM_ANDAMENTO" | "CONCLUIDO" | "BLOQUEADO";

/**
 * Uma linha do funil. `kind: "lead"` é uma conta que entrou no painel e ainda
 * não criou workspace: não há workspace para abrir, então a linha leva ao
 * usuário (`owner`).
 */
interface WorkspaceRow {
  kind: "workspace" | "lead";
  id: number | null;
  nome: string | null;
  slug: string | null;
  tipo: "PF" | "PJ" | null;
  status: string | null;
  etapa: string;
  createdAt: string;
  owner: { id: number; nome: string | null; sobrenome: string | null; email: string } | null;
  modules: string[];
  membersCount: number;
  eventsCount: number;
}

const FILTERS: { value: StageFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "SEM_WORKSPACE", label: "Sem workspace" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluídos" },
  { value: "BLOQUEADO", label: "Bloqueados" },
];

function rowHref(row: WorkspaceRow): string {
  return row.kind === "lead" ? `/admin/usuarios/${row.owner?.id}` : `/admin/workspaces/${row.id}`;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [etapa, setEtapa] = useState<StageFilter>("");
  const debounced = useDebouncedValue(search.trim(), 400);

  const list = useAdminList<WorkspaceRow>("/admin/workspaces", { etapa: etapa || null, search: debounced || null }, { fallbackError: "Não foi possível carregar os workspaces." });
  const rows = list.rows ?? [];
  const concluded = rows.filter((r) => r.etapa === "CONCLUIDO").length;
  const blocked = rows.filter((r) => r.kind === "workspace" && r.status !== "ACTIVE").length;
  const emptyTitle = debounced ? "Nada encontrado pra essa busca" : "Nada encontrado com esse filtro";

  return (
    <div className="space-y-6">
      <PageHeader title="Workspaces" description="Funil de criação: da conta nova ao workspace operando." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="No funil" icon="building" value={list.rows ? list.paginate.total : null} hint={etapa || debounced ? "Com o filtro atual" : "Contas e workspaces"} />
        <StatCard label="Onboarding concluído" icon="check-circle" value={list.rows ? concluded : null} hint="Nesta página" />
        <StatCard label="Bloqueados" icon="ban" value={list.rows ? blocked : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, link, documento ou e-mail" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <div className="scrollbar-hide max-w-full overflow-x-auto">
          <SegmentedControl value={etapa} onChange={setEtapa} options={FILTERS} size="sm" />
        </div>
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar os workspaces" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={8} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Workspace</DataTableHeadCell>
                  <DataTableHeadCell>Dono</DataTableHeadCell>
                  <DataTableHeadCell>Etapa</DataTableHeadCell>
                  <DataTableHeadCell>Módulos</DataTableHeadCell>
                  <DataTableHeadCell align="right">Equipe</DataTableHeadCell>
                  <DataTableHeadCell align="right">Eventos</DataTableHeadCell>
                  <DataTableHeadCell>Criado em</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={72}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={8} icon="building" title={emptyTitle} />
                ) : (
                  rows.map((row, i) => {
                    const isLead = row.kind === "lead";
                    const ownerName = fullName(row.owner?.nome, row.owner?.sobrenome);
                    const blockedRow = !isLead && row.status !== "ACTIVE";
                    const href = rowHref(row);
                    return (
                      <DataTableRow key={`${row.kind}-${isLead ? row.owner?.id : row.id}`} index={i} onClick={() => router.push(href)}>
                        <DataTableCell>
                          {isLead ? (
                            <span className="text-muted-foreground">Ainda não criou o workspace</span>
                          ) : (
                            <>
                              <p className="font-medium">{row.nome}</p>
                              <p className="text-caption text-muted-foreground">
                                #{row.id} · {row.slug ?? "sem link"} · {row.tipo}
                              </p>
                            </>
                          )}
                        </DataTableCell>
                        <DataTableCell stopPropagation>
                          {row.owner ? (
                            <Link href={`/admin/usuarios/${row.owner.id}`} className="block hover:text-brand">
                              <span className="block">{ownerName}</span>
                              <span className="block text-caption text-muted-foreground">{row.owner.email}</span>
                            </Link>
                          ) : (
                            <span className="text-subtle-foreground">Sem dono</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex flex-wrap gap-1">
                              <WorkspaceStageBadge etapa={row.etapa} />
                              {blockedRow && row.status ? <WorkspaceStatusBadge status={row.status} /> : null}
                            </div>
                            {row.etapa !== "CONCLUIDO" ? <span className="text-caption text-muted-foreground">{stageInfo(row.etapa).detail}</span> : null}
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.modules.length === 0 ? (
                              <span className="text-subtle-foreground">Nenhum</span>
                            ) : (
                              row.modules.map((m) => (
                                <StatusBadge key={m} tone="brand" dot={false}>
                                  {MODULE_LABEL[m] ?? m}
                                </StatusBadge>
                              ))
                            )}
                          </div>
                        </DataTableCell>
                        <DataTableCell num>{isLead ? <span className="text-subtle-foreground">—</span> : row.membersCount}</DataTableCell>
                        <DataTableCell num>{isLead ? <span className="text-subtle-foreground">—</span> : row.eventsCount}</DataTableCell>
                        <DataTableCell className="tnum text-muted-foreground">{formatDate(row.createdAt)}</DataTableCell>
                        <DataTableCell align="right" stopPropagation>
                          <Button asChild variant="subtle" size="icon-sm" aria-label={isLead ? `Ver a conta de ${ownerName}` : `Ver ${row.nome}`}>
                            <Link href={href}>
                              <Icon name="chevron-right" size={12} />
                            </Link>
                          </Button>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            rows.length === 0 ? (
              <EmptyState compact icon="building" title={emptyTitle} />
            ) : (
              <MobileCardList>
                {rows.map((row, i) => {
                  const isLead = row.kind === "lead";
                  return (
                    <MobileCard
                      key={`${row.kind}-${isLead ? row.owner?.id : row.id}`}
                      index={i}
                      href={rowHref(row)}
                      title={isLead ? "Ainda não criou o workspace" : row.nome}
                      subtitle={row.owner ? `${fullName(row.owner.nome, row.owner.sobrenome)} · ${row.owner.email}` : undefined}
                      badge={<WorkspaceStageBadge etapa={row.etapa} />}
                      meta={[
                        { label: "Módulos", value: row.modules.length ? row.modules.map((m) => MODULE_LABEL[m] ?? m).join(", ") : "Nenhum" },
                        { label: "Criado em", value: formatDate(row.createdAt), num: true },
                        { label: "Equipe", value: isLead ? "—" : row.membersCount, num: true },
                        { label: "Eventos", value: isLead ? "—" : row.eventsCount, num: true },
                      ]}
                    />
                  );
                })}
              </MobileCardList>
            )
          }
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="registros" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}
    </div>
  );
}
