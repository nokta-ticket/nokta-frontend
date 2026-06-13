"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PageState } from "@/components/ui/page-state";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";

interface AuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  admin: { id: number; nome?: string; email?: string } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface GetAuditResponse {
  data: AuditLog[];
  paginate: Paginate;
}

const ENTITY_LABEL: Record<string, string> = {
  USER: "Usuário",
  USER_TICKET: "Ingresso",
  EVENT: "Evento",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  async function getLogs(page = 1) {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<GetAuditResponse>("/admin/auditoria", {
        params: { page },
      });
      setLogs(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setLogs([]);
      setPaginate(toPaginate(null));
      setError(getErrorMessage(err, "Não foi possível carregar a auditoria."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getLogs(1);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Auditoria de Ações</h1>
      <p className="text-sm text-muted-foreground">
        Registro de todas as ações administrativas realizadas no painel.
      </p>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Não foi possível carregar a auditoria"
              description={error}
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              actionLabel="Tentar novamente"
              onAction={() => void getLogs()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3">Data</TableHead>
                <TableHead className="px-6 py-3">Admin</TableHead>
                <TableHead className="px-6 py-3">Ação</TableHead>
                <TableHead className="px-6 py-3">Alvo</TableHead>
                <TableHead className="px-6 py-3">Detalhes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-6 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-6 text-center">
                    Nenhuma ação registrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? logs.map((log) => (
                    <TableRow key={log.id} className="border-b">
                      <TableCell className="px-6 py-3 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-sm">
                        {log.admin?.email ?? log.admin?.nome ?? "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-sm">
                        {ENTITY_LABEL[log.entityType] ?? log.entityType} #
                        {log.entityId}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-xs text-muted-foreground">
                        {log.metadata && Object.keys(log.metadata).length > 0
                          ? JSON.stringify(log.metadata)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        )}

        {!loading && !error && paginate.totalPages > 1 ? (
          <div className="border-t bg-muted/30 p-4">
            <Pagination>
              <PaginationContent className="justify-center gap-4">
                <PaginationPrevious
                  onClick={() => void getLogs(paginate.currentPage - 1)}
                  className={
                    paginate.currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
                <span className="text-sm font-medium">
                  Página {paginate.currentPage} de {paginate.totalPages}
                </span>
                <PaginationNext
                  onClick={() => void getLogs(paginate.currentPage + 1)}
                  className={
                    paginate.currentPage === paginate.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </div>
    </div>
  );
}
