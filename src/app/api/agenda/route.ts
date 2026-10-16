import { NextResponse, type NextRequest } from "next/server";
import { citiesFrom, citySlug, getAgenda } from "@/lib/agenda";
import { isUf, statePlace, ufFromSlug, inPlace, type Place } from "@/lib/place";

/**
 * Agenda da home e da busca por lugar.
 * - `?cidade=auto` (padrão): ESTADO do IP. A cidade do IP não é usada: em
 *   região metropolitana ela erra (Mauá vira São Paulo).
 * - `?cidade=uf-sp`: um estado escolhido no seletor.
 * - `?cidade=<slug>`: uma cidade escolhida no seletor.
 * - `?cidade=brasil`: tudo.
 * - `?q=`: filtra por nome, local ou cidade (busca). `?limit=` até 60.
 * Devolve também o estado do IP (`ipState`), mesmo sem eventos na agenda: a
 * tela usa pra filtrar os eventos da própria Nokta.
 */
export const dynamic = "force-dynamic";

const norm = (v: string) => citySlug(v).replace(/-/g, " ").trim();

/**
 * Estado do visitante. O site passa pela Cloudflare antes da Vercel, então o
 * cabeçalho da Vercel enxerga o servidor da Cloudflare (quase sempre o de São
 * Paulo), não a pessoa. `cf-region-code` vem do IP real da pessoa; só existe
 * com "Add visitor location headers" ligado na Cloudflare.
 */
function ipState(req: NextRequest): { place: Place | null; source: "cloudflare" | "vercel" | null } {
  const cfRegion = req.headers.get("cf-region-code")?.trim().toUpperCase();
  const cfCountry = req.headers.get("cf-ipcountry")?.trim().toUpperCase();
  if (cfRegion) return { place: (!cfCountry || cfCountry === "BR") && isUf(cfRegion) ? statePlace(cfRegion) : null, source: "cloudflare" };
  const country = req.headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  const region = req.headers.get("x-vercel-ip-country-region")?.trim().toUpperCase();
  if (region) return { place: (!country || country === "BR") && isUf(region) ? statePlace(region) : null, source: "vercel" };
  return { place: null, source: null };
}

export async function GET(req: NextRequest) {
  const wanted = req.nextUrl.searchParams.get("cidade") ?? "auto";
  const all = await getAgenda();
  const cities: Place[] = citiesFrom(all).map(({ slug, name, uf, count }) => ({ kind: "city", slug, name, uf, count }));
  const byUf = new Map<string, number>();
  for (const e of all) {
    const uf = e.uf?.toUpperCase();
    if (isUf(uf)) byUf.set(uf, (byUf.get(uf) ?? 0) + 1);
  }
  const states = [...byUf.entries()].map(([uf, count]) => statePlace(uf, count)).sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const fromIp = ipState(req);

  let place: Place | null = null;
  const wantedUf = ufFromSlug(wanted);
  // Automático: só fixa o estado do IP se ele tiver eventos na agenda.
  if (wanted === "auto") place = fromIp.place && byUf.has(fromIp.place.uf!) ? statePlace(fromIp.place.uf!, byUf.get(fromIp.place.uf!)) : null;
  else if (wantedUf) place = statePlace(wantedUf, byUf.get(wantedUf));
  else if (wanted !== "brasil") place = cities.find((c) => c.slug === wanted) ?? { kind: "city", slug: wanted, name: wanted, uf: null };

  const q = norm(req.nextUrl.searchParams.get("q") ?? "");
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 12, 1), 60);
  const events = all
    .filter((e) => !place || inPlace(place, e.city, e.uf))
    .filter((e) => !q || norm(`${e.name} ${e.venue ?? ""} ${e.city ?? ""}`).includes(q))
    .slice(0, limit);

  return NextResponse.json(
    { place, ipState: fromIp.place, ipSource: fromIp.source, states, cities, events },
    // Resposta depende do IP no modo auto: nada de cache compartilhado.
    { headers: { "Cache-Control": wanted === "auto" ? "private, max-age=300" : "public, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
