"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatEventDateShort } from "@/lib/format";
import { useAdminList } from "../_hooks/use-admin-list";
import { useStaffRole } from "../_lib/staff-role";
import { RefreshButton } from "../_components/refresh-button";
import { TransferTicketDialog } from "../_components/transfer-ticket-dialog";
import { TICKET_STATUS_META, metaOf } from "../_lib/status-meta";
import { formatDate, fullName } from "../_lib/format";

interface Ticket {
  id: number;
  code: string;
  status: number;
  bloqueado: boolean;
  bloqueadoMotivo: string | null;
  createdAt: string;
  dono: { id: number; nome: string; sobrenome: string; email: string } | null;
  evento: { id: number; nome: string; data: string } | null;
}

export default function IngressosPage() {
  const { isSupport } = useStaffRole();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 400);
  const list = useAdminList<Ticket>("/admin/ingressos", { search: debounced || null }, { fallbackError: "Não foi possível carregar os ingressos." });
  const rows = list.rows ?? [];

  const [blockTarget, setBlockTarget] = useState<Ticket | null>(null);
  const [transferTarget, setTransferTarget] = useState<Ticket | null>(null);

  async function toggleBlock(ticket: Ticket) {
    try {
      await api.patch(`/admin/ingressos/${ticket.id}/bloqueio`, { bloqueado: !ticket.bloqueado });
      toast.success(ticket.bloqueado ? "Ingresso desbloqueado" : "Ingresso bloqueado");
      void list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o ingresso."));
    }
  }

  const validated = rows.filter((t) => t.status === 2).length;
  const blocked = rows.filter((t) => t.bloqueado).length;
  const emptyTitle = debounced ? "Nenhum ingresso pra essa busca" : "Nenhum ingresso emitido ainda";

  const actions = (t: Ticket) =>
    isSupport ? null : (
      <>
        <Button variant="subtle" size="icon-sm" aria-label={t.bloqueado ? "Desbloquear ingresso" : "Bloquear ingresso"} title={t.bloqueado ? "Desbloquear" : "Bloquear"} className={t.bloqueado ? "" : "hover:bg-danger-bg hover:text-danger"} onClick={() => setBlockTarget(t)}>
          <Icon name={t.bloqueado ? "lock-open" : "ban"} size={14} />
        </Button>
        <Button variant="subtle" size="icon-sm" aria-label="Transferir ingresso" title="Transferir" onClick={() => setTransferTarget(t)}>
          <Icon name="transfer" size={14} />
        </Button>
      </>
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Ingressos" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ingressos" icon="ticket" value={list.rows ? list.paginate.total : null} hint={debounced ? "Com a busca atual" : "Emitidos na plataforma"} />
        <StatCard label="Validados" icon="check-circle" value={list.rows ? validated : null} hint="Nesta página" />
        <StatCard label="Bloqueados" icon="ban" value={list.rows ? blocked : null} hint="Nesta página" />
      </div>

      <DataTableToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por código, e-mail do dono ou evento" className="min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-xl" />
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar os ingressos" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={8} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Código</DataTableHeadCell>
                  <DataTableHeadCell>Evento</DataTableHeadCell>
                  <DataTableHeadCell>Dono</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell>Bloqueio</DataTableHeadCell>
                  <DataTableHeadCell>Emitido</DataTableHeadCell>
                  {!isSupport ? (
                    <DataTableHeadCell align="right">
                      <span className="sr-only">Ações</span>
                    </DataTableHeadCell>
                  ) : null}
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={isSupport ? 6 : 7} icon="ticket" title={emptyTitle} />
                ) : (
                  rows.map((t, i) => {
                    const meta = metaOf(TICKET_STATUS_META, t.status);
                    return (
                      <DataTableRow key={t.id} index={i}>
                        <DataTableCell className="font-mono text-caption">{t.code}</DataTableCell>
                        <DataTableCell>
                          {t.evento ? (
                            <>
                              <p className="font-medium">{t.evento.nome}</p>
                              <p className="text-caption text-muted-foreground">{formatEventDateShort(t.evento.data)}</p>
                            </>
                          ) : (
                            <span className="text-subtle-foreground">Sem evento</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          {t.dono ? (
                            <Link href={`/admin/usuarios/${t.dono.id}`} className="block hover:text-brand">
                              <span className="block">{fullName(t.dono.nome, t.dono.sobrenome)}</span>
                              <span className="block text-caption text-muted-foreground">{t.dono.email}</span>
                            </Link>
                          ) : (
                            <span className="text-subtle-foreground">Sem dono</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={t.bloqueado ? "danger" : "success"}>{t.bloqueado ? "Bloqueado" : "Liberado"}</StatusBadge>
                        </DataTableCell>
                        <DataTableCell className="tnum text-muted-foreground">{formatDate(t.createdAt)}</DataTableCell>
                        {!isSupport ? (
                          <DataTableCell align="right">
                            <div className="flex justify-end gap-1">{actions(t)}</div>
                          </DataTableCell>
                        ) : null}
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            rows.length === 0 ? (
              <EmptyState compact icon="ticket" title={emptyTitle} />
            ) : (
              <MobileCardList>
                {rows.map((t, i) => {
                  const meta = metaOf(TICKET_STATUS_META, t.status);
                  return (
                    <MobileCard
                      key={t.id}
                      index={i}
                      title={t.evento?.nome ?? "Sem evento"}
                      subtitle={<span className="font-mono">{t.code}</span>}
                      badge={<StatusBadge tone={t.bloqueado ? "danger" : meta.tone}>{t.bloqueado ? "Bloqueado" : meta.label}</StatusBadge>}
                      meta={[
                        { label: "Dono", value: t.dono ? fullName(t.dono.nome, t.dono.sobrenome) : "Sem dono" },
                        { label: "E-mail", value: t.dono?.email ?? "—" },
                        { label: "Status", value: meta.label },
                        { label: "Emitido", value: formatDate(t.createdAt), num: true },
                      ]}
                      actions={actions(t)}
                    />
                  );
                })}
              </MobileCardList>
            )
          }
          footer={<DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="ingressos" onPageChange={(p) => void list.goTo(p)} />}
        />
      )}

      <ConfirmDialog
        open={blockTarget !== null}
        onOpenChange={(o) => (!o ? setBlockTarget(null) : null)}
        title={blockTarget?.bloqueado ? "Desbloquear ingresso" : "Bloquear ingresso"}
        description={blockTarget?.bloqueado ? `O ingresso ${blockTarget.code} volta a valer na portaria.` : `O ingresso ${blockTarget?.code ?? ""} deixa de ser aceito na portaria até ser desbloqueado.`}
        confirmLabel={blockTarget?.bloqueado ? "Desbloquear" : "Bloquear"}
        danger={!blockTarget?.bloqueado}
        icon={blockTarget?.bloqueado ? "lock-open" : "ban"}
        onConfirm={() => (blockTarget ? toggleBlock(blockTarget) : undefined)}
      />

      <TransferTicketDialog ticket={transferTarget} onOpenChange={(o) => (!o ? setTransferTarget(null) : null)} onDone={() => void list.reload()} />
    </div>
  );
}
