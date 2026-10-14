"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import api, { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { createDefaultSelection, flattenSelection, type BusinessNeedSelectionState } from "../_components/business-needs/business-need-groups-picker";
import { useActivateBusinessNeeds, useBusinessNeedsCatalog, usePreviewBusinessNeedsActivation } from "../_hooks/use-platform";
import { OnboardingExtras } from "./_components/onboarding-extras";
import type { BusinessNeedGroup, BusinessNeedKey } from "@/services/platform";

const STEP_LABELS = ["Identificação", "Operação", "Termos", "Resumo"] as const;

const IDENTIFICATION_BENEFITS: { icon: IconName; title: string; description: string }[] = [
  { icon: "grid", title: "Centralize tudo em um só lugar", description: "Gerencie eventos, vendas, equipe e finanças." },
  { icon: "users", title: "Convide sua equipe", description: "Defina papéis e permissões para cada pessoa." },
  { icon: "layers", title: "Escalável", description: "Crie quantas organizações precisar." },
];

const OPERATION_NEXT_STEPS: { icon: IconName; title: string; description: string }[] = [
  { icon: "magic", title: "Mais clareza", description: "Veja no menu apenas os recursos usados no seu dia a dia." },
  { icon: "layers", title: "Totalmente flexível", description: "Ative ou desative funcionalidades depois, em Explore a Nokta." },
  { icon: "shield", title: "Sem impacto nos seus dados", description: "Ocultar um recurso não apaga cadastros nem configurações existentes." },
];

const TERMS_NEXT_STEPS = [
  { title: "Você revisará todas as escolhas", desc: "Na próxima etapa, você confere cada detalhe antes de criar sua organização." },
  { title: "A organização será criada", desc: "Seu espaço será criado com os recursos selecionados." },
  { title: "Painel organizado para você", desc: "O painel mostrará apenas as áreas e recursos que você ativou agora." },
  { title: "Dados jurídicos depois", desc: "Quando precisar publicar eventos pagos, receber valores ou pedir saques, avisamos pra você concluir a verificação." },
];

/** Ícone por necessidade de negócio — mesma ordem/keys de BUSINESS_NEED_CATALOG (backend). */
const BUSINESS_NEED_ICON: Record<BusinessNeedKey, IconName> = {
  EVENTS_TICKETING: "ticket",
  RELATIONSHIP: "user-group",
  OPERATION: "chair",
  MENU_PRODUCTS: "utensils",
  STOCK_PURCHASING: "box",
  MANAGEMENT: "chart-line",
};

/** Marcador do card de grupo com estado indeterminado (parte dos recursos do grupo ativa). */
function GroupCheckbox({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", checked || indeterminate ? "border-brand bg-brand text-brand-foreground" : "border-border-strong bg-surface-2")}>
      <input ref={ref} type="checkbox" checked={checked} readOnly tabIndex={-1} className="sr-only" />
      {indeterminate ? <span className="h-0.5 w-2.5 rounded-full bg-current" /> : checked ? <Icon name="check" size={10} /> : null}
    </span>
  );
}

/** Rótulo pequeno de etapa ("Vamos começar"), em vez de eyebrow colorido. */
function StepEyebrow({ children }: { children: string }) {
  return (
    <StatusBadge tone="brand" dot={false}>
      {children}
    </StatusBadge>
  );
}

/**
 * Barra de ações do wizard: no celular fica fixa embaixo (com fundo sólido,
 * em cima do conteúdo que rola); no desktop é só uma linha no fim do passo.
 */
function WizardActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-surface/95 px-4 py-3 pb-safe backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3">{children}</div>
      {note ? <div className="mt-2 hidden md:block">{note}</div> : null}
    </div>
  );
}

/**
 * Painel de personalização de um grupo (etapa "Operação") — fica FORA do
 * card, logo abaixo da linha de 3 (xl:grid-cols-3) onde o grupo está,
 * de propósito: o card do grupo nunca muda de altura, então os cards
 * vizinhos da mesma linha do CSS Grid nunca esticam nem sobram espaços
 * vazios.
 */
