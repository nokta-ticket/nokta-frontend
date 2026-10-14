"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/ui/data-table";
import { cn } from "@/lib/cn";
import { useAdminList } from "../../../_hooks/use-admin-list";
import { AUDIT_ACTION_META, metaOf } from "../../../_lib/status-meta";
import { formatDateTime } from "../../../_lib/format";

interface AuditItem {
  id: number;
  action: string;
  metadata: Record<string, unknown> | null;
  admin: { id: number; nome?: string; email?: string } | null;
  createdAt: string;
}

const DOT: Record<string, string> = { success: "bg-success", danger: "bg-danger", warning: "bg-warning", info: "bg-info", brand: "bg-brand", neutral: "bg-neutral" };

export default function TabAuditoria({ userId }: { userId: number }) {
  const list = useAdminList<AuditItem>(`/admin/usuarios/${userId}/auditoria`, {}, { fallbackError: "Não foi possível carregar a auditoria." });

  if (list.error) return <ErrorState title="Não deu pra carregar a auditoria" description={list.error} onRetry={() => void list.reload()} />;
  if (list.rows === null) return <RowsSkeleton rows={4} />;
  if (list.rows.length === 0) return <EmptyState icon="file-lines" title="Nenhuma ação registrada" description="As ações administrativas sobre esta conta aparecem aqui." />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <ol className="relative space-y-6 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-0.5 before:rounded-full before:bg-border-strong">
            {list.rows.map((item, i) => {
              const meta = metaOf(AUDIT_ACTION_META, item.action);
              const hasMeta = item.metadata && Object.keys(item.metadata).length > 0;
              return (
                <li key={item.id} className="row-in relative flex gap-4" style={{ ["--i" as string]: i } as never}>
                  <span className={cn("relative z-10 mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-[3px] border-surface", DOT[meta.tone])} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={meta.tone} dot={false}>
                        {meta.label}
                      </StatusBadge>
                      <span className="tnum text-caption text-subtle-foreground">{formatDateTime(item.createdAt)}</span>
                    </div>
                    {item.admin ? <p className="mt-1 text-caption text-muted-foreground">Por {item.admin.email ?? item.admin.nome ?? "equipe"}</p> : null}
                    {hasMeta ? <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-mono text-micro leading-5 tracking-normal text-muted-foreground">{JSON.stringify(item.metadata, null, 1)}</pre> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
      {list.paginate.lastPage > 1 ? <DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="registros" onPageChange={(p) => void list.goTo(p)} /> : null}
    </div>
  );
}
