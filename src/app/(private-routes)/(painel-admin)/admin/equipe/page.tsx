"use client";

import { useEffect, useState } from "react";
import { AlertCircle, KeyRound, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageState } from "@/components/ui/page-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

type StaffRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT";

interface StaffMember {
  id: number;
  nome: string;
  sobrenome: string | null;
  email: string;
  role: StaffRole;
  roleId: number;
  bloqueado: boolean;
  isRoot: boolean;
  createdAt: string;
}

interface StaffResponse {
  canManage: boolean;
  rootEmail: string;
  data: StaffMember[];
}

// Os ids são os do backend (UserRole): 4 super admin, 1 admin, 5 suporte.
const ROLES: { id: number; label: string; detail: string }[] = [
  { id: 4, label: "Super admin", detail: "Acesso total: exclui contas e workspaces, altera taxas e edita usuários." },
  { id: 1, label: "Admin", detail: "Consulta tudo e bloqueia contas, ingressos e workspaces." },
  { id: 5, label: "Suporte", detail: "Só consulta." },
];

const ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  SUPPORT: "Suporte",
};

const PASSWORD_HINT = "Mínimo de 8 caracteres, com letra, número e símbolo.";
const selectClass =
  "h-10 w-full rounded-md border border-input bg-white px-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

const emptyForm = { nome: "", sobrenome: "", email: "", senha: "", role: 4 };

export default function EquipePage() {
  const [staff, setStaff] = useState<StaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [passwordTarget, setPasswordTarget] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StaffResponse>("/admin/equipe");
      setStaff(data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar a equipe."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function run(action: () => Promise<unknown>, success: string, fallback: string) {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      await load();
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, fallback));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    const ok = await run(
      () =>
        api.post("/admin/equipe", {
          nome: form.nome.trim(),
          sobrenome: form.sobrenome.trim() || undefined,
          email: form.email.trim(),
          senha: form.senha,
          role: form.role,
        }),
      "Conta criada.",
      "Não foi possível criar a conta.",
    );
    if (ok) {
      setCreateOpen(false);
      setForm(emptyForm);
    }
  }

  async function handleRole(member: StaffMember, role: number) {
    if (role === member.roleId) return;
    await run(
      () => api.patch(`/admin/equipe/${member.id}`, { role }),
      "Papel alterado. A pessoa precisa entrar de novo.",
      "Não foi possível alterar o papel.",
    );
  }

  async function handlePassword() {
    if (!passwordTarget) return;
    const ok = await run(
      () => api.patch(`/admin/equipe/${passwordTarget.id}`, { senha: newPassword }),
      "Senha redefinida.",
      "Não foi possível redefinir a senha.",
    );
    if (ok) {
      setPasswordTarget(null);
      setNewPassword("");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    const ok = await run(
      () => api.delete(`/admin/equipe/${removeTarget.id}`),
      "Acesso removido.",
      "Não foi possível remover o acesso.",
    );
    if (ok) setRemoveTarget(null);
  }

  const canManage = staff?.canManage ?? false;
  const formValid = form.nome.trim() !== "" && form.email.trim() !== "" && form.senha.length >= 8;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Equipe</h1>
          <p className="text-sm text-muted-foreground">Contas com acesso a este painel.</p>
        </div>

        {canManage ? (
          <Button onClick={() => setCreateOpen(true)} className="bg-violet-600 text-white hover:bg-violet-700">
            <Plus className="h-4 w-4" />
            Nova conta
          </Button>
        ) : null}
      </div>

      {staff && !canManage ? (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Só a conta {staff.rootEmail} cria, altera ou remove contas da equipe.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Não foi possível carregar a equipe"
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
                <TableHead className="px-6 py-3">Pessoa</TableHead>
                <TableHead className="px-6 py-3">Papel</TableHead>
                <TableHead className="px-6 py-3">Desde</TableHead>
                {canManage ? <TableHead className="px-6 py-3 text-right">Ações</TableHead> : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && !staff ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-6 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : null}

              {staff?.data.map((member) => {
                const name = `${member.nome} ${member.sobrenome ?? ""}`.trim();
                const editable = canManage && !member.isRoot;

                return (
                  <TableRow key={member.id} className="border-b transition hover:bg-muted/40">
                    <TableCell className="px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {name}
                          {member.isRoot ? (
                            <Badge className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                              Conta principal
                            </Badge>
                          ) : null}
                          {member.bloqueado ? (
                            <Badge className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                              Bloqueada
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-3">
                      {editable ? (
                        <select
                          aria-label={`Papel de ${name}`}
                          className={`${selectClass} max-w-[180px]`}
                          value={member.roleId}
                          disabled={saving}
                          onChange={(e) => void handleRole(member, Number(e.target.value))}
                        >
                          {ROLES.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ROLE_LABEL[member.role]
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-3">
                      {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>

                    {canManage ? (
                      <TableCell className="px-6 py-3 text-right">
                        {editable ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label={`Redefinir a senha de ${name}`}
                              onClick={() => setPasswordTarget(member)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              aria-label={`Remover o acesso de ${name}`}
                              onClick={() => setRemoveTarget(member)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Nova conta */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta da equipe</DialogTitle>
            <DialogDescription>
              Use um e-mail só para este painel. A conta entra por /admin/login e não serve para comprar nem para o
              dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <Input
                placeholder="Sobrenome"
                value={form.sobrenome}
                onChange={(e) => setForm({ ...form, sobrenome: e.target.value })}
              />
            </div>
            <Input
              type="email"
              placeholder="E-mail"
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div>
              <Input
                type="text"
                placeholder="Senha provisória"
                autoComplete="off"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
            </div>
            <div>
              <select
                aria-label="Papel"
                className={selectClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {ROLES.find((role) => role.id === form.role)?.detail}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={saving || !formValid}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {saving ? "Criando..." : "Criar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redefinir senha */}
      <Dialog
        open={passwordTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordTarget(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              {passwordTarget?.email} sai de todas as sessões e passa a entrar com a senha nova.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Input
              type="text"
              placeholder="Nova senha"
              autoComplete="off"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">{PASSWORD_HINT}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handlePassword()}
              disabled={saving || newPassword.length < 8}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {saving ? "Salvando..." : "Redefinir senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remover acesso */}
      <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Remover acesso</DialogTitle>
            <DialogDescription>
              {removeTarget?.email} perde o acesso ao painel agora. A conta fica bloqueada e passa a aparecer em
              Usuários, onde pode ser excluída.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleRemove()}
              disabled={saving}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {saving ? "Removendo..." : "Remover acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
