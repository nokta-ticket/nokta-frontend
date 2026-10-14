"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailGrid, DetailItem, NOT_INFORMED } from "@/components/ui/detail-list";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStaffRole } from "../../../_lib/staff-role";
import { USER_ROLE_META, metaOf } from "../../../_lib/status-meta";
import { formatCPF, formatDate, formatDateUTC, formatPhone, toDateInput } from "../../../_lib/format";
import { TypedConfirmDialog } from "../../../_components/typed-confirm-dialog";
import type { AdminUser } from "./types";

type FormState = { nome: string; sobrenome: string; email: string; cpf: string; telefone: string; dataNascimento: string };

function toForm(user: AdminUser): FormState {
  return { nome: user.nome ?? "", sobrenome: user.sobrenome ?? "", email: user.email ?? "", cpf: user.cpf ?? "", telefone: user.telefone ?? "", dataNascimento: toDateInput(user.dataNascimento) };
}

export default function TabDadosGerais({ user, onRefresh }: { user: AdminUser; onRefresh: () => void }) {
  const router = useRouter();
  const { isSuperAdmin, isSupport } = useStaffRole();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(user));

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function startEdit() {
    setForm(toForm(user));
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<Record<keyof FormState, string | null>> = {};
      if (form.nome !== (user.nome ?? "")) payload.nome = form.nome;
      if (form.sobrenome !== (user.sobrenome ?? "")) payload.sobrenome = form.sobrenome;
      if (form.email !== (user.email ?? "")) payload.email = form.email;
      if (form.cpf !== (user.cpf ?? "")) payload.cpf = form.cpf;
      if (form.telefone !== (user.telefone ?? "")) payload.telefone = form.telefone;
      if (form.dataNascimento !== toDateInput(user.dataNascimento)) payload.dataNascimento = form.dataNascimento || null;

      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração pra salvar.");
        return;
      }

      await api.put(`/admin/usuarios/${user.id}`, payload);
      toast.success("Dados salvos");
      setEditing(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    try {
      const payload: { bloqueado: boolean; motivo?: string } = { bloqueado: !user.bloqueado };
      if (!user.bloqueado && blockReason.trim()) payload.motivo = blockReason.trim();
      await api.patch(`/admin/usuarios/${user.id}/bloqueio`, payload);
      toast.success(user.bloqueado ? "Usuário desbloqueado" : "Usuário bloqueado");
      setBlockReason("");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o bloqueio."));
    }
  }

  /**
   * Ativa/desativa a conta (`PATCH /admin/usuarios/:id/status`). Distinto de
   * bloquear: bloqueio é punitivo (com motivo); status é o "a conta terminou
   * o cadastro?" que o login exige — serve pra destravar quem não recebeu o
   * código de confirmação por WhatsApp.
   */
  async function handleToggleStatus() {
    try {
      await api.patch(`/admin/usuarios/${user.id}/status`, { ativo: !user.ativo });
      toast.success(user.ativo ? "Conta desativada" : "Conta ativada");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o status da conta."));
    }
  }

  async function handleInvalidateSessions() {
    try {
      await api.post(`/admin/usuarios/${user.id}/invalidar-sessoes`);
      toast.success("Sessões invalidadas");
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível invalidar as sessões."));
    }
  }

  async function handleDeleteCompletely() {
    try {
      await api.delete(`/admin/usuarios/${user.id}/completo`);
      toast.success("Conta excluída completamente.");
      router.push("/admin/usuarios");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir esta conta."));
    }
  }

  const role = metaOf(USER_ROLE_META, user.role);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dados da conta</CardTitle>
              {isSuperAdmin ? <CardDescription>Só o super admin edita os dados cadastrais.</CardDescription> : null}
            </div>
            {isSuperAdmin && !editing ? (
              <Button variant="outline" size="sm" leftIcon="edit" onClick={startEdit}>
                Editar
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="pt-4">
            {editing ? (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSave();
                }}
              >
                <FieldGroup columns={2}>
                  <Field label="Nome" htmlFor="u-nome">
                    <Input id="u-nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
                  </Field>
                  <Field label="Sobrenome" htmlFor="u-sobrenome">
                    <Input id="u-sobrenome" value={form.sobrenome} onChange={(e) => setForm((f) => ({ ...f, sobrenome: e.target.value }))} />
                  </Field>
                  <Field label="E-mail" htmlFor="u-email">
                    <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </Field>
                  <Field label="Telefone" htmlFor="u-telefone">
                    <Input id="u-telefone" type="tel" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
                  </Field>
                  <Field label="CPF" htmlFor="u-cpf">
                    <Input id="u-cpf" inputMode="numeric" value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} />
                  </Field>
                  <Field label="Data de nascimento" htmlFor="u-nascimento">
                    <Input id="u-nascimento" type="date" value={form.dataNascimento} onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))} />
                  </Field>
                </FieldGroup>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" loading={saving} leftIcon="save">
                    Salvar
                  </Button>
                </div>
              </form>
            ) : (
              <DetailGrid columns={3}>
                <DetailItem label="Nome" icon="user" value={user.nome} />
                <DetailItem label="Sobrenome" icon="user" value={user.sobrenome} />
                <DetailItem label="E-mail" icon="mail" value={user.email} />
                <DetailItem label="Telefone" icon="phone" value={user.telefone ? formatPhone(user.telefone) : null} />
                <DetailItem label="CPF" icon="id-card" mono value={user.cpf ? formatCPF(user.cpf) : null} />
                <DetailItem label="Nascimento" icon="cake" value={user.dataNascimento ? formatDateUTC(user.dataNascimento) : null} />
                <DetailItem label="Cadastro" icon="calendar" value={user.createdAt ? formatDate(user.createdAt) : null} />
                <DetailItem label="Tipo da conta" icon="shield" value={role.label} />
                <DetailItem label="Nível produtor" icon="megaphone" value={user.nivelProdutor != null ? `N${user.nivelProdutor}` : null} />
              </DetailGrid>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <DetailGrid columns={2}>
              <DetailItem label="Ingressos" icon="ticket" value={user.qtdIngressos != null ? user.qtdIngressos.toLocaleString("pt-BR") : NOT_INFORMED} />
              <DetailItem label="Compras" icon="cart" value={user.qtdCompras != null ? user.qtdCompras.toLocaleString("pt-BR") : NOT_INFORMED} />
            </DetailGrid>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {user.bloqueado ? (
          <Callout tone="danger" title="Conta bloqueada">
            {user.bloqueadoMotivo ? `Motivo: ${user.bloqueadoMotivo}` : "Nenhum motivo registrado."}
          </Callout>
        ) : null}

        {!isSupport ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Ações</CardTitle>
                <CardDescription>Tudo fica registrado na auditoria.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-4">
              <Button variant="outline" leftIcon={user.ativo ? "x-circle" : "check-circle"} className="justify-start" onClick={() => setStatusOpen(true)}>
                {user.ativo ? "Desativar conta" : "Ativar conta"}
              </Button>
              <Button variant={user.bloqueado ? "outline" : "destructive-soft"} leftIcon={user.bloqueado ? "lock-open" : "ban"} className="justify-start" onClick={() => setBlockOpen(true)}>
                {user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}
              </Button>
              <Button variant="outline" leftIcon="logout" className="justify-start" onClick={() => setSessionOpen(true)}>
                Invalidar sessões
              </Button>
              {isSuperAdmin ? (
                <Button variant="destructive-soft" leftIcon="trash" className="justify-start" onClick={() => setDeleteOpen(true)}>
                  Excluir conta
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Callout tone="neutral" title="Só consulta">
            Contas de suporte não alteram usuários.
          </Callout>
        )}
      </div>

      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title={user.ativo ? "Desativar conta" : "Ativar conta"}
        description={user.ativo ? "O usuário não vai conseguir entrar até a conta ser ativada de novo." : "A conta volta a permitir login — use quando o cadastro foi feito mas a confirmação por WhatsApp não pôde ser concluída."}
        confirmLabel={user.ativo ? "Desativar" : "Ativar"}
        danger={user.ativo}
        icon={user.ativo ? "x-circle" : "check-circle"}
        onConfirm={handleToggleStatus}
      />

      <ConfirmDialog
        open={blockOpen}
        onOpenChange={(o) => {
          setBlockOpen(o);
          if (!o) setBlockReason("");
        }}
        title={user.bloqueado ? "Desbloquear conta" : "Bloquear conta"}
        description={user.bloqueado ? "O usuário volta a acessar a plataforma." : "O usuário é impedido de entrar imediatamente."}
        confirmLabel={user.bloqueado ? "Desbloquear" : "Bloquear"}
        danger={!user.bloqueado}
        icon={user.bloqueado ? "lock-open" : "ban"}
        onConfirm={handleToggleBlock}
      >
        {!user.bloqueado ? (
          <Field label="Motivo" optional htmlFor="block-reason">
            <Input id="block-reason" placeholder="Ex.: suspeita de fraude" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          </Field>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog open={sessionOpen} onOpenChange={setSessionOpen} title="Invalidar todas as sessões" description="Todas as sessões ativas são encerradas e o usuário precisa entrar de novo." confirmLabel="Invalidar" icon="logout" onConfirm={handleInvalidateSessions} />

      <TypedConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir conta permanentemente"
        description="Apaga a conta, os pedidos e ingressos dela e as organizações das quais é dona, com tudo dentro (eventos, cardápio, comandas, financeiro, equipe). Não tem volta, mas o histórico completo fica guardado em Contas excluídas. A exclusão só é recusada se apagaria ingressos que hoje pertencem a outras contas."
        expected={user.email ?? ""}
        label={
          <>
            Digite <span className="font-semibold">{user.email}</span> pra confirmar
          </>
        }
        placeholder="E-mail da conta"
        onConfirm={handleDeleteCompletely}
      />
    </div>
  );
}
