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
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { Icon } from "@/components/ui/icon";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { USER_ROLE_META, accountStatusMeta, metaOf } from "../_lib/status-meta";
import { formatCPF, formatDateUTC, fullName } from "../_lib/format";
import { NOT_INFORMED } from "@/components/ui/detail-list";

type Role = "COMUM" | "PRODUTOR";
type Genero = "MASCULINO" | "FEMININO" | "OUTRO";
type Filter = "0" | "2" | "3";

interface User {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string | null;
  dataNascimento: string | null;
  genero: Genero | null;
  role: Role;
  ativo: boolean;
  bloqueado?: boolean;
}

const GENERO_LABEL: Record<Genero, string> = { MASCULINO: "Masculino", FEMININO: "Feminino", OUTRO: "Outro" };

// Os valores do filtro são os do backend (`type`): 2 = comum, 3 = produtor.
const FILTERS: { value: Filter; label: string }[] = [
  { value: "0", label: "Todos" },
  { value: "2", label: "Comuns" },
  { value: "3", label: "Produtores" },
];

export default function UsuariosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("0");
  const debounced = useDebouncedValue(search.trim(), 400);

  const list = useAdminList<User>("/admin/usuarios", { type: filter !== "0" ? Number(filter) : null, nameOrEmail: debounced || null }, { fallbackError: "Não foi possível carregar os usuários." });
  const rows = list.rows ?? [];
  const producers = rows.filter((u) => u.role === "PRODUTOR").length;
  const blocked = rows.filter((u) => u.bloqueado).length;

  const emptyTitle = debounced ? "Nenhum usuário encontrado pra essa busca" : "Nenhum usuário com esse filtro";

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuários" icon="users" value={list.rows ? list.paginate.total : null} hint={filter !== "0" || debounced ? "Com o filtro atual" : "Cadastrados na plataforma"} />
        <StatCard label="Produtores" icon="megaphone" value={list.rows ? producers : null} hint="Nesta página" />
        <StatCard label="Bloqueados" icon="ban" value={list.rows ? blocked : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou e-mail" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <SegmentedControl value={filter} onChange={setFilter} options={FILTERS} size="sm" />
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar os usuários" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={8} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Usuário</DataTableHeadCell>
                  <DataTableHeadCell>CPF</DataTableHeadCell>
                  <DataTableHeadCell>Nascimento</DataTableHeadCell>
                  <DataTableHeadCell>Gênero</DataTableHeadCell>
                  <DataTableHeadCell>Tipo</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right" width={72}>
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={7} icon="users" title={emptyTitle} description="Tenta outro nome, e-mail ou filtro." />
                ) : (
                  rows.map((user, i) => {
                    const role = metaOf(USER_ROLE_META, user.role);
                    const status = accountStatusMeta(user.ativo, user.bloqueado);
                    return (
                      <DataTableRow key={user.id} index={i} onClick={() => router.push(`/admin/usuarios/${user.id}`)}>
                        <DataTableCell>
                          <p className="font-medium">{fullName(user.nome, user.sobrenome)}</p>
                          <p className="text-caption text-muted-foreground">{user.email}</p>
                        </DataTableCell>
                        <DataTableCell className="tnum text-muted-foreground">{user.cpf ? formatCPF(user.cpf) : <span className="text-subtle-foreground">{NOT_INFORMED}</span>}</DataTableCell>
                        <DataTableCell className="tnum text-muted-foreground">{user.dataNascimento ? formatDateUTC(user.dataNascimento) : <span className="text-subtle-foreground">{NOT_INFORMED}</span>}</DataTableCell>
                        <DataTableCell className="text-muted-foreground">{user.genero ? GENERO_LABEL[user.genero] : <span className="text-subtle-foreground">{NOT_INFORMED}</span>}</DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={role.tone}>{role.label}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell align="right" stopPropagation>
                          <Button asChild variant="subtle" size="icon-sm" aria-label={`Ver ${fullName(user.nome, user.sobrenome)}`}>
                            <Link href={`/admin/usuarios/${user.id}`}>
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
              <EmptyState compact icon="users" title={emptyTitle} description="Tenta outro nome, e-mail ou filtro." />
            ) : (
              <MobileCardList>
                {rows.map((user, i) => {
                  const role = metaOf(USER_ROLE_META, user.role);
                  const status = accountStatusMeta(user.ativo, user.bloqueado);
                  return (
                    <MobileCard
                      key={user.id}
                      index={i}
                      href={`/admin/usuarios/${user.id}`}
                      title={fullName(user.nome, user.sobrenome)}
                      subtitle={user.email}
                      badge={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
                      meta={[
                        { label: "Tipo", value: role.label },
                        { label: "CPF", value: user.cpf ? formatCPF(user.cpf) : NOT_INFORMED, num: true },
                        { label: "Nascimento", value: user.dataNascimento ? formatDateUTC(user.dataNascimento) : NOT_INFORMED, num: true },
                        { label: "Gênero", value: user.genero ? GENERO_LABEL[user.genero] : NOT_INFORMED },
                      ]}
                    />
                  );
                })}
              </MobileCardList>
            )
          }
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="usuários" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}
    </div>
  );
}
