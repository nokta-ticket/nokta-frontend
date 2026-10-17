/**
 * Fim das vendas de um evento, no cliente. Espelha a regra do backend
 * (`SALES_CUTOFF_MINUTES` em `core/common/utils/event-time.util.ts`): as
 * vendas encerram 120 minutos antes do início, e `data`/`horario` são o
 * horário de parede de Brasília (UTC-3, sem horário de verão).
 *
 * Serve só para a tela não oferecer uma compra que o backend vai recusar.
 * A autoridade continua sendo o backend: se a regra mudar lá, mudar aqui.
 */
export const SALES_CUTOFF_MINUTES = 120;

interface EventTime {
  data?: string | null;
  horario?: string | null;
}

/** Instante real do início do evento, ou null se data/horário não forem legíveis. */
export function getEventStartAt(evento: EventTime): Date | null {
  const date = evento.data?.split("T")[0];
  const rawTime = evento.horario ?? "";
  const time = (rawTime.includes("T") ? rawTime.split("T")[1] : rawTime).slice(0, 5);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const start = new Date(`${date}T${time}:00-03:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

/** true a partir de 120 minutos antes do início (inclusive depois que o evento começou). */
export function isSalesClosed(evento: EventTime, now: Date = new Date()): boolean {
  const start = getEventStartAt(evento);
  if (!start) return false;
  return now.getTime() >= start.getTime() - SALES_CUTOFF_MINUTES * 60 * 1000;
}

/**
 * Quanto tempo depois do INÍCIO o evento conta como encerrado. Espelha
 * `EVENT_FINISH_AFTER_START_HOURS` do backend: o evento não tem horário de
 * término, e 12h cobre festa que vira a madrugada (é também até quando a
 * portaria aceita o ingresso).
 */
export const EVENT_FINISH_AFTER_START_HOURS = 12;

/** true quando o evento já terminou (12h depois do início). Sem data/horário legível, nunca. */
export function isEventOver(evento: EventTime, now: Date = new Date()): boolean {
  const start = getEventStartAt(evento);
  if (!start) return false;
  return now.getTime() >= start.getTime() + EVENT_FINISH_AFTER_START_HOURS * 60 * 60 * 1000;
}
