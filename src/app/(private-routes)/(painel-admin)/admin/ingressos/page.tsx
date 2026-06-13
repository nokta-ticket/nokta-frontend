"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Ban, Search, Send, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageState } from "@/components/ui/page-state";
import { cn } from "@/lib/utils";
import { Paginate } from "@/interfaces/paginate";
import { toPaginate } from "@/lib/pagination";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface Ticket {
  id: number;
  code: string;
  status: number;
  bloqueado: boolean;
  bloqueadoMotivo: string | null;
  createdAt: string;
  dono: { id: number; nome: string; sobrenome: string; email: string } | null;
  evento: { id: number; nome: string; data: string } | null;
}

interface GetTicketsResponse {
  data: Ticket[];
  paginate: Paginate;
}

const STATUS_LABEL: Record<number, string> = {
  1: "Não validado",
  2: "Validado",
  3: "Em revenda",
  4: "Transferido",
};

export default function IngressosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  const [transferTarget, setTransferTarget] = useState<Ticket | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function getTickets(page = 1) {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<GetTicketsResponse>("/admin/ingressos", {
        params: {
          page,
          search: search.trim() !== "" ? search.trim() : null,
        },
      });

      setTickets(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setTickets([]);
      setPaginate(toPaginate(null));
      setError(getErrorMessage(err, "Não foi possível carregar os ingressos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void getTickets(1), search ? 500 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleBlock(ticket: Ticket) {
    try {
      await api.patch(`/admin/ingressos/${ticket.id}/bloqueio`, {
        bloqueado: !ticket.bloqueado,
      });
      toast.success(
        ticket.bloqueado
          ? "Ingresso desbloqueado com sucesso"
          : "Ingresso bloqueado com sucesso"
      );
      void getTickets(paginate.currentPage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o ingresso."));
    }
  }

  async function confirmTransfer() {
    if (!transferTarget) return;
    if (!transferEmail.trim()) {
      toast.error("Informe o e-mail de destino.");
      return;
    }

    setTransferLoading(true);
    try {
      await api.post(`/admin/ingressos/${transferTarget.id}/transferir`, {
        toEmail: transferEmail.trim(),
      });
      toast.success("Ingresso transferido com sucesso");
      setTransferTarget(null);
      setTransferEmail("");
      void getTickets(paginate.currentPage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível transferir o ingresso."));
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Ingressos da Plataforma</h1>

        <div className="relative w-full sm:w-96">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Buscar por código, e-mail do dono ou evento"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Não foi possível carregar os ingressos"
              description={error}
              icon={<AlertCircle className="h-8 w-8 text-red-500" />}
              actionLabel="Tentar novamente"
              onAction={() => void getTickets()}
            />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3">Código</TableHead>
                <TableHead className="px-6 py-3">Evento</TableHead>
                <TableHead className="px-6 py-3">Dono</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                <TableHead className="px-6 py-3">Bloqueio</TableHead>
                <TableHead className="px-6 py-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-6 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-6 text-center">
                    {search
                      ? "Nenhum ingresso encontrado para a busca atual."
                      : "Nenhum ingresso encontrado."}
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="border-b transition hover:bg-muted/40"
                    >
                      <TableCell className="px-6 py-3 font-mono text-xs">
                        {ticket.code}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {ticket.evento?.nome ?? "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {ticket.dono
                              ? `${ticket.dono.nome} ${ticket.dono.sobrenome ?? ""}`
                              : "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ticket.dono?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {STATUS_LABEL[ticket.status] ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-xs",
                            ticket.bloqueado
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {ticket.bloqueado ? "Bloqueado" : "Liberado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void toggleBlock(ticket)}
                            className={
                              ticket.bloqueado
                                ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                                : "border-red-600 text-red-600 hover:bg-red-50"
                            }
                          >
                            {ticket.bloqueado ? (
                              <ShieldCheck className="mr-1 h-4 w-4" />
                            ) : (
                              <Ban className="mr-1 h-4 w-4" />
                            )}
                            {ticket.bloqueado ? "Desbloquear" : "Bloquear"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTransferTarget(ticket);
                              setTransferEmail("");
                            }}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            Transferir
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
                  onClick={() => void getTickets(paginate.currentPage - 1)}
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
                  onClick={() => void getTickets(paginate.currentPage + 1)}
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

      <Dialog
        open={transferTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransferTarget(null);
            setTransferEmail("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Ingresso</DialogTitle>
            <DialogDescription>
              O ingresso{" "}
              <span className="font-mono">{transferTarget?.code}</span> será
              transferido para a conta do e-mail informado. A conta de destino
              precisa existir, estar ativa e não estar bloqueada.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              type="email"
              placeholder="E-mail de destino"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTransferTarget(null);
                setTransferEmail("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void confirmTransfer()}
              disabled={transferLoading}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {transferLoading ? "Transferindo..." : "Confirmar transferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
