"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useAdminList } from "../../../_hooks/use-admin-list";
import { useStaffRole } from "../../../_lib/staff-role";
import { TICKET_STATUS_META, metaOf } from "../../../_lib/status-meta";
import { formatDate } from "../../../_lib/format";
import { TransferTicketDialog } from "../../../_components/transfer-ticket-dialog";

interface Ticket {
  id: number;
  code: string;
  status: number;
  bloqueado: boolean;
  createdAt: string;
  evento: { id: number; nome: string } | null;
}

export default function TabIngressos({ userId }: { userId: number }) {
  const { isSupport } = useStaffRole();
  const list = useAdminList<Ticket>(`/admin/usuarios/${userId}/ingressos`, {}, { fallbackError: "Não foi possível carregar os ingressos." });
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

  if (list.error) return <ErrorState title="Não deu pra carregar os ingressos" description={list.error} onRetry={() => void list.reload()} />;
  if (list.rows === null) return <RowsSkeleton rows={5} />;

  const rows = list.rows;
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
    <div className="space-y-4">
      <DataTableShell
        maxHeight="none"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Código</DataTableHeadCell>
                <DataTableHeadCell>Evento</DataTableHeadCell>
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
                <DataTableEmpty colSpan={isSupport ? 5 : 6} icon="ticket" title="Nenhum ingresso deste usuário" />
              ) : (
                rows.map((t, i) => {
                  const meta = metaOf(TICKET_STATUS_META, t.status);
                  return (
                    <DataTableRow key={t.id} index={i}>
                      <DataTableCell className="font-mono text-caption">{t.code}</DataTableCell>
                      <DataTableCell>{t.evento?.nome ?? <span className="text-subtle-foreground">Sem evento</span>}</DataTableCell>
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
            <EmptyState compact icon="ticket" title="Nenhum ingresso deste usuário" />
          ) : (
            <MobileCardList>
              {rows.map((t, i) => {
                const meta = metaOf(TICKET_STATUS_META, t.status);
                return (
                  <MobileCard
                    key={t.id}
                    index={i}
                    title={<span className="font-mono text-sm">{t.code}</span>}
                    subtitle={t.evento?.nome ?? "Sem evento"}
                    badge={<StatusBadge tone={t.bloqueado ? "danger" : meta.tone}>{t.bloqueado ? "Bloqueado" : meta.label}</StatusBadge>}
                    meta={[
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
        footer={list.paginate.lastPage > 1 ? <DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="ingressos" onPageChange={(p) => void list.goTo(p)} /> : undefined}
      />

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
