"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { PageState } from "@/components/ui/page-state";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";
import {
  MODULE_LABEL,
  WorkspaceStageBadge,
  WorkspaceStatusBadge,
  stageInfo,
} from "./_components/workspace-labels";

type StageFilter = "" | "SEM_WORKSPACE" | "EM_ANDAMENTO" | "CONCLUIDO" | "BLOQUEADO";

/**
 * Uma linha do funil. `kind: "lead"` é uma conta que entrou no painel e ainda
 * não criou workspace: não há workspace para abrir, então a linha leva ao
 * usuário (`owner`).
 */
interface WorkspaceRow {
  kind: "workspace" | "lead";
  id: number | null;
  nome: string | null;
  slug: string | null;
  tipo: "PF" | "PJ" | null;
  status: string | null;
  etapa: string;
  createdAt: string;
  owner: { id: number; nome: string | null; sobrenome: string | null; email: string } | null;
  modules: string[];
  membersCount: number;
  eventsCount: number;
}

interface GetWorkspacesResponse {
  data: WorkspaceRow[];
  paginate: Paginate;
}

const filters: { label: string; value: StageFilter }[] = [
  { label: "Todos", value: "" },
  { label: "Sem workspace", value: "SEM_WORKSPACE" },
  { label: "Em andamento", value: "EM_ANDAMENTO" },
  { label: "Concluídos", value: "CONCLUIDO" },
  { label: "Bloqueados", value: "BLOQUEADO" },
];

export default function WorkspacesPage() {
  const [search, setSearch] = useState("");
  const [etapa, setEtapa] = useState<StageFilter>("");
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginate, setPaginate] = useState<Paginate>({ currentPage: 1, totalPages: 1 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<GetWorkspacesResponse>("/admin/workspaces", {
        params: {
          page,
          etapa: etapa || null,
          search: search.trim() !== "" ? search.trim() : null,
        },
      });
      setRows(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setRows([]);
      setPaginate(toPaginate(null));
      setError(getErrorMessage(err, "Não foi possível carregar os workspaces."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void load(1), search ? 500 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [etapa, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Workspaces</h1>

        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, link, documento ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <Button
            key={option.label}
            onClick={() => setEtapa(option.value)}
            variant={etapa === option.value ? "default" : "outline"}
            className={etapa === option.value ? "bg-violet-600 text-white hover:bg-violet-700" : "text-sm"}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Não foi possível carregar os workspaces"
              description={error}
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              actionLabel="Tentar novamente"
              onAction={() => void load()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3">Workspace</TableHead>
                <TableHead className="px-6 py-3">Dono</TableHead>
                <TableHead className="px-6 py-3">Etapa</TableHead>
                <TableHead className="px-6 py-3">Módulos</TableHead>
                <TableHead className="px-6 py-3 text-center">Equipe</TableHead>
                <TableHead className="px-6 py-3 text-center">Eventos</TableHead>
                <TableHead className="px-6 py-3">Criado em</TableHead>
                <TableHead className="px-6 py-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-6 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-6 text-center">
                    {search ? "Nada encontrado para a busca atual." : "Nada encontrado com o filtro selecionado."}
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? rows.map((row) => {
                    const isLead = row.kind === "lead";
                    const ownerName =
                      `${row.owner?.nome ?? ""} ${row.owner?.sobrenome ?? ""}`.trim() || "Sem nome";
                    const href = isLead ? `/admin/usuarios/${row.owner?.id}` : `/admin/workspaces/${row.id}`;
                    const blocked = !isLead && row.status !== "ACTIVE";

                    return (
                      <TableRow
                        key={`${row.kind}-${isLead ? row.owner?.id : row.id}`}
                        className="border-b transition hover:bg-muted/40"
                      >
                        <TableCell className="px-6 py-3">
                          {isLead ? (
                            <span className="text-sm text-muted-foreground">Ainda não criou o workspace</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium">{row.nome}</span>
                              <span className="text-xs text-muted-foreground">
                                #{row.id} · {row.slug ?? "sem link"} · {row.tipo}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          {row.owner ? (
                            <Link
                              href={`/admin/usuarios/${row.owner.id}`}
                              className="flex flex-col hover:text-violet-600"
                            >
                              <span>{ownerName}</span>
                              <span className="text-xs text-muted-foreground">{row.owner.email}</span>
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex flex-wrap gap-1">
                              <WorkspaceStageBadge etapa={row.etapa} />
                              {blocked && row.status ? <WorkspaceStatusBadge status={row.status} /> : null}
                            </div>
                            {row.etapa !== "CONCLUIDO" ? (
                              <span className="text-xs text-muted-foreground">{stageInfo(row.etapa).detail}</span>
                            ) : null}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.modules.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              row.modules.map((m) => (
                                <Badge
                                  key={m}
                                  className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700"
                                >
                                  {MODULE_LABEL[m] ?? m}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-3 text-center">{isLead ? "—" : row.membersCount}</TableCell>
                        <TableCell className="px-6 py-3 text-center">{isLead ? "—" : row.eventsCount}</TableCell>
                        <TableCell className="px-6 py-3">
                          {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>

                        <TableCell className="px-6 py-3 text-right">
                          <Link
                            href={href}
                            aria-label={isLead ? `Ver a conta de ${ownerName}` : `Ver detalhes de ${row.nome}`}
                          >
                            <Button size="icon">
                              <Eye className="h-4 w-4 text-white" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                : null}
            </TableBody>
          </Table>
        )}

        {!loading && !error && paginate.totalPages > 1 ? (
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
        ) : null}
      </div>
    </div>
  );
}
