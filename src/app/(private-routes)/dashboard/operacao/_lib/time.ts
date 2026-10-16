/** Helpers de tempo das telas operacionais (sem React). */

export function minutesSince(iso: string, nowMs = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60000));
}

/** "21:33" no fuso do navegador (operação é sempre "agora", no próprio salão). */
export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}

/** "17/10/2026" */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "há 12 min", "há 1 h 20", "agora". */
export function formatSince(iso: string, nowMs = Date.now()): string {
  const min = minutesSince(iso, nowMs);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `há ${h} h` : `há ${h} h ${String(m).padStart(2, "0")}`;
}

/** "12 min" / "1 h 20" — tempo decorrido sem o "há". */
export function formatElapsed(iso: string, nowMs = Date.now()): string {
  const min = minutesSince(iso, nowMs);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
