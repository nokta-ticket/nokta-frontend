import { COMPANY } from "@/lib/company";
import { SITES, canonicalFor, type SiteKey } from "@/lib/seo/site";

type Json = Record<string, unknown>;

/**
 * Dados estruturados (schema.org) — o que faz o Google mostrar resultado
 * rico (evento com data e preço, FAQ, estabelecimento com horário, caminho
 * de navegação). Sempre renderizado no servidor. `<` escapado pra o JSON
 * nunca fechar a tag script.
 */
export function JsonLd({ data }: { data: Json | Json[] }) {
  const payload = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : { "@context": "https://schema.org", ...data };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }} />;
}

const ORG_ID = `${SITES.marketing.url}/#organization`;

export function organizationLd(): Json {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: COMPANY.brand,
    legalName: COMPANY.legalName,
    alternateName: [COMPANY.tradeName, "Nokta Live"],
    url: SITES.marketing.url,
    logo: `${SITES.marketing.url}/icon.svg`,
    taxID: COMPANY.cnpj,
    foundingDate: String(COMPANY.foundedYear),
    email: COMPANY.emails.support,
    telephone: COMPANY.phone.e164,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${COMPANY.address.street}, ${COMPANY.address.number}, ${COMPANY.address.complement}`,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: "BR",
    },
    sameAs: [COMPANY.social.instagram, SITES.tickets.url],
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: COMPANY.emails.support, availableLanguage: ["Portuguese"], areaServed: "BR" }],
  };
}

/** WebSite com caixa de busca (sitelinks searchbox) apontando pra busca de eventos. */
export function websiteLd(site: SiteKey): Json {
  const base: Json = { "@type": "WebSite", "@id": `${SITES[site].url}/#website`, name: SITES[site].name, url: SITES[site].url, inLanguage: "pt-BR", publisher: { "@id": ORG_ID } };
  if (site === "tickets") {
    base.potentialAction = { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITES.tickets.url}/eventos?name={search_term_string}` }, "query-input": "required name=search_term_string" };
  }
  return base;
}

export function breadcrumbLd(site: SiteKey, items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: canonicalFor(site, it.path) })),
  };
}

export function faqLd(items: { q: string; a: string }[]): Json {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
}

export function softwareApplicationLd(opts: { name: string; description: string; path: string; category?: string }): Json {
  return {
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: canonicalFor("marketing", opts.path),
    applicationCategory: opts.category ?? "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: "pt-BR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL", description: "Sem mensalidade: você paga só quando vende." },
    publisher: { "@id": ORG_ID },
  };
}

export function articleLd(opts: { title: string; description: string; path: string; published: string; modified?: string; image?: string }): Json {
  return {
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: canonicalFor("marketing", opts.path),
    datePublished: opts.published,
    dateModified: opts.modified ?? opts.published,
    inLanguage: "pt-BR",
    image: opts.image ?? `${SITES.marketing.url}/opengraph-image`,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export interface EventLdInput {
  name: string;
  description?: string | null;
  url: string;
  /** "YYYY-MM-DD" (ou ISO) */
  date: string;
  /** "HH:mm" ou ISO com hora */
  time?: string | null;
  image?: string | null;
  venueName?: string | null;
  address?: { logradouro?: string | null; numero?: string | null; bairro?: string | null; localidade?: string | null; uf?: string | null; cep?: string | null } | null;
  /** Preços em reais dos lotes à venda. */
  prices?: number[];
  soldOut?: boolean;
  /** 1 rascunho · 2 publicado · 3 cancelado · 4 finalizado */
  status?: number;
  organizerName?: string | null;
}

/** Horário de Brasília: "2026-10-17T23:00:00-03:00". */
export function brtDateTime(date: string, time?: string | null): string {
  const day = date.split("T")[0];
  const hhmm = time ? (time.includes("T") ? time.split("T")[1] : time).slice(0, 5) : "20:00";
  return `${day}T${/^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "20:00"}:00-03:00`;
}

export function eventLd(e: EventLdInput): Json {
  const prices = (e.prices ?? []).filter((p) => Number.isFinite(p) && p >= 0);
  const offers = prices.length
    ? {
        "@type": "AggregateOffer",
        url: e.url,
        priceCurrency: "BRL",
        lowPrice: Math.min(...prices).toFixed(2),
        highPrice: Math.max(...prices).toFixed(2),
        offerCount: prices.length,
        availability: e.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        validFrom: new Date().toISOString().slice(0, 10),
      }
    : undefined;
  return {
    "@type": "Event",
    name: e.name,
    description: e.description?.slice(0, 500) || `Ingressos para ${e.name} na Nokta Tickets.`,
    url: e.url,
    startDate: brtDateTime(e.date, e.time),
    eventStatus: e.status === 3 ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.image ? [e.image] : undefined,
    location: {
      "@type": "Place",
      name: e.venueName || e.address?.localidade || "Local a confirmar",
      address: {
        "@type": "PostalAddress",
        streetAddress: [e.address?.logradouro, e.address?.numero].filter(Boolean).join(", ") || undefined,
        addressLocality: e.address?.localidade ?? undefined,
        addressRegion: e.address?.uf ?? undefined,
        postalCode: e.address?.cep ?? undefined,
        addressCountry: "BR",
      },
    },
    offers,
    organizer: { "@type": "Organization", name: e.organizerName || COMPANY.tradeName, url: SITES.tickets.url },
  };
}

export function itemListLd(items: { name: string; url: string }[]): Json {
  return { "@type": "ItemList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: it.url })) };
}
