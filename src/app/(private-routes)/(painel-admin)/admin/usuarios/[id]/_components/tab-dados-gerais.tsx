"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import {
  Ban,
  LogOut,
  ShieldCheck,
  User,
  Mail,
  Phone,
  CreditCard,
  CalendarDays,
  Shield,
  Ticket,
  ShoppingCart,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

interface TabDadosGeraisProps {
  user: any;
  onRefresh: () => void;
}

function getUserRole(): string | null {
  try {
    const raw = Cookies.get("user");
    if (!raw) return null;
    return JSON.parse(raw).role ?? null;
  } catch {
    return null;
  }
}

function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuário",
  PRODUCER: "Produtor",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super Admin",
  SUPPORT: "Suporte",
};

export default function TabDadosGerais({ user, onRefresh }: TabDadosGeraisProps) {
  const role = getUserRole();
  const isSupport = role === "SUPPORT";

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  async function handleToggleBlock() {
    setBlockLoading(true);
    try {
      const payload: any = { bloqueado: !user.bloqueado };
      if (!user.bloqueado && blockReason.trim()) {
        payload.motivo = blockReason.trim();
      }
      await api.patch(`/admin/usuarios/${user.id}/bloqueio`, payload);
      toast.success(
        user.bloqueado
          ? "Usuário desbloqueado com sucesso"
          : "Usuário bloqueado com sucesso"
      );
      setBlockOpen(false);
      setBlockReason("");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o bloqueio."));
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleInvalidateSessions() {
    setSessionLoading(true);
    try {
      await api.post(`/admin/usuarios/${user.id}/invalidar-sessoes`);
      toast.success("Todas as sessões foram invalidadas com sucesso");
      setSessionOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível invalidar as sessões."));
    } finally {
      setSessionLoading(false);
    }
  }

  const fields = [
    {
      label: "Nome completo",
      value: `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() || "—",
      icon: User,
    },
    { label: "Email", value: user.email ?? "—", icon: Mail },
    { label: "Telefone", value: user.telefone ?? "—", icon: Phone },
    { label: "CPF", value: user.cpf ?? "—", icon: CreditCard },
    {
      label: "Data de nascimento",
      value: formatDateBR(user.dataNascimento),
      icon: CalendarDays,
    },
    {
      label: "Data de cadastro",
      value: formatDateBR(user.createdAt),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Grid de dados */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <field.icon className="h-3.5 w-3.5" />
              {field.label}
            </p>
            <p className="text-sm font-medium truncate">{field.value}</p>
          </div>
        ))}

        {/* Tipo da conta */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Tipo da conta
          </p>
          <Badge className="mt-1 rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
            {ROLE_LABELS[user.role] ?? user.role ?? "—"}
          </Badge>
        </div>

        {/* Status */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-muted-foreground">Status</p>
          <Badge
            className={`mt-1 rounded-full px-3 py-1 text-xs ${
              user.ativo
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {user.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Nível produtor */}
        {user.nivelProdutor != null && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">
              Nível produtor
            </p>
            <p className="text-sm font-medium">{user.nivelProdutor}</p>
          </div>
        )}

        {/* Qtd ingressos */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" />
            Qtd ingressos
          </p>
          <p className="text-sm font-medium">{user.qtdIngressos ?? 0}</p>
        </div>

        {/* Qtd compras */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShoppingCart className="h-3.5 w-3.5" />
            Qtd compras
          </p>
          <p className="text-sm font-medium">{user.qtdCompras ?? 0}</p>
        </div>
      </div>

      {/* Motivo do bloqueio */}
      {user.bloqueado && user.bloqueadoMotivo && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Motivo do bloqueio:</strong> {user.bloqueadoMotivo}
        </div>
      )}

      {/* Ações admin */}
      {!isSupport && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              setBlockReason("");
              setBlockOpen(true);
            }}
            className={
              user.bloqueado
                ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                : "border-red-600 text-red-600 hover:bg-red-50"
            }
          >
            {user.bloqueado ? (
              <ShieldCheck className="mr-2 h-4 w-4" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setSessionOpen(true)}
            className="border-violet-600 text-violet-600 hover:bg-violet-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Invalidar todas as sessões
          </Button>
        </div>
      )}

      {/* Dialog de bloqueio */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}
            </DialogTitle>
            <DialogDescription>
              {user.bloqueado
                ? "Deseja desbloquear esta conta? O usuário poderá acessar a plataforma novamente."
                : "Tem certeza que deseja bloquear esta conta? O usuário será impedido de fazer login imediatamente."}
            </DialogDescription>
          </DialogHeader>

          {!user.bloqueado && (
            <div className="py-2">
              <label className="mb-1.5 block text-sm font-medium">
                Motivo do bloqueio (opcional)
              </label>
              <Input
                placeholder="Informe o motivo..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleToggleBlock()}
              disabled={blockLoading}
              className={
                user.bloqueado
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }
            >
              {blockLoading
                ? "Processando..."
                : user.bloqueado
                ? "Confirmar desbloqueio"
                : "Confirmar bloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de invalidação de sessões */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalidar todas as sessões</DialogTitle>
            <DialogDescription>
              Todas as sessões ativas deste usuário serão encerradas
              imediatamente. Ele precisará fazer login novamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleInvalidateSessions()}
              disabled={sessionLoading}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {sessionLoading ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
