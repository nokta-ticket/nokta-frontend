"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { formatCPF } from "../_lib/format";

interface Pedido {
  id: string;
  user: { cpf: string; email: string; nome: string };
}

type Acao = "aprovar" | "recusar";

const ITEMS_PER_PAGE = 10;

// Status enviado no PUT /admin/solicitacoes/:id.
const STATUS_BY_ACTION: Record<Acao, number> = { aprovar: 2, recusar: 3 };

export default function PedidosProdutorPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 400);
  const list = useAdminList<Pedido>("/admin/solicitacoes", { nameOrEmail: debounced || null }, { perPage: ITEMS_PER_PAGE, fallbackError: "Não foi possível carregar as solicitações." });
  const rows = list.rows ?? [];
  const [target, setTarget] = useState<{ pedido: Pedido; acao: Acao } | null>(null);

  async function act(pedido: Pedido, acao: Acao) {
    try {
      await api.put(`/admin/solicitacoes/${pedido.id}`, { status: STATUS_BY_ACTION[acao] });
      toast.success(acao === "aprovar" ? "Pedido aprovado" : "Pedido recusado");
      await list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível processar o pedido."));
    }
  }

  const emptyTitle = debounced ? "Nenhuma solicitação pra essa busca" : "Nenhuma solicitação pendente";
  const actions = (p: Pedido) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label={`Aprovar ${p.user.nome}`} title="Aprovar" className="hover:bg-success-bg hover:text-success" onClick={() => setTarget({ pedido: p, acao: "aprovar" })}>
        <Icon name="check" size={14} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label={`Recusar ${p.user.nome}`} title="Recusar" className="hover:bg-danger-bg hover:text-danger" onClick={() => setTarget({ pedido: p, acao: "recusar" })}>
        <Icon name="close" size={14} />
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos de produtor" description="Contas pedindo pra virar produtor. Aprovar libera o nível de produtor na hora." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pendentes" icon="clipboard-check" value={list.rows ? list.paginate.total : null} hint={debounced ? "Com a busca atual" : "Aguardando decisão"} />
        <StatCard label="Nesta página" icon="list" value={list.rows ? rows.length : null} />
        <StatCard label="Com CPF informado" icon="id-card" value={list.rows ? rows.filter((p) => Boolean(p.user.cpf)).length : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou e-mail" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar as solicitações" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={6} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Nome</DataTableHeadCell>
                  <DataTableHeadCell>E-mail</DataTableHeadCell>
                  <DataTableHeadCell>CPF</DataTableHeadCell>
                  <DataTableHeadCell align="right">
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={4} icon="clipboard-check" title={emptyTitle} description="Quando alguém pedir pra virar produtor, aparece aqui." />
                ) : (
                  rows.map((p, i) => (
                    <DataTableRow key={p.id} index={i}>
                      <DataTableCell className="font-medium">{p.user.nome}</DataTableCell>
                      <DataTableCell className="text-muted-foreground">{p.user.email}</DataTableCell>
                      <DataTableCell className="tnum text-muted-foreground">{p.user.cpf ? formatCPF(p.user.cpf) : <span className="text-subtle-foreground">Não informado</span>}</DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex justify-end gap-1">{actions(p)}</div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            rows.length === 0 ? (
              <EmptyState compact icon="clipboard-check" title={emptyTitle} />
            ) : (
              <MobileCardList>
                {rows.map((p, i) => (
                  <MobileCard key={p.id} index={i} title={p.user.nome} subtitle={p.user.email} meta={[{ label: "CPF", value: p.user.cpf ? formatCPF(p.user.cpf) : "Não informado", num: true }]} actions={actions(p)} />
                ))}
              </MobileCardList>
            )
          }
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="solicitações" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => (!o ? setTarget(null) : null)}
        title={target?.acao === "aprovar" ? "Aprovar pedido" : "Recusar pedido"}
        description={target ? (target.acao === "aprovar" ? `${target.pedido.user.nome} passa a ser produtor e pode criar eventos.` : `${target.pedido.user.nome} continua como usuário comum e pode pedir de novo depois.`) : undefined}
        confirmLabel={target?.acao === "aprovar" ? "Aprovar" : "Recusar"}
        danger={target?.acao === "recusar"}
        icon={target?.acao === "aprovar" ? "check-circle" : "x-circle"}
        onConfirm={() => (target ? act(target.pedido, target.acao) : undefined)}
      />
    </div>
  );
}
