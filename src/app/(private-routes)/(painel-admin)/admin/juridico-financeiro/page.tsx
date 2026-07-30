"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, X as XIcon, Lock, Unlock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageState } from "@/components/ui/page-state";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { useStepUp } from "@/components/session/step-up-modal";
import { STEP_UP_TOKEN_HEADER } from "@/services/step-up";

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

export default function JuridicoFinanceiroPage() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PendingProfile[]>("/admin/legal-financial-profiles/pending");
      setProfiles(data);
    } catch (err) {
      setProfiles([]);
      setError(getErrorMessage(err, "Não foi possível carregar a fila de revisão."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(profile: PendingProfile) {
    setActingId(profile.organizationId);
    try {
      const { data } = await api.post(`/admin/legal-financial-profiles/${profile.organizationId}/approve`);
      if (data?.recipient?.attempted) {
        if (data.recipient.created) {
          toast.success(`Organização aprovada e recebedor criado na Pagar.me.`);
        } else {
          toast.success(`Organização aprovada. O recebedor ainda não pôde ser criado: ${data.recipient.error ?? "conta bancária pendente"}.`);
        }
      } else {
        toast.success("Organização aprovada. O recebedor será criado quando a conta bancária for cadastrada.");
      }
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao aprovar organização."));
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
      await api.post(`/admin/legal-financial-profiles/${rejectTarget.organizationId}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.success("Organização rejeitada.");
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Erro ao rejeitar organização."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dados jurídicos e financeiros</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organizações aguardando revisão do documento (CPF/CNPJ) enviado. Ao aprovar, o recebedor na Pagar.me é
          criado automaticamente se a conta bancária já estiver cadastrada.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {error ? (
          <div className="p-6">
            <PageState
              title="Não foi possível carregar a fila"
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
                <TableHead className="px-6 py-3">Organização</TableHead>
                <TableHead className="px-6 py-3">Tipo</TableHead>
                <TableHead className="px-6 py-3">Nome legal</TableHead>
                <TableHead className="px-6 py-3">Documento</TableHead>
                <TableHead className="px-6 py-3">Representante</TableHead>
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

              {!loading && profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-6 text-center">
                    Nenhuma organização pendente de revisão no momento.
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? profiles.map((profile) => (
                    <TableRow key={profile.organizationId} className="border-b transition hover:bg-muted/40">
                      <TableCell className="px-6 py-3 font-medium">{profile.organization.nome}</TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge variant="outline">{profile.legalType === "INDIVIDUAL" ? "Pessoa física" : "Pessoa jurídica"}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">{profile.legalName}</TableCell>
                      <TableCell className="px-6 py-3 font-mono text-xs">
                        {profile.documentLast4 ? `***${profile.documentLast4}` : "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div>{profile.representative.nome} {profile.representative.sobrenome ?? ""}</div>
                        <div className="text-xs text-muted-foreground">{profile.representative.email}</div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                            disabled={actingId === profile.organizationId}
                            onClick={() => void approve(profile)}
                            title="Aprovar"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            disabled={actingId === profile.organizationId}
                            onClick={() => setRejectTarget(profile)}
                            title="Rejeitar"
                          >
                            <XIcon size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {rejectTarget?.organization.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Explique o motivo — a organização usará isso para corrigir e reenviar os dados.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex.: documento ilegível, dígito verificador do CNPJ não confere, nome legal não corresponde ao documento enviado…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={actingId === rejectTarget?.organizationId}
              onClick={() => void reject()}
            >
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
        description: nextBlocked
          ? "A organização deixará de conseguir vender e sacar imediatamente."
          : "A organização volta a conseguir vender e sacar imediatamente — confirme que a suspeita/pendência foi resolvida.",
        preview: [
          { label: "Organização", value: overview.organizationName },
          { label: "Recipient", value: overview.hasRecipient ? "Cadastrado" : "Não cadastrado" },
          { label: "Ação", value: nextBlocked ? "Bloquear" : "Desbloquear" },
        ],
      });

      await api.patch(
        `/admin/organizations/${overview.organizationId}/recipient-block`,
        { blocked: nextBlocked, reason: reason.trim() },
        { headers: { [STEP_UP_TOKEN_HEADER]: stepUpToken } },
      );
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
    <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Bloqueio de recebedor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bloqueia ou desbloqueia o recebedor Pagar.me de uma organização — nenhuma venda ou saque acontece enquanto
          bloqueado. Exige verificação por Authenticator, mesmo com sessão válida.
        </p>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 max-w-xs space-y-1.5">
          <Label>ID da organização</Label>
          <Input
            value={organizationIdInput}
            onChange={(e) => setOrganizationIdInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="Ex.: 1038"
            inputMode="numeric"
          />
        </div>
        <Button variant="outline" onClick={() => void search()} disabled={loading}>
          <Search size={16} className="mr-2" />
          Buscar
        </Button>
      </div>

      {overview ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{overview.organizationName}</p>
            <p className="text-xs text-muted-foreground">
              Recipient: {overview.hasRecipient ? (overview.recipientStatus ?? "cadastrado") : "não cadastrado"}
            </p>
            {overview.recipientBlocked ? (
              <p className="mt-1 text-xs text-red-600">
                Bloqueado{overview.recipientBlockedReason ? ` — ${overview.recipientBlockedReason}` : ""}
              </p>
            ) : null}
          </div>
          <Button
            variant={overview.recipientBlocked ? "outline" : "destructive"}
            onClick={() => setActionOpen(true)}
          >
            {overview.recipientBlocked ? <Unlock size={16} className="mr-2" /> : <Lock size={16} className="mr-2" />}
            {overview.recipientBlocked ? "Desbloquear" : "Bloquear"}
          </Button>
        </div>
      ) : null}

      <Dialog open={actionOpen} onOpenChange={(open) => !open && setActionOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {overview?.recipientBlocked ? "Desbloquear" : "Bloquear"} recebedor — {overview?.organizationName}
            </DialogTitle>
            <DialogDescription>
              {overview?.recipientBlocked
                ? "A organização volta a conseguir vender e sacar imediatamente."
                : "A organização deixa de conseguir vender e sacar imediatamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Motivo (obrigatório)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: suspeita de fraude confirmada, chargeback rate acima do limite…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant={overview?.recipientBlocked ? "default" : "destructive"} onClick={() => void confirmToggle()} disabled={submitting}>
              {submitting ? "Confirmando…" : "Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
