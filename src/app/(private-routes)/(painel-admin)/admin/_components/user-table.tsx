"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye } from "lucide-react";
import { formatarCPF } from "@/lib/formatarCPF";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageState } from "@/components/ui/page-state";
import { cn } from "@/lib/utils";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";

type Role = "COMUM" | "PRODUTOR";
type Genero = "MASCULINO" | "FEMININO" | "OUTRO";

interface User {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  genero: Genero;
  role: Role;
  ativo: boolean;
  bloqueado?: boolean;
}

interface GetUsersResponse {
  data: User[];
  paginate: Paginate;
}

interface Props {
  search: string;
  filter: 0 | 2 | 3;
}

export function UserTable({ search, filter }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function getUsers(page = 1) {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<GetUsersResponse>("/admin/usuarios", {
        params: {
          page,
          type: filter !== 0 ? filter : null,
          nameOrEmail: search.trim() !== "" ? search.trim() : null,
        },
      });

      setUsers(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setUsers([]);
      setPaginate(toPaginate(null));
      setError(getErrorMessage(err, "Nao foi possivel carregar os usuarios."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(
      () => {
        void getUsers(1);
      },
      search ? 500 : 0
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filter, search]);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {error ? (
        <div className="p-6">
          <PageState
            title="Nao foi possivel carregar os usuarios"
            description={error}
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
            actionLabel="Tentar novamente"
            onAction={() => void getUsers()}
          />
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-6 py-3">Nome / Email</TableHead>
              <TableHead className="px-6 py-3 text-center">CPF</TableHead>
              <TableHead className="px-6 py-3 text-center">
                Nascimento
              </TableHead>
              <TableHead className="px-6 py-3 text-center">Genero</TableHead>
              <TableHead className="px-6 py-3">Tipo</TableHead>
              <TableHead className="px-6 py-3">Status</TableHead>
              <TableHead className="px-6 py-3 text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-6 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-6 text-center">
                  {search
                    ? "Nenhum usuario encontrado para a busca atual."
                    : "Nenhum usuario encontrado com o filtro selecionado."}
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b transition hover:bg-muted/40"
                  >
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user.nome} {user.sobrenome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-3 text-center">
                      {formatarCPF(user.cpf)}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center">
                      {new Date(user.dataNascimento).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="px-6 py-3 text-center capitalize">
                      {user.genero.toLowerCase()}
                    </TableCell>

                    <TableCell className="px-6 py-3">
                      <Badge
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          user.role === "PRODUTOR"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {user.role === "PRODUTOR"
                          ? "Produtor"
                          : "Usuario comum"}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-xs",
                            user.ativo
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {user.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {user.bloqueado ? (
                          <Badge className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                            Bloqueado
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-3 text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/admin/usuarios/${user.id}`}>
                              <Button size="icon">
                                <Eye className="h-4 w-4 text-white" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalhes</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                onClick={() => void getUsers(paginate.currentPage - 1)}
                className={
                  paginate.currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
              <span className="text-sm font-medium">
                Pagina {paginate.currentPage} de {paginate.totalPages}
              </span>
              <PaginationNext
                onClick={() => void getUsers(paginate.currentPage + 1)}
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
  );
}
