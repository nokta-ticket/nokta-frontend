"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import {
  Boxes,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Grid2x2,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  ListChecks,
  Lock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import {
  createDefaultSelection,
  flattenSelection,
  type BusinessNeedSelectionState,
} from "../_components/business-needs/business-need-groups-picker";
import { BusinessNeedActivationSummary } from "../_components/business-needs/business-need-activation-summary";
import { useActivateBusinessNeeds, useBusinessNeedsCatalog, usePreviewBusinessNeedsActivation } from "../_hooks/use-platform";
import { BlockSkeleton } from "../_components/states/loading-state";
import { OnboardingExtras } from "./_components/onboarding-extras";
import type { BusinessNeedGroup, BusinessNeedKey } from "@/services/platform";

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

const OPERATION_NEXT_STEPS = [
  {
    icon: Sparkles,
    title: "Mais clareza",
    description: "Veja no menu apenas os recursos usados no seu dia a dia.",
  },
  {
    icon: Layers,
    title: "Totalmente flexível",
    description: "Ative ou desative funcionalidades depois, nas configurações.",
  },
  {
    icon: ShieldCheck,
    title: "Sem impacto nos seus dados",
    description: "Ocultar um recurso não apaga cadastros nem configurações existentes.",
  },
];

/** Tema visual (ícone + cores) por necessidade de negócio — mesma ordem/keys de BUSINESS_NEED_CATALOG (backend). */
const BUSINESS_NEED_THEME: Record<BusinessNeedKey, { icon: typeof Calendar; iconBg: string; iconColor: string; border: string }> = {
  EVENTS_TICKETING: { icon: Calendar, iconBg: "bg-[#F1ECFE]", iconColor: "text-[#7C3AED]", border: "border-[#CBBAF7]" },
  RELATIONSHIP: { icon: UsersRound, iconBg: "bg-[#E4F6EF]", iconColor: "text-[#059669]", border: "border-[#B6E6D2]" },
  OPERATION: { icon: Layers, iconBg: "bg-[#FEF0E2]", iconColor: "text-[#F97316]", border: "border-[#F7DBBB]" },
  MENU_PRODUCTS: { icon: UtensilsCrossed, iconBg: "bg-[#E7F0FE]", iconColor: "text-[#2563EB]", border: "border-[#BED7F9]" },
  STOCK_PURCHASING: { icon: Boxes, iconBg: "bg-[#ECEAFD]", iconColor: "text-[#5B4BD6]", border: "border-[#C7C0F4]" },
  MANAGEMENT: { icon: Calculator, iconBg: "bg-[#FCE8F0]", iconColor: "text-[#DB2777]", border: "border-[#F5C2D9]" },
};

