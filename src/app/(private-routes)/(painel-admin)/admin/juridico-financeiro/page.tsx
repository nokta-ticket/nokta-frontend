"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStepUp } from "@/components/session/step-up-modal";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";
import { RefreshButton } from "../_components/refresh-button";
import { formatDate, fullName } from "../_lib/format";

interface PendingProfile {
  organizationId: number;
  legalType: "INDIVIDUAL" | "COMPANY";
  legalName: string;
  tradeName: string | null;
  documentLast4: string | null;
  verificationStatus: string;
  createdAt: string;
  organization: { nome: string };
  representative: { nome: string; sobrenome: string | null; email: string };
}

interface ApproveResponse {
  recipient?: { attempted?: boolean; created?: boolean; error?: string | null };
}

export default function JuridicoFinanceiroPage() {
  const [profiles, setProfiles] = useState<PendingProfile[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingProfile | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PendingProfile[]>("/admin/legal-financial-profiles/pending");
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setProfiles([]);
      setError(getErrorMessage(err, "Não foi possível carregar a fila de revisão."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(profile: PendingProfile) {
    setActingId(profile.organizationId);
    try {
      const { data } = await api.post<ApproveResponse>(`/admin/legal-financial-profiles/${profile.organizationId}/approve`);
      if (data?.recipient?.attempted) {
        if (data.recipient.created) toast.success("Organização aprovada e recebedor criado na Pagar.me.");
        else toast.success(`Organização aprovada. O recebedor ainda não pôde ser criado: ${data.recipient.error ?? "conta bancária pendente"}.`);
      } else {
        toast.success("Organização aprovada. O recebedor será criado quando a conta bancária for cadastrada.");
      }
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível aprovar a organização."));
    } finally {
      setActingId(null);
    }
  }

  async function reject() {
    if (!rejectTarget || rejectReason.trim().length < 10) {
      toast.error("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }
    setActingId(rejectTarget.organizationId);
    try {
      await api.post(`/admin/legal-financial-profiles/${rejectTarget.organizationId}/reject`, { reason: rejectReason.trim() });
      toast.success("Organização rejeitada.");
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível rejeitar a organização."));
    } finally {
      setActingId(null);
    }
  }

  const rows = profiles ?? [];
  const companies = rows.filter((p) => p.legalType === "COMPANY").length;

  const actions = (p: PendingProfile) => (
    <>
      <Button variant="subtle" size="icon-sm" aria-label={`Aprovar ${p.organization.nome}`} title="Aprovar" className="hover:bg-success-bg hover:text-success" disabled={actingId === p.organizationId} onClick={() => setApproveTarget(p)}>
        <Icon name="check" size={14} />
      </Button>
      <Button variant="subtle" size="icon-sm" aria-label={`Rejeitar ${p.organization.nome}`} title="Rejeitar" className="hover:bg-danger-bg hover:text-danger" disabled={actingId === p.organizationId} onClick={() => setRejectTarget(p)}>
        <Icon name="close" size={14} />
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Jurídico e financeiro" description="Organizações aguardando revisão do documento (CPF/CNPJ). Ao aprovar, o recebedor na Pagar.me é criado automaticamente se a conta bancária já estiver cadastrada." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Aguardando revisão" icon="scale" value={profiles ? rows.length : null} />
        <StatCard label="Pessoas jurídicas" icon="building" value={profiles ? companies : null} />
        <StatCard label="Pessoas físicas" icon="user" value={profiles ? rows.length - companies : null} />
      </div>

      <DataTableToolbar>
        <p className="text-caption text-muted-foreground">Da mais antiga pra mais recente.</p>
        <RefreshButton onClick={() => void load()} pending={loading} className="ml-auto" />
      </DataTableToolbar>

      {error ? (
        <ErrorState title="Não deu pra carregar a fila" description={error} onRetry={() => void load()} />
      ) : profiles === null ? (
        <RowsSkeleton rows={5} />
      ) : (
        <DataTableShell
          maxHeight="none"
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Organização</DataTableHeadCell>
                  <DataTableHeadCell>Tipo</DataTableHeadCell>
                  <DataTableHeadCell>Nome legal</DataTableHeadCell>
                  <DataTableHeadCell>Documento</DataTableHeadCell>
                  <DataTableHeadCell>Representante</DataTableHeadCell>
                  <DataTableHeadCell>Enviado</DataTableHeadCell>
                  <DataTableHeadCell align="right">
                    <span className="sr-only">Ações</span>
                  </DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.length === 0 ? (
                  <DataTableEmpty colSpan={7} icon="scale" title="Nenhuma organização pendente de revisão" description="Quando um produtor enviar o documento, aparece aqui." />
                ) : (
                  rows.map((p, i) => (
                    <DataTableRow key={p.organizationId} index={i}>
                      <DataTableCell>
                        <p className="font-medium">{p.organization.nome}</p>
                        <p className="tnum text-caption text-muted-foreground">#{p.organizationId}</p>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone="neutral" dot={false}>
                          {p.legalType === "INDIVIDUAL" ? "Pessoa física" : "Pessoa jurídica"}
                        </StatusBadge>
                      </DataTableCell>
                      <DataTableCell>
                        <p>{p.legalName}</p>
                        {p.tradeName ? <p className="text-caption text-muted-foreground">{p.tradeName}</p> : null}
                      </DataTableCell>
                      <DataTableCell className="font-mono text-caption">{p.documentLast4 ? `•••${p.documentLast4}` : <span className="text-subtle-foreground">Não informado</span>}</DataTableCell>
                      <DataTableCell>
                        <p>{fullName(p.representative.nome, p.representative.sobrenome)}</p>
                        <p className="text-caption text-muted-foreground">{p.representative.email}</p>
                      </DataTableCell>
                      <DataTableCell className="tnum text-muted-foreground">{formatDate(p.createdAt)}</DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex justify-end gap-1">{actions(p)}</div>
                      </DataTableCell>
                    </DataTableRow>
                  ))
                )}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            rows.length === 0 ? (
              <EmptyState compact icon="scale" title="Nenhuma organização pendente de revisão" />
            ) : (
              <MobileCardList>
                {rows.map((p, i) => (
                  <MobileCard
                    key={p.organizationId}
                    index={i}
                    title={p.organization.nome}
                    subtitle={p.legalName}
                    badge={
                      <StatusBadge tone="neutral" dot={false}>
                        {p.legalType === "INDIVIDUAL" ? "PF" : "PJ"}
                      </StatusBadge>
                    }
                    meta={[
                      { label: "Documento", value: p.documentLast4 ? `•••${p.documentLast4}` : "Não informado", num: true },
                      { label: "Enviado", value: formatDate(p.createdAt), num: true },
                      { label: "Representante", value: fullName(p.representative.nome, p.representative.sobrenome) },
                      { label: "E-mail", value: p.representative.email },
                    ]}
                    actions={actions(p)}
                  />
                ))}
              </MobileCardList>
            )
          }
        />
      )}

      <ConfirmDialog
        open={approveTarget !== null}
        onOpenChange={(o) => (!o ? setApproveTarget(null) : null)}
        title={`Aprovar ${approveTarget?.organization.nome ?? "organização"}`}
        description="O documento é marcado como verificado e, se a conta bancária já estiver cadastrada, o recebedor é criado na Pagar.me agora."
        confirmLabel="Aprovar"
        icon="check-circle"
        onConfirm={() => (approveTarget ? approve(approveTarget) : undefined)}
      />

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (actingId !== null) return;
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {rejectTarget?.organization.nome}</DialogTitle>
            <DialogDescription>Explique o motivo — a organização usa isso pra corrigir e reenviar os dados.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Motivo" htmlFor="reject-reason" required hint="Pelo menos 10 caracteres.">
              <Textarea id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Ex.: documento ilegível, dígito verificador do CNPJ não confere, nome legal não corresponde ao documento enviado…" rows={4} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)} disabled={actingId !== null}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={rejectReason.trim().length < 10} loading={actingId !== null && actingId === rejectTarget?.organizationId} onClick={() => void reject()}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecipientBlockSection />
    </div>
  );
}

interface RecipientOverview {
  organizationId: number;
  organizationName: string;
  hasRecipient: boolean;
  recipientStatus: string | null;
  recipientBlocked: boolean;
  recipientBlockedAt: string | null;
  recipientBlockedReason: string | null;
}

/**
 * Bloqueio/desbloqueio de recipient — proteção máxima (SUPER_ADMIN + step-up
 * TOTP obrigatório, sem fallback OTP; ver backend RecipientService.
 * setRecipientBlock). Nunca age às cegas: sempre busca e mostra o estado
 * real (organização, recipient, status atual) antes de qualquer ação, e
 * exige motivo em ambas as direções — desbloquear restaura capacidade
 * financeira, não é menos sensível que bloquear.
 */
function RecipientBlockSection() {
  const { openStepUp } = useStepUp();
  const [organizationIdInput, setOrganizationIdInput] = useState("");
  const [overview, setOverview] = useState<RecipientOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function search() {
    const organizationId = Number(organizationIdInput);
    if (!organizationId || organizationId <= 0) {
      toast.error("Informe um ID de organização válido.");
      return;
    }
    setLoading(true);
    setOverview(null);
    try {
      const { data } = await api.get<RecipientOverview>(`/admin/organizations/${organizationId}/recipient-overview`);
      setOverview(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível carregar a organização."));
    } finally {
      setLoading(false);
    }
  }

  async function confirmToggle() {
    if (!overview) return;
    if (reason.trim().length < 10) {
      toast.error("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }
    const nextBlocked = !overview.recipientBlocked;
    setSubmitting(true);
    try {
      const stepUpToken = await openStepUp({
        action: "RECIPIENT_BLOCK_TOGGLE",
        organizationId: overview.organizationId,
        actionParams: { organizationId: overview.organizationId },
        title: nextBlocked ? "Bloquear recebedor" : "Desbloquear recebedor",
        description: nextBlocked ? "A organização deixará de conseguir vender e sacar imediatamente." : "A organização volta a conseguir vender e sacar imediatamente — confirme que a suspeita/pendência foi resolvida.",
        preview: [
          { label: "Organização", value: overview.organizationName },
          { label: "Recipient", value: overview.hasRecipient ? "Cadastrado" : "Não cadastrado" },
          { label: "Ação", value: nextBlocked ? "Bloquear" : "Desbloquear" },
        ],
      });

      await api.patch(`/admin/organizations/${overview.organizationId}/recipient-block`, { blocked: nextBlocked, reason: reason.trim() }, { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } });
      toast.success(nextBlocked ? "Recebedor bloqueado." : "Recebedor desbloqueado.");
      setActionOpen(false);
      setReason("");
      await search();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "Verificação de segurança cancelada.") {
        toast.error(getErrorMessage(err, "Não foi possível concluir a ação."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card accent>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icon name="lock" size={15} />
            Bloqueio de recebedor
          </CardTitle>
          <CardDescription>Bloqueia ou desbloqueia o recebedor Pagar.me de uma organização — nenhuma venda ou saque acontece enquanto bloqueado. Exige verificação por Authenticator, mesmo com sessão válida.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
        >
          <Field label="ID da organização" htmlFor="recipient-org" className="sm:max-w-xs sm:flex-1">
            <Input id="recipient-org" leftIcon="hashtag" value={organizationIdInput} onChange={(e) => setOrganizationIdInput(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 1038" inputMode="numeric" />
          </Field>
          <Button type="submit" variant="outline" leftIcon="search" loading={loading}>
            Buscar
          </Button>
        </form>

        {overview ? (
          <div className="surface-inset flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{overview.organizationName}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                <span>Recipient:</span>
                {overview.hasRecipient ? <StatusBadge tone="success">{overview.recipientStatus ?? "cadastrado"}</StatusBadge> : <StatusBadge tone="neutral">não cadastrado</StatusBadge>}
                {overview.recipientBlocked ? <StatusBadge tone="danger">Bloqueado</StatusBadge> : null}
              </p>
              {overview.recipientBlocked && overview.recipientBlockedReason ? <p className="mt-1 text-caption text-danger">{overview.recipientBlockedReason}</p> : null}
            </div>
            <Button variant={overview.recipientBlocked ? "outline" : "destructive"} leftIcon={overview.recipientBlocked ? "lock-open" : "lock"} onClick={() => setActionOpen(true)}>
              {overview.recipientBlocked ? "Desbloquear" : "Bloquear"}
            </Button>
          </div>
        ) : (
          <Callout tone="neutral">Busque a organização pelo ID pra ver o estado real do recebedor antes de agir.</Callout>
        )}
      </CardContent>

      <Dialog open={actionOpen} onOpenChange={(open) => (!open && !submitting ? setActionOpen(false) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {overview?.recipientBlocked ? "Desbloquear" : "Bloquear"} recebedor — {overview?.organizationName}
            </DialogTitle>
            <DialogDescription>{overview?.recipientBlocked ? "A organização volta a conseguir vender e sacar imediatamente." : "A organização deixa de conseguir vender e sacar imediatamente."}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Motivo" htmlFor="recipient-reason" required hint="Pelo menos 10 caracteres. Fica registrado na auditoria.">
              <Textarea id="recipient-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: suspeita de fraude confirmada, chargeback rate acima do limite…" rows={4} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant={overview?.recipientBlocked ? "primary" : "destructive"} onClick={() => void confirmToggle()} loading={submitting} disabled={reason.trim().length < 10}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
