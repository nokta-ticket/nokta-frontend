import { CURATED_AGENDA } from "@/content/agenda/curated";
import { fetchTicketmasterEvent, fetchTicketmasterEvents } from "./ticketmaster";
import type { AgendaEvent } from "./types";

export * from "./types";

/** "São Paulo" → "sao-paulo" (URL das páginas de cidade). */
export function citySlug(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function todayBrt(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

async function mockAgenda(): Promise<AgendaEvent[] | null> {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "1") return null;
  const { MOCK_AGENDA } = await import("@/mocks/agenda");
  return MOCK_AGENDA;
}

/**
 * Agenda completa (todas as fontes), só eventos de hoje em diante, em ordem
 * de data. Filtra por cidade quando `city` vem (nome ou slug).
 */
export async function getAgenda(opts: { city?: string } = {}): Promise<AgendaEvent[]> {
  const mock = await mockAgenda();
  const tm = mock ?? (await fetchTicketmasterEvents({ size: 200 }));
  const all = [...tm, ...(mock ? [] : CURATED_AGENDA)];
  const today = todayBrt();
  const wanted = opts.city ? citySlug(opts.city) : null;
  const seen = new Set<string>();
  return all
    .filter((e) => e.date >= today)
    .filter((e) => !wanted || (e.city && citySlug(e.city) === wanted))
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
}

export async function getAgendaEvent(id: string): Promise<AgendaEvent | null> {
  const mock = await mockAgenda();
  if (mock) return mock.find((e) => e.id === id) ?? null;
  if (id.startsWith("tm-")) return fetchTicketmasterEvent(id.slice(3));
  return CURATED_AGENDA.find((e) => e.id === id) ?? null;
}

/** Cidades com eventos na agenda, mais movimentadas primeiro. */
export function citiesFrom(events: AgendaEvent[]): { name: string; uf: string | null; slug: string; count: number }[] {
  const map = new Map<string, { name: string; uf: string | null; slug: string; count: number }>();
  for (const e of events) {
    if (!e.city) continue;
    const slug = citySlug(e.city);
    const cur = map.get(slug) ?? { name: e.city, uf: e.uf, slug, count: 0 };
    cur.count += 1;
    map.set(slug, cur);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
