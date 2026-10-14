"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { DataTablePagination, DataTableToolbar } from "@/components/ui/data-table";
import { useAdminList } from "../_hooks/use-admin-list";
import { RefreshButton } from "../_components/refresh-button";
import { SimpleTable } from "../_components/simple-table";
import { AUDIT_ACTION_META, ENTITY_LABEL, metaOf } from "../_lib/status-meta";
import { formatDateTime } from "../_lib/format";

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  admin: { id: number; nome?: string; email?: string } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditoriaPage() {
  const list = useAdminList<AuditLog>("/admin/auditoria", {}, { fallbackError: "Não foi possível carregar a auditoria." });
  const rows = list.rows ?? [];
  const admins = new Set(rows.map((l) => l.admin?.email ?? l.admin?.id).filter(Boolean)).size;
  const destructive = rows.filter((l) => metaOf(AUDIT_ACTION_META, l.action).tone === "danger").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Registro de todas as ações administrativas feitas neste painel." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros" icon="file-lines" value={list.rows ? list.paginate.total : null} />
        <StatCard label="Pessoas da equipe agindo" icon="user-shield" value={list.rows ? admins : null} hint="Nesta página" />
        <StatCard label="Ações críticas" icon="warning" value={list.rows ? destructive : null} hint="Bloqueios e exclusões nesta página" />
      </div>

      <DataTableToolbar>
        <p className="text-caption text-muted-foreground">Do mais recente pro mais antigo.</p>
        <RefreshButton onClick={() => void list.reload()} pending={list.loading} className="ml-auto" />
      </DataTableToolbar>

      {list.error ? (
        <ErrorState title="Não deu pra carregar a auditoria" description={list.error} onRetry={() => void list.reload()} />
      ) : list.rows === null ? (
        <RowsSkeleton rows={8} />
      ) : (
        <div className="space-y-4">
          <SimpleTable
            columns={["Quando", "Quem", "Ação", "Alvo", "Detalhes"]}
            empty="Nenhuma ação registrada ainda"
            emptyIcon="file-lines"
            maxHeight="calc(100dvh - 17rem)"
            rowKey={(_, i) => rows[i].id}
            rows={rows.map((log) => {
              const meta = metaOf(AUDIT_ACTION_META, log.action);
              return [
                <span key="d" className="tnum whitespace-nowrap text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </span>,
                log.admin?.email ?? log.admin?.nome ?? <span className="text-subtle-foreground">Sistema</span>,
                <StatusBadge key="a" tone={meta.tone} dot={false}>
                  {meta.label}
                </StatusBadge>,
                <span key="t" className="whitespace-nowrap">
                  {ENTITY_LABEL[log.entityType] ?? log.entityType} <span className="tnum text-muted-foreground">#{log.entityId}</span>
                </span>,
                log.metadata && Object.keys(log.metadata).length > 0 ? (
                  <span key="m" className="block max-w-md break-all font-mono text-caption text-muted-foreground">
                    {JSON.stringify(log.metadata)}
                  </span>
                ) : (
                  <span key="m" className="text-subtle-foreground">
                    —
                  </span>
                ),
              ];
            })}
          />
          <DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="registros" onPageChange={(p) => void list.goTo(p)} />
        </div>
      )}
    </div>
  );
}
