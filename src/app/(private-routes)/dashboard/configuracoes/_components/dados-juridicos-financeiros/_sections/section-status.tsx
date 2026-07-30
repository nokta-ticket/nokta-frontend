"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { VERIFICATION_STATUS_LABEL, type LegalFinancialProfile } from "@/services/venue-legal-financial";

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

export function SectionStatus({ profile }: { profile: LegalFinancialProfile | undefined }) {
  if (!profile) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>5. Status</CardTitle>
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
              <Badge variant="outline">{profile.recipientStatus ? RECIPIENT_STATUS_LABEL[profile.recipientStatus] ?? profile.recipientStatus : "Não criado"}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-black/50">Verificação de identidade</Label>
            <div className="mt-1">
              <Badge variant="outline">{profile.kycStatus ? KYC_STATUS_LABEL[profile.kycStatus] ?? profile.kycStatus : "Não iniciado"}</Badge>
            </div>
          </div>
        </div>

        {profile.recipientAttemptState === "RECIPIENT_ERROR" && profile.recipientLastError ? (
          <p className="text-xs text-red-600">A última tentativa de criar o recebedor falhou: {profile.recipientLastError}</p>
        ) : null}

        <div className="rounded-xl border border-[#ecebf1] bg-black/[0.02] p-3.5">
          <p className="text-xs text-black/60">
            Cadastro criado não significa saldo liberado — a Pagar.me pode pedir uma verificação de identidade adicional (prova de vida) antes de liberar
            o recebedor por completo.
          </p>
          {profile.hasRecipient ? (
            <a
              href="https://dashboard.pagar.me"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d28d9]"
            >
              Criar conta e fazer KYC
              <ExternalLink size={12} />
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
