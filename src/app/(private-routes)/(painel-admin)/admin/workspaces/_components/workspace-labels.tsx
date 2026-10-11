import { Badge } from "@/components/ui/badge";

export const MODULE_LABEL: Record<string, string> = {
  tickets: "Ingressos",
  venue: "Bar e restaurante",
};

const STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Ativo", className: "bg-green-100 text-green-700" },
  SUSPENDED: { label: "Bloqueado", className: "bg-red-100 text-red-700" },
  CANCELED: { label: "Cancelado", className: "bg-gray-100 text-gray-700" },
};

export function WorkspaceStatusBadge({ status }: { status: string }) {
  const item = STATUS[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <Badge className={`rounded-full px-3 py-1 text-xs ${item.className}`}>{item.label}</Badge>;
}

/**
 * Etapas do funil, na ordem em que o lead passa por elas: conta → as 4 etapas
 * do onboarding (Identificação cria o workspace) → concluído. `step` é a
 * posição entre as 4 etapas do onboarding; `detail` diz o que falta.
 */
const STAGE: Record<string, { label: string; detail: string; step: number | null; className: string }> = {
  CONTA_NAO_CONFIRMADA: {
    label: "Conta não confirmada",
    detail: "Criou a conta, mas não confirmou o telefone",
    step: null,
    className: "bg-gray-100 text-gray-700",
  },
  IDENTIFICACAO: {
    label: "Identificação",
    detail: "Entrou no painel e ainda não criou o workspace",
    step: 1,
    className: "bg-amber-100 text-amber-800",
  },
  OPERACAO: {
    label: "Operação",
    detail: "Criou o workspace, falta escolher as áreas",
    step: 2,
    className: "bg-amber-100 text-amber-800",
  },
  TERMOS: {
    label: "Termos",
    detail: "Escolheu as áreas, falta aceitar os termos",
    step: 3,
    className: "bg-amber-100 text-amber-800",
  },
  RESUMO: {
    label: "Resumo",
    detail: "Aceitou os termos, falta confirmar a criação",
    step: 4,
    className: "bg-amber-100 text-amber-800",
  },
  CONCLUIDO: {
    label: "Concluído",
    detail: "Terminou todas as etapas",
    step: null,
    className: "bg-green-100 text-green-700",
  },
};

export function stageInfo(etapa: string) {
  return STAGE[etapa] ?? { label: etapa, detail: "", step: null, className: "bg-gray-100 text-gray-700" };
}

export function WorkspaceStageBadge({ etapa }: { etapa: string }) {
  const item = stageInfo(etapa);
  return (
    <Badge className={`rounded-full px-3 py-1 text-xs ${item.className}`}>
      {item.step ? `Etapa ${item.step} de 4 · ${item.label}` : item.label}
    </Badge>
  );
}