function GroupCustomizationPanel({ group, selection, setSelection, onClose }: { group: BusinessNeedGroup; selection: BusinessNeedSelectionState; setSelection: (next: BusinessNeedSelectionState) => void; onClose: () => void }) {
  const isSelected = selection.selectedGroupKeys.has(group.key);
  const deselected = selection.deselectedCapabilityKeysByGroup.get(group.key) ?? new Set<string>();

  return (
    <div className="surface-inset scale-in col-span-full rounded-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{group.label}</p>
          <p className="mt-0.5 text-caption text-muted-foreground">Escolha individualmente os recursos deste grupo que você quer usar.</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onClose} rightIcon="check" className="shrink-0">
          Concluir
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-3">
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
              nextByGroup.set(group.key, new Set(group.capabilities.filter((c) => !c.required && c.key !== capability.key).map((c) => c.key)));
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
            <button key={capability.key} type="button" role="checkbox" aria-checked={checked} onClick={toggleCapability} disabled={!interactive} className={cn("flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm transition-colors", interactive ? "cursor-pointer hover:bg-surface-2" : "cursor-default")}>
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", checked ? "border-brand bg-brand text-brand-foreground" : "border-border-strong bg-surface-2")}>{checked ? <Icon name="check" size={10} /> : null}</span>
              <span className="min-w-0 flex-1 text-foreground">{capability.label}</span>
              {capability.required ? <Icon name="lock" size={10} className="text-subtle-foreground" aria-label="Necessário" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OnboardingStepper({ step }: { step: number }) {
  return <Stepper orientation="horizontal" className="rounded-card border border-border bg-surface px-5 py-4 shadow-card md:[&_span[aria-hidden]]:min-h-0" steps={STEP_LABELS.map((label, index) => ({ label, status: index < step ? "done" : index === step ? "current" : "upcoming" }))} />;
}

/** Linha "título + descrição" com ícone inline (benefícios, próximos passos). */
function BulletItem({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-brand" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/** Card de confirmação da etapa "Termos": o card inteiro é o rótulo do checkbox. */
function TermCard({ checked, onChange, icon, title, children }: { checked: boolean; onChange: (next: boolean) => void; icon: IconName; title: string; children: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-4 rounded-card border bg-surface p-5 shadow-card transition-colors", checked ? "border-brand/50 ring-1 ring-brand-ring" : "border-border hover:border-border-strong")}>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} className="mt-1 size-5" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Icon name={icon} size={15} className="text-brand" />
          {title}
        </span>
        <span className="mt-1.5 block text-body text-muted-foreground">{children}</span>
      </span>
    </label>
  );
}

function ExternalTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" className="font-medium text-brand underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}

const BUSINESS_NAME_DRAFT_KEY = "nokta_onboarding_business_name_draft";

type PhoneRecheckPhase = "idle" | "sending" | "code" | "verifying";

/** Serialização de BusinessNeedSelectionState — Set/Map não sobrevivem a JSON.stringify direto. */
interface SerializedSelection {
  selectedGroupKeys: string[];
  deselectedCapabilityKeysByGroup: Record<string, string[]>;
}

interface OnboardingProgress {
  createdOrgId: number;
  step: number;
  skippedIdentification?: boolean;
  // Seleção de áreas/capacidades da etapa "Operação" — sem isso, um F5 (ou
  // fechar e voltar) entre "Operação" e "Resumo" perdia tudo que o usuário
  // tinha marcado e a tela recaía no createDefaultSelection() do catálogo.
  selection?: SerializedSelection;
}

function serializeSelection(selection: BusinessNeedSelectionState): SerializedSelection {
  return {
    selectedGroupKeys: [...selection.selectedGroupKeys],
    deselectedCapabilityKeysByGroup: Object.fromEntries([...selection.deselectedCapabilityKeysByGroup.entries()].map(([k, v]) => [k, [...v]])),
  };
}

// Tolerante a progresso salvo por uma versão anterior do código (sem o
// campo `selection`, ou com formato antigo/parcial) — nunca lança, só
// retorna vazio, que o chamador trata como "nada restaurável".
function deserializeSelection(serialized: SerializedSelection | undefined | null): BusinessNeedSelectionState {
  return {
    selectedGroupKeys: new Set(Array.isArray(serialized?.selectedGroupKeys) ? serialized.selectedGroupKeys : []),
    deselectedCapabilityKeysByGroup: new Map(Object.entries(serialized?.deselectedCapabilityKeysByGroup ?? {}).map(([k, v]) => [k, new Set(Array.isArray(v) ? v : [])])),
  };
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
  // Etapa "Resumo" (4): "Revisar termos" abre um modal somente-leitura com o
  // que foi confirmado na etapa "Termos" — mudar de verdade exige voltar lá
  // (setStep(2)), o modal não edita os checkboxes.
  const [reviewingTerms, setReviewingTerms] = useState(false);
  // Distingue "ainda não sei se há progresso salvo" (evita flash da etapa 0
  // antes de checar localStorage) de "sei que não há" — só relevante no
  // primeiro render.
  const [progressChecked, setProgressChecked] = useState(false);

  // Telefone já foi confirmado no cadastro (OTP via WhatsApp) — esta
  // reverificação só entra em cena se `telefoneVerificado` ficou `false`
  // por alguma inconsistência (ex.: usuário trocou o telefone em Perfil
  // entre o cadastro e completar este onboarding). Nunca é o caminho normal.
  const [phoneRecheckPhase, setPhoneRecheckPhase] = useState<PhoneRecheckPhase>("idle");
  const [phoneRecheckCode, setPhoneRecheckCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const catalog = useBusinessNeedsCatalog(createdOrgId);
  const [selection, setSelection] = useState<BusinessNeedSelectionState | null>(null);
  // Seleção restaurada do localStorage, à espera do catálogo carregar (o
  // catálogo chega assíncrono depois de createdOrgId ser restaurado) — só
  // usada uma vez, pelo efeito abaixo; null significa "nada salvo ainda" ou
  // "já aplicada".
  const restoredSelectionRef = useRef<SerializedSelection | null>(null);
  // "Personalizar recursos" na etapa "Operação": qual grupo tem o painel de
  // capacidades individuais aberto (no máximo um por vez — abrir outro
  // fecha o anterior). Só controla se o painel aparece, não afeta a
  // seleção em si.
  const [customizingGroupKey, setCustomizingGroupKey] = useState<string | null>(null);
  const preview = usePreviewBusinessNeedsActivation(createdOrgId ?? -1);
  const activateNeeds = useActivateBusinessNeeds(createdOrgId ?? -1);

  useEffect(() => {
    if (!catalog.data || selection) return;

    const restored = restoredSelectionRef.current;
    restoredSelectionRef.current = null;
    if (!restored) {
      setSelection(createDefaultSelection(catalog.data));
      return;
    }

    // Valida contra o catálogo atual — um grupo/capacidade removido desde
    // que o progresso foi salvo não pode sobreviver à restauração.
    const validGroupKeys = new Set<string>(catalog.data.map((g) => g.key));
    const deserialized = deserializeSelection(restored);
    const selectedGroupKeys = new Set([...deserialized.selectedGroupKeys].filter((k) => validGroupKeys.has(k)));

    // Nada sobrou (dado vazio/corrompido de uma versão anterior, ou todo
    // grupo salvo saiu do catálogo) — trata como "nada pra restaurar" em
    // vez de aplicar uma seleção vazia, que nunca aconteceria por escolha
    // real do usuário (a UI sempre parte de createDefaultSelection).
    if (selectedGroupKeys.size === 0) {
      setSelection(createDefaultSelection(catalog.data));
      return;
    }

    const deselectedCapabilityKeysByGroup = new Map([...deserialized.deselectedCapabilityKeysByGroup.entries()].filter(([k]) => selectedGroupKeys.has(k)));
    setSelection({ selectedGroupKeys, deselectedCapabilityKeysByGroup });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog.data]);

  // Reconstrói o preview da etapa "Resumo" (step 3) depois de um F5 nela.
  // preview vem de usePreviewBusinessNeedsActivation, um useMutation — seu
  // resultado só existe na memória do componente (React Query nunca
  // persiste mutation entre remontagens), diferente de `selection`, que
  // é restaurado do localStorage. goToSummary só chama preview.mutateAsync
  // uma vez, ao avançar de "Termos" pra "Resumo"; sem isto, restaurar
  // step=3 direto (F5) deixava preview.data vazio para sempre.
  useEffect(() => {
    if (step !== 3 || !createdOrgId || !catalog.data || !selection) return;
    if (preview.data || preview.isPending || preview.isError) return;
    const payload = flattenSelection(catalog.data, selection);
    preview.mutate(payload, {
      onError: (error) => toast.error(getErrorMessage(error, "Não foi possível montar o resumo. Tente novamente.")),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, createdOrgId, catalog.data, selection]);

  // Sinal legado (pré-plataforma-unificada): nível de produtor não reflete
  // mais "onboarding concluído" — uma conta pode nunca ter passado por
  // /produtor (nivelProdutor nulo/0) e ainda assim ter uma organização 100%
  // configurada pelo onboarding novo. `hasCompletedOnboardingOrg` é a fonte
  // real (mesmo campo que o backend calcula a partir de
  // organization_capabilities): existe pelo menos uma organização e nenhuma
  // delas está com onboardingCompleted=false.
  const hasCompletedOnboardingOrg = !loadingOrgs && organizations.length > 0 && organizations.every((o) => o.onboardingCompleted);
  const accessAlreadyActive = (role === "PRODUTOR" && (nivelProdutor ?? 0) >= 1) || hasCompletedOnboardingOrg;

  // Recupera progresso salvo (F5 no meio do onboarding) — sem isso, um
  // reload no meio de "Operação"/"Termos"/"Resumo" perdia createdOrgId e a
  // tela caía em alreadyConfigured (redirect automático pra
  // /dashboard/inicio, ver abaixo).
  //
  // localStorage é só um atalho de UX — não é a fonte de verdade. Ele não
  // existe em outro navegador, aba anônima ou depois de limpar dados, e
  // nesses casos o passo abaixo (organizations vindo do backend) sempre
  // resolve pelo menos "existe organização sem nenhuma capacidade ativada
  // pelo onboarding" -> volta pra etapa "Operação".
  useEffect(() => {
    if (progressChecked || loadingOrgs) return;
    const saved = loadProgress(userId);
    if (saved && organizations.some((o) => o.id === saved.createdOrgId)) {
      setCreatedOrgId(saved.createdOrgId);
      setStep(saved.step);
      setSkippedIdentification(!!saved.skippedIdentification);
      if (saved.selection) restoredSelectionRef.current = saved.selection;
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
  // com createdOrgId restaurado) mostrava o campo vazio.
  useEffect(() => {
    if (!createdOrgId || businessName) return;
    const org = organizations.find((o) => o.id === createdOrgId);
    if (org) setBusinessName(org.nome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, organizations]);

  useEffect(() => {
    // Espera `selection` existir antes de salvar: no primeiro render após
    // restaurar/criar createdOrgId, selection ainda é null (o catálogo é
    // assíncrono) — salvar nesse instante gravaria `selection: undefined`
    // por cima de uma seleção restaurada válida.
    if (createdOrgId && progressChecked && selection) {
      saveProgress(userId, {
        createdOrgId,
        step,
        skippedIdentification,
        selection: serializeSelection(selection),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdOrgId, step, progressChecked, skippedIdentification, selection]);

  // Avisa o backend em que etapa o dono está, só para o painel admin ver
  // onde o lead parou (Workspaces). Retomar o onboarding continua sendo pelo
  // localStorage acima; se esta chamada falhar, nada muda para o usuário.
  useEffect(() => {
    if (!createdOrgId || !progressChecked || step < 1 || step > 3) return;
    void api.patch(`/organizations/${createdOrgId}/onboarding-step`, { step }).catch(() => {});
  }, [createdOrgId, step, progressChecked]);

  // Caminho "só falta criar workspace" (needsWorkspaceOnly, abaixo): o
  // workspace acabou de ser criado agora mesmo — segue direto pra etapa
  // "Operação", sem repetir Identificação.
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
  // caíam em alreadyConfigured sem NUNCA ter a chance de criar um workspace.
  const needsWorkspaceOnly = accessAlreadyActive && !loadingOrgs && organizations.length === 0 && !createdOrgId;
  // Nada a fazer aqui — segue direto pra /dashboard/inicio (useEffect abaixo).
  const alreadyConfigured = accessAlreadyActive && progressChecked && !needsWorkspaceOnly && !createdOrgId;

  useEffect(() => {
    if (alreadyConfigured) window.location.href = "/dashboard/inicio";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyConfigured]);
  const phoneNeedsRecheck = !!user && user.telefoneVerificado !== true;
  const isSendingPhoneCode = phoneRecheckPhase === "sending";
  const isVerifyingPhoneCode = phoneRecheckPhase === "verifying";
  const showPhoneCodeInput = phoneRecheckPhase === "code" || phoneRecheckPhase === "verifying";

  // Termos de bilheteria (3º card) são sempre obrigatórios, mesmo sem o grupo
  // EVENTS_TICKETING selecionado agora — cobre ativar bilheteria depois pelo
  // Explore a Nokta, onde não existe (ainda) um modal de aceite de termos.
  // `requiresTicketingTerms` só ajusta o texto de apoio do card.
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

  /** @param destination Rota pós-criação — Início (padrão) ou direto na aba de dados jurídicos/financeiros (botão "Criar e verificar dados jurídicos agora"). */
  const handleFinish = async (destination: string = "/dashboard/inicio") => {
    if (!createdOrgId || !catalog.data || !selection) return;
    setFinishing(true);
    try {
      const payload = flattenSelection(catalog.data, selection);
      await activateNeeds.mutateAsync(payload);
      clearProgress(userId);
      // Sem setFinishing(false) aqui de propósito: window.location.href não
      // navega no mesmo tick — resetar o estado agora reabilitaria o botão
      // por uma fração de segundo antes do browser trocar de página.
      window.location.href = destination;
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível concluir. Tente novamente."));
      setFinishing(false);
    }
  };

  if (loadingOrgs || !progressChecked || alreadyConfigured) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (needsWorkspaceOnly) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandLogo variant="nokta" height={28} className="text-foreground" />
            <h1 className="mt-6 text-display font-medium tracking-tight text-foreground">Só falta criar seu workspace</h1>
            <p className="mt-2 text-body text-muted-foreground">Seu acesso já está ativo. Informe o nome do negócio ou operação para continuar.</p>
          </div>

          <Card accent className="p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateWorkspaceOnly();
              }}
              className="space-y-5"
            >
              <Field label="Nome do negócio ou operação" htmlFor="workspaceOnlyName" required>
                <Input id="workspaceOnlyName" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ex.: Produtora Horizonte, Bar Central" autoFocus autoComplete="off" />
              </Field>
              <Button type="submit" size="full" disabled={businessName.trim().length < 2} loading={creatingWorkspaceOnly} rightIcon="arrow-right">
                Continuar
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="space-y-6">
        <OnboardingStepper step={step} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="space-y-6 lg:pt-4">
            <StepEyebrow>Vamos começar</StepEyebrow>
            <h1 className="text-display font-medium tracking-tight text-foreground">
              Crie sua primeira <span className="text-brand">organização</span>
            </h1>
            <p className="max-w-md text-body text-muted-foreground">A organização é o espaço onde você gerencia eventos, equipe, operações e resultados.</p>
            <div className="space-y-4">
              {IDENTIFICATION_BENEFITS.map((benefit) => (
                <BulletItem key={benefit.title} {...benefit} />
              ))}
            </div>
          </section>

          <Card accent className="p-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateWorkspace();
              }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Como deseja chamar sua organização?</h2>
                <p className="mt-1 text-caption text-muted-foreground">Pode ser o nome da sua produtora, estabelecimento, empresa ou o seu próprio nome.</p>
              </div>

              <Field label="Nome da organização" htmlFor="businessName" required>
                <Input id="businessName" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Ex.: Produtora Horizonte, Bar Central ou Vitor Reis" autoComplete="organization" autoFocus />
              </Field>

              <Button type="submit" size="full" disabled={!canAdvance()} loading={loading} rightIcon="arrow-right">
                Continuar
              </Button>

              <Callout tone="neutral" icon="lock">
                <span className="font-semibold text-foreground">Somente você pode criar organizações.</span> Depois, poderá convidar sua equipe para colaborar.
              </Callout>
            </form>
          </Card>
        </div>

        <OnboardingExtras />
      </div>
    );
  }

  if (step === 1) {
    const orgName = organizations.find((o) => o.id === createdOrgId)?.nome ?? businessName;
    const selectedCount = selection?.selectedGroupKeys.size ?? 0;

    return (
      <div className="space-y-6">
        <OnboardingStepper step={step} />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="space-y-3">
              <StepEyebrow>Vamos continuar</StepEyebrow>
              <h1 className="text-display font-medium tracking-tight text-foreground">
                Como funciona a sua <span className="text-brand">operação?</span>
              </h1>
              <p className="text-body text-muted-foreground">Selecione os recursos que pretende utilizar agora. A Nokta personaliza seu painel pra exibir só o que faz sentido pra sua operação.</p>
            </div>

            <Card className="gap-3 p-5">
              <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Sua organização</p>
              <p className="text-base font-semibold text-foreground">{orgName}</p>
              <p className="text-caption text-muted-foreground">Este é o nome mostrado no painel pra você e pra sua equipe.</p>
              <Button type="button" variant="link" size="sm" onClick={() => setStep(0)} leftIcon="edit" className="w-fit">
                Editar nome de exibição
              </Button>
              <Callout tone="neutral" icon="shield" className="mt-1">
                Dados jurídicos, como razão social e CPF/CNPJ, são tratados à parte e podem exigir nova verificação após o KYC.
              </Callout>
            </Card>

            <div className="hidden space-y-4 lg:block">
              {OPERATION_NEXT_STEPS.map((next) => (
                <BulletItem key={next.title} {...next} />
              ))}
            </div>
          </aside>

          <section className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Selecione as áreas que fazem parte da sua operação</h2>
            <p className="mt-1 text-caption text-muted-foreground">Clique no card pra ativar todos os recursos do grupo, ou personalize as funcionalidades individualmente.</p>

            {catalog.isLoading || !selection ? (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-52 rounded-card" />
                ))}
              </div>
            ) : catalog.data ? (
              <div className="mt-5 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {catalog.data.map((group, index) => {
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
                  // nos breakpoints menores (sm:2col, mobile:1col).
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
                      <Card
                        interactive
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
                        className={cn("fade-up h-full cursor-pointer gap-3 p-4 text-left", isSelected && "border-brand/50 ring-1 ring-brand-ring", isCustomizing && "ring-2 ring-brand/40")}
                        style={{ ["--i" as string]: index } as never}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Icon name={BUSINESS_NEED_ICON[group.key]} size={18} className="mt-0.5 text-brand" />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleBusinessNeedGroup(group.key);
                            }}
                            aria-pressed={isSelected}
                            className="flex items-center gap-2 text-caption font-semibold text-muted-foreground"
                          >
                            {isSelected ? "Ativo" : "Ativar grupo"}
                            <GroupCheckbox checked={isSelected && !isPartial} indeterminate={isPartial} />
                          </button>
                        </div>

                        <div>
                          <p className="text-base font-semibold text-foreground">{group.label}</p>
                          <p className="mt-1 text-caption leading-snug text-muted-foreground">{group.description}</p>
                        </div>

                        <StatusBadge tone={isSelected ? "brand" : "neutral"} dot={false} className="w-fit">
                          {isPartial ? `${activeCount} de ${totalCount} recursos` : `${totalCount} recursos incluídos`}
                        </StatusBadge>

                        <p className="text-caption leading-snug text-subtle-foreground">{group.capabilities.map((c) => c.label).join(", ")}.</p>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleCustomize();
                          }}
                          aria-expanded={isCustomizing}
                          className="mt-auto -mx-2 -mb-2 flex h-9 w-fit items-center gap-1.5 rounded-lg px-2 text-caption font-semibold text-brand transition-colors hover:bg-brand-soft"
                        >
                          Personalizar recursos
                          <Icon name="chevron-down" size={10} className={cn("transition-transform", isCustomizing && "rotate-180")} />
                        </button>
                      </Card>

                      {customizingInThisRow ? <GroupCustomizationPanel group={catalog.data.find((g) => g.key === customizingGroupKey)!} selection={selection} setSelection={setSelection} onClose={() => setCustomizingGroupKey(null)} /> : null}
                    </Fragment>
                  );
                })}
              </div>
            ) : null}

            <Callout tone="brand" title="Seu painel fica mais organizado" className="mt-6">
              Os recursos não selecionados ficam ocultos pra reduzir a poluição visual. Você pode ativá-los depois em Explore a Nokta, sem refazer o cadastro nem perder informações.
            </Callout>

            <WizardActions>
              {!skippedIdentification ? (
                <Button type="button" variant="ghost" onClick={() => setStep(0)} leftIcon="arrow-left">
                  Voltar
                </Button>
              ) : (
                <span />
              )}
              <Button onClick={goToTerms} disabled={!canAdvance()} rightIcon="arrow-right" className="min-w-0 flex-1 md:flex-initial">
                <span className="truncate">{selectedCount > 0 ? `Continuar com ${selectedCount} ${selectedCount > 1 ? "áreas" : "área"}` : "Continuar"}</span>
              </Button>
            </WizardActions>
          </section>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const orgName = organizations.find((o) => o.id === createdOrgId)?.nome ?? businessName;
    const fullName = user ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() : "";
    const selectedGroups = catalog.data?.filter((g) => selection?.selectedGroupKeys.has(g.key)) ?? [];

    return (
      <div className="space-y-6">
        <OnboardingStepper step={step} />

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          {/* ── Coluna esquerda: resumo ───────────────────────────────── */}
          <aside className="space-y-5">
            <div className="space-y-3">
              <StepEyebrow>Vamos continuar</StepEyebrow>
              <h1 className="text-display font-medium tracking-tight text-foreground">
                Antes de concluir, confirme sua <span className="text-brand">responsabilidade</span>
              </h1>
              <p className="text-body text-muted-foreground">Você será o responsável inicial por esta organização e poderá convidar outras pessoas pra ajudar na gestão.</p>
            </div>

            <Card className="gap-4 p-5">
              <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Resumo da organização</p>
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Icon name="building" size={18} className="text-brand" />
                <p className="text-base font-semibold text-foreground">{orgName}</p>
              </div>
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Responsável inicial</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                  {fullName || "—"}
                  <StatusBadge tone="brand" dot={false}>
                    Owner
                  </StatusBadge>
                </p>
              </div>
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Áreas selecionadas</p>
                <ul className="mt-2 space-y-1.5">
                  {selectedGroups.map((group) => (
                    <li key={group.key} className="flex items-center gap-2 text-sm text-foreground">
                      <Icon name={BUSINESS_NEED_ICON[group.key]} size={13} className="text-brand" />
                      {group.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setStep(0)} leftIcon="edit">
                  Editar nome
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Alterar áreas selecionadas
                </Button>
              </div>
            </Card>
          </aside>

          {/* ── Coluna central: confirmações ─────────────────────────── */}
          <section className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Confirmações necessárias</h2>

            {phoneNeedsRecheck ? (
              <Card accent className="mt-4 p-6">
                <div className="flex items-start gap-3">
                  <Icon name="phone" size={18} className="mt-0.5 text-brand" />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Confirme seu telefone</h3>
                    <p className="mt-1 text-body text-muted-foreground">Identificamos uma pendência na verificação do seu telefone. Confirme novamente para continuar.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {!showPhoneCodeInput ? (
                    <Button onClick={handleSendPhoneRecheckCode} loading={isSendingPhoneCode} size="full" leftIcon="whatsapp">
                      Enviar código no WhatsApp
                    </Button>
                  ) : (
                    <>
                      <Field label="Código recebido" htmlFor="phoneRecheckCode">
                        <Input id="phoneRecheckCode" type="text" inputMode="numeric" maxLength={8} value={phoneRecheckCode} onChange={(event) => setPhoneRecheckCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" className="text-center font-mono text-xl tracking-widest" autoFocus />
                      </Field>
                      <Button onClick={handleConfirmPhoneRecheck} disabled={phoneRecheckCode.length < 4} loading={isVerifyingPhoneCode} size="full">
                        Confirmar código
                      </Button>
                      <div className="flex justify-end">
                        <Button type="button" variant="link" size="sm" onClick={handleSendPhoneRecheckCode} disabled={resendTimer > 0 || isSendingPhoneCode} leftIcon="refresh">
                          {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar código"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ) : (
              <>
                <p className="mt-1 text-caption text-muted-foreground">Para criar sua organização, precisamos que você confirme os itens abaixo.</p>

                <div className="mt-5 space-y-3">
                  <TermCard checked={authorizedToAdminister} onChange={setAuthorizedToAdminister} icon="shield" title="Autorização para administrar">
                    Confirmo que tenho autorização para criar e administrar esta organização. Sou responsável pelas informações cadastradas e pelos acessos concedidos à equipe. Li e aceito os <ExternalTextLink href="/termos">Termos de Uso</ExternalTextLink> e a <ExternalTextLink href="/privacidade">Política de Privacidade</ExternalTextLink> da Nokta.
                  </TermCard>

                  <TermCard checked={acknowledgedLegalData} onChange={setAcknowledgedLegalData} icon="file-lines" title="Dados jurídicos e financeiros">
                    Para publicar eventos pagos, receber valores ou solicitar saques, será necessário informar e verificar os dados do responsável PF ou da empresa PJ.
                    <span className="mt-2 block text-caption text-subtle-foreground">Esses dados podem ser configurados depois, quando forem necessários.</span>
                  </TermCard>

                  {/* Termos de bilheteria — sempre visível e obrigatório, mesmo sem
                      ter selecionado o grupo de Eventos/Bilheteria agora. Cobre o caso de
                      ativar bilheteria depois pelo Explore a Nokta, onde não existe (ainda)
                      um modal de aceite de termos. */}
                  <TermCard checked={acceptedSpecificTerms} onChange={setAcceptedSpecificTerms} icon="ticket" title="Termos específicos de eventos e bilheteria">
                    {requiresTicketingTerms ? "Como você selecionou recursos de eventos e bilheteria, é necessário confirmar a leitura dos termos abaixo." : "Mesmo que você não use bilheteria agora, esses termos valem para quando ativar esse recurso depois — confirme a leitura para evitar essa etapa novamente no futuro."}
                    <span className="surface-inset mt-3 block rounded-xl p-4">
                      <span className="block text-sm font-semibold text-foreground">Operação de eventos e bilheteria</span>
                      <span className="mt-1 block text-caption text-muted-foreground">Confirmo que li e aceito os Termos de Bilheteria e a Política de Cancelamentos, Reembolsos e Chargebacks da Nokta.</span>
                      <span className="mt-3 flex flex-col gap-2">
                        <Link href="/termos-bilheteria" target="_blank" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-between gap-2 text-caption font-semibold text-brand hover:underline">
                          <span className="inline-flex items-center gap-2">
                            <Icon name="file-lines" size={12} />
                            Ver Termos de Bilheteria
                          </span>
                          <Icon name="external" size={10} />
                        </Link>
                        <Link href="/politica-de-cancelamento" target="_blank" onClick={(e) => e.stopPropagation()} className="inline-flex items-center justify-between gap-2 text-caption font-semibold text-brand hover:underline">
                          <span className="inline-flex items-center gap-2">
                            <Icon name="file-lines" size={12} />
                            Ver Política de Cancelamentos, Reembolsos e Chargebacks
                          </span>
                          <Icon name="external" size={10} />
                        </Link>
                      </span>
                    </span>
                  </TermCard>
                </div>

                <p className="mt-4 flex items-center gap-2 text-caption text-muted-foreground">
                  <Icon name="lock" size={12} className="text-subtle-foreground" />
                  Você pode revisar e editar tudo antes da criação final da organização.
                </p>

                <WizardActions>
                  <Button variant="ghost" onClick={() => setStep(1)} leftIcon="arrow-left">
                    Voltar
                  </Button>
                  <Button onClick={goToSummary} disabled={!canAdvance()} loading={preview.isPending} rightIcon="arrow-right">
                    Continuar para revisão
                  </Button>
                </WizardActions>
              </>
            )}
          </section>

          {/* ── Coluna direita: o que acontece depois ────────────────── */}
          <aside className="hidden xl:block">
            <Card className="gap-5 p-5">
              <h3 className="text-base font-semibold text-foreground">O que acontece depois?</h3>
              <ol className="space-y-4">
                {TERMS_NEXT_STEPS.map((item, index) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-semibold text-brand tnum">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-caption text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Callout tone="neutral" icon="shield" title="Seus dados estão seguros">
                Seguimos as melhores práticas de segurança e proteção de dados. Leia nossa <ExternalTextLink href="/privacidade">Política de Privacidade</ExternalTextLink>.
              </Callout>
              <div className="flex items-start gap-3 border-t border-border pt-4">
                <Icon name="question" size={16} className="mt-0.5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Dúvidas?</p>
                  <p className="mt-0.5 text-caption text-muted-foreground">Acesse nossa Central de Ajuda sempre que precisar.</p>
                  <a href="mailto:contato@noktatickets.com.br" className="mt-1.5 inline-flex items-center gap-1.5 text-caption font-semibold text-brand hover:underline">
                    Falar com o suporte
                    <Icon name="external" size={10} />
                  </a>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  // step === 3 (Resumo)
  const orgName = organizations.find((o) => o.id === createdOrgId)?.nome ?? businessName;
  const fullName = user ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() : "";
  const initials = fullName ? fullName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") : "?";
  const previewGroups = preview.data?.groups ?? [];
  const labelOf = (key: string) => catalog.data?.flatMap((g) => g.capabilities).find((c) => c.key === key)?.label ?? key;
  const totalCapabilities = preview.data?.allCapabilityKeys.length ?? 0;
  const activeAreasCount = previewGroups.length;

  const summaryCard = (icon: IconName, title: string, action: ReactNode, body: ReactNode) => (
    <Card className="gap-0 p-0">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2.5">
          <Icon name={icon} size={16} className="text-brand" />
          <CardTitle>{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-4">{body}</CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <OnboardingStepper step={step} />

      <div className="space-y-3">
        <StepEyebrow>Vamos finalizar</StepEyebrow>
        <h1 className="text-display font-medium tracking-tight text-foreground">
          Tudo certo para <span className="text-brand">começar?</span>
        </h1>
        <p className="max-w-2xl text-body text-muted-foreground">Revise as informações abaixo. Você pode ajustar configurações e ativar novos recursos depois.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Coluna central ────────────────────────────────────────── */}
        <section className="min-w-0 space-y-4">
          {summaryCard(
            "building",
            "Organização",
            <Button type="button" variant="outline" size="sm" onClick={() => setStep(0)} leftIcon="edit">
              Editar nome
            </Button>,
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Nome da organização</dt>
                <dd className="mt-1 text-sm font-medium text-foreground">{orgName}</dd>
              </div>
              <div>
                <dt className="text-micro font-semibold uppercase tracking-wider text-subtle-foreground">Responsável inicial</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon name="user" size={13} className="text-muted-foreground" />
                  {fullName || "—"}
                  <StatusBadge tone="brand" dot={false}>
                    Owner
                  </StatusBadge>
                </dd>
              </div>
            </dl>,
          )}

          {summaryCard(
            "layers",
            "Áreas da operação",
            <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)} leftIcon="edit">
              Editar recursos
            </Button>,
            preview.isPending || !catalog.data ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {previewGroups.map((group) => (
                  <div key={group.key}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon name={BUSINESS_NEED_ICON[group.key as BusinessNeedKey] ?? "layers"} size={13} className="text-brand" />
                      {group.label}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {group.capabilityKeys.map((key) => (
                        <li key={key} className="flex items-center gap-2 text-caption text-foreground">
                          <Icon name="check-circle" size={12} className="shrink-0 text-success" />
                          {labelOf(key)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ),
          )}

          {summaryCard(
            "shield",
            "Responsabilidades e termos",
            <Button type="button" variant="outline" size="sm" onClick={() => setReviewingTerms(true)} leftIcon="clipboard-check">
              Revisar termos
            </Button>,
            <ul className="space-y-3">
              {[
                { text: "Confirmo que tenho autorização para criar e administrar esta organização.", sub: "Sou responsável pelas informações cadastradas e pelos acessos concedidos à equipe." },
                { text: "Entendo que os dados jurídicos e financeiros serão necessários para publicar eventos pagos, receber valores ou solicitar saques." },
                { text: "Li e aceito os termos aplicáveis aos recursos selecionados." },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2.5">
                  <Icon name="check-circle" size={14} className="mt-0.5 shrink-0 text-success" />
                  <div className="text-caption text-foreground">
                    {item.text}
                    {item.sub ? <span className="mt-0.5 block text-subtle-foreground">{item.sub}</span> : null}
                  </div>
                </li>
              ))}
            </ul>,
          )}

          {summaryCard(
            "file-lines",
            "Dados jurídicos e financeiros",
            <StatusBadge tone="warning">Opcional agora</StatusBadge>,
            <div className="space-y-3">
              <p className="text-caption text-muted-foreground">Para criar sua organização, você não precisa desses dados agora. Eles só são exigidos quando você for publicar eventos pagos, receber valores ou solicitar saques — momento em que faremos a verificação (KYC) do responsável, como pessoa física, ou da empresa, como pessoa jurídica.</p>
              <Callout tone="brand">Quer adiantar? Você pode iniciar a verificação jurídica agora, ao criar a organização, ou deixar pra quando precisar movimentar valores.</Callout>
            </div>,
          )}

          <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-surface/95 px-4 py-3 pb-safe backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="flex flex-col-reverse items-stretch gap-3 md:flex-row md:items-start md:justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={finishing} leftIcon="arrow-left" className="hidden md:inline-flex">
                Voltar
              </Button>
              <div className="flex min-w-0 flex-col gap-2 md:min-w-[320px]">
                <Button size="lg" onClick={() => handleFinish()} loading={finishing} leftIcon="bolt">
                  Criar organização
                </Button>
                <Button variant="outline" onClick={() => handleFinish("/dashboard/configuracoes?tab=juridico-financeiro")} disabled={finishing}>
                  Criar e verificar dados jurídicos agora
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={finishing} leftIcon="arrow-left" className="md:hidden">
                  Voltar
                </Button>
              </div>
            </div>
            <p className="mt-3 hidden items-center justify-end gap-1.5 text-caption text-muted-foreground md:flex">
              <Icon name="lock" size={11} />
              Ao criar, você concorda com os{" "}
              <Link href="/termos" target="_blank" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                termos aplicáveis
                <Icon name="external" size={10} />
              </Link>
            </p>
          </div>
        </section>

        {/* ── Coluna direita ────────────────────────────────────────── */}
        <aside className="hidden xl:block">
          <Card accent className="gap-5 p-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">O que será criado agora</h3>
              <p className="mt-1.5 text-caption text-muted-foreground">Um espaço chamado {orgName}, administrado inicialmente por você, com o painel organizado conforme as áreas selecionadas.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="surface-inset flex w-full items-center gap-3 rounded-xl p-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-caption font-bold text-brand">{initials}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{fullName || "—"}</p>
                  <p className="text-micro uppercase tracking-wider text-subtle-foreground">Owner</p>
                </div>
              </div>
              <Icon name="chevron-down" size={12} className="my-1.5 text-subtle-foreground" />
              <div className="surface-inset flex w-full items-center gap-3 rounded-xl p-3.5">
                <Icon name="building" size={16} className="shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{orgName}</p>
                  <p className="text-caption text-muted-foreground">Sua organização</p>
                </div>
              </div>
              <Icon name="chevron-down" size={12} className="my-1.5 text-subtle-foreground" />
              <div className="surface-inset flex w-full flex-col gap-2.5 rounded-xl p-3.5">
                <div className="flex flex-wrap gap-2">
                  {previewGroups.slice(0, 3).map((group) => (
                    <span key={group.key} className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Icon name={BUSINESS_NEED_ICON[group.key as BusinessNeedKey] ?? "layers"} size={13} />
                    </span>
                  ))}
                  {previewGroups.length > 3 ? (
                    <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
                      <Icon name="chevron-right" size={11} />
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground tnum">
                    {activeAreasCount} {activeAreasCount === 1 ? "área ativa" : "áreas ativas"}
                  </p>
                  <p className="text-caption text-muted-foreground tnum">
                    {totalCapabilities} {totalCapabilities === 1 ? "recurso visível" : "recursos visíveis"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Próximos passos após a criação</p>
              <ul className="mt-3 space-y-2.5">
                {["Seu painel será configurado com as áreas e recursos que você escolheu.", "Você poderá convidar sua equipe e definir permissões.", "Complete os dados jurídicos quando precisar publicar eventos pagos ou solicitar saques."].map((text) => (
                  <li key={text} className="flex items-start gap-2.5 text-caption text-foreground">
                    <Icon name="check" size={11} className="mt-1 shrink-0 text-brand" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3 border-t border-border pt-4">
              <Icon name="question" size={16} className="mt-0.5 text-brand" />
              <div>
                <p className="text-sm font-semibold text-foreground">Dúvidas?</p>
                <p className="mt-0.5 text-caption text-muted-foreground">Nossa Central de Ajuda está sempre por perto.</p>
                <a href="mailto:contato@noktatickets.com.br" className="mt-1.5 inline-flex items-center gap-1.5 text-caption font-semibold text-brand hover:underline">
                  Falar com o suporte
                  <Icon name="external" size={10} />
                </a>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {/* Modal "Revisar termos" — somente leitura, o que já foi confirmado na etapa Termos */}
      <Dialog open={reviewingTerms} onOpenChange={setReviewingTerms}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Termos confirmados</DialogTitle>
            <DialogDescription>O que você aceitou na etapa anterior. Pra mudar, volte pra etapa Termos.</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="flex items-start gap-2.5">
              <Icon name="check-circle" size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="text-caption text-foreground">
                Autorização para administrar esta organização — Li e aceito os <ExternalTextLink href="/termos">Termos de Uso</ExternalTextLink> e a <ExternalTextLink href="/privacidade">Política de Privacidade</ExternalTextLink> da Nokta.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Icon name="check-circle" size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="text-caption text-foreground">Ciência de que dados jurídicos e financeiros serão necessários para publicar eventos pagos, receber valores ou solicitar saques.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <Icon name="check-circle" size={14} className="mt-0.5 shrink-0 text-success" />
              <p className="text-caption text-foreground">
                Termos específicos de eventos e bilheteria — Li e aceito os <ExternalTextLink href="/termos-bilheteria">Termos de Bilheteria</ExternalTextLink> e a <ExternalTextLink href="/politica-de-cancelamento">Política de Cancelamentos, Reembolsos e Chargebacks</ExternalTextLink> da Nokta.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewingTerms(false)}>
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReviewingTerms(false);
                setStep(2);
              }}
            >
              Alterar respostas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
