"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "@/lib/axios";
import { formatCpf, formatCnpj, normalizeDigits, validateCpf, validateCnpj, validatePixKey } from "@/lib/br-data";
import { VERIFICATION_STATUS_LABEL, type LegalType, type VerificationStatus } from "@/services/venue-legal-financial";
import { BlockSkeleton } from "../../_components/states/loading-state";
import {
  useCreateRecipient,
  useLegalFinancialProfile,
  useSetBankAccount,
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
  FINANCIAL_REVIEW_REQUIRED: "secondary",
};

export function DadosJuridicosFinanceirosTab({ orgId, canManage }: { orgId: number; canManage: boolean }) {
  const { data: profile, isLoading } = useLegalFinancialProfile(orgId);
  const startProfile = useStartLegalProfile(orgId);
  const setDestination = useSetFinancialDestination(orgId);
  const setBankAccount = useSetBankAccount(orgId);
  const createRecipient = useCreateRecipient(orgId);

  const [legalType, setLegalType] = useState<LegalType>("INDIVIDUAL");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [document, setDocument] = useState("");
  const [pixKey, setPixKey] = useState("");

  const [holderName, setHolderName] = useState("");
  const [bank, setBank] = useState("");
  const [branchNumber, setBranchNumber] = useState("");
  const [branchCheckDigit, setBranchCheckDigit] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountCheckDigit, setAccountCheckDigit] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");

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

  const handleSaveBankAccount = () => {
    if (!holderName.trim() || !bank || !branchNumber || !accountNumber || !accountCheckDigit) {
      toast.error("Preencha todos os campos obrigatórios da conta bancária.");
      return;
    }
    setBankAccount.mutate(
      {
        holderName: holderName.trim(),
        bank,
        branchNumber,
        branchCheckDigit: branchCheckDigit || undefined,
        accountNumber,
        accountCheckDigit,
        accountType,
      },
      {
        onSuccess: () => {
          toast.success(
            profile?.verificationStatus === "VERIFIED"
              ? "Conta bancária salva. O recebedor está sendo criado na Pagar.me."
              : "Conta bancária salva. O recebedor será criado assim que a verificação for aprovada.",
          );
          setHolderName("");
          setBank("");
          setBranchNumber("");
          setBranchCheckDigit("");
          setAccountNumber("");
          setAccountCheckDigit("");
        },
        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar a conta bancária.")),
      },
    );
  };

  const handleCreateRecipient = () => {
    createRecipient.mutate(undefined, {
      onSuccess: () => toast.success("Recebedor criado na Pagar.me."),
      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível criar o recebedor.")),
    });
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

      {canManage && hasProfile && !profile?.hasRecipient ? (
        <Card>
          <CardHeader>
            <CardTitle>Conta bancária</CardTitle>
            <CardDescription>
              Conta para onde os repasses da organização serão transferidos. Precisa estar no mesmo CPF/CNPJ da
              organização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.bankAccountMasked ? (
              <p className="text-sm text-black/60">
                Conta atual: <span className="font-medium text-black">{profile.bankAccountMasked}</span>
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label>Nome do titular</Label>
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Igual ao nome legal cadastrado" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Banco (código)</Label>
                <Input value={bank} onChange={(e) => setBank(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 001" inputMode="numeric" maxLength={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Agência</Label>
                <Input value={branchNumber} onChange={(e) => setBranchNumber(e.target.value.replace(/\D/g, ""))} placeholder="0000" inputMode="numeric" maxLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label>Dígito da agência (opcional)</Label>
                <Input value={branchCheckDigit} onChange={(e) => setBranchCheckDigit(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={1} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Conta</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} placeholder="00000000" inputMode="numeric" maxLength={13} />
              </div>
              <div className="space-y-1.5">
                <Label>Dígito da conta</Label>
                <Input value={accountCheckDigit} onChange={(e) => setAccountCheckDigit(e.target.value.replace(/[^0-9xX]/g, ""))} inputMode="text" maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de conta</Label>
                <Select value={accountType} onValueChange={(v) => setAccountType(v as "checking" | "savings")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSaveBankAccount} disabled={setBankAccount.isPending}>
              {setBankAccount.isPending ? "Salvando…" : "Salvar conta bancária"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Recebedor e verificação</CardTitle>
          <CardDescription>Status do repasse e da verificação de identidade da organização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {canManage && !profile?.hasRecipient && profile?.verificationStatus === "VERIFIED" && profile?.bankAccountMasked ? (
            <div>
              {profile?.recipientAttemptState === "RECIPIENT_ERROR" ? (
                <>
                  <p className="text-xs text-red-600 mb-1">
                    A última tentativa de criar o recebedor falhou{profile.recipientLastError ? `: ${profile.recipientLastError}` : "."}
                  </p>
                  <p className="text-xs text-black/50 mb-2">Corrija os dados se necessário e tente novamente.</p>
                </>
              ) : profile?.recipientAttemptState === "RECIPIENT_IN_PROGRESS" ? (
                <p className="text-xs text-black/50 mb-2">Já existe uma tentativa de criação em andamento. Aguarde antes de tentar de novo.</p>
              ) : (
                <p className="text-xs text-black/50 mb-2">
                  O recebedor normalmente é criado automaticamente após a aprovação. Se isso não aconteceu, tente
                  manualmente:
                </p>
              )}
              <Button
                variant="outline"
                onClick={handleCreateRecipient}
                disabled={createRecipient.isPending || profile?.recipientAttemptState === "RECIPIENT_IN_PROGRESS"}
              >
                {createRecipient.isPending
                  ? "Criando…"
                  : profile?.recipientAttemptState === "RECIPIENT_ERROR"
                    ? "Tentar novamente"
                    : "Criar recebedor agora"}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
