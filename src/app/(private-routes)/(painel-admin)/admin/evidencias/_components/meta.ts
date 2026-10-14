import type { IconName } from "@/components/ui/icon";
import type { Tone } from "@/components/ui/badge";
import type { StatusMeta } from "../../_lib/status-meta";
import type { ScoreNivel, Severidade, VereditoTipo } from "./types";

export const SCORE_META: Record<ScoreNivel, StatusMeta> = {
  muito_forte: { label: "Muito forte", tone: "success" },
  forte: { label: "Forte", tone: "success" },
  moderado: { label: "Moderado", tone: "warning" },
  fraco: { label: "Fraco", tone: "danger" },
};

export const VEREDITO_META: Record<VereditoTipo, StatusMeta & { icon: IconName; summary: string }> = {
  defesa_recomendada: { label: "Defesa recomendada", tone: "success", icon: "check-circle", summary: "As evidências sustentam contestar a disputa." },
  analisar_manualmente: { label: "Analisar manualmente", tone: "warning", icon: "question", summary: "Há sinais nos dois sentidos — vale um olhar humano." },
  alto_risco: { label: "Alto risco", tone: "danger", icon: "warning", summary: "Indícios fortes de fraude ou de serviço não prestado." },
};

export const SEVERITY_META: Record<Severidade, StatusMeta> = {
  critico: { label: "Crítico", tone: "danger" },
  alto: { label: "Alto", tone: "warning" },
  medio: { label: "Médio", tone: "warning" },
  baixo: { label: "Baixo", tone: "neutral" },
};

/** Status do ingresso no vocabulário do Protect (1 ativo, 2 transferido, 3 revendido, 4 cancelado). */
export function protectTicketMeta(status: number, bloqueado: boolean): StatusMeta {
  if (bloqueado) return { label: "Bloqueado", tone: "danger" };
  switch (status) {
    case 1:
      return { label: "Ativo", tone: "success" };
    case 2:
      return { label: "Transferido", tone: "info" };
    case 3:
      return { label: "Revendido", tone: "warning" };
    case 4:
      return { label: "Cancelado", tone: "danger" };
    default:
      return { label: `Status ${status}`, tone: "neutral" };
  }
}

export function loteTipoNome(tipo: number): string {
  switch (tipo) {
    case 1:
      return "Normal";
    case 2:
      return "Meia";
    case 3:
      return "Gratuito";
    default:
      return `Tipo ${tipo}`;
  }
}

export function timelineTone(tipo: string): Tone {
  const upper = tipo.toUpperCase();
  if (upper.includes("VALIDADO") || upper.includes("ATIVAD")) return "success";
  if (upper.includes("FALHA") || upper.includes("CANCELADO") || upper.includes("BLOQUEADO")) return "danger";
  if (upper.includes("CRIADO") || upper.includes("PAGA") || upper.includes("COMPRA")) return "brand";
  if (upper.includes("TRANSFER") || upper.includes("REVEND")) return "info";
  return "neutral";
}

export function canalIcon(canal: string): IconName {
  switch (canal.toLowerCase()) {
    case "email":
      return "mail";
    case "whatsapp":
      return "whatsapp";
    default:
      return "message";
  }
}

export const TONE_DOT: Record<Tone, string> = { success: "bg-success", danger: "bg-danger", warning: "bg-warning", info: "bg-info", brand: "bg-brand", neutral: "bg-neutral" };
