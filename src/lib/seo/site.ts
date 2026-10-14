import { COMPANY } from "@/lib/company";

/**
 * Identidade de busca dos dois sites públicos do mesmo build:
 * - TICKETS (noktatickets.com.br): quem compra ingresso — eventos, cidades.
 * - MARKETING (nokta.live): quem produz evento ou opera bar — soluções,
 *   comparativos, guias.
 * Conteúdo de um site nunca é canônico no outro (ver `canonicalFor`).
 */
export const SITES = {
  tickets: { name: "Nokta Tickets", url: COMPANY.sites.tickets },
  marketing: { name: "Nokta", url: COMPANY.sites.marketing },
} as const;

export type SiteKey = keyof typeof SITES;

/** URL absoluta canônica de um caminho num dos sites. */
export function canonicalFor(site: SiteKey, path: string): string {
  const base = SITES[site].url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Imagem padrão de compartilhamento (gerada em src/app/opengraph-image.tsx). */
export const DEFAULT_OG_IMAGE = "/opengraph-image";

export const SEO_KEYWORDS = {
  tickets: ["ingressos", "comprar ingresso", "eventos", "festas", "baladas", "shows", "revenda de ingressos", "ingresso online", "Pix"],
  marketing: [
    "vender ingressos online",
    "plataforma de ingressos",
    "sistema para eventos",
    "lista VIP",
    "check-in de eventos",
    "promoters",
    "sistema para bar",
    "cardápio digital QR code",
    "comanda digital",
    "reservas de mesa",
    "controle de estoque bar",
  ],
} as const;
