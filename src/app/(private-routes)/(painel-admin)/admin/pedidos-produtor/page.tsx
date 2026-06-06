"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Search, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { formatarCPF } from "@/lib/formatarCPF";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";
import { Paginate } from "@/interfaces/paginate";
import { toast } from "@/lib/toast";

interface User {
  cpf: string;
  email: string;
  nome: string;
}

interface Pedido {
  id: string;
  user: User;
}

interface GetPedido {
  data: Pedido[];
  paginate: Paginate;
}

const ITEMS_PER_PAGE = 10;

export default function PedidosProdutorPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function getOrders(page = 1) {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<GetPedido>("/admin/solicitacoes", {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          nameOrEmail: search.trim() !== "" ? search.trim() : null,
        },
      });

      setPedidos(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setPedidos([]);
      setPaginate(toPaginate(null));
      setError(
        getErrorMessage(err, "Nao foi possivel carregar as solicitacoes.")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(
      () => {
        void getOrders(1);
      },
      search ? 500 : 0
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  function castActionToStatus(action: "aprovar" | "recusar") {
    switch (action) {
      case "aprovar":
        return 2;
      case "recusar":
        return 3;
      default:
        throw new Error("Status nao identificado.");
    }
  }

  async function act(id: string, action: "aprovar" | "recusar") {
    try {
      const status = castActionToStatus(action);
      await api.put(`/admin/solicitacoes/${id}`, { status });
      toast.success(
        action === "aprovar" ? "Pedido aprovado." : "Pedido recusado."
      );
      await getOrders(paginate.currentPage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao processar pedido."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Pedidos de produtor</h1>

        <div className="relative w-full sm:w-80">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Nao foi possivel carregar as solicitacoes"
              description={error}
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              actionLabel="Tentar novamente"
              onAction={() => void getOrders()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3">Nome</TableHead>
                <TableHead className="px-6 py-3">E-mail</TableHead>
                <TableHead className="px-6 py-3">CPF</TableHead>
                <TableHead className="px-6 py-3 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-6 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-6 text-center">
                    {search
                      ? "Nenhuma solicitacao encontrada para a busca atual."
                      : "Nenhuma solicitacao pendente no momento."}
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? pedidos.map((pedido) => (
                    <TableRow
                      key={pedido.id}
                      className="border-b transition hover:bg-muted/40"
                    >
                      <TableCell className="px-6 py-3 font-medium">
                        {pedido.user.nome}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {pedido.user.email}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {formatarCPF(pedido.user.cpf)}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => void act(pedido.id, "aprovar")}
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => void act(pedido.id, "recusar")}
                          >
                            <XIcon size={16} />
                          </Button>
                        </div>
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
                  onClick={() => void getOrders(paginate.currentPage - 1)}
                  className={
                    paginate.currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
                <div className="text-sm font-medium">
                  Pagina {paginate.currentPage} de {paginate.totalPages}
                </div>
                <PaginationNext
                  onClick={() => void getOrders(paginate.currentPage + 1)}
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
