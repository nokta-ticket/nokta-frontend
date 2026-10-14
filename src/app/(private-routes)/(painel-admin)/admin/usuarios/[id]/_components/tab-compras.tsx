"use client";

import { StatusBadge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/empty-state";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/ui/data-table";
import { formatBRL } from "@/lib/format";
import { useAdminList } from "../../../_hooks/use-admin-list";
import { SimpleTable } from "../../../_components/simple-table";
import { ORDER_STATUS_META, metaOf } from "../../../_lib/status-meta";
import { formatDate } from "../../../_lib/format";

interface Pedido {
  id: number;
  evento: { id: number; nome: string } | null;
  valor: number;
  status: number;
  createdAt: string;
}

export default function TabCompras({ userId }: { userId: number }) {
  const list = useAdminList<Pedido>(`/admin/usuarios/${userId}/pedidos`, {}, { fallbackError: "Não foi possível carregar os pedidos." });

  if (list.error) return <ErrorState title="Não deu pra carregar os pedidos" description={list.error} onRetry={() => void list.reload()} />;
  if (list.rows === null) return <RowsSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      <SimpleTable
        columns={["Pedido", "Evento", { label: "Valor", align: "right", num: true }, "Status", "Data"]}
        empty="Nenhum pedido deste usuário"
        emptyIcon="cart"
        rowKey={(_, i) => list.rows![i].id}
        rows={list.rows.map((p) => {
          const meta = metaOf(ORDER_STATUS_META, p.status);
          return [<span key="id" className="font-mono text-caption">#{p.id}</span>, p.evento?.nome ?? <span className="text-subtle-foreground">Sem evento</span>, <span key="v" className="font-medium">{formatBRL(p.valor)}</span>, <StatusBadge key="s" tone={meta.tone}>{meta.label}</StatusBadge>, <span key="d" className="tnum text-muted-foreground">{formatDate(p.createdAt)}</span>];
        })}
      />
      {list.paginate.lastPage > 1 ? <DataTablePagination page={list.page} lastPage={list.paginate.lastPage} total={list.paginate.total} perPage={list.paginate.perPage} noun="pedidos" onPageChange={(p) => void list.goTo(p)} /> : null}
    </div>
  );
}
