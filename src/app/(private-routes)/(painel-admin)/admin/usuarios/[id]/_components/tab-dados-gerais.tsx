"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Cookies from "js-cookie";
import {
  Ban,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  User,
  Mail,
  Phone,
  CreditCard,
  CalendarDays,
  Shield,
  Ticket,
  ShoppingCart,
  Trash2,
  X,
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

function formatDateInput(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const ROLE_LABELS: Record<string, string> = {
  COMUM: "Usuário",
  PRODUTOR: "Produtor",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super Admin",
  SUPPORT: "Suporte",
};

export default function TabDadosGerais({ user, onRefresh }: TabDadosGeraisProps) {
  const router = useRouter();
  const role = getUserRole();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSupport = role === "SUPPORT";

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: user.nome ?? "",
    sobrenome: user.sobrenome ?? "",
    email: user.email ?? "",
    cpf: user.cpf ?? "",
    telefone: user.telefone ?? "",
    dataNascimento: formatDateInput(user.dataNascimento),
  });

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  function startEdit() {
    setForm({
      nome: user.nome ?? "",
      sobrenome: user.sobrenome ?? "",
      email: user.email ?? "",
      cpf: user.cpf ?? "",
      telefone: user.telefone ?? "",
      dataNascimento: formatDateInput(user.dataNascimento),
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = {};
      if (form.nome !== (user.nome ?? "")) payload.nome = form.nome;
      if (form.sobrenome !== (user.sobrenome ?? "")) payload.sobrenome = form.sobrenome;
      if (form.email !== (user.email ?? "")) payload.email = form.email;
      if (form.cpf !== (user.cpf ?? "")) payload.cpf = form.cpf;
      if (form.telefone !== (user.telefone ?? "")) payload.telefone = form.telefone;

      const origDate = formatDateInput(user.dataNascimento);
      if (form.dataNascimento !== origDate) {
        payload.dataNascimento = form.dataNascimento || null;
      }

      if (Object.keys(payload).length === 0) {
        toast.error("Nenhuma alteração detectada.");
        return;
      }

      await api.put(`/admin/usuarios/${user.id}`, payload);
      toast.success("Dados atualizados com sucesso!");
      setEditing(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    setBlockLoading(true);
    try {
      const payload: any = { bloqueado: !user.bloqueado };
      if (!user.bloqueado && blockReason.trim()) payload.motivo = blockReason.trim();
      await api.patch(`/admin/usuarios/${user.id}/bloqueio`, payload);
      toast.success(user.bloqueado ? "Usuário desbloqueado" : "Usuário bloqueado");
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
      toast.success("Sessões invalidadas com sucesso");
      setSessionOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível invalidar as sessões."));
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleDeleteCompletely() {
    if (deleteConfirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/usuarios/${user.id}/completo`);
      toast.success("Conta excluída completamente.");
      router.push("/admin/usuarios");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir esta conta."));
    } finally {
      setDeleteLoading(false);
    }
  }

  const editableFields = [
    { key: "nome", label: "Nome", icon: User, type: "text" },
    { key: "sobrenome", label: "Sobrenome", icon: User, type: "text" },
    { key: "email", label: "Email", icon: Mail, type: "email" },
    { key: "telefone", label: "Telefone", icon: Phone, type: "tel" },
    { key: "cpf", label: "CPF", icon: CreditCard, type: "text" },
    { key: "dataNascimento", label: "Data de nascimento", icon: CalendarDays, type: "date" },
  ];

  const readonlyFields = [
    { label: "Data de cadastro", value: formatDateBR(user.createdAt), icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      {/* Botão editar (só SUPER_ADMIN) */}
      {isSuperAdmin && !editing && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={startEdit} className="border-violet-600 text-violet-600 hover:bg-violet-50">
            <Pencil className="mr-2 h-4 w-4" />
            Editar dados
          </Button>
        </div>
      )}

      {editing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 text-white hover:bg-violet-700">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}

      {/* Grid de dados */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {editableFields.map((field) => (
          <div key={field.key} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <field.icon className="h-3.5 w-3.5" />
              {field.label}
            </p>
            {editing ? (
              <Input
                type={field.type}
                value={(form as any)[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                className="h-9 text-sm"
              />
            ) : (
              <p className="text-sm font-medium break-all">
                {field.key === "dataNascimento"
                  ? formatDateBR(user.dataNascimento)
                  : (user[field.key] ?? "—")}
              </p>
            )}
          </div>
        ))}

        {readonlyFields.map((field) => (
          <div key={field.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <field.icon className="h-3.5 w-3.5" />
              {field.label}
            </p>
            <p className="text-sm font-medium">{field.value}</p>
          </div>
        ))}

        {/* Tipo da conta */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            Tipo da conta
          </p>
          <Badge className="mt-0.5 rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
            {ROLE_LABELS[user.role] ?? user.role ?? "—"}
          </Badge>
        </div>

        {/* Status */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1.5 text-xs text-muted-foreground">Status</p>
          <Badge
            className={`mt-0.5 rounded-full px-3 py-1 text-xs ${
              user.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {user.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Nível produtor */}
        {user.nivelProdutor != null && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="mb-1.5 text-xs text-muted-foreground">Nível produtor</p>
            <p className="text-sm font-medium">N{user.nivelProdutor}</p>
          </div>
        )}

        {/* Qtd ingressos */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ticket className="h-3.5 w-3.5" />
            Qtd ingressos
          </p>
          <p className="text-sm font-medium">{user.qtdIngressos ?? 0}</p>
        </div>

        {/* Qtd compras */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
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
            onClick={() => { setBlockReason(""); setBlockOpen(true); }}
            className={user.bloqueado
              ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              : "border-red-600 text-red-600 hover:bg-red-50"
            }
          >
            {user.bloqueado ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
            {user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}
          </Button>

          <Button
            variant="outline"
            onClick={() => setSessionOpen(true)}
            className="border-violet-600 text-violet-600 hover:bg-violet-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Invalidar sessões
          </Button>

          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => { setDeleteConfirmEmail(""); setDeleteOpen(true); }}
              className="border-red-700 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir conta
            </Button>
          )}
        </div>
      )}

      {/* Dialog bloqueio */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}</DialogTitle>
            <DialogDescription>
              {user.bloqueado
                ? "O usuário poderá acessar a plataforma novamente."
                : "O usuário será impedido de fazer login imediatamente."}
            </DialogDescription>
          </DialogHeader>
          {!user.bloqueado && (
            <div className="py-2">
              <label className="mb-1.5 block text-sm font-medium">Motivo (opcional)</label>
              <Input placeholder="Informe o motivo..." value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => void handleToggleBlock()}
              disabled={blockLoading}
              className={user.bloqueado ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"}
            >
              {blockLoading ? "Processando..." : user.bloqueado ? "Confirmar desbloqueio" : "Confirmar bloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog invalidar sessões */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalidar todas as sessões</DialogTitle>
            <DialogDescription>
              Todas as sessões ativas serão encerradas. O usuário precisará fazer login novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionOpen(false)}>Cancelar</Button>
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

      {/* Dialog excluir conta completamente */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Excluir conta permanentemente</DialogTitle>
            <DialogDescription>
              Isso apaga e-mail, telefone, nome, organização própria e tudo mais vinculado a esta conta — ação
              irreversível. Contas com pedidos, ingressos ou transferências reais são recusadas automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1.5 block text-sm font-medium">
              Digite <span className="font-semibold">{user.email}</span> para confirmar
            </label>
            <Input
              placeholder="E-mail da conta..."
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => void handleDeleteCompletely()}
              disabled={deleteLoading || deleteConfirmEmail.trim().toLowerCase() !== (user.email ?? "").toLowerCase()}
              className="bg-red-700 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteLoading ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
