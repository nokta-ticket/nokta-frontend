import type { Tone } from "@/components/ui/badge";
import type { IconName } from "@/components/ui/icon";

/** EventStatus da API: 1=DRAFT 2=PUBLISHED 3=CANCELLED 4=FINISHED. */
export const EVENT_STATUS = { DRAFT: 1, PUBLISHED: 2, CANCELLED: 3, FINISHED: 4 } as const;

export const EVENT_STATUS_META: Record<number, { label: string; tone: Tone; icon: IconName; description: string }> = {
  1: { label: "Rascunho", tone: "neutral", icon: "eye-slash", description: "Oculto do público. Só você vê." },
  2: { label: "Publicado", tone: "success", icon: "check-circle", description: "Visível na bilheteria e vendendo." },
  3: { label: "Cancelado", tone: "danger", icon: "ban", description: "Cancelado. Não pode ser reativado." },
  4: { label: "Finalizado", tone: "info", icon: "calendar-check", description: "Já aconteceu. Encerrado automaticamente." },
};

export const UNKNOWN_STATUS = { label: "Desconhecido", tone: "neutral" as Tone, icon: "question" as IconName, description: "" };

export function eventStatusMeta(status: number | null | undefined) {
  return EVENT_STATUS_META[status ?? 0] ?? UNKNOWN_STATUS;
}

/** Tipo do lote de ingresso (TipoIngresso da API). */
export const TIPO_INGRESSO_META: Record<number, { label: string; tone: Tone }> = {
  0: { label: "Gratuito", tone: "success" },
  1: { label: "Pago", tone: "brand" },
  2: { label: "Inteira", tone: "info" },
  3: { label: "Meia-entrada", tone: "warning" },
  4: { label: "VIP", tone: "danger" },
};

export const TIPO_INGRESSO_OPTIONS = [
  { value: "0", label: "Gratuito" },
  { value: "1", label: "Pago" },
  { value: "2", label: "Inteira" },
  { value: "3", label: "Meia-entrada" },
  { value: "4", label: "VIP" },
];

/** Status do pedido (OrderStatus): 1=PENDING 2=PAID 3=CANCELLED 4=FAILED. */
export const ORDER_STATUS_META: Record<number, { label: string; tone: Tone }> = {
  1: { label: "Pendente", tone: "warning" },
  2: { label: "Pago", tone: "success" },
  3: { label: "Cancelado", tone: "danger" },
  4: { label: "Falhou", tone: "neutral" },
};

export const ordinal = (n: number) => `${n}º`;
