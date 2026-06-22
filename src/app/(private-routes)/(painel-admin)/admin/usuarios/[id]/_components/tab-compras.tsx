"use client";

import { useEffect, useState } from "react";

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
import { cn } from "@/lib/utils";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface Pedido {
  id: number;
  evento: { id: number; nome: string } | null;
  valor: number;
  status: number;
  createdAt: string;
}

interface GetPedidosResponse {
  data: Pedido[];
  paginate: Paginate;
}

const STATUS_LABEL: Record<number, string> = {
  1: "Pendente",
  2: "Pago",
  3: "Cancelado",
  4: "Falhou",
  5: "Reservado",
};

const STATUS_COLOR: Record<number, string> = {
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-green-100 text-green-700",
  3: "bg-gray-100 text-gray-600",
  4: "bg-red-100 text-red-700",
  5: "bg-blue-100 text-blue-700",
};

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default function TabCompras({ userId }: { userId: number }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  async function getPedidos(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get<GetPedidosResponse>(
        `/admin/usuarios/${userId}/pedidos`,
        { params: { page } }
      );
      setPedidos(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setPedidos([]);
      setPaginate(toPaginate(null));
      toast.error(getErrorMessage(err, "Não foi possível carregar os pedidos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getPedidos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3">Pedido</TableHead>
              <TableHead className="px-4 py-3">Evento</TableHead>
              <TableHead className="px-4 py-3">Valor</TableHead>
              <TableHead className="px-4 py-3">Status</TableHead>
              <TableHead className="px-4 py-3">Data</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && pedidos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  Nenhum pedido encontrado para este usuário.
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? pedidos.map((pedido) => (
                  <TableRow
                    key={pedido.id}
                    className="border-b hover:bg-muted/40"
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs">
                      #{pedido.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {pedido.evento?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium">
                      {formatBRL(pedido.valor)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          STATUS_COLOR[pedido.status] ?? "bg-gray-100 text-gray-600"
                        )}
                      >
                        {STATUS_LABEL[pedido.status] ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>

        {!loading && paginate.totalPages > 1 && (
          <div className="border-t bg-muted/30 p-4">
            <Pagination>
              <PaginationContent className="justify-center gap-4">
                <PaginationPrevious
                  onClick={() => void getPedidos(paginate.currentPage - 1)}
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
                  onClick={() => void getPedidos(paginate.currentPage + 1)}
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
    </div>
  );
}
