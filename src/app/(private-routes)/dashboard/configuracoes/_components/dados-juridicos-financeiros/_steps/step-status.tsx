"use client";

import { useEffect, useState } from "react";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { VERIFICATION_STATUS_LABEL, type LegalFinancialProfile, type VerificationStatus } from "@/services/venue-legal-financial";
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

const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  NOT_STARTED: "neutral",
  PENDING: "warning",
  UNDER_REVIEW: "warning",
  VERIFIED: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
  LEGACY_REVIEW_REQUIRED: "warning",
  FINANCIAL_REVIEW_REQUIRED: "warning",
};

function recipientTone(status: string | null): Tone {
  if (status === "active") return "success";
  if (status === "refused" || status === "canceled" || status === "inactive") return "danger";
  if (!status) return "neutral";
  return "warning";
}

function kycTone(status: string | null): Tone {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function StatusItem({ label, tone, children }: { label: string; tone: Tone; children: string }) {
  return (
    <div className="surface-inset flex flex-col gap-2 rounded-xl p-4">
      <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">{label}</p>
      <StatusBadge tone={tone}>{children}</StatusBadge>
    </div>
  );
}

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
        <div>
          <CardTitle>Status da verificação</CardTitle>
          <CardDescription>Acompanhamento do cadastro e da verificação de identidade (KYC) na Pagar.me.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {profile.recipientBlocked ? (
          <Callout tone="danger" title="Recebedor bloqueado">
            {profile.recipientBlockedReason ?? "Fale com o suporte da Nokta."}
          </Callout>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <StatusItem label="Status interno" tone={VERIFICATION_TONE[profile.verificationStatus]}>
            {VERIFICATION_STATUS_LABEL[profile.verificationStatus]}
          </StatusItem>
          <StatusItem label="Status na Pagar.me" tone={recipientTone(profile.recipientStatus)}>
            {profile.recipientStatus ? (RECIPIENT_STATUS_LABEL[profile.recipientStatus] ?? profile.recipientStatus) : "Não criado"}
          </StatusItem>
          <StatusItem label="Verificação de identidade" tone={kycTone(profile.kycStatus)}>
            {profile.kycStatus ? (KYC_STATUS_LABEL[profile.kycStatus] ?? profile.kycStatus) : "Não iniciado"}
          </StatusItem>
        </div>

        {profile.recipientAttemptState === "RECIPIENT_ERROR" && profile.recipientLastError ? <Callout tone="danger">A última tentativa de criar o recebedor falhou: {profile.recipientLastError}</Callout> : null}

        {/* Recebedor já ativo na Pagar.me não precisa de prova de vida: o link só aparece enquanto o cadastro está em análise. */}
        {profile.hasRecipient && profile.recipientStatus !== "active" ? (
          <Callout
            tone="brand"
            icon="id-card"
            title="Prova de vida"
            action={
              <Button size="sm" variant="outline" onClick={handleGenerateLink} loading={generateKycLink.isPending}>
                {linkUrl && !linkExpired ? "Gerar novo link" : "Gerar link de verificação"}
              </Button>
            }
          >
            Cadastro criado não significa saldo liberado — a Pagar.me pode pedir uma verificação de identidade adicional antes de liberar o recebedor por completo.
            {linkUrl && !linkExpired ? (
              <span className="mt-2 flex flex-wrap items-center gap-3">
                <a href={linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-caption font-semibold text-brand hover:underline">
                  Abrir verificação
                  <Icon name="external" size={10} />
                </a>
                {countdown ? <span className="text-caption text-subtle-foreground tnum">Expira em {countdown}</span> : null}
              </span>
            ) : null}
          </Callout>
        ) : null}
      </CardContent>
    </Card>
  );
}
