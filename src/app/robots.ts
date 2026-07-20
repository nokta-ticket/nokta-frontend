import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isSurfaceEnforced, resolveSurfaceFromHost } from "@/lib/surfaces";

/**
 * Fase 5.1, Etapa 6 — robots.txt depende do host: app.nokta.live nunca deve
 * ser indexado (é o dashboard); noktatickets.com.br mantém as páginas
 * públicas indexáveis, só bloqueando as áreas autenticadas/privadas do
 * comprador; www.nokta.live (institucional) é totalmente indexável — é a
 * porta de entrada de busca pra plataforma. Dinâmico de propósito — o
 * mesmo build atende os três hosts, não dá pra ter arquivos estáticos.
 */
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

  if (enforced && surface === "MARKETING") {
    return {
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://www.nokta.live/sitemap.xml",
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Dashboard/produtor/admin nunca deveriam ser alcançados por este
      // host (o middleware já redireciona pra app.nokta.live), mas o
      // disallow fica como reforço; áreas privadas do comprador (perfil,
      // ingressos, revendas, favoritos) exigem login, sem valor de busca.
      disallow: [
        "/perfil",
        "/meus-ingressos",
        "/minhas-revendas",
        "/favoritos",
        "/dashboard",
        "/produtor",
        "/admin",
      ],
    },
    // Sem sitemap.xml gerado ainda pra este host — fora do escopo desta
    // fase (só reorganiza as superfícies, não cria descoberta de conteúdo
    // nova). Adicionar aqui quando existir.
  };
}
