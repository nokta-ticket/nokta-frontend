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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid2x2,
  Layers,
  Lightbulb,
  ListChecks,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import {
  BusinessNeedGroupsPicker,
  createDefaultSelection,
  flattenSelection,
  type BusinessNeedSelectionState,
} from "../../_components/business-needs/business-need-groups-picker";
import { BusinessNeedActivationSummary } from "../../_components/business-needs/business-need-activation-summary";
import { useActivateBusinessNeeds, useBusinessNeedsCatalog, usePreviewBusinessNeedsActivation } from "../../_hooks/use-platform";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { OnboardingExtras } from "./_components/onboarding-extras";

const STEP_COUNT = 4;

const IDENTIFICATION_BENEFITS = [
  {
    icon: Grid2x2,
    title: "Centralize tudo em um só lugar",
    description: "Gerencie eventos, vendas, equipe e finanças.",
  },
  {
    icon: UsersRound,
    title: "Convide sua equipe",
    description: "Defina papéis e permissões para cada pessoa.",
  },
  {
    icon: Target,
    title: "Escalável",
    description: "Crie quantas organizações precisar.",
  },
];

const IDENTIFICATION_NEXT_STEPS = [
  {
    icon: Sparkles,
    title: "Crie sua primeira organização",
    description: "Comece do zero e configure seu espaço.",
  },
  {
    icon: UsersRound,
    title: "Convide sua equipe",
    description: "Chame pessoas para te ajudar a operar.",
  },
  {
    icon: Lightbulb,
    title: "Explore todos os recursos",
    description: "Libere o potencial da Nokta.",
  },
];

