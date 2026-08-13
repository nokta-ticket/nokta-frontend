import type { Metadata } from "next";
import { headers } from "next/headers";
import { getApiBaseUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { resolveThumbnailUrl, MEDIA_FALLBACK } from "@/lib/media";
import type { EventDetails } from "@/interfaces/events";
import EventoPageClient from "./_components/EventoPageClient";

/**
 * Server wrapper só para `generateMetadata` (Open Graph) — a página em si
 * continua 100% client-side (EventoPageClient, que já faz seu próprio fetch
 * via useEffect/useParams). Sem isso, o preview de compartilhamento (Share2)
 * caía no `metadata` genérico do Root Layout (logo Nokta), nunca o banner
 * real do evento — crawlers de redes sociais não executam JS, então só
 * enxergam o que vem no <head> do HTML servido, nunca o fetch client-side.
 */
async function getEventForMetadata(slugOrId: string): Promise<EventDetails | null> {
  const host = (await headers()).get("host");
  const apiBaseUrl = getApiBaseUrl(host);

  try {
    const res = await fetch(`${apiBaseUrl}/eventos/${slugOrId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as EventDetails;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const evento = await getEventForMetadata(id);

  if (!evento) {
    return { title: "Evento — Nokta Tickets" };
  }

  const title = evento.nome;
  const description =
    evento.descricao?.slice(0, 200) || `Ingressos para ${evento.nome} na Nokta Tickets.`;
  // Banner real do evento se existir; senão a logo padrão da Nokta — nunca
  // omite a imagem OG (crawlers de WhatsApp/Telegram/Facebook preferem
  // sempre ter uma imagem no preview, mesmo genérica, a não ter nenhuma).
  const bannerUrl = resolveThumbnailUrl(evento.thumbnails?.[0], null) ?? getPublicTicketsUrl(MEDIA_FALLBACK);
  const url = getPublicTicketsUrl(`/evento/${evento.slug ?? evento.id}`);

  return {
    title: `${title} — Nokta Tickets`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Nokta Tickets",
      locale: "pt_BR",
      type: "website",
      images: [{ url: bannerUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [bannerUrl],
    },
  };
}

// Compatibilidade com /evento/{id} (link antigo, id numérico) é resolvida
// no middleware (src/middleware.ts, resolveEventoIdRedirect) — 308 real
// ANTES de qualquer render, garantido em qualquer ambiente (curl,
// crawlers, navegador). Não duplicar aqui: `permanentRedirect()` chamado
// dentro deste componente foi tentado e confirmado (curl + next start
// local, sem CDN no meio) como NÃO emitindo um 308 HTTP real na requisição
// de documento — só troca a URL client-side via RSC, invisível pra quem
// não executa JS.
export default function EventoPage() {
  return <EventoPageClient />;
}
