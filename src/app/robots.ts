import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isSurfaceEnforced, resolveSurfaceFromHost } from "@/lib/surfaces";
import { canonicalFor } from "@/lib/seo/site";

/**
 * Fase 5.1, Etapa 6 — robots.txt depende do host: app.nokta.live nunca deve
 * ser indexado (é o dashboard); noktatickets.com.br e www.nokta.live ficam
 * indexáveis, só bloqueando áreas privadas e de fluxo (login, checkout,
 * área do comprador, painel). Cada host aponta pro PRÓPRIO sitemap.
 * Dinâmico de propósito — o mesmo build atende os três hosts.
 *
 * As páginas bloqueadas aqui também têm `noindex` no metadata (reforço pra
 * quando alguém linka direto, já que o Google pode listar URL bloqueada
 * sem conteúdo).
 */
const PRIVATE_PATHS = [
  // painel / produtor / admin (moram em app.nokta.live; o middleware redireciona)
  "/dashboard",
  "/produtor",
  "/admin",
  "/solicitar-produtor",
  "/cardapio-preview",
  // área do comprador
  "/perfil",
  "/meus-ingressos",
  "/minhas-revendas",
  "/favoritos",
  // fluxos
  "/evento/*/checkout",
  "/revenda/anunciar",
  "/auth",
  "/login",
  "/register",
  "/recuperar-senha",
  "/convites",
  "/convites-promotor",
  "/descadastro",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host");
  const enforced = isSurfaceEnforced(host);
  const surface = resolveSurfaceFromHost(host);

  if (enforced && surface === "PLATFORM") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  const site = enforced && surface === "MARKETING" ? "marketing" : "tickets";
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: canonicalFor(site, "/sitemap.xml"),
  };
}
