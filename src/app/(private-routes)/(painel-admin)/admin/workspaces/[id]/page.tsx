"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { ErrorState } from "@/components/ui/empty-state";
import { Field, FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStaffRole } from "../../_lib/staff-role";
import { MEMBER_ROLE_LABEL, MEMBER_STATUS_META, VERIFICATION_META, metaOf } from "../../_lib/status-meta";
import { formatDate, formatDateTime, formatPhone, fullName } from "../../_lib/format";
import { SimpleTable } from "../../_components/simple-table";
import { TypedConfirmDialog } from "../../_components/typed-confirm-dialog";
import { MODULE_LABEL, WorkspaceStageBadge, WorkspaceStatusBadge } from "../_components/workspace-labels";

interface Workspace {
  id: number;
  nome: string;
  slug: string | null;
  documento: string | null;
  tipo: "PF" | "PJ";
  status: string;
  bloqueado: boolean;
  bloqueadoEm: string | null;
  bloqueadoMotivo: string | null;
  createdAt: string;
  onboardingCompleted: boolean;
  etapa: string;
  owner: { id: number; nome: string | null; sobrenome: string | null; email: string; telefone: string | null } | null;
  modules: { module: string; ativo: boolean }[];
  members: { id: number; userId: number; nome: string; email: string; role: string; status: string }[];
  legalFinancial: { verificationStatus: string; recipientStatus: string | null; recipientBlocked: boolean } | null;
  taxas?: { taxaServicoPercent: number };
  counts: { members: number; events: number; venueLocations: number; venueProducts: number; venueTabs: number; venueReservations: number; activeCapabilities: number };
}

type Tipo = "PF" | "PJ";

