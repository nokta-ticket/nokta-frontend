import type { AgendaEvent } from "./types";

/**
 * Integração com a Discovery API do Ticketmaster (eventos do Brasil).
 *
 * Variáveis de ambiente (servidor):
 * - TICKETMASTER_API_KEY: chave gratuita em developer.ticketmaster.com.
 * - TICKETMASTER_AFFILIATE_URL: modelo de deep link do programa de
 *   afiliados (Impact), com `{url}` onde entra o link do evento codificado.
 *   Ex.: "https://ticketmaster.evyy.net/c/<publisher>/<ad>/<campaign>?u={url}"
 *   (os números vêm no onboarding). Sem ela, o link vai direto pro evento.
 *
 * Termos: a API exige link pro evento no Ticketmaster e proíbe revender o
 * acesso à API; a imagem é a do próprio feed. Nunca exibimos como venda da
 * Nokta (ver o selo "Vendido em" e o aviso de comissão na UI).
 */
const BASE = "https://app.ticketmaster.com/discovery/v2";

interface TmImage {
  url: string;
  ratio?: string;
  width?: number;
}
interface TmEvent {
  id: string;
  name: string;
  url: string;
  images?: TmImage[];
  dates?: { start?: { localDate?: string; localTime?: string }; status?: { code?: string } };
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  classifications?: { genre?: { name?: string }; segment?: { name?: string } }[];
  _embedded?: { venues?: { name?: string; city?: { name?: string }; state?: { stateCode?: string; name?: string }; address?: { line1?: string } }[] };
}

export function ticketmasterEnabled(): boolean {
  return Boolean(process.env.TICKETMASTER_API_KEY);
}

export function withAffiliate(url: string): string {
  const tpl = process.env.TICKETMASTER_AFFILIATE_URL;
  return tpl && tpl.includes("{url}") ? tpl.replace("{url}", encodeURIComponent(url)) : url;
}

function pickImage(images: TmImage[] = []): string | null {
  // Preferimos 16:9 grande (combina com o card da Nokta).
  const wide = images.filter((i) => i.ratio === "16_9").sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return (wide[0] ?? images[0])?.url ?? null;
}

export function mapTicketmasterEvent(e: TmEvent): AgendaEvent | null {
  const date = e.dates?.start?.localDate;
  if (!date) return null;
  const venue = e._embedded?.venues?.[0];
  const price = e.priceRanges?.find((p) => !p.currency || p.currency === "BRL");
  const genre = e.classifications?.[0]?.genre?.name;
  return {
    id: `tm-${e.id}`,
    source: "ticketmaster",
    name: e.name,
    date,
    time: e.dates?.start?.localTime?.slice(0, 5) ?? null,
    venue: venue?.name ?? null,
    city: venue?.city?.name ?? null,
    uf: venue?.state?.stateCode ?? null,
    address: venue?.address?.line1 ?? null,
    image: pickImage(e.images),
    url: withAffiliate(e.url),
    priceMin: price?.min ?? null,
    priceMax: price?.max ?? null,
    status: e.dates?.status?.code ?? null,
    genre: genre && genre !== "Undefined" ? genre : null,
  };
}

/**
 * Próximos eventos no Brasil (opcionalmente numa cidade). Cache de 1h no
 * servidor — o limite padrão da API é 5.000 chamadas/dia.
 */
export async function fetchTicketmasterEvents(opts: { city?: string; size?: number; keyword?: string } = {}): Promise<AgendaEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    apikey: key,
    countryCode: "BR",
    locale: "*",
    sort: "date,asc",
    size: String(Math.min(opts.size ?? 100, 200)),
    startDateTime: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  if (opts.city) params.set("city", opts.city);
  if (opts.keyword) params.set("keyword", opts.keyword);
  try {
    const res = await fetch(`${BASE}/events.json?${params}`, { next: { revalidate: 3600, tags: ["agenda"] } });
    if (!res.ok) return [];
    const json = (await res.json()) as { _embedded?: { events?: TmEvent[] } };
    return (json._embedded?.events ?? []).map(mapTicketmasterEvent).filter((e): e is AgendaEvent => e !== null && e.status !== "cancelled");
  } catch {
    return [];
  }
}

export async function fetchTicketmasterEvent(rawId: string): Promise<AgendaEvent | null> {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/events/${encodeURIComponent(rawId)}.json?apikey=${key}&locale=*`, { next: { revalidate: 3600, tags: ["agenda"] } });
    if (!res.ok) return null;
    return mapTicketmasterEvent((await res.json()) as TmEvent);
  } catch {
    return null;
  }
}