/** Checkbox visual com estado indeterminado (parte dos recursos do grupo ativa) — `indeterminate` só existe como propriedade DOM, não como atributo HTML declarativo. */
function GroupCheckbox({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.6px] transition-colors ${
        checked || indeterminate ? "border-transparent bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]" : "border-[#DAD8E2] bg-white"
      }`}
    >
      <input ref={ref} type="checkbox" checked={checked} readOnly className="sr-only" />
      {indeterminate ? (
        <span className="h-[2px] w-2.5 rounded-full bg-white" />
      ) : checked ? (
        <Check size={12} strokeWidth={3} className="text-white" />
      ) : null}
    </span>
  );
}

/**
 * Painel de personalização de um grupo (etapa "Operação") — fica FORA do
 * card, logo abaixo da linha de 3 (xl:grid-cols-3) onde o grupo está,
 * de propósito: o card do grupo nunca muda de altura, então os cards
 * vizinhos da mesma linha do CSS Grid nunca esticam nem sobram espaços
 * vazios (regressão corrigida aqui — antes a lista de capacidades
 * expandia dentro do próprio card).
 */
function GroupCustomizationPanel({
  group,
  selection,
  setSelection,
  onClose,
}: {
  group: BusinessNeedGroup;
  selection: BusinessNeedSelectionState;
  setSelection: (next: BusinessNeedSelectionState) => void;
  onClose: () => void;
}) {
  const theme = BUSINESS_NEED_THEME[group.key];
  const isSelected = selection.selectedGroupKeys.has(group.key);
  const deselected = selection.deselectedCapabilityKeysByGroup.get(group.key) ?? new Set<string>();

  return (
    <div className="col-span-full rounded-[15px] border border-[#ECE6F8] bg-[#FBFAFE] p-[18px_20px_20px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[14px] font-bold text-[#1a1626]">{group.label}</div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-[#6b7280]">
            Escolha individualmente os recursos deste grupo que você quer usar.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-3.5 py-2 text-[11.5px] font-semibold text-[#6d28d9] shadow-[0_1px_3px_rgba(80,40,160,0.12)] hover:brightness-105"
        >
          Concluir personalização
          <Check size={13} strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-[#f1eff5] pt-4 sm:grid-cols-2 xl:grid-cols-3">
        {group.capabilities.map((capability) => {
          const checked = isSelected ? capability.required || !deselected.has(capability.key) : false;
          const interactive = !capability.required;
          const toggleCapability = () => {
            if (!interactive) return;

            if (!isSelected) {
              // Grupo ainda não ativado: marcar o primeiro item pela
              // personalização ativa o grupo ("Ativar este grupo" reflete
              // isso), mas só esse item fica ligado — os demais (exceto os
              // `required`, sempre ligados) entram como desmarcados, ao
              // contrário de "Ativar este grupo" direto, que liga tudo.
              const nextGroups = new Set(selection.selectedGroupKeys);
              nextGroups.add(group.key);
              const nextByGroup = new Map(selection.deselectedCapabilityKeysByGroup);
              nextByGroup.set(
                group.key,
                new Set(group.capabilities.filter((c) => !c.required && c.key !== capability.key).map((c) => c.key)),
              );
              setSelection({ ...selection, selectedGroupKeys: nextGroups, deselectedCapabilityKeysByGroup: nextByGroup });
              return;
            }

            const nextByGroup = new Map(selection.deselectedCapabilityKeysByGroup);
            const current = new Set(nextByGroup.get(group.key) ?? []);
            if (current.has(capability.key)) current.delete(capability.key);
            else current.add(capability.key);
            nextByGroup.set(group.key, current);
            setSelection({ ...selection, deselectedCapabilityKeysByGroup: nextByGroup });
          };
          return (
            <button
              key={capability.key}
              type="button"
              onClick={toggleCapability}
              disabled={!interactive}
              className={`flex items-start gap-2.5 text-left text-xs ${interactive ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] ${
                  checked ? `${theme.iconColor} bg-current` : "border-[1.6px] border-[#D7D5E0] bg-white"
                }`}
              >
                {checked && <Check size={11} strokeWidth={3} className="text-white" />}
              </span>
              <span className="text-[#1a1626]">{capability.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  // Etapa "Termos" (3): 3 confirmações independentes, todas obrigatórias.
  // A terceira (recursos específicos) só existe/conta quando o grupo
  // EVENTS_TICKETING foi selecionado na etapa "Operação" — ver `aceitouTermos` abaixo.
  const [authorizedToAdminister, setAuthorizedToAdminister] = useState(false);
  const [acknowledgedLegalData, setAcknowledgedLegalData] = useState(false);
  const [acceptedSpecificTerms, setAcceptedSpecificTerms] = useState(false);
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
  // "Personalizar recursos" na etapa "Operação": qual grupo tem o painel de
  // capacidades individuais aberto (no máximo um por vez — abrir outro
  // fecha o anterior). Só controla se o painel aparece, não afeta a
  // seleção em si. O painel fica fora do grid de cards (col-span-full,
  // logo abaixo da linha do grupo) de propósito: os cards nunca mudam de
  // altura, evitando o desalinhamento que expandir o card causava.
  const [customizingGroupKey, setCustomizingGroupKey] = useState<string | null>(null);
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
  //
  // localStorage é só um atalho de UX (lembra também o passo exato dentro
  // da etapa "Operação"/"Termos"/"Resumo") — não é a fonte de verdade. Ele
  // não existe em outro navegador, aba anônima ou depois de limpar dados,
  // e nesses casos o passo abaixo (organizations vindo do backend) sempre
  // resolve pelo menos "existe organização sem nenhuma capacidade ativada
  // pelo onboarding" -> volta pra etapa "Operação", nunca deixa cair em
  // "Acesso já configurado" por engano.
  useEffect(() => {
    if (progressChecked || loadingOrgs) return;
    const saved = loadProgress(userId);
    if (saved && organizations.some((o) => o.id === saved.createdOrgId)) {
      setCreatedOrgId(saved.createdOrgId);
      setStep(saved.step);
      setSkippedIdentification(!!saved.skippedIdentification);
    } else {
      const pending = organizations.find((o) => !o.onboardingCompleted);
      if (pending) {
        setCreatedOrgId(pending.id);
        setStep(1);
        setSkippedIdentification(true);
      }
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

  // Termos de bilheteria (3º card) são sempre obrigatórios, mesmo sem o grupo
  // EVENTS_TICKETING selecionado agora — cobre ativar bilheteria depois pelo
  // Explore a Nokta, onde não existe (ainda) um modal de aceite de termos.
  // `requiresTicketingTerms` só ajusta o texto de apoio do card, não se ele
  // aparece nem se é obrigatório.
  const requiresTicketingTerms = selection?.selectedGroupKeys.has("EVENTS_TICKETING") ?? false;
  const aceitouTermos = authorizedToAdminister && acknowledgedLegalData && acceptedSpecificTerms;

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

  // Marca/desmarca um card de módulo na etapa "Operação" — sempre reseta as
  // exceções individuais de capacidade dele (mesma regra de
  // BusinessNeedGroupsPicker.toggleGroup): selecionar liga tudo por padrão,
  // desmarcar tira tudo, sem sobra de uma seleção parcial anterior.
  const toggleBusinessNeedGroup = (groupKey: string) => {
    if (!selection) return;
    const nextGroups = new Set(selection.selectedGroupKeys);
    const nextDeselected = new Map(selection.deselectedCapabilityKeysByGroup);
    nextDeselected.delete(groupKey);

    if (nextGroups.has(groupKey)) {
      nextGroups.delete(groupKey);
    } else {
      nextGroups.add(groupKey);
    }
    setSelection({ ...selection, selectedGroupKeys: nextGroups, deselectedCapabilityKeysByGroup: nextDeselected });
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
        <section className="flex flex-1 flex-col rounded-[20px] border border-[#ecebf1] bg-white px-5 pb-6 pt-6 md:px-10 md:pb-8 md:pt-8">
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

        {/*
          Largura calculada pra bater exatamente com a 3ª coluna da grid de
          OnboardingExtras (1.1fr 1.55fr 1fr, gap 22px): col3 = (100% - 2×22px) × (1/3.65).
          Valores fixos em px só coincidem numa resolução — isto acompanha
          qualquer largura de tela, os dois blocos ficam sempre alinhados.
        */}
        <aside
          className="hidden shrink-0 flex-col items-center rounded-[20px] border border-[#ecebf1] bg-white px-10 py-8 text-center xl:flex"
          style={{ width: "calc((100% - 44px) * (1 / 3.65))" }}
        >
          <h3 className="text-[21px] font-bold text-[#1a1626]">Ainda não tem uma organização</h3>

          <div className="my-8 flex w-full items-center justify-center">
            <svg viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-[240px]">
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

  if (step === 1) {
    const orgName = organizations.find((o) => o.id === createdOrgId)?.nome ?? businessName;
    const selectedCount = selection?.selectedGroupKeys.size ?? 0;

    return (
      <div className="flex h-full items-stretch gap-[22px]">
        <section className="flex flex-1 flex-col rounded-[20px] border border-[#ecebf1] bg-white px-5 pb-6 pt-6 md:px-10 md:pb-8 md:pt-8">
          <OnboardingStepper step={step} />

          <div className="flex flex-1 flex-col items-start gap-9 lg:flex-row">
            <div className="w-full space-y-6 lg:w-[280px] lg:shrink-0">
              <div>
                <span className="inline-block rounded-full bg-[#f3efff] px-3 py-1.5 text-[11.5px] font-semibold text-[#6d28d9]">
                  Vamos continuar
                </span>
                <h1 className="mt-4 text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1a1626] md:text-[27px]">
                  Como funciona a sua <span className="text-[#6d28d9]">operação?</span>
                </h1>
                <p className="mt-3.5 text-[13.5px] leading-[1.6] text-[#6b7280]">
                  Selecione os recursos que pretende utilizar agora. A Nokta personalizará seu painel para exibir somente o que fizer sentido para a sua operação.
                </p>
              </div>

              <div className="rounded-2xl border border-[#ECE6F8] bg-[#F6F3FC] p-[18px]">
                <div className="mb-3.5 flex items-center gap-2.5">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#EDE7FE] text-[#6d28d9]">
                    <Layers size={17} strokeWidth={1.9} />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1a1626]">Sua organização</span>
                </div>
                <div className="text-[16px] font-bold text-[#1a1626]">{orgName}</div>
                <p className="mt-1.5 text-xs leading-[1.5] text-[#6b7280]">
                  Este é o nome que será mostrado no painel para você e para a sua equipe.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#6d28d9] hover:underline"
                >
                  <Pencil size={13} />
                  Editar nome de exibição
                </button>
                <div className="mt-4 flex items-start gap-2.5 rounded-[11px] bg-[#EFEAFA] p-3">
                  <ShieldCheck size={14} strokeWidth={1.9} className="mt-0.5 shrink-0 text-[#6d28d9]" />
                  <p className="text-[11px] leading-[1.5] text-[#5F5580]">
                    O nome de exibição pode ser ajustado depois. Dados jurídicos, como razão social e CPF/CNPJ, são tratados à parte e podem exigir nova verificação após o KYC.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-1 flex-col">
              <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[#1a1626]">Selecione as áreas que fazem parte da sua operação</h2>
              <p className="mt-1.5 text-[12.5px] text-[#6b7280]">
                Clique no card para ativar todos os recursos do grupo ou personalize as funcionalidades individualmente.
              </p>

              {catalog.isLoading || !selection ? (
                <BlockSkeleton className="mt-5 h-72" />
              ) : catalog.data ? (
                <div className="mt-5 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {catalog.data.map((group, index) => {
                    const theme = BUSINESS_NEED_THEME[group.key];
                    const Icon = theme.icon;
                    const isSelected = selection.selectedGroupKeys.has(group.key);
                    const deselected = selection.deselectedCapabilityKeysByGroup.get(group.key) ?? new Set<string>();
                    const activeCount = group.capabilities.filter((c) => c.required || !deselected.has(c.key)).length;
                    const totalCount = group.capabilities.length;
                    const isPartial = isSelected && activeCount < totalCount;
                    const isCustomizing = customizingGroupKey === group.key;

                    const toggleCustomize = () => {
                      setCustomizingGroupKey((prev) => (prev === group.key ? null : group.key));
                    };

                    // Painel de personalização fica FORA do card (nunca faz o card
                    // crescer) e é inserido logo após a linha de 3 (xl:grid-cols-3,
                    // o layout de referência) onde o grupo aberto está — col-span-full
                    // sempre quebra pra próxima linha do grid, então também funciona
                    // nos breakpoints menores (sm:2col, mobile:1col), só não fica
                    // "colado" exatamente na linha visual deles.
                    const isEndOfRow = (index + 1) % 3 === 0;
                    const isLastCard = index === catalog.data.length - 1;
                    const customizingInThisRow =
                      customizingGroupKey !== null &&
                      catalog.data
                        .slice(index - (index % 3), index + 1)
                        .some((g) => g.key === customizingGroupKey) &&
                      (isEndOfRow || isLastCard);

                    return (
                      <Fragment key={group.key}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleBusinessNeedGroup(group.key)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleBusinessNeedGroup(group.key);
                            }
                          }}
                          aria-pressed={isSelected}
                          className={`relative cursor-pointer rounded-[15px] border p-[18px_16px_16px] transition-colors ${
                            isSelected ? `${theme.border} bg-[#FBFAFE]` : "border-[#ecebf1] bg-white"
                          } ${isCustomizing ? "ring-2 ring-[#7C3AED]/25" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-[13px] ${theme.iconBg} ${theme.iconColor}`}>
                              <Icon size={22} strokeWidth={1.9} />
                            </div>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleBusinessNeedGroup(group.key);
                              }}
                              className="flex items-center gap-2 text-[11.5px] font-semibold text-[#6b7280]"
                            >
                              Ativar este grupo
                              <GroupCheckbox checked={isSelected && !isPartial} indeterminate={isPartial} />
                            </button>
                          </div>

                          <div className="mt-3.5 text-[14px] font-bold text-[#1a1626]">{group.label}</div>
                          <div className="mt-1.5 text-[11.5px] leading-[1.5] text-[#6b7280]">{group.description}</div>

                          <span
                            className={`mt-3.5 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isSelected ? `${theme.iconBg} ${theme.iconColor}` : "bg-black/[0.04] text-[#6b7280]"
                            }`}
                          >
                            {isPartial ? `${activeCount} de ${totalCount} recursos` : `${totalCount} recursos incluídos`}
                          </span>

                          <p className="mt-2.5 text-[11px] leading-[1.5] text-[#9a98a6]">
                            {group.capabilities.map((c) => c.label).join(", ")}.
                          </p>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleCustomize();
                            }}
                            className="-m-2.5 mt-1 flex items-center gap-1 p-2.5 text-[11.5px] font-semibold text-[#6d28d9] hover:underline"
                          >
                            Personalizar recursos
                            <ChevronDown size={13} className={`transition-transform ${isCustomizing ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {customizingInThisRow ? (
                          <GroupCustomizationPanel
                            group={catalog.data.find((g) => g.key === customizingGroupKey)!}
                            selection={selection}
                            setSelection={setSelection}
                            onClose={() => setCustomizingGroupKey(null)}
                          />
                        ) : null}
                      </Fragment>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-auto">
                <div className="mt-8 flex items-start gap-3 rounded-[13px] border border-[#E9E1FB] bg-[#f3efff] p-3.5">
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-white text-[#6d28d9] shadow-[0_2px_5px_rgba(80,40,160,0.12)]">
                    <Info size={15} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#3A2E63]">Seu painel ficará mais organizado</div>
                    <p className="mt-0.5 text-xs leading-[1.55] text-[#6A5E90]">
                      Os recursos não selecionados ficam ocultos para reduzir a poluição visual. Você poderá ativá-los depois em Configurações, sem refazer o cadastro nem perder informações.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    onClick={goToTerms}
                    disabled={!canAdvance()}
                    className="flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white hover:brightness-105 disabled:cursor-not-allowed"
                  >
                    {selectedCount > 0
                      ? `Continuar com ${selectedCount} ${selectedCount > 1 ? "áreas selecionadas" : "área selecionada"}`
                      : "Continuar"}
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden w-[288px] shrink-0 flex-col justify-center rounded-[20px] border border-[#ECE6F8] bg-[#F6F3FC] px-6 py-8 xl:flex">
          <h3 className="text-[16px] font-bold leading-[1.3] tracking-[-0.01em] text-[#1a1626]">
            Um painel feito para a sua operação
          </h3>
          <p className="mt-3 text-[12.5px] leading-[1.6] text-[#6b7280]">
            Ao finalizar, a navegação será organizada de acordo com os recursos selecionados
            {selectedCount > 0 ? ` (${selectedCount} selecionado${selectedCount > 1 ? "s" : ""})` : ""}. Você começa com uma área mais simples e ativa novas funcionalidades conforme precisar.
          </p>

          <div className="my-6 flex w-full items-center justify-center">
            <svg viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full max-w-[210px]">
              <ellipse cx="120" cy="150" rx="95" ry="18" fill="#ECE6F8" />
              <circle cx="205" cy="52" r="4" fill="#C4B5FD" />
              <path d="M30 60v10M25 65h10" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
              <rect x="66" y="34" width="120" height="86" rx="12" fill="#EDE7FE" />
              <rect x="48" y="52" width="120" height="80" rx="12" fill="#fff" stroke="#DED3F6" strokeWidth="1.6" />
              <rect x="48" y="52" width="120" height="20" rx="12" fill="#F4EFFD" />
              <circle cx="60" cy="62" r="2.4" fill="#C4B5FD" />
              <circle cx="69" cy="62" r="2.4" fill="#D9CDF3" />
              <circle cx="78" cy="62" r="2.4" fill="#E5DCF6" />
              <rect x="62" y="86" width="15" height="15" rx="4" fill="#7C3AED" />
              <path d="m66 93.5 2.5 2.5 4-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="84" y="90" width="62" height="6" rx="3" fill="#E3D9F8" />
              <rect x="62" y="108" width="15" height="15" rx="4" fill="#A78BFA" />
              <path d="m66 115.5 2.5 2.5 4-4.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="84" y="112" width="48" height="6" rx="3" fill="#ECE4FA" />
              <path d="M150 108l26 10-11 3-3 11-12-24Z" fill="#6D28D9" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>

          {OPERATION_NEXT_STEPS.map((next) => {
            const Icon = next.icon;
            return (
              <div key={next.title} className="mb-5 flex w-full items-start gap-3 text-left last:mb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EDE7FE] text-[#6d28d9]">
                  <Icon size={16} strokeWidth={1.9} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1a1626]">{next.title}</div>
                  <div className="mt-0.5 text-xs leading-[1.5] text-[#6b7280]">{next.description}</div>
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    );
  }

  if (step === 2) {
    const orgName = organizations.find((o) => o.id === createdOrgId)?.nome ?? businessName;
    const fullName = user ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() : "";
    const selectedGroups = catalog.data?.filter((g) => selection?.selectedGroupKeys.has(g.key)) ?? [];

    return (
      <div>
        <OnboardingStepper step={step} />

        <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[290px_minmax(0,1fr)_300px]">
        {/* ── Coluna esquerda: resumo ───────────────────────────────── */}
        <div className="flex flex-col">
          <span className="inline-block w-fit rounded-full bg-[#f3efff] px-3 py-1.5 text-[11.5px] font-semibold text-[#6d28d9]">
            Vamos continuar
          </span>
          <h1 className="mt-4 text-[26px] font-extrabold leading-[1.18] tracking-[-0.02em] text-[#1a1626]">
            Antes de concluir, confirme sua <span className="text-[#6d28d9]">responsabilidade</span>
          </h1>
          <p className="mt-3.5 text-[13.5px] leading-[1.6] text-[#6b7280]">
            Você será o responsável inicial por esta organização e poderá convidar outras pessoas para ajudar na gestão.
          </p>

          <div className="mt-6 rounded-2xl border border-[#ece6f8] bg-[#fcfbfe] p-5">
            <div className="mb-4 text-xs font-semibold text-[#6d28d9] opacity-85">Resumo da organização</div>
            <div className="mb-4 flex items-center gap-2.5 border-b border-[#efecf6] pb-4">
              <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#ede7fe] text-[#6d28d9]">
                <Grid2x2 size={19} strokeWidth={1.8} />
              </div>
              <div className="text-[15px] font-bold text-[#1a1626]">{orgName}</div>
            </div>
            <div className="mb-3.5">
              <div className="mb-1 text-[11px] text-[#9a98a6]">Responsável inicial</div>
              <div className="text-[13.5px] font-semibold text-[#1a1626]">{fullName || "—"}</div>
            </div>
            <div className="mb-3.5">
              <div className="mb-1 text-[11px] text-[#9a98a6]">Acesso</div>
              <span className="inline-block rounded-full bg-[#f3efff] px-2.5 py-1 text-xs font-semibold text-[#6d28d9]">Owner</span>
            </div>
            <div className="mb-4">
              <div className="mb-2.5 text-[11px] text-[#9a98a6]">Áreas selecionadas</div>
              {selectedGroups.map((group) => {
                const theme = BUSINESS_NEED_THEME[group.key];
                const Icon = theme.icon;
                return (
                  <div key={group.key} className="mb-2 flex items-center gap-2 text-[13px] text-[#2d2a3a] last:mb-0">
                    <Icon size={16} strokeWidth={1.8} className="shrink-0 text-[#6d28d9]" />
                    {group.label}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-[11px] border border-[#e7e5ee] bg-white p-2.5 text-[13px] font-semibold text-[#1a1626] transition hover:bg-[#faf9fd]"
            >
              <Pencil size={14} className="text-[#6d28d9]" />
              Editar nome
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="block w-full text-center text-[12.5px] font-semibold text-[#6d28d9]"
            >
              Alterar áreas selecionadas
            </button>
          </div>
        </div>

        {/* ── Coluna central: confirmações ─────────────────────────── */}
        <div>
          <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#1a1626]">Confirmações necessárias</h2>

          {phoneNeedsRecheck ? (
            <div className="mt-5 space-y-4 rounded-2xl border border-[#ecebf1] bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                <FileText className="text-violet-600" size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirme seu telefone</h3>
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
            </div>
          ) : (
            <>
              <p className="mt-1.5 text-[13px] text-[#6b7280]">
                Para criar sua organização, precisamos que você confirme os itens abaixo.
              </p>

              <div className="mt-5 space-y-4">
                {/* Card 1: autorização */}
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#ecebf1] bg-white p-[22px_24px]">
                  <span
                    className={`mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
                      authorizedToAdminister ? "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_3px_7px_rgba(109,40,217,0.35)]" : "border-[1.6px] border-[#dad8e2] bg-white"
                    }`}
                  >
                    {authorizedToAdminister && <Check size={15} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="flex flex-1 items-start gap-4">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#ede7fe] text-[#6d28d9]">
                      <ShieldCheck size={24} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1.5 block text-[15px] font-bold text-[#1a1626]">Autorização para administrar</span>
                      <span className="block text-[13px] leading-[1.55] text-[#6b7280]">
                        Confirmo que tenho autorização para criar e administrar esta organização. Sou responsável pelas
                        informações cadastradas e pelos acessos concedidos à equipe. Li e aceito os{" "}
                        <Link href="/termos" target="_blank" className="font-medium text-[#6d28d9] underline" onClick={(e) => e.stopPropagation()}>
                          Termos de Uso
                        </Link>{" "}
                        e a{" "}
                        <Link href="/privacidade" target="_blank" className="font-medium text-[#6d28d9] underline" onClick={(e) => e.stopPropagation()}>
                          Política de Privacidade
                        </Link>{" "}
                        da Nokta.
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={authorizedToAdminister}
                    onChange={(event) => setAuthorizedToAdminister(event.target.checked)}
                    className="sr-only"
                  />
                </label>

                {/* Card 2: dados jurídicos/financeiros (também exige confirmação) */}
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#ecebf1] bg-white p-[22px_24px]">
                  <span
                    className={`mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
                      acknowledgedLegalData ? "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_3px_7px_rgba(109,40,217,0.35)]" : "border-[1.6px] border-[#dad8e2] bg-white"
                    }`}
                  >
                    {acknowledgedLegalData && <Check size={15} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="flex flex-1 items-start gap-4">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#ede7fe] text-[#6d28d9]">
                      <FileText size={24} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1.5 block text-[15px] font-bold text-[#1a1626]">Dados jurídicos e financeiros</span>
                      <span className="block text-[13px] leading-[1.55] text-[#6b7280]">
                        Para publicar eventos pagos, receber valores ou solicitar saques, será necessário informar e
                        verificar os dados do responsável PF ou da empresa PJ.
                      </span>
                      <span className="mt-3.5 flex items-start gap-2 rounded-[11px] bg-[#f6f3fc] p-[11px_14px]">
                        <Info size={15} className="mt-0.5 shrink-0 text-[#6d28d9]" />
                        <span className="text-xs leading-[1.5] text-[#5f5580]">
                          Esses dados poderão ser configurados depois, quando forem necessários.
                        </span>
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={acknowledgedLegalData}
                    onChange={(event) => setAcknowledgedLegalData(event.target.checked)}
                    className="sr-only"
                  />
                </label>

                {/* Card 3: termos de bilheteria — sempre visível e obrigatório, mesmo sem
                    ter selecionado o grupo de Eventos/Bilheteria agora. Cobre o caso de
                    ativar bilheteria depois pelo Explore a Nokta, onde não existe (ainda)
                    um modal de aceite de termos — assinar aqui evita esse buraco. */}
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-[#ecebf1] bg-white p-[22px_24px]">
                  <span
                    className={`mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
                      acceptedSpecificTerms ? "bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] shadow-[0_3px_7px_rgba(109,40,217,0.35)]" : "border-[1.6px] border-[#dad8e2] bg-white"
                    }`}
                  >
                    {acceptedSpecificTerms && <Check size={15} strokeWidth={3} className="text-white" />}
                  </span>
                  <span className="flex flex-1 items-start gap-4">
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#ede7fe] text-[#6d28d9]">
                      <ListChecks size={24} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1.5 block text-[15px] font-bold text-[#1a1626]">
                        Termos específicos de eventos e bilheteria
                      </span>
                      <span className="block text-[13px] leading-[1.55] text-[#6b7280]">
                        {requiresTicketingTerms
                          ? "Como você selecionou recursos de eventos e bilheteria, é necessário confirmar a leitura dos termos abaixo."
                          : "Mesmo que você não use bilheteria agora, esses termos valem para quando ativar esse recurso depois — confirme a leitura para evitar essa etapa novamente no futuro."}
                      </span>
                      <span className="mt-3.5 block rounded-xl bg-[#f6f3fc] p-4">
                        <span className="mb-1.5 block text-[13.5px] font-bold text-[#1a1626]">Operação de eventos e bilheteria</span>
                        <span className="mb-3.5 block text-[12.5px] leading-[1.55] text-[#6b7280]">
                          Confirmo que li e aceito os Termos de Bilheteria e a Política de Cancelamentos, Reembolsos e
                          Chargebacks da Nokta.
                        </span>
                        <Link
                          href="/termos-bilheteria"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="mb-2.5 flex items-center justify-between gap-2.5 text-[12.5px] font-semibold text-[#6d28d9]"
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={15} strokeWidth={1.8} />
                            Ver Termos de Bilheteria
                          </span>
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href="/politica-de-cancelamento"
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between gap-2.5 text-[12.5px] font-semibold text-[#6d28d9]"
                        >
                          <span className="flex items-center gap-2">
                            <FileText size={15} strokeWidth={1.8} />
                            Ver Política de Cancelamentos, Reembolsos e Chargebacks
                          </span>
                          <ExternalLink size={14} />
                        </Link>
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={acceptedSpecificTerms}
                    onChange={(event) => setAcceptedSpecificTerms(event.target.checked)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[12.5px] text-[#6b7280]">
                <Lock size={15} className="text-[#9a98a6]" />
                Você poderá revisar e editar tudo antes da criação final da organização.
              </div>

              <div className="mt-5 flex items-center justify-between gap-3.5">
                <Button variant="outline" onClick={() => setStep(1)} className="h-11">
                  <ChevronLeft size={16} className="mr-1" />
                  Voltar para operação
                </Button>
                <Button
                  onClick={goToSummary}
                  disabled={!canAdvance() || preview.isPending}
                  className="h-11 bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-white hover:brightness-105 disabled:cursor-not-allowed"
                >
                  {preview.isPending ? "Preparando..." : "Continuar para revisão"}
                  {!preview.isPending && <ChevronRight size={16} className="ml-1" />}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* ── Coluna direita: o que acontece depois ────────────────── */}
        <aside className="hidden rounded-[20px] border border-[#ece6f8] bg-[#f6f3fc] p-[24px_22px] xl:block">
          <h3 className="mb-5 text-base font-bold tracking-[-0.01em] text-[#1a1626]">O que acontece depois?</h3>

          {[
            { title: "Você revisará todas as escolhas", desc: "Na próxima etapa, você poderá conferir cada detalhe antes de criar sua organização." },
            { title: "A organização será criada", desc: "Seu espaço será criado com os recursos selecionados." },
            { title: "Painel organizado para você", desc: "O dashboard mostrará apenas as áreas e recursos que você ativou agora." },
            { title: "Dados jurídicos depois", desc: "Quando precisar publicar eventos pagos, receber valores ou solicitar saques, avisaremos para você concluir a verificação." },
          ].map((item, index) => (
            <div key={item.title} className="mb-[18px] flex items-start gap-3 last:mb-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] text-xs font-bold text-white shadow-[0_2px_6px_rgba(109,40,217,0.35)]">
                {index + 1}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1a1626]">{item.title}</div>
                <div className="mt-0.5 text-xs leading-[1.5] text-[#6b7280]">{item.desc}</div>
              </div>
            </div>
          ))}

          <div className="my-5 flex items-start gap-2.5 rounded-[13px] border border-[#ece6f8] bg-white p-3.5">
            <ShieldCheck size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#6d28d9]" />
            <div>
              <div className="mb-0.5 text-xs font-bold text-[#1a1626]">Seus dados estão seguros</div>
              <div className="text-[11.5px] leading-[1.5] text-[#6b7280]">
                Seguimos as melhores práticas de segurança e proteção de dados. Leia nossa{" "}
                <Link href="/privacidade" target="_blank" className="font-semibold text-[#6d28d9] underline">
                  Política de Privacidade.
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <HelpCircle size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#6d28d9]" />
            <div>
              <div className="mb-0.5 text-[13px] font-bold text-[#1a1626]">Dúvidas?</div>
              <div className="mb-2 text-xs leading-[1.5] text-[#6b7280]">Acesse nossa Central de Ajuda sempre que precisar.</div>
              <a href="mailto:contato@noktatickets.com.br" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6d28d9]">
                Ir para a Central de Ajuda
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl bg-white shadow-sm">
          <OnboardingStepper step={step} />

          <div className="p-8">
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
            {step === 3 && (
              <Button variant="outline" onClick={() => setStep(2)} className="h-11 flex-1" disabled={finishing}>
                <ChevronLeft size={16} className="mr-1" />
                Voltar
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
