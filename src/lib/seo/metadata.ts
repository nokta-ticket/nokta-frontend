import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, SEO_KEYWORDS, SITES, canonicalFor, type SiteKey } from "./site";

export interface PageSeo {
  /** Título da página (o layout raiz aplica o template "%s · Nokta"). */
  title: string;
  /** 140–160 caracteres: o que a pessoa encontra aqui, com a palavra-chave. */
  description: string;
  /** Caminho no site canônico, ex. "/solucoes/lista-vip". */
  path: string;
  site: SiteKey;
  /** Imagem de compartilhamento (absoluta ou relativa ao site). */
  image?: string | null;
  keywords?: string[];
  /** Páginas privadas, de fluxo ou de teste. */
  noindex?: boolean;
  /** Título completo, ignorando o template do layout (ex.: home). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Metadata canônica de toda página pública: canonical absoluto no site
 * certo, Open Graph e Twitter completos, keywords e robots. Uma função só
 * pra nenhuma página esquecer canonical ou imagem.
 */
export function buildMetadata(seo: PageSeo): Metadata {
  const url = canonicalFor(seo.site, seo.path);
  const site = SITES[seo.site];
  const image = seo.image ?? `${site.url}${DEFAULT_OG_IMAGE}`;
  const title = seo.absoluteTitle ? { absolute: seo.title } : seo.title;

  return {
    title,
    description: seo.description,
    keywords: [...(seo.keywords ?? []), ...SEO_KEYWORDS[seo.site]],
    alternates: { canonical: url },
    robots: seo.noindex ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      siteName: site.name,
      locale: "pt_BR",
      type: seo.type ?? "website",
      images: [{ url: image, width: 1200, height: 630, alt: seo.title }],
      ...(seo.type === "article" ? { publishedTime: seo.publishedTime, modifiedTime: seo.modifiedTime } : null),
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [image] },
  };
}

/** Atalho pra páginas que nunca devem aparecer no Google. */
export const NOINDEX: Metadata = { robots: { index: false, follow: false } };
