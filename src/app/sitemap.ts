import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getMarketingUrl, isSurfaceEnforced, resolveSurfaceFromHost } from "@/lib/surfaces";

/**
 * Fase 5.1, Etapa 6 — sitemap só existe (com URLs) pra www.nokta.live
 * (institucional): a bilheteria nunca teve sitemap gerado (fora de escopo
 * mudar isso agora) e a plataforma nunca deve ter um. Mesmo build atende
 * os três hosts, então o conteúdo depende do host da requisição.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get("host");
  const isMarketing = isSurfaceEnforced(host) && resolveSurfaceFromHost(host) === "MARKETING";

  if (!isMarketing) return [];

  const lastModified = new Date();
  return [
    { url: getMarketingUrl("/"), lastModified, changeFrequency: "monthly", priority: 1 },
    { url: getMarketingUrl("/termos"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: getMarketingUrl("/privacidade"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
