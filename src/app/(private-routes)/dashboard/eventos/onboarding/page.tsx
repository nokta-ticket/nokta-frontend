"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { Check, ChevronLeft, ChevronRight, FileText, Layers, ListChecks, RefreshCw } from "lucide-react";
import {
  BusinessNeedGroupsPicker,
  createDefaultSelection,
  flattenSelection,
  type BusinessNeedSelectionState,
} from "../../_components/business-needs/business-need-groups-picker";
import { BusinessNeedActivationSummary } from "../../_components/business-needs/business-need-activation-summary";
import { useActivateBusinessNeeds, useBusinessNeedsCatalog, usePreviewBusinessNeedsActivation } from "../../_hooks/use-platform";
import { BlockSkeleton } from "../../_components/states/loading-state";

const STEPS = [
  { label: "Identificação", icon: Check },
  { label: "Operação", icon: Layers },
  { label: "Termos", icon: FileText },
  { label: "Resumo", icon: ListChecks },
];

const BUSINESS_NAME_DRAFT_KEY = "nokta_onboarding_business_name_draft";

type PhoneRecheckPhase = "idle" | "sending" | "code" | "verifying";

interface OnboardingProgress {
  createdOrgId: number;
  step: number;
}

function progressKey(userId: number | null): string | null {
  return userId ? `nokta_onboarding_progress_${userId}` : null;
}

