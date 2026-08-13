import type { Metadata } from "next";
import { headers } from "next/headers";
import { getApiBaseUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { resolveThumbnailUrl } from "@/lib/media";
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
  const bannerUrl = resolveThumbnailUrl(evento.thumbnails?.[0], null);
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
      images: bannerUrl ? [{ url: bannerUrl, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: bannerUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: bannerUrl ? [bannerUrl] : undefined,
    },
  };
}

export default function EventoPage() {
  return <EventoPageClient />;
}
