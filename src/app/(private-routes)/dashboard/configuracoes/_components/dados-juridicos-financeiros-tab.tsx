"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { formatCpf, formatCnpj, normalizeDigits, validateCpf, validateCnpj, validatePixKey } from "@/lib/br-data";
import { VERIFICATION_STATUS_LABEL, type LegalType, type VerificationStatus } from "@/services/venue-legal-financial";
import { BlockSkeleton } from "../../_components/states/loading-state";
import {
  useLegalFinancialProfile,
  useSetFinancialDestination,
  useStartLegalProfile,
} from "../_hooks/use-legal-financial-settings";

const STATUS_BADGE_VARIANT: Record<VerificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  NOT_STARTED: "outline",
  PENDING: "secondary",
  UNDER_REVIEW: "secondary",
  VERIFIED: "default",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
  LEGACY_REVIEW_REQUIRED: "secondary",
};

export function DadosJuridicosFinanceirosTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: profile, isLoading } = useLegalFinancialProfile(orgId);
  const startProfile = useStartLegalProfile(orgId);
  const setDestination = useSetFinancialDestination(orgId);

  const [legalType, setLegalType] = useState<LegalType>("INDIVIDUAL");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    if (profile?.legalType) {
      setLegalType(profile.legalType);
      setLegalName(profile.legalName ?? "");
      setTradeName(profile.tradeName ?? "");
    }
  }, [profile]);

  if (isLoading) return <BlockSkeleton className="h-72" />;

  const hasProfile = !!profile?.legalType;
  const documentDigits = normalizeDigits(document);
  const documentValid = legalType === "INDIVIDUAL" ? validateCpf(documentDigits) : validateCnpj(documentDigits);
  const canEditDocument = !hasProfile || profile?.verificationStatus === "LEGACY_REVIEW_REQUIRED" || profile?.verificationStatus === "REJECTED";
  const pixValid = validatePixKey(pixKey);

  const handleStartProfile = () => {
    if (!legalName.trim()) {
      toast.error("Informe o nome legal da organização.");
      return;
    }
    if (!documentValid) {
      toast.error(legalType === "INDIVIDUAL" ? "CPF inválido." : "CNPJ inválido.");
      return;
    }
    startProfile.mutate(
      { legalType, legalName: legalName.trim(), tradeName: tradeName.trim() || undefined, document: documentDigits },
      {
        onSuccess: () => toast.success("Dados jurídicos enviados para verificação."),
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar os dados jurídicos.")),
      },
    );
  };

  const handleSaveDestination = () => {
    if (!pixValid) {
      toast.error("Chave Pix inválida.");
      return;
    }
    setDestination.mutate(
      { pixKey },
      {
        onSuccess: () => {
          toast.success("Destino financeiro salvo.");
          setPixKey("");
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar o destino financeiro.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      {profile?.verificationStatus === "LEGACY_REVIEW_REQUIRED" ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900">
              Conclua a verificação financeira da organização para começar a vender. Seus eventos, vendas e saldos
              atuais continuam preservados normalmente.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Dados jurídicos</CardTitle>
              <CardDescription>Tipo de organização, nome legal e documento.</CardDescription>
            </div>
            {profile?.verificationStatus ? (
              <Badge variant={STATUS_BADGE_VARIANT[profile.verificationStatus]}>
                {VERIFICATION_STATUS_LABEL[profile.verificationStatus]}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasProfile && !canEditDocument ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-black/50">Tipo</Label>
                <p className="text-sm font-medium">{profile.legalType === "INDIVIDUAL" ? "Pessoa física" : "Pessoa jurídica"}</p>
              </div>
              <div>
                <Label className="text-xs text-black/50">Documento</Label>
                <p className="text-sm font-medium">{profile.documentMasked ?? "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-black/50">Nome legal</Label>
                <p className="text-sm font-medium">{profile.legalName}</p>
              </div>
              {profile.tradeName ? (
                <div className="sm:col-span-2">
                  <Label className="text-xs text-black/50">Nome de exibição</Label>
                  <p className="text-sm font-medium">{profile.tradeName}</p>
                </div>
              ) : null}
            </div>
          ) : canManage ? (
            <>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={legalType === "INDIVIDUAL" ? "default" : "outline"}
                  onClick={() => setLegalType("INDIVIDUAL")}
                >
                  Pessoa física
                </Button>
                <Button
                  type="button"
                  variant={legalType === "COMPANY" ? "default" : "outline"}
                  onClick={() => setLegalType("COMPANY")}
                >
                  Pessoa jurídica
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome legal</Label>
                  <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Nome civil ou razão social" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nome de exibição (opcional)</Label>
                  <Input value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Nome fantasia" />
                </div>
              </div>

              <div className="max-w-xs space-y-1.5">
                <Label>{legalType === "INDIVIDUAL" ? "CPF" : "CNPJ"}</Label>
                <Input
                  value={document}
                  onChange={(e) => setDocument(legalType === "INDIVIDUAL" ? formatCpf(e.target.value) : formatCnpj(e.target.value))}
                  placeholder={legalType === "INDIVIDUAL" ? "000.000.000-00" : "00.000.000/0000-00"}
                  inputMode="numeric"
                  maxLength={legalType === "INDIVIDUAL" ? 14 : 18}
                />
                {document ? (
                  <p className={documentValid ? "text-xs text-green-600" : "text-xs text-red-500"}>
                    {documentValid ? "Documento válido." : "Documento inválido."}
                  </p>
                ) : null}
              </div>

              <Button onClick={handleStartProfile} disabled={startProfile.isPending}>
                {startProfile.isPending ? "Enviando…" : "Enviar para verificação"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-black/50">Aguardando o responsável pela organização concluir a verificação financeira.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destino financeiro</CardTitle>
          <CardDescription>Chave Pix para onde os repasses da organização serão enviados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-black/50">Chave atual</Label>
              <p className="text-sm font-medium">{profile?.financialDestinationMasked ?? "Não configurada"}</p>
            </div>
            <div>
              <Label className="text-xs text-black/50">Status</Label>
              <p className="text-sm font-medium">{profile?.financialDestinationStatus === "VERIFIED" ? "Verificado" : "Pendente"}</p>
            </div>
          </div>

          {canManage && hasProfile ? (
            <div className="max-w-sm space-y-1.5">
              <Label>Nova chave Pix</Label>
              <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
              <Button onClick={handleSaveDestination} disabled={setDestination.isPending} className="mt-2">
                {setDestination.isPending ? "Salvando…" : "Salvar destino financeiro"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recebedor e verificação</CardTitle>
          <CardDescription>Status do repasse e da verificação de identidade da organização.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-black/50">Recebedor</Label>
              <p className="text-sm font-medium">{profile?.hasRecipient ? "Configurado" : "Não configurado"}</p>
            </div>
            <div>
              <Label className="text-xs text-black/50">Verificação de identidade</Label>
              <p className="text-sm font-medium">{profile?.kycStatus === "APPROVED" ? "Aprovada" : "Pendente"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
