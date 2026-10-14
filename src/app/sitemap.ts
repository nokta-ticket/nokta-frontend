import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { CONTENT, SECTION_META } from "@/content/marketing/registry";
import { citiesFrom, citySlug, getAgenda } from "@/lib/agenda";
import { isSurfaceEnforced, resolveSurfaceFromHost } from "@/lib/surfaces";
import { getPublicNoktaEvents } from "@/lib/seo/public-events";
import { canonicalFor } from "@/lib/seo/site";

/**
 * Um build, três hosts: o sitemap lista só as URLs do host que está
 * servindo (o Google só aceita, por padrão, URLs do mesmo host do sitemap),
 * sempre na forma canônica (`canonicalFor`), igual ao `<link rel=canonical>`
 * de cada página.
 * - www.nokta.live: LP + soluções/comparativos/guias (registry) + legais.
 * - www.noktatickets.com.br (e localhost/preview, que caem no público):
 *   home, busca, eventos da Nokta, revenda, agenda, cidades, legais.
 * - app.nokta.live: nunca indexado — vazio.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host");
  const enforced = isSurfaceEnforced(host);
  const surface = resolveSurfaceFromHost(host);

  if (enforced && surface === "PLATFORM") return [];
  if (enforced && surface === "MARKETING") return marketingSitemap();
  return ticketsSitemap(host);
}

function marketingSitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => canonicalFor("marketing", path);
  const latest = CONTENT.reduce((max, e) => (e.updated > max ? e.updated : max), "2026-01-01");
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    ...Object.values(SECTION_META).map((s) => ({ url: url(s.path), lastModified: latest, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...CONTENT.map((e) => ({ url: url(e.path), lastModified: e.updated, changeFrequency: "monthly" as const, priority: e.section === "solucoes" ? 0.8 : 0.7 })),
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/politica-de-cancelamento"), changeFrequency: "yearly", priority: 0.2 },
  ];
}

async function ticketsSitemap(host: string | null): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => canonicalFor("tickets", path);
  // Cache de dados de 1h nas duas fontes (fetch com revalidate).
  const [events, agenda] = await Promise.all([getPublicNoktaEvents(host), getAgenda()]);

  // Só cidades com pelo menos um evento: as vazias são noindex.
  const citySlugs = new Set<string>();
  for (const e of events) if (e.endereco?.localidade) citySlugs.add(citySlug(e.endereco.localidade));
  for (const c of citiesFrom(agenda)) citySlugs.add(c.slug);

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/eventos"), changeFrequency: "daily", priority: 0.9 },
    ...events.map((e) => ({ url: url(`/evento/${e.slug ?? e.id}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...[...citySlugs].map((slug) => ({ url: url(`/eventos/em/${slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
    { url: url("/revenda"), changeFrequency: "daily", priority: 0.6 },
    { url: url("/agenda"), changeFrequency: "daily", priority: 0.6 },
    ...agenda.map((e) => ({ url: url(`/agenda/${e.id}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    { url: url("/para-produtores"), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/ajuda"), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/termos"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/termos-bilheteria"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/privacidade"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/politica-de-cancelamento"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
