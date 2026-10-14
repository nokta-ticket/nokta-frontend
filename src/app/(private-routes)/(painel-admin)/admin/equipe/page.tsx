"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Icon } from "@/components/ui/icon";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { RefreshButton } from "../_components/refresh-button";
import { STAFF_ROLE_META, metaOf } from "../_lib/status-meta";
import { formatDate, fullName } from "../_lib/format";

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

const PASSWORD_HINT = "Mínimo de 8 caracteres, com letra, número e símbolo.";
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

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    const ok = await run(() => api.post("/admin/equipe", { nome: form.nome.trim(), sobrenome: form.sobrenome.trim() || undefined, email: form.email.trim(), senha: form.senha, role: form.role }), "Conta criada", "Não foi possível criar a conta.");
    if (ok) {
      setCreateOpen(false);
      setForm(emptyForm);
    }
  }

  async function handleRole(member: StaffMember, role: number) {
    if (role === member.roleId) return;
    await run(() => api.patch(`/admin/equipe/${member.id}`, { role }), "Papel alterado. A pessoa precisa entrar de novo.", "Não foi possível alterar o papel.");
  }

  async function handlePassword() {
    if (!passwordTarget) return;
    const ok = await run(() => api.patch(`/admin/equipe/${passwordTarget.id}`, { senha: newPassword }), "Senha redefinida", "Não foi possível redefinir a senha.");
    if (ok) {
      setPasswordTarget(null);
      setNewPassword("");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    await run(() => api.delete(`/admin/equipe/${removeTarget.id}`), "Acesso removido", "Não foi possível remover o acesso.");
  }

  const canManage = staff?.canManage ?? false;
  const members = staff?.data ?? [];
  const formValid = form.nome.trim() !== "" && form.email.trim() !== "" && form.senha.length >= 8;

  const roleCell = (member: StaffMember) => {
    const editable = canManage && !member.isRoot;
    const meta = metaOf(STAFF_ROLE_META, member.role);
    if (!editable) return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
    return (
      <NativeSelect aria-label={`Papel de ${fullName(member.nome, member.sobrenome)}`} className="max-w-[180px]" value={member.roleId} disabled={saving} onChange={(e) => void handleRole(member, Number(e.target.value))}>
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </NativeSelect>
    );
  };

  const rowActions = (member: StaffMember) =>
    canManage && !member.isRoot ? (
      <>
        <Button variant="subtle" size="icon-sm" aria-label={`Redefinir a senha de ${member.nome}`} title="Redefinir senha" onClick={() => setPasswordTarget(member)}>
          <Icon name="key" size={14} />
        </Button>
        <Button variant="subtle" size="icon-sm" aria-label={`Remover o acesso de ${member.nome}`} title="Remover acesso" className="hover:bg-danger-bg hover:text-danger" onClick={() => setRemoveTarget(member)}>
          <Icon name="trash" size={14} />
        </Button>
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Contas com acesso a este painel."
        actions={
          canManage ? (
            <Button leftIcon="user-plus" onClick={() => setCreateOpen(true)}>
              Nova conta
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pessoas na equipe" icon="user-shield" value={staff ? members.length : null} />
        <StatCard label="Super admins" icon="crown" value={staff ? members.filter((m) => m.role === "SUPER_ADMIN").length : null} />
        <StatCard label="Acessos bloqueados" icon="ban" value={staff ? members.filter((m) => m.bloqueado).length : null} />
      </div>

      {staff && !canManage ? (
        <Callout tone="info" title="Só a conta principal gerencia a equipe">
          {staff.rootEmail} é quem cria, altera ou remove contas da equipe.
        </Callout>
      ) : null}

      <DataTableToolbar>
        <p className="text-caption text-muted-foreground">Papéis: super admin age em tudo, admin bloqueia e consulta, suporte só consulta.</p>
        <RefreshButton onClick={() => void load()} pending={loading} className="ml-auto" />
      </DataTableToolbar>

      {error ? (
        <ErrorState title="Não deu pra carregar a equipe" description={error} onRetry={() => void load()} />
      ) : !staff ? (
        <RowsSkeleton rows={4} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Pessoa</DataTableHeadCell>
                  <DataTableHeadCell>Papel</DataTableHeadCell>
                  <DataTableHeadCell>Desde</DataTableHeadCell>
                  {canManage ? (
                    <DataTableHeadCell align="right">
                      <span className="sr-only">Ações</span>
                    </DataTableHeadCell>
                  ) : null}
                </tr>
              </DataTableHead>
              <DataTableBody>
                {members.length === 0 ? (
                  <DataTableEmpty colSpan={canManage ? 4 : 3} icon="user-shield" title="Ninguém na equipe ainda" />
                ) : (
                  members.map((member, i) => (
                    <DataTableRow key={member.id} index={i}>
                      <DataTableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{fullName(member.nome, member.sobrenome)}</span>
                          {member.isRoot ? <StatusBadge tone="brand" dot={false}>Conta principal</StatusBadge> : null}
                          {member.bloqueado ? <StatusBadge tone="danger">Bloqueada</StatusBadge> : null}
                        </div>
                        <p className="text-caption text-muted-foreground">{member.email}</p>
                      </DataTableCell>
                      <DataTableCell>{roleCell(member)}</DataTableCell>
                      <DataTableCell className="tnum text-muted-foreground">{formatDate(member.createdAt)}</DataTableCell>
                      {canManage ? (
                        <DataTableCell align="right">
                          <div className="flex justify-end gap-1">{rowActions(member)}</div>
                        </DataTableCell>
                      ) : null}
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            members.length === 0 ? (
              <EmptyState compact icon="user-shield" title="Ninguém na equipe ainda" />
            ) : (
              <MobileCardList>
                {members.map((member, i) => (
                  <MobileCard
                    key={member.id}
                    index={i}
                    title={fullName(member.nome, member.sobrenome)}
                    subtitle={member.email}
                    badge={member.bloqueado ? <StatusBadge tone="danger">Bloqueada</StatusBadge> : member.isRoot ? <StatusBadge tone="brand" dot={false}>Principal</StatusBadge> : undefined}
                    meta={[{ label: "Desde", value: formatDate(member.createdAt), num: true }]}
                    actions={
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">{roleCell(member)}</div>
                        <div className="flex shrink-0 gap-1">{rowActions(member)}</div>
                      </div>
                    }
                  />
                ))}
              </MobileCardList>
            )
          }
        />
      )}

      {/* Nova conta */}
      <Dialog open={createOpen} onOpenChange={(o) => (!saving ? setCreateOpen(o) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta da equipe</DialogTitle>
            <DialogDescription>Use um e-mail só pra este painel. A conta entra por /admin/login e não serve pra comprar nem pro dashboard.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FieldGroup columns={2}>
              <Field label="Nome" htmlFor="eq-nome" required>
                <Input id="eq-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </Field>
              <Field label="Sobrenome" htmlFor="eq-sobrenome" optional>
                <Input id="eq-sobrenome" value={form.sobrenome} onChange={(e) => setForm({ ...form, sobrenome: e.target.value })} />
              </Field>
            </FieldGroup>
            <Field label="E-mail" htmlFor="eq-email" required>
              <Input id="eq-email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Senha provisória" htmlFor="eq-senha" required hint={PASSWORD_HINT}>
              <Input id="eq-senha" type="text" autoComplete="off" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
            </Field>
            <Field label="Papel" htmlFor="eq-role" hint={ROLES.find((r) => r.id === form.role)?.detail}>
              <NativeSelect id="eq-role" value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!formValid} loading={saving}>
              Criar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redefinir senha */}
      <Dialog
        open={passwordTarget !== null}
        onOpenChange={(open) => {
          if (saving) return;
          if (!open) {
            setPasswordTarget(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>{passwordTarget?.email} sai de todas as sessões e passa a entrar com a senha nova.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Nova senha" htmlFor="eq-nova-senha" hint={PASSWORD_HINT}>
              <Input id="eq-nova-senha" type="text" autoComplete="off" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handlePassword()} disabled={newPassword.length < 8} loading={saving} leftIcon="key">
              Redefinir senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={removeTarget !== null} onOpenChange={(o) => (!o ? setRemoveTarget(null) : null)} title="Remover acesso" description={`${removeTarget?.email ?? "A conta"} perde o acesso ao painel agora. A conta fica bloqueada e passa a aparecer em Usuários, onde pode ser excluída.`} confirmLabel="Remover acesso" danger icon="trash" onConfirm={handleRemove} />
    </div>
  );
}
