import { NextResponse, type NextRequest } from "next/server";
import { citiesFrom, citySlug, getAgenda } from "@/lib/agenda";

/**
 * Agenda da home por cidade.
 * - `?cidade=auto` (padrão): cidade do IP (cabeçalho `x-vercel-ip-city` da
 *   Vercel; não existe em localhost). Sem cidade conhecida, devolve o Brasil.
 * - `?cidade=<slug>`: escolha da pessoa no seletor.
 * - `?cidade=brasil`: tudo.
 * Devolve também a cidade detectada pelo IP (`ipCity`), mesmo quando ela não
 * tem eventos na agenda: a home usa pra filtrar os eventos da própria Nokta.
 */
export const dynamic = "force-dynamic";

function ipCity(req: NextRequest): { slug: string; name: string } | null {
  const raw = req.headers.get("x-vercel-ip-city");
  if (!raw) return null;
  const name = decodeURIComponent(raw).trim();
  return name ? { slug: citySlug(name), name } : null;
}

export async function GET(req: NextRequest) {
  const wanted = req.nextUrl.searchParams.get("cidade") ?? "auto";
  const all = await getAgenda();
  const cities = citiesFrom(all).slice(0, 20).map(({ slug, name, count }) => ({ slug, name, count }));
  const fromIp = ipCity(req);

  let city: { slug: string; name: string } | null = null;
  // Automático: só fixa a cidade do IP se ela tiver eventos na agenda.
  if (wanted === "auto") city = fromIp && cities.some((c) => c.slug === fromIp.slug) ? fromIp : null;
  else if (wanted !== "brasil") city = cities.find((c) => c.slug === wanted) ?? { slug: wanted, name: wanted };

  const events = (city ? all.filter((e) => e.city && citySlug(e.city) === city.slug) : all).slice(0, 12);

  return NextResponse.json(
    { city, ipCity: fromIp, cities, events },
    // Resposta depende do IP no modo auto: nada de cache compartilhado.
    { headers: { "Cache-Control": wanted === "auto" ? "private, max-age=300" : "public, s-maxage=600, stale-while-revalidate=3600" } },
  );
}