function OnboardingStepper({ step }: { step: number }) {
  return (
    <div className="mx-auto mb-8 flex w-full max-w-[340px] items-center justify-center">
      {Array.from({ length: STEP_COUNT }, (_, i) => i).map((index) => {
        const active = index === step;
        return (
          <div key={index} className="flex flex-1 items-center last:flex-initial">
            <div
              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                active
                  ? "border-transparent bg-gradient-to-br from-violet-600 to-[#6d28d9] text-white shadow-[0_3px_8px_rgba(109,40,217,0.3)]"
                  : "border-[#e7e5ee] bg-white text-[#b4b2be]"
              }`}
            >
              {index + 1}
            </div>
            {index < STEP_COUNT - 1 && <div className="mx-1 h-[1.5px] flex-1 bg-[#e7e5ee]" />}
          </div>
        );
      })}
    </div>
  );
}

const BUSINESS_NAME_DRAFT_KEY = "nokta_onboarding_business_name_draft";

type PhoneRecheckPhase = "idle" | "sending" | "code" | "verifying";

interface OnboardingProgress {
  createdOrgId: number;
  step: number;
  skippedIdentification?: boolean;
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
  const { organizations, loadingOrgs, refreshOrganizations } = useOrganizations();

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
  // true só quando a etapa 0 nunca foi exibida nesta sessão (veio do fluxo
  // needsWorkspaceOnly, que pula direto pra "Operação") — nesses casos não
  // há nome pra editar ao voltar. No fluxo normal (handleCreateWorkspace)
  // fica false, mesmo com accessAlreadyActive=true, pra não travar o
  // usuário que preencheu o nome e quer corrigi-lo.
  const [skippedIdentification, setSkippedIdentification] = useState(false);
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
      setSkippedIdentification(!!saved.skippedIdentification);
    }
    setProgressChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressChecked, loadingOrgs, userId]);

  // Preenche o campo de nome com o valor já salvo na organização — sem
  // isso, voltar da etapa "Operação" pra "Identificação" (ou dar F5 já
  // com createdOrgId restaurado) mostrava o campo vazio em vez do nome
  // que o usuário quer corrigir.
  useEffect(() => {
    if (!createdOrgId || businessName) return;
    const org = organizations.find((o) => o.id === createdOrgId);
    if (org) setBusinessName(org.nome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, organizations]);

  useEffect(() => {
    if (createdOrgId && progressChecked) saveProgress(userId, { createdOrgId, step, skippedIdentification });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, step, progressChecked, skippedIdentification]);

  // Caminho "só falta criar workspace" (needsWorkspaceOnly, abaixo): o
  // workspace acabou de ser criado agora mesmo — segue direto pra etapa
  // "Operação", sem repetir Identificação (já não faz sentido nesse
  // caminho, o acesso já estava ativo antes desta tela).
  useEffect(() => {
    if (createdOrgId && accessAlreadyActive && step < 1) {
      setStep(1);
      setSkippedIdentification(true);
    }
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
  // Se createdOrgId já existe, o usuário voltou da etapa "Operação" pra
  // corrigir o nome — nesse caso atualiza a org existente em vez de criar
  // uma segunda (ver PATCH /organizations/:id).
  const handleCreateWorkspace = async () => {
    if (businessName.trim().length < 2) return;
    setLoading(true);

    try {
      if (createdOrgId) {
        await api.patch(`/organizations/${createdOrgId}`, { nome: businessName.trim() });
        persistBusinessNameDraft(businessName.trim());
        await refreshOrganizations();
        setStep(1);
        return;
      }

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
      await refreshOrganizations();
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
      await refreshOrganizations();
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
    return <div className="flex h-full items-center justify-center bg-gray-50" />;
  }

  if (needsWorkspaceOnly) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-lg">
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
      <div className="flex h-full items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
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

  if (step === 0) {
    return (
      <>
      <div className="flex items-stretch gap-[22px]">
        <section className="flex flex-1 flex-col rounded-[20px] border border-[#ecebf1] bg-white px-5 pb-7 pt-[34px] md:px-10 md:pb-10">
          <div className="flex flex-col items-start gap-[30px] lg:flex-row lg:gap-[44px]">
            <div className="w-full lg:flex-[1_1_54%]">
              <span className="inline-block rounded-full bg-[#f3efff] px-3 py-1.5 text-[11.5px] font-semibold text-[#6d28d9]">
                Vamos começar
              </span>

              <h1 className="mt-4 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1a1626] md:text-[34px]">
                Crie sua primeira <span className="block text-[#6d28d9]">organização</span>
              </h1>

              <p className="mt-3.5 max-w-[400px] text-[14.5px] leading-[1.6] text-[#6b7280]">
                A organização é o espaço onde você gerencia eventos, equipe, operações e resultados.
              </p>

              <div className="mt-7 space-y-6">
                {IDENTIFICATION_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1ecfe] text-[#6d28d9]">
                        <Icon size={19} strokeWidth={1.9} />
                      </div>
                      <div>
                        <div className="text-[14.5px] font-semibold text-[#1a1626]">{benefit.title}</div>
                        <div className="mt-0.5 text-[13px] leading-[1.5] text-[#6b7280]">{benefit.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:flex-[1_1_46%]">
              <OnboardingStepper step={step} />

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleCreateWorkspace();
                }}
                className="mx-auto max-w-[420px] rounded-2xl border border-[#e7e5ee] bg-white p-6 shadow-[0_6px_24px_rgba(30,20,60,0.05)]"
              >
                <h2 className="text-[18px] font-bold tracking-[-0.01em] text-[#1a1626]">Como deseja chamar sua organização?</h2>

                <p className="mt-2 text-[12.5px] leading-[1.5] text-[#6b7280]">
                  Pode ser o nome da sua produtora, estabelecimento, empresa ou o seu próprio nome.
                </p>

                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Ex.: Produtora Horizonte, Bar Central ou Vitor Reis"
                  autoComplete="organization"
                  autoFocus
                  className="mt-[18px] h-auto rounded-[11px] border-[#e7e5ee] px-[15px] py-[13px] text-[13.5px] placeholder:text-[#a9a7b3] focus-visible:border-violet-500 focus-visible:ring-[3px] focus-visible:ring-violet-500/15"
                />

                <Button
                  type="submit"
                  disabled={!canAdvance() || loading}
                  className="mt-4 flex h-auto w-full items-center justify-center gap-2 rounded-[11px] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] py-3.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(109,40,217,0.28)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? "Continuando..." : "Continuar"}
                  {!loading && <ChevronRight className="h-4 w-4" />}
                </Button>

                <div className="mt-4 flex items-start gap-2.5 rounded-[11px] bg-[#f3efff] p-3.5">
                  <Lock size={15} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#6d28d9]" />
                  <p className="text-xs leading-[1.5] text-[#6d5b93]">
                    <b className="font-semibold text-[#5b4a86]">Somente você pode criar organizações.</b>
                    <br />
                    Depois, poderá convidar sua equipe para colaborar.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </section>

        <aside className="hidden w-[420px] shrink-0 flex-col items-center rounded-[20px] border border-[#ecebf1] bg-white px-10 py-12 text-center xl:flex">
          <h3 className="text-[19px] font-bold text-[#1a1626]">Ainda não tem uma organização</h3>

          <div className="my-8 flex w-full items-center justify-center">
            <svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-[220px]">
              <ellipse cx="100" cy="150" rx="70" ry="9" fill="#EDE7FE" />
              <path d="M35 52h130l10 20H25l10-20Z" fill="#C4B5FD" />
              <path d="M35 52h26l-4 20H31l4-20Z" fill="#A78BFA" />
              <path d="M87 52h26l0 20H87l0-20Z" fill="#A78BFA" />
              <path d="M139 52h26l4 20h-26l-4-20Z" fill="#A78BFA" />
              <rect x="35" y="72" width="130" height="70" rx="6" fill="#EDE7FE" />
              <rect x="35" y="72" width="130" height="70" rx="6" stroke="#C4B5FD" strokeWidth="2" />
              <rect x="60" y="96" width="30" height="46" rx="4" fill="#C4B5FD" />
              <circle cx="84" cy="120" r="2.2" fill="#7C3AED" />
              <rect x="105" y="96" width="42" height="30" rx="4" fill="#fff" stroke="#C4B5FD" strokeWidth="2" />
              <path d="M126 96v30M105 111h42" stroke="#C4B5FD" strokeWidth="2" />
              <circle cx="150" cy="112" r="20" fill="#7C3AED" />
              <path d="M150 104v16M142 112h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {IDENTIFICATION_NEXT_STEPS.map((next) => {
            const Icon = next.icon;
            return (
              <div key={next.title} className="mb-7 flex w-full items-start gap-4 text-left last:mb-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1ecfe] text-[#6d28d9]">
                  <Icon size={20} strokeWidth={1.9} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#1a1626]">{next.title}</div>
                  <div className="mt-1 text-[13px] leading-[1.5] text-[#6b7280]">{next.description}</div>
                </div>
              </div>
            );
          })}
        </aside>
      </div>

      <OnboardingExtras />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col items-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl bg-white shadow-sm">
          <OnboardingStepper step={step} />

          <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <Layers className="text-violet-600" size={22} />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <FileText className="text-violet-600" size={22} />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <ListChecks className="text-violet-600" size={22} />
              </div>
              {catalog.data ? (
                <BusinessNeedActivationSummary groups={catalog.data} preview={preview.data} isLoading={preview.isPending} />
              ) : null}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step === 1 && (
              <Button variant="outline" onClick={() => setStep(0)} className="h-11 flex-1" disabled={skippedIdentification}>
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
    </div>
  );
}
