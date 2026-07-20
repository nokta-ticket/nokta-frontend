import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converte data+hora "de parede" (o que a hostess digitou, ex.: 2026-08-01
 * 19:00) no timezone DA UNIDADE para um instante UTC preciso — nunca usa o
 * timezone do navegador como fonte de verdade.
 */
export function zonedWallClockToUtcIso(dateStr: string, timeStr: string, timeZone: string): string {
  return dayjs.tz(`${dateStr}T${timeStr}`, timeZone).utc().toISOString();
}

/** Exibe um instante UTC (ISO) no timezone da unidade, nunca no do navegador. */
export function formatInTimeZone(iso: string, timeZone: string, fmt: string): string {
  return dayjs(iso).tz(timeZone).format(fmt);
}

/** "YYYY-MM-DD" do instante no timezone da unidade — usado para agrupar por dia. */
export function zonedDateKey(iso: string, timeZone: string): string {
  return dayjs(iso).tz(timeZone).format("YYYY-MM-DD");
}

/** Data de hoje ("YYYY-MM-DD") no timezone da unidade — nunca a do navegador. */
export function todayInTimeZone(timeZone: string): string {
  return dayjs().tz(timeZone).format("YYYY-MM-DD");
}
