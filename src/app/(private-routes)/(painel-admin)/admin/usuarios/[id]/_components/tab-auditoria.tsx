"use client";

import { useEffect, useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface AuditItem {
  id: number;
  action: string;
  metadata: Record<string, unknown> | null;
  admin: { id: number; nome?: string; email?: string } | null;
  createdAt: string;
}

interface GetAuditResponse {
  data: AuditItem[];
  paginate: Paginate;
}

const ACTION_LABELS: Record<string, string> = {
  USER_BLOQUEADO: "Conta bloqueada",
  USER_DESBLOQUEADO: "Conta desbloqueada",
  USER_ATIVADO: "Conta ativada",
  USER_DESATIVADO: "Conta desativada",
  USER_EXCLUIDO: "Conta excluída",
  SESSOES_INVALIDADAS: "Sessões invalidadas",
  INGRESSO_TRANSFERIDO: "Ingresso transferido",
};

const ACTION_COLORS: Record<string, string> = {
  USER_BLOQUEADO: "bg-red-500",
  USER_DESBLOQUEADO: "bg-green-500",
  USER_ATIVADO: "bg-green-500",
  USER_DESATIVADO: "bg-yellow-500",
  USER_EXCLUIDO: "bg-red-700",
  SESSOES_INVALIDADAS: "bg-violet-500",
  INGRESSO_TRANSFERIDO: "bg-blue-500",
};

export default function TabAuditoria({ userId }: { userId: number }) {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  async function getAuditoria(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get<GetAuditResponse>(
        `/admin/usuarios/${userId}/auditoria`,
        { params: { page } }
      );
      setItems(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setItems([]);
      setPaginate(toPaginate(null));
      toast.error(
        getErrorMessage(err, "Não foi possível carregar a auditoria.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getAuditoria(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <p className="py-12 text-center text-muted-foreground">Carregando...</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
        <p className="text-muted-foreground">
          Nenhuma ação registrada para este usuário.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {items.map((item) => {
              const label = ACTION_LABELS[item.action] ?? item.action;
              const dotColor =
                ACTION_COLORS[item.action] ?? "bg-gray-400";

              return (
                <div key={item.id} className="relative flex gap-4 pl-0">
                  {/* Dot */}
                  <div className="relative z-10 mt-1 flex-shrink-0">
                    <div
                      className={`h-5 w-5 rounded-full border-2 border-white shadow ${dotColor}`}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 pb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {label}
                    </p>
                    {item.admin && (
                      <p className="text-xs text-muted-foreground">
                        Por: {item.admin.email ?? item.admin.nome ?? "—"}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                    {item.metadata &&
                      Object.keys(item.metadata).length > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          {JSON.stringify(item.metadata)}
                        </p>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {paginate.totalPages > 1 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <Pagination>
            <PaginationContent className="justify-center gap-4">
              <PaginationPrevious
                onClick={() => void getAuditoria(paginate.currentPage - 1)}
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
                onClick={() => void getAuditoria(paginate.currentPage + 1)}
                className={
                  paginate.currentPage === paginate.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