function loadProgress(userId: number | null): OnboardingProgress | null {
  const key = progressKey(userId);
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingProgress;
    if (typeof parsed.createdOrgId !== "number" || typeof parsed.step !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(userId: number | null, progress: OnboardingProgress) {
  const key = progressKey(userId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // localStorage indisponível (modo privado etc.) — F5 nesse caso volta pro início, sem quebrar o fluxo.
  }
}

function clearProgress(userId: number | null) {
  const key = progressKey(userId);
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // idem acima.
  }
}

export default function PlatformOnboardingPage() {
  const { signIn, user, userId, role, nivelProdutor } = useAuth();
  const { organizations, loadingOrgs } = useOrganizations();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [creatingWorkspaceOnly, setCreatingWorkspaceOnly] = useState(false);

  // Workspace criado ao sair da etapa de Identificação — as etapas
  // seguintes (Operação/Termos/Resumo) precisam de um organizationId real,
  // já que a ativação de capacidades é sempre escopada por organização
  // (resolve dependências contra o que já está ACTIVE nela).
  const [createdOrgId, setCreatedOrgId] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  // Distingue "ainda não sei se há progresso salvo" (evita flash da etapa 0
  // antes de checar localStorage) de "sei que não há" — só relevante no
  // primeiro render.
  const [progressChecked, setProgressChecked] = useState(false);

  // Telefone já foi confirmado no cadastro (OTP via WhatsApp) — esta
  // reverificação só entra em cena se `telefoneVerificado` ficou `false`
  // por alguma inconsistência (ex.: usuário trocou o telefone em Perfil
  // entre o cadastro e completar este onboarding, ver auth.service.ts
  // `updateProfile`). Nunca é o caminho normal.
  const [phoneRecheckPhase, setPhoneRecheckPhase] = useState<PhoneRecheckPhase>("idle");
  const [phoneRecheckCode, setPhoneRecheckCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const catalog = useBusinessNeedsCatalog(createdOrgId);
  const [selection, setSelection] = useState<BusinessNeedSelectionState | null>(null);
  const preview = usePreviewBusinessNeedsActivation(createdOrgId ?? -1);
  const activateNeeds = useActivateBusinessNeeds(createdOrgId ?? -1);

  useEffect(() => {
    if (catalog.data && !selection) setSelection(createDefaultSelection(catalog.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.data]);

  const accessAlreadyActive = role === "PRODUTOR" && (nivelProdutor ?? 0) >= 1;

  // Recupera progresso salvo (F5 no meio do onboarding) — sem isso, um
  // reload no meio de "Operação"/"Termos"/"Resumo" perdia createdOrgId e a
  // tela caía em "Acesso já configurado" (o workspace já existe de
  // verdade), dando a impressão de que tudo tinha sido concluído quando na
  // real o usuário só recarregou a página.
  useEffect(() => {
    if (progressChecked || loadingOrgs) return;
    const saved = loadProgress(userId);
    if (saved && organizations.some((o) => o.id === saved.createdOrgId)) {
      setCreatedOrgId(saved.createdOrgId);
      setStep(saved.step);
    }
    setProgressChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressChecked, loadingOrgs, userId]);

  useEffect(() => {
    if (createdOrgId && progressChecked) saveProgress(userId, { createdOrgId, step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, step, progressChecked]);

  // Caminho "só falta criar workspace" (needsWorkspaceOnly, abaixo): o
  // workspace acabou de ser criado agora mesmo — segue direto pra etapa
  // "Operação", sem repetir Identificação (já não faz sentido nesse
  // caminho, o acesso já estava ativo antes desta tela).
  useEffect(() => {
    if (createdOrgId && accessAlreadyActive && step < 1) setStep(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, accessAlreadyActive]);

  // Acesso ativado não significa workspace criado — ver
  // handleCreateWorkspace. Contas que ativaram o acesso antes dessa etapa
  // existir (ou cuja criação de workspace falhou naquele momento) ficam com
  // accessAlreadyActive=true e organizations=[]: sem esta checagem elas
  // caíam na tela "Acesso já configurado" (que só linka pra
  // /dashboard/inicio) sem NUNCA ter a chance de criar um workspace.
  const needsWorkspaceOnly = accessAlreadyActive && !loadingOrgs && organizations.length === 0 && !createdOrgId;
  const alreadyConfigured = accessAlreadyActive && progressChecked && !needsWorkspaceOnly && !createdOrgId;
  const phoneNeedsRecheck = !!user && user.telefoneVerificado !== true;
  const isSendingPhoneCode = phoneRecheckPhase === "sending";
  const isVerifyingPhoneCode = phoneRecheckPhase === "verifying";
  const showPhoneCodeInput = phoneRecheckPhase === "code" || phoneRecheckPhase === "verifying";

  const canAdvance = () => {
    if (step === 0) return businessName.trim().length >= 2;
    if (step === 1) return (selection?.selectedGroupKeys.size ?? 0) > 0;
    if (step === 2) return aceitouTermos && !phoneNeedsRecheck;
    return true;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = window.setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleSendPhoneRecheckCode = async () => {
    setPhoneRecheckPhase("sending");
    try {
      await api.post("/auth/reverificar-telefone/reenviar");
      setPhoneRecheckPhase("code");
      setPhoneRecheckCode("");
      startResendTimer();
      toast.success("Código enviado no WhatsApp.");
    } catch (error) {
      setPhoneRecheckPhase("idle");
      toast.error(getErrorMessage(error, "Não foi possível enviar o código."));
    }
  };

  const handleConfirmPhoneRecheck = async () => {
    if (phoneRecheckCode.replace(/\D/g, "").length < 4) return;
    setPhoneRecheckPhase("verifying");
    try {
      const response = await api.post("/auth/reverificar-telefone/confirmar", {
        token: phoneRecheckCode,
      });
      signIn(response.data.user);
      toast.success("Telefone verificado.");
    } catch (error) {
      setPhoneRecheckPhase("code");
      toast.error(getErrorMessage(error, "Código inválido. Verifique e tente novamente."));
    }
  };

  const persistBusinessNameDraft = (name: string) => {
    try {
      window.localStorage.setItem(BUSINESS_NAME_DRAFT_KEY, name);
    } catch {
      // localStorage indisponível (modo privado etc.) — não bloqueia o fluxo.
    }
  };

  // Etapa 0→1: ativa o acesso (se ainda não ativo) e cria o workspace com o
  // nome já informado. Não ativa nenhuma capacidade aqui — isso é decidido
  // na etapa "Operação" logo em seguida, com o workspace já existindo.
  const handleCreateWorkspace = async () => {
    if (businessName.trim().length < 2) return;
    setLoading(true);

    try {
      if (!accessAlreadyActive) {
        const response = await api.post("/auth/ativar-produtor", {
          nomeArtistico: businessName.trim(),
          aceitouTermos: true,
        });
        signIn(response.data.user);
      }

      const orgResponse = await api.post("/organizations", { nome: businessName.trim() });
      persistBusinessNameDraft(businessName.trim());
      setCreatedOrgId(orgResponse.data.id);
      setStep(1);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível continuar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  /** Caminho para contas com acesso já ativo mas sem organização nenhuma — pula direto pra criação do workspace, sem repassar por ativar-produtor. */
  const handleCreateWorkspaceOnly = async () => {
    if (businessName.trim().length < 2) return;
    setCreatingWorkspaceOnly(true);
    try {
      const orgResponse = await api.post("/organizations", { nome: businessName.trim() });
      persistBusinessNameDraft(businessName.trim());
      setCreatedOrgId(orgResponse.data.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível criar seu workspace agora. Tente novamente."));
    } finally {
      setCreatingWorkspaceOnly(false);
    }
  };

  const goToTerms = () => setStep(2);

  const goToSummary = async () => {
    if (!createdOrgId || !catalog.data || !selection || phoneNeedsRecheck || !aceitouTermos) return;
    const payload = flattenSelection(catalog.data, selection);
    try {
      await preview.mutateAsync(payload);
      setStep(3);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível montar o resumo. Tente novamente."));
    }
  };

  const handleFinish = async () => {
    if (!createdOrgId || !catalog.data || !selection) return;
    setFinishing(true);
    try {
      const payload = flattenSelection(catalog.data, selection);
      await activateNeeds.mutateAsync(payload);
      clearProgress(userId);
      // Sem setFinishing(false) aqui de propósito: window.location.href não
      // navega no mesmo tick — resetar o estado agora reabilitaria o botão
      // por uma fração de segundo antes do browser trocar de página.
      window.location.href = "/dashboard/inicio";
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível concluir. Tente novamente."));
      setFinishing(false);
    }
  };

  if (loadingOrgs || !progressChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50" />;
  }

  if (needsWorkspaceOnly) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Image src="/logo-painel.svg" alt="Nokta" width={120} height={40} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Só falta criar seu workspace</h1>
            <p className="mt-1 text-sm text-gray-500">
              Seu acesso já está ativo. Informe o nome do negócio ou operação para continuar.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Check className="text-violet-600" size={22} />
              </div>
              <div className="space-y-2">
                <label htmlFor="workspaceOnlyName" className="block text-sm font-medium text-gray-700">
                  Nome do negócio ou operação
                </label>
                <Input
                  id="workspaceOnlyName"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Ex.: Produtora Horizonte, Bar Central"
                  className="h-11"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button
                onClick={handleCreateWorkspaceOnly}
                disabled={businessName.trim().length < 2 || creatingWorkspaceOnly}
                className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {creatingWorkspaceOnly ? "Criando..." : "Continuar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <Check className="text-green-600" size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Acesso já configurado</h1>
          <p className="mt-2 text-sm text-gray-500">Sua conta já está pronta para acessar a plataforma.</p>
          <Link href="/dashboard/inicio" className="mt-6 inline-flex w-full">
            <Button className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700">
              Ir para o painel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-lg">
        <div className="mb-4 text-center">
          <Image src="/logo-painel.svg" alt="Nokta" width={96} height={32} className="mx-auto mb-2" />
          <h1 className="text-lg font-bold text-gray-900">Configure seu acesso à Nokta</h1>
          <p className="mt-1 text-sm text-gray-500">
            Conte um pouco sobre a operação que você deseja gerenciar.
          </p>
        </div>

        <div className="mb-5 flex items-center justify-center gap-2 overflow-x-auto">
          {STEPS.map((currentStep, index) => (
            <div key={currentStep.label} className="flex shrink-0 items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  index < step
                    ? "bg-violet-600 text-white"
                    : index === step
                      ? "border-2 border-violet-600 bg-white text-violet-600"
                      : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                {index < step ? <Check size={13} /> : index + 1}
              </div>
              <span className={`text-xs ${index === step ? "font-medium text-gray-900" : "text-gray-400"}`}>
                {currentStep.label}
              </span>
              {index < STEPS.length - 1 && <div className="h-px w-6 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100">
                <Check className="text-violet-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Como seu negócio será identificado?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Informe o nome da empresa, produtora, bar, estabelecimento ou operação que você representa.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Nome do negócio ou operação
                </label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Ex.: Produtora Horizonte, Bar Central"
                  className="h-11"
                  autoFocus
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100">
                <Layers className="text-violet-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Como sua operação funciona?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Marque o que descreve o seu negócio — a Nokta ativa automaticamente o que for necessário.
                </p>
              </div>

              {catalog.isLoading || !selection ? (
                <BlockSkeleton className="h-72" />
              ) : catalog.data ? (
                <BusinessNeedGroupsPicker groups={catalog.data} selection={selection} onChange={setSelection} />
              ) : null}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100">
                <FileText className="text-violet-600" size={20} />
              </div>

              {phoneNeedsRecheck ? (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Confirme seu telefone</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Identificamos uma pendência na verificação do seu telefone. Confirme novamente para continuar.
                    </p>
                  </div>

                  {!showPhoneCodeInput ? (
                    <Button
                      onClick={handleSendPhoneRecheckCode}
                      disabled={isSendingPhoneCode}
                      className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                    >
                      {isSendingPhoneCode ? "Enviando..." : "Enviar código no WhatsApp"}
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="phoneRecheckCode" className="block text-sm font-medium text-gray-700">
                          Código recebido
                        </label>
                        <Input
                          id="phoneRecheckCode"
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          value={phoneRecheckCode}
                          onChange={(event) => setPhoneRecheckCode(event.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                          className="h-11 text-center font-mono text-xl tracking-widest"
                          autoFocus
                        />
                      </div>
                      <Button
                        onClick={handleConfirmPhoneRecheck}
                        disabled={isVerifyingPhoneCode || phoneRecheckCode.length < 4}
                        className="h-11 w-full bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
                      >
                        {isVerifyingPhoneCode ? "Verificando..." : "Confirmar código"}
                      </Button>
                      <div className="flex justify-end text-xs text-gray-500">
                        <button
                          type="button"
                          onClick={handleSendPhoneRecheckCode}
                          disabled={resendTimer > 0 || isSendingPhoneCode}
                          className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RefreshCw size={12} />
                          {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar código"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Termos de uso</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Para continuar, confirme que leu e aceita os Termos de Uso da Nokta e a Política de Privacidade.
                    </p>
                  </div>
                  <label
                    htmlFor="termos"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-gray-300"
                  >
                    <Checkbox
                      id="termos"
                      checked={aceitouTermos}
                      onCheckedChange={(value) => setAceitouTermos(Boolean(value))}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm leading-relaxed text-gray-700">
                      Li e aceito os{" "}
                      <Link href="/termos" target="_blank" className="font-medium text-violet-700 underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link href="/privacidade" target="_blank" className="font-medium text-violet-700 underline">
                        Política de Privacidade
                      </Link>{" "}
                      da Nokta.
                    </span>
                  </label>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100">
                <ListChecks className="text-violet-600" size={20} />
              </div>
              {catalog.data ? (
                <BusinessNeedActivationSummary groups={catalog.data} preview={preview.data} isLoading={preview.isPending} />
              ) : null}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {step === 1 && (
              <Button variant="outline" onClick={() => setStep(0)} className="h-11 flex-1" disabled={accessAlreadyActive}>
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} className="h-11 flex-1">
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}
            {step === 3 && (
              <Button variant="outline" onClick={() => setStep(2)} className="h-11 flex-1" disabled={finishing}>
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}

            {step === 0 && (
              <Button
                onClick={handleCreateWorkspace}
                disabled={!canAdvance() || loading}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {loading ? "Continuando..." : "Continuar"}
                {!loading && <ChevronRight size={16} className="ml-1" />}
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={goToTerms}
                disabled={!canAdvance()}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                Continuar
                <ChevronRight size={16} className="ml-1" />
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={goToSummary}
                disabled={!canAdvance() || preview.isPending}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {preview.isPending ? "Preparando..." : "Continuar"}
                {!preview.isPending && <ChevronRight size={16} className="ml-1" />}
              </Button>
            )}

            {step === 3 && (
              <Button
                onClick={handleFinish}
                disabled={finishing}
                className="h-11 flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed"
              >
                {finishing ? "Configurando..." : "Configurar meu workspace"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
