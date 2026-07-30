"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { VERIFICATION_STATUS_LABEL, type LegalFinancialProfile } from "@/services/venue-legal-financial";
import { useGenerateKycLink } from "../../../_hooks/use-legal-financial-settings";

const RECIPIENT_STATUS_LABEL: Record<string, string> = {
  registration: "Cadastro enviado",
  affiliation: "Em afiliação",
  active: "Ativo",
  inactive: "Inativo",
  refused: "Recusado",
  canceled: "Cancelado",
};

const KYC_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Não iniciado",
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export function StepStatus({ orgId, profile }: { orgId: number; profile: LegalFinancialProfile | undefined }) {
  const generateKycLink = useGenerateKycLink(orgId);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown(null);
      return;
    }
    const interval = setInterval(() => {
      const remainingMs = expiresAt.getTime() - Date.now();
      if (remainingMs <= 0) {
        setCountdown("Expirado");
        clearInterval(interval);
        return;
      }
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!profile) return null;

  const handleGenerateLink = () => {
    generateKycLink.mutate(undefined, {
      onSuccess: (result) => {
        setLinkUrl(result.url);
        setExpiresAt(new Date(result.expiresAt));
        toast.success("Link de verificação gerado.");
      },
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível gerar o link de verificação.")),
    });
  };

  const linkExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
        <CardDescription>Acompanhamento do cadastro e da verificação de identidade (KYC) na Pagar.me.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.recipientBlocked ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3.5">
            <p className="text-sm font-medium text-red-900">Recebedor bloqueado</p>
            <p className="mt-1 text-xs text-red-700">{profile.recipientBlockedReason ?? "Fale com o suporte da Nokta."}</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-black/50">Status interno</Label>
            <div className="mt-1">
              <Badge variant="outline">{VERIFICATION_STATUS_LABEL[profile.verificationStatus]}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-black/50">Status na Pagar.me</Label>
            <div className="mt-1">
              <Badge variant="outline">{profile.recipientStatus ? (RECIPIENT_STATUS_LABEL[profile.recipientStatus] ?? profile.recipientStatus) : "Não criado"}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-black/50">Verificação de identidade</Label>
            <div className="mt-1">
              <Badge variant="outline">{profile.kycStatus ? (KYC_STATUS_LABEL[profile.kycStatus] ?? profile.kycStatus) : "Não iniciado"}</Badge>
            </div>
          </div>
        </div>

        {profile.recipientAttemptState === "RECIPIENT_ERROR" && profile.recipientLastError ? (
          <p className="text-xs text-red-600">A última tentativa de criar o recebedor falhou: {profile.recipientLastError}</p>
        ) : null}

        {profile.hasRecipient ? (
          <div className="rounded-xl border border-[#ecebf1] bg-black/[0.02] p-3.5">
            <p className="text-xs text-black/60">
              Cadastro criado não significa saldo liberado — a Pagar.me pode pedir uma verificação de identidade adicional (prova de vida) antes de
              liberar o recebedor por completo.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={handleGenerateLink} disabled={generateKycLink.isPending}>
                {generateKycLink.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" /> Gerando…
                  </span>
                ) : linkUrl && !linkExpired ? (
                  "Gerar novo link"
                ) : (
                  "Gerar link de verificação"
                )}
              </Button>
              {linkUrl && !linkExpired ? (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d28d9]"
                >
                  Abrir verificação
                  <ExternalLink size={12} />
                </a>
              ) : null}
              {countdown && !linkExpired ? <span className="text-xs text-black/40">Expira em {countdown}</span> : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
