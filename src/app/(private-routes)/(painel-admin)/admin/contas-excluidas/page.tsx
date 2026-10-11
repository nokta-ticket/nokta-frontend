"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Paginate } from "@/interfaces/paginate";
import api, { getErrorMessage } from "@/lib/axios";
import { toPaginate } from "@/lib/pagination";
import { toast } from "@/lib/toast";

interface DeletedAccountRow {
  id: number;
  userId: number;
  email: string;
  nome: string;
  telefone: string | null;
  accountCreatedAt: string | null;
  deletedByEmail: string | null;
  deletedAt: string;
  summary: {
    pedidos?: number;
    ingressos?: number;
    ingressosUtilizados?: number;
    organizacoes?: number;
    eventos?: number;
  };
}

export default function ContasExcluidasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DeletedAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginate, setPaginate] = useState<Paginate>({ currentPage: 1, totalPages: 1 });

  async function load(page = 1, term = search) {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/contas-excluidas", {
        params: { page, search: term.trim() || undefined },
      });
      setRows(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setRows([]);
      setPaginate(toPaginate(null));
      toast.error(getErrorMessage(err, "Não foi possível carregar as contas excluídas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(1, search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contas excluídas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro permanente de cada conta apagada, com tudo o que ela tinha no momento da exclusão.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, e-mail, telefone ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3">Conta</TableHead>
              <TableHead className="px-4 py-3">Telefone</TableHead>
              <TableHead className="px-4 py-3">Pedidos</TableHead>
              <TableHead className="px-4 py-3">Ingressos</TableHead>
              <TableHead className="px-4 py-3">Organizações</TableHead>
              <TableHead className="px-4 py-3">Excluída em</TableHead>
              <TableHead className="px-4 py-3">Excluída por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  {search.trim()
                    ? "Nenhuma conta excluída encontrada para essa busca."
                    : "Nenhuma conta foi excluída desde que este registro começou."}
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-b hover:bg-muted/40"
                    onClick={() => router.push(`/admin/contas-excluidas/${row.id}`)}
                  >
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{row.nome || "Sem nome"}</p>
                      <p className="break-all text-xs text-muted-foreground">{row.email}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{row.telefone ?? "—"}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{row.summary.pedidos ?? 0}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {row.summary.ingressos ?? 0}
                      {row.summary.ingressos ? (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          ({row.summary.ingressosUtilizados ?? 0} utilizados)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{row.summary.organizacoes ?? 0}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(row.deletedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="break-all px-4 py-3 text-xs text-muted-foreground">
                      {row.deletedByEmail ?? "—"}
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
                  onClick={() => void load(paginate.currentPage - 1)}
                  className={paginate.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
                <span className="text-sm font-medium">
                  Página {paginate.currentPage} de {paginate.totalPages}
                </span>
                <PaginationNext
                  onClick={() => void load(paginate.currentPage + 1)}
                  className={paginate.currentPage === paginate.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
