"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { AlertCircle, ArrowLeft, Ban, Pencil, Save, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  counts: {
    members: number;
    events: number;
    venueLocations: number;
    venueProducts: number;
    venueTabs: number;
    venueReservations: number;
    activeCapabilities: number;
  };
}

const ROLE_LABEL: Record<string, string> = { OWNER: "Dono", ADMIN: "Administrador", MEMBER: "Membro" };
const MEMBER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  SUSPENDED: "Suspenso",
  REMOVED: "Removido",
};
const VERIFICATION_LABEL: Record<string, string> = {
  NOT_STARTED: "Não iniciado",
  PENDING: "Pendente",
  UNDER_REVIEW: "Em análise",
  VERIFIED: "Verificado",
  REJECTED: "Recusado",
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

export default function WorkspaceDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();
  const role = getUserRole();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSupport = role === "SUPPORT";

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", slug: "", documento: "", tipo: "PF" as "PF" | "PJ" });

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  const [moduleLoading, setModuleLoading] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Workspace>(`/admin/workspaces/${id}`);
      setWorkspace(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar o workspace."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchWorkspace();
  }, [fetchWorkspace]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-gray-700">{error ?? "Workspace não encontrado."}</p>
        <Button variant="outline" onClick={() => void fetchWorkspace()}>
          Tentar novamente
        </Button>
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
      toast.error("Nenhuma alteração detectada.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<Workspace>(`/admin/workspaces/${ws.id}`, payload);
      setWorkspace(res.data);
      setEditing(false);
      toast.success("Workspace atualizado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBlock() {
    setBlockLoading(true);
    try {
      const res = await api.patch<Workspace>(`/admin/workspaces/${ws.id}/bloqueio`, {
        bloqueado: !ws.bloqueado,
        ...(ws.bloqueado || !blockReason.trim() ? {} : { motivo: blockReason.trim() }),
      });
      setWorkspace(res.data);
      setBlockOpen(false);
      setBlockReason("");
      toast.success(ws.bloqueado ? "Workspace desbloqueado." : "Workspace bloqueado.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o bloqueio."));
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleToggleModule(module: string, ativo: boolean) {
    setModuleLoading(module);
    try {
      const res = await api.patch<Workspace>(`/admin/workspaces/${ws.id}/modulos`, { module, ativo });
      setWorkspace(res.data);
      toast.success(`${MODULE_LABEL[module] ?? module} ${ativo ? "ativado" : "desativado"}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível alterar o módulo."));
    } finally {
      setModuleLoading(null);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/workspaces/${ws.id}`);
      toast.success("Workspace excluído.");
      router.push("/admin/workspaces");
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível excluir o workspace."));
    } finally {
      setDeleteLoading(false);
    }
  }

  const ownerName = ws.owner ? `${ws.owner.nome ?? ""} ${ws.owner.sobrenome ?? ""}`.trim() || "Sem nome" : "—";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/workspaces"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Workspaces
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
          {ws.nome.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-bold text-gray-900">{ws.nome}</h1>
          <p className="break-all text-sm text-muted-foreground">
            #{ws.id} · {ws.slug ?? "sem link"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WorkspaceStatusBadge status={ws.status} />
          <WorkspaceStageBadge etapa={ws.etapa} />
        </div>
      </div>

      {ws.bloqueado && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">
            Workspace bloqueado
            {ws.bloqueadoEm ? ` em ${new Date(ws.bloqueadoEm).toLocaleString("pt-BR")}` : ""}
          </p>
          <p className="mt-1">
            {ws.bloqueadoMotivo ? `Motivo: ${ws.bloqueadoMotivo}` : "Nenhum motivo informado."} A equipe não consegue
            operar, as páginas públicas (cardápio, avaliação, página do local) saem do ar e os eventos param de vender.
          </p>
        </div>
      )}

      {/* Dados */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Dados do workspace</h2>
          {isSuperAdmin && !editing && (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome</label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Link público</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Trocar o link quebra QR codes e links do cardápio já impressos ou compartilhados.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Documento (CPF ou CNPJ)</label>
                <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Tipo</label>
                <div className="flex gap-2">
                  {(["PF", "PJ"] as const).map((tipo) => (
                    <Button
                      key={tipo}
                      type="button"
                      variant={form.tipo === tipo ? "default" : "outline"}
                      onClick={() => setForm({ ...form, tipo })}
                      className={form.tipo === tipo ? "bg-violet-600 text-white hover:bg-violet-700" : ""}
                    >
                      {tipo === "PF" ? "Pessoa física" : "Pessoa jurídica"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => void handleSave()}
                disabled={saving}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Nome" value={ws.nome} />
            <Field label="Link público" value={ws.slug ?? "—"} />
            <Field label="Documento" value={ws.documento ?? "—"} />
            <Field label="Tipo" value={ws.tipo === "PF" ? "Pessoa física" : "Pessoa jurídica"} />
            <Field
              label="Dono"
              value={
                ws.owner ? (
                  <Link href={`/admin/usuarios/${ws.owner.id}`} className="text-violet-700 hover:underline">
                    {ownerName}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="E-mail do dono" value={ws.owner?.email ?? "—"} />
            <Field label="Telefone do dono" value={ws.owner?.telefone ?? "—"} />
            <Field label="Criado em" value={new Date(ws.createdAt).toLocaleDateString("pt-BR")} />
            <Field
              label="Verificação jurídica"
              value={
                ws.legalFinancial
                  ? VERIFICATION_LABEL[ws.legalFinancial.verificationStatus] ?? ws.legalFinancial.verificationStatus
                  : "Não iniciado"
              }
            />
            <Field
              label="Recebedor (Pagar.me)"
              value={
                ws.legalFinancial?.recipientBlocked
                  ? "Bloqueado"
                  : ws.legalFinancial?.recipientStatus ?? "Não criado"
              }
            />
            <Field label="Recursos ativos" value={ws.counts.activeCapabilities} />
            <Field label="Equipe" value={ws.counts.members} />
          </div>
        )}
      </section>

      {/* Conteúdo */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Conteúdo</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Field label="Eventos" value={ws.counts.events} />
          <Field label="Unidades" value={ws.counts.venueLocations} />
          <Field label="Produtos" value={ws.counts.venueProducts} />
          <Field label="Comandas" value={ws.counts.venueTabs} />
          <Field label="Reservas" value={ws.counts.venueReservations} />
        </div>
      </section>

      {/* Módulos */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Módulos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {ws.modules.map((m) => (
            <div key={m.module} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div>
                <p className="text-sm font-medium">{MODULE_LABEL[m.module] ?? m.module}</p>
                <p className="text-xs text-muted-foreground">{m.ativo ? "Ativo" : "Desativado"}</p>
              </div>
              <Switch
                checked={m.ativo}
                disabled={!isSuperAdmin || moduleLoading !== null}
                onCheckedChange={(checked) => void handleToggleModule(m.module, checked)}
                aria-label={`${m.ativo ? "Desativar" : "Ativar"} ${MODULE_LABEL[m.module] ?? m.module}`}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Desativar um módulo tira o acesso da equipe a ele, sem apagar nada. Financeiro e Insights estão sempre ativos.
        </p>
      </section>

      {/* Equipe */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Equipe</h2>
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3">Nome / E-mail</TableHead>
                <TableHead className="px-6 py-3">Papel</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ws.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-6 py-6 text-center">
                    Nenhum membro.
                  </TableCell>
                </TableRow>
              ) : (
                ws.members.map((member) => (
                  <TableRow key={member.id} className="border-b">
                    <TableCell className="px-6 py-3">
                      <Link href={`/admin/usuarios/${member.userId}`} className="flex flex-col hover:text-violet-600">
                        <span className="font-medium">{member.nome || "Sem nome"}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="px-6 py-3">{ROLE_LABEL[member.role] ?? member.role}</TableCell>
                    <TableCell className="px-6 py-3">{MEMBER_STATUS_LABEL[member.status] ?? member.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Ações */}
      {!isSupport && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setBlockOpen(true)}
            className={
              ws.bloqueado
                ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                : "border-red-600 text-red-600 hover:bg-red-50"
            }
          >
            {ws.bloqueado ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
            {ws.bloqueado ? "Desbloquear workspace" : "Bloquear workspace"}
          </Button>

          {isSuperAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}
              className="border-red-700 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir workspace
            </Button>
          )}
        </div>
      )}

      {/* Dialog bloqueio */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ws.bloqueado ? "Desbloquear workspace" : "Bloquear workspace"}</DialogTitle>
            <DialogDescription>
              {ws.bloqueado
                ? "A equipe volta a operar, as páginas públicas voltam ao ar e os eventos voltam a vender."
                : "A equipe deixa de conseguir operar, as páginas públicas saem do ar e os eventos param de vender. Nada é apagado e as contas dos usuários continuam funcionando."}
            </DialogDescription>
          </DialogHeader>
          {!ws.bloqueado && (
            <div className="py-2">
              <label className="mb-1.5 block text-sm font-medium">Motivo (opcional)</label>
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
                ws.bloqueado
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }
            >
              {blockLoading ? "Processando..." : ws.bloqueado ? "Confirmar desbloqueio" : "Confirmar bloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Excluir workspace permanentemente</DialogTitle>
            <DialogDescription>
              Apaga o workspace com tudo dentro: eventos, cardápio, comandas, reservas, estoque, financeiro e equipe.
              Não tem volta. A conta do dono continua existindo. A exclusão é recusada se apagaria ingressos de
              compradores; nesse caso, bloqueie o workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1.5 block text-sm font-medium">
              Digite <span className="font-semibold">{ws.nome}</span> para confirmar
            </label>
            <Input
              placeholder="Nome do workspace..."
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={deleteLoading || deleteConfirm.trim().toLowerCase() !== ws.nome.trim().toLowerCase()}
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
