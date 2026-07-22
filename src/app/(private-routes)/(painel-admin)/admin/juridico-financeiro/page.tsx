"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { PageState } from "@/components/ui/page-state";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";

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
    </div>
  );
}