export default function WorkspaceDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isSuperAdmin, isSupport } = useStaffRole();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", slug: "", documento: "", tipo: "PF" as Tipo });

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [moduleLoading, setModuleLoading] = useState<string | null>(null);
  const [feeEditing, setFeeEditing] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [feeSaving, setFeeSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const res = await api.get<Workspace>(`/admin/workspaces/${id}`);
      setWorkspace(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o workspace."));
    }
  }, [id]);

  useEffect(() => {
    void fetchWorkspace();
  }, [fetchWorkspace]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader back="/admin/workspaces" title="Workspace" />
        <ErrorState title="Não deu pra carregar o workspace" description={error} onRetry={() => void fetchWorkspace()} />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    );
  }

  const ws = workspace;

  function startEdit() {
    setForm({ nome: ws.nome, slug: ws.slug ?? "", documento: ws.documento ?? "", tipo: ws.tipo });
    setEditing(true);
  }

  async function handleSave() {
    const payload: Record<string, string> = {};
    if (form.nome.trim() !== ws.nome) payload.nome = form.nome.trim();
    if (form.slug.trim() !== (ws.slug ?? "")) payload.slug = form.slug.trim();
    if (form.documento.trim() !== (ws.documento ?? "")) payload.documento = form.documento.trim();
    if (form.tipo !== ws.tipo) payload.tipo = form.tipo;

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhuma alteração pra salvar.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<Workspace>(`/admin/workspaces/${ws.id}`, payload);
      setWorkspace(res.data);
      setEditing(false);
      toast.success("Workspace salvo");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    try {
      const res = await api.patch<Workspace>(`/admin/workspaces/${ws.id}/bloqueio`, { bloqueado: !ws.bloqueado, ...(ws.bloqueado || !blockReason.trim() ? {} : { motivo: blockReason.trim() }) });
      setWorkspace(res.data);
      setBlockReason("");
      toast.success(ws.bloqueado ? "Workspace desbloqueado" : "Workspace bloqueado");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o bloqueio."));
    }
  }

  async function handleToggleModule(module: string, ativo: boolean) {
    setModuleLoading(module);
    try {
      const res = await api.patch<Workspace>(`/admin/workspaces/${ws.id}/modulos`, { module, ativo });
      setWorkspace(res.data);
      toast.success(`${MODULE_LABEL[module] ?? module} ${ativo ? "ativado" : "desativado"}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o módulo."));
    } finally {
      setModuleLoading(null);
    }
  }

  async function handleSaveFee() {
    const percent = Number(feeValue.replace(",", "."));
    if (feeValue.trim() === "" || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      toast.error("Informe uma taxa entre 0 e 100.");
      return;
    }
    setFeeSaving(true);
    try {
      const res = await api.patch<Workspace>(`/admin/workspaces/${ws.id}/taxas`, { taxaServicoPercent: Math.round(percent * 100) / 100 });
      setWorkspace(res.data);
      setFeeEditing(false);
      toast.success("Taxa salva. Vale pras próximas compras.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar a taxa."));
    } finally {
      setFeeSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/admin/workspaces/${ws.id}`);
      toast.success("Workspace excluído.");
      router.push("/admin/workspaces");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o workspace."));
    }
  }

  // A API antiga (antes do deploy) não devolve `taxas`.
  const feePercent = ws.taxas?.taxaServicoPercent ?? 10;
  const ownerName = ws.owner ? fullName(ws.owner.nome, ws.owner.sobrenome) : null;
  const verification = ws.legalFinancial ? metaOf(VERIFICATION_META, ws.legalFinancial.verificationStatus) : VERIFICATION_META.NOT_STARTED;

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin/workspaces"
        title={ws.nome}
        badge={
          <>
            <WorkspaceStatusBadge status={ws.status} />
            <WorkspaceStageBadge etapa={ws.etapa} />
          </>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="hashtag" size={11} />
              {ws.id}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="link" size={11} />
              {ws.slug ? `nokta.live/${ws.slug}` : "sem link público"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={11} />
              Criado em {formatDate(ws.createdAt)}
            </span>
          </>
        }
      />

      {ws.bloqueado ? (
        <Callout tone="danger" title={`Workspace bloqueado${ws.bloqueadoEm ? ` em ${formatDateTime(ws.bloqueadoEm)}` : ""}`}>
          {ws.bloqueadoMotivo ? `Motivo: ${ws.bloqueadoMotivo}. ` : "Nenhum motivo informado. "}A equipe não consegue operar, as páginas públicas (cardápio, avaliação, página do local) saem do ar e os eventos param de vender.
        </Callout>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Dados do workspace</CardTitle>
                {isSuperAdmin ? <CardDescription>Trocar o link quebra QR codes e links do cardápio já impressos.</CardDescription> : null}
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
                    <Field label="Nome" htmlFor="ws-nome">
                      <Input id="ws-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                    </Field>
                    <Field label="Link público" htmlFor="ws-slug" hint="Trocar o link quebra QR codes e links já compartilhados.">
                      <Input id="ws-slug" prefix="nokta.live/" className="[&>input]:pl-24" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                    </Field>
                    <Field label="Documento (CPF ou CNPJ)" htmlFor="ws-doc">
                      <Input id="ws-doc" inputMode="numeric" value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
                    </Field>
                    <Field label="Tipo">
                      <SegmentedControl<Tipo> value={form.tipo} onChange={(tipo) => setForm({ ...form, tipo })} options={[{ value: "PF", label: "Pessoa física" }, { value: "PJ", label: "Pessoa jurídica" }]} fullWidth />
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
                  <DetailItem label="Nome" value={ws.nome} />
                  <DetailItem label="Link público" mono value={ws.slug} />
                  <DetailItem label="Documento" mono value={ws.documento} />
                  <DetailItem label="Tipo" value={ws.tipo === "PF" ? "Pessoa física" : "Pessoa jurídica"} />
                  <DetailItem label="Dono" icon="user">
                    {ws.owner ? (
                      <Link href={`/admin/usuarios/${ws.owner.id}`} className="text-brand underline-offset-4 hover:underline">
                        {ownerName}
                      </Link>
                    ) : (
                      <span className="font-normal text-subtle-foreground">Não informado</span>
                    )}
                  </DetailItem>
                  <DetailItem label="E-mail do dono" icon="mail" value={ws.owner?.email} />
                  <DetailItem label="Telefone do dono" icon="phone" value={ws.owner?.telefone ? formatPhone(ws.owner.telefone) : null} />
                  <DetailItem label="Verificação jurídica" icon="scale">
                    <StatusBadge tone={verification.tone}>{verification.label}</StatusBadge>
                  </DetailItem>
                  <DetailItem label="Recebedor (Pagar.me)" icon="credit-card">
                    {ws.legalFinancial?.recipientBlocked ? <StatusBadge tone="danger">Bloqueado</StatusBadge> : ws.legalFinancial?.recipientStatus ? <StatusBadge tone="success">{ws.legalFinancial.recipientStatus}</StatusBadge> : <span className="font-normal text-subtle-foreground">Não criado</span>}
                  </DetailItem>
                </DetailGrid>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DetailGrid columns={4}>
                <DetailItem label="Eventos" icon="calendar" value={ws.counts.events.toLocaleString("pt-BR")} />
                <DetailItem label="Unidades" icon="store" value={ws.counts.venueLocations.toLocaleString("pt-BR")} />
                <DetailItem label="Produtos" icon="utensils" value={ws.counts.venueProducts.toLocaleString("pt-BR")} />
                <DetailItem label="Comandas" icon="receipt" value={ws.counts.venueTabs.toLocaleString("pt-BR")} />
                <DetailItem label="Reservas" icon="chair" value={ws.counts.venueReservations.toLocaleString("pt-BR")} />
                <DetailItem label="Recursos ativos" icon="bolt" value={ws.counts.activeCapabilities.toLocaleString("pt-BR")} />
                <DetailItem label="Equipe" icon="users" value={ws.counts.members.toLocaleString("pt-BR")} />
              </DetailGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Módulos</CardTitle>
                <CardDescription>Desativar um módulo tira o acesso da equipe a ele, sem apagar nada. Financeiro e Insights estão sempre ativos.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
              {ws.modules.map((m) => (
                <label key={m.module} className="surface-inset flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-foreground">{MODULE_LABEL[m.module] ?? m.module}</span>
                    <span className="block text-caption text-muted-foreground">{m.ativo ? "Ativo" : "Desativado"}</span>
                  </span>
                  <Switch checked={m.ativo} disabled={!isSuperAdmin || moduleLoading !== null} onCheckedChange={(checked) => void handleToggleModule(m.module, checked)} aria-label={`${m.ativo ? "Desativar" : "Ativar"} ${MODULE_LABEL[m.module] ?? m.module}`} />
                </label>
              ))}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="flex items-baseline gap-2 text-base font-semibold text-foreground">
              Equipe <span className="tnum text-sm font-normal text-muted-foreground">{ws.members.length}</span>
            </h2>
            <SimpleTable
              columns={["Pessoa", "Papel", "Status"]}
              empty="Nenhum membro"
              emptyIcon="users"
              rowKey={(_, i) => ws.members[i].id}
              rows={ws.members.map((member) => {
                const status = metaOf(MEMBER_STATUS_META, member.status);
                return [
                  <Link key="p" href={`/admin/usuarios/${member.userId}`} className="block hover:text-brand">
                    <span className="block font-medium">{member.nome || "Sem nome"}</span>
                    <span className="block text-caption text-muted-foreground">{member.email}</span>
                  </Link>,
                  MEMBER_ROLE_LABEL[member.role] ?? member.role,
                  <StatusBadge key="s" tone={status.tone}>
                    {status.label}
                  </StatusBadge>,
                ];
              })}
            />
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Taxas de ingressos</CardTitle>
                <CardDescription>Sobre o valor do ingresso, paga pelo comprador. O produtor recebe o valor integral.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="surface-inset rounded-xl px-4 py-3">
                <p className="text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Taxa da Nokta</p>
                {feeEditing ? (
                  <form
                    className="mt-2 space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSaveFee();
                    }}
                  >
                    <Input inputMode="decimal" suffix="%" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} aria-label="Taxa da Nokta em porcentagem" autoFocus className="max-w-[160px]" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" loading={feeSaving}>
                        Salvar
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setFeeEditing(false)} disabled={feeSaving}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-stat font-medium tabular-nums text-foreground">{feePercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p>
                    {isSuperAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon="edit"
                        onClick={() => {
                          setFeeValue(String(feePercent).replace(".", ","));
                          setFeeEditing(true);
                        }}
                      >
                        Alterar
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
              <p className="text-caption text-muted-foreground">
                O processamento (Pagar.me) também é pago pelo comprador, varia por Pix, cartão e parcelas e vale pra todos os workspaces.{" "}
                <Link href="/admin/taxas-gateway" className="text-brand underline-offset-4 hover:underline">
                  Ver taxas do gateway
                </Link>
              </p>
            </CardContent>
          </Card>

          {!isSupport ? (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Ações</CardTitle>
                  <CardDescription>Bloquear não apaga nada; excluir não tem volta.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-4">
                <Button variant={ws.bloqueado ? "outline" : "destructive-soft"} leftIcon={ws.bloqueado ? "lock-open" : "ban"} className="justify-start" onClick={() => setBlockOpen(true)}>
                  {ws.bloqueado ? "Desbloquear workspace" : "Bloquear workspace"}
                </Button>
                {isSuperAdmin ? (
                  <Button variant="destructive-soft" leftIcon="trash" className="justify-start" onClick={() => setDeleteOpen(true)}>
                    Excluir workspace
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={blockOpen}
        onOpenChange={(o) => {
          setBlockOpen(o);
          if (!o) setBlockReason("");
        }}
        title={ws.bloqueado ? "Desbloquear workspace" : "Bloquear workspace"}
        description={ws.bloqueado ? "A equipe volta a operar, as páginas públicas voltam ao ar e os eventos voltam a vender." : "A equipe deixa de conseguir operar, as páginas públicas saem do ar e os eventos param de vender. Nada é apagado e as contas dos usuários continuam funcionando."}
        confirmLabel={ws.bloqueado ? "Desbloquear" : "Bloquear"}
        danger={!ws.bloqueado}
        icon={ws.bloqueado ? "lock-open" : "ban"}
        onConfirm={handleToggleBlock}
      >
        {!ws.bloqueado ? (
          <Field label="Motivo" optional htmlFor="ws-block-reason">
            <Input id="ws-block-reason" placeholder="Ex.: chargebacks acima do limite" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          </Field>
        ) : null}
      </ConfirmDialog>

      <TypedConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir workspace permanentemente"
        description="Apaga o workspace com tudo dentro: eventos, cardápio, comandas, reservas, estoque, financeiro e equipe. Não tem volta. A conta do dono continua existindo. A exclusão é recusada se apagaria ingressos de compradores; nesse caso, bloqueie o workspace."
        expected={ws.nome}
        label={
          <>
            Digite <span className="font-semibold">{ws.nome}</span> pra confirmar
          </>
        }
        placeholder="Nome do workspace"
        onConfirm={handleDelete}
      />
    </div>
  );
}
