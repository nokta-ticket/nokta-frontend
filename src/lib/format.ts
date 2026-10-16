/**
 * Formatadores puros (pt-BR). Sem React, sem fetch — testáveis.
 */

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "YYYY-MM-DD" ou ISO completo → Date local (sem deslocamento de fuso). */
export function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const dateOnly = value.split("T")[0];
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** "Sáb, 17 de outubro" */
export function formatEventDate(value?: string | null): string {
  const d = parseDateOnly(value);
  if (!d) return "";
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

/** "17 out" */
export function formatEventDateShort(value?: string | null): string {
  const d = parseDateOnly(value);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** { day: "17", month: "OUT" } — pra o selo de data do card. */
export function formatDateBadge(value?: string | null): { day: string; month: string; weekday: string } | null {
  const d = parseDateOnly(value);
  if (!d) return null;
  return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS_SHORT[d.getMonth()].toUpperCase(), weekday: WEEKDAYS_SHORT[d.getDay()] };
}

/** "17/10/2026" */
export function formatDateBR(value?: string | null): string {
  const d = parseDateOnly(value);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/**
 * "15/10/2026" de um instante real (createdAt, expiresAt...), no horário de
 * Brasília. `formatDateBR` lê a data como está no texto, certo para a data do
 * evento mas não para um instante: compra às 22h de Brasília é dia seguinte em UTC.
 */
export function formatInstantDateBR(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** "22:00" de um instante real, no horário de Brasília. */
export function formatInstantTimeBR(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

/** "22:00" a partir de "22:00", "22:00:00" ou "1970-01-01T22:00:00.000Z". */
export function formatTime(value?: string | null): string | null {
  if (!value) return null;
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const hhmm = timePart?.slice(0, 5);
  return hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : null;
}

/** "Sáb, 17 de outubro · 22h" */
export function formatEventDateTime(data?: string | null, horario?: string | null): string {
  const date = formatEventDate(data);
  const time = formatTime(horario);
  if (!time) return date;
  const [h, m] = time.split(":");
  return `${date} · ${h}h${m === "00" ? "" : m}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBRLCents(cents: number): string {
  return formatBRL(cents / 100);
}

/** "R$ 60" quando inteiro, "R$ 59,90" quando não. */
export function formatPriceCompact(value: number): string {
  if (Number.isInteger(value)) return `R$ ${value.toLocaleString("pt-BR")}`;
  return formatBRL(value);
}

/** Primeiro nome + inicial do sobrenome. */
export function shortName(nome?: string | null, sobrenome?: string | null): string {
  const first = (nome ?? "").trim().split(/\s+/)[0] ?? "";
  const last = (sobrenome ?? "").trim();
  return last ? `${first} ${last[0]}.` : first;
}

export function initials(nome?: string | null, sobrenome?: string | null): string {
  const a = (nome ?? "").trim()[0] ?? "";
  const b = (sobrenome ?? "").trim()[0] ?? "";
  return `${a}${b}`.toUpperCase() || "N";
}

export function cityLabel(endereco?: { localidade?: string | null; uf?: string | null } | null): string {
  if (!endereco?.localidade) return "";
  return endereco.uf ? `${endereco.localidade} · ${endereco.uf}` : endereco.localidade;
}
