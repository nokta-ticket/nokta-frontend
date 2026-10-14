import { cache } from "react";
import type { EventoAPI, GetEvents } from "@/interfaces/events";
import { citySlug } from "@/lib/agenda";
import { serverApiGet } from "@/lib/server-api";

const PAGE_SIZE = 100;
const MAX_PAGES = 5;

/**
 * Eventos públicos vendidos na Nokta (publicados, futuros, de organização
 * não bloqueada — o filtro é da API `GET /eventos`). Sem sessão: nunca
 * personalizado, seguro pra cache compartilhado. A API não filtra por
 * cidade, então paginamos (até 500 eventos) e filtramos aqui.
 */
export const getPublicNoktaEvents = cache(async (host: string | null, revalidate = 3600): Promise<EventoAPI[]> => {
  const all: EventoAPI[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await serverApiGet<GetEvents>(`/eventos?page=${page}&limit=${PAGE_SIZE}`, { host, revalidate });
    const items = res?.data ?? [];
    all.push(...items);
    const lastPage = res?.paginate?.lastPage ?? res?.paginate?.totalPages ?? page;
    if (items.length < PAGE_SIZE || page >= lastPage) break;
  }
  const seen = new Set<string>();
  return all
    .filter((e) => (seen.has(String(e.id)) ? false : (seen.add(String(e.id)), true)))
    .sort((a, b) => `${a.data}${a.horario ?? ""}`.localeCompare(`${b.data}${b.horario ?? ""}`));
});

export function noktaEventsInCity(events: EventoAPI[], slug: string): EventoAPI[] {
  return events.filter((e) => e.endereco?.localidade && citySlug(e.endereco.localidade) === slug);
}
