"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Ban, Send, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  createdAt: string;
  evento: { id: number; nome: string } | null;
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

const STATUS_COLOR: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-green-100 text-green-700",
  3: "bg-violet-100 text-violet-700",
  4: "bg-blue-100 text-blue-700",
};

function getUserRole(): string | null {
  try {
    const raw = Cookies.get("user");
    if (!raw) return null;
    return JSON.parse(raw).role ?? null;
  } catch {
    return null;
  }
}

export default function TabIngressos({ userId }: { userId: number }) {
  const role = getUserRole();
  const isSupport = role === "SUPPORT";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginate, setPaginate] = useState<Paginate>({
    currentPage: 1,
    totalPages: 1,
  });

  const [transferTarget, setTransferTarget] = useState<Ticket | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  async function getTickets(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get<GetTicketsResponse>(
        `/admin/usuarios/${userId}/ingressos`,
        { params: { page } }
      );
      setTickets(data.data);
      setPaginate(toPaginate(data.paginate));
    } catch (err) {
      setTickets([]);
      setPaginate(toPaginate(null));
      toast.error(getErrorMessage(err, "Não foi possível carregar os ingressos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void getTickets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3">Evento</TableHead>
              <TableHead className="px-4 py-3">Status</TableHead>
              <TableHead className="px-4 py-3">Bloqueio</TableHead>
              <TableHead className="px-4 py-3">Data</TableHead>
              {!isSupport && (
                <TableHead className="px-4 py-3 text-right">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={isSupport ? 4 : 5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  Carregando...
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && tickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isSupport ? 4 : 5}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  Nenhum ingresso encontrado para este usuário.
                </TableCell>
              </TableRow>
            ) : null}

            {!loading
              ? tickets.map((ticket) => (
                  <TableRow key={ticket.id} className="border-b hover:bg-muted/40">
                    <TableCell className="px-4 py-3 text-sm">
                      {ticket.evento?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          STATUS_COLOR[ticket.status] ?? "bg-gray-100 text-gray-700"
                        )}
                      >
                        {STATUS_LABEL[ticket.status] ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
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
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    {!isSupport && (
                      <TableCell className="px-4 py-3">
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
                    )}
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
        )}
      </div>

      {/* Dialog de transferência */}
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
              O ingresso será transferido para a conta do e-mail informado.
              A conta de destino precisa existir, estar ativa e não estar
              bloqueada.
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

          <DialogFooter>
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
