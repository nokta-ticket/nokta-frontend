import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isSurfaceEnforced, resolveSurfaceFromHost } from "@/lib/surfaces";

/**
 * Fase 5, Etapa 11 — robots.txt depende do host: app.nokta.live nunca deve
 * ser indexado (é o dashboard); noktatickets.com.br mantém as páginas
 * públicas indexáveis, só bloqueando as áreas autenticadas/privadas do
 * comprador (que também nunca deveriam aparecer em busca). Dinâmico de
 * propósito — o mesmo build atende os dois hosts, não dá pra ter dois
 * arquivos estáticos.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("host");
  const isPlatform = isSurfaceEnforced(host) && resolveSurfaceFromHost(host) === "PLATFORM";

  if (isPlatform) {
    return {
      rules: { userAgent: "*", disallow: "/" },
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
    // Sem sitemap.xml gerado ainda — fora do escopo desta fase (só
    // reorganiza as duas superfícies, não cria descoberta de conteúdo
    // nova). Adicionar aqui quando existir.
  };
}
