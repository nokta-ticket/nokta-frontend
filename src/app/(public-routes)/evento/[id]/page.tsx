import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
// crawlers, navegador). O middleware casa só id numérico de propósito (ver
// comentário de EVENTO_BY_ID_RE lá): consultar a API pra TODO slug faria
// custo extra em toda visita, mesmo já correta.
//
// Slug antigo (nome do evento mudou desde que o link foi compartilhado, ver
// EventSlugHistory no backend, 2026-08-13) é resolvido AQUI: getEventForMetadata
// já busca o evento pra generateMetadata (Next memoiza o fetch idêntico
// dentro da mesma requisição — não duplica a chamada), então comparar
// `evento.slug` com o `id` da URL e chamar `redirect()` custa zero fetch
// extra no caminho comum. Isso é seguro (emite 307 HTTP real, não só troca
// client-side) porque roda num Server Component de verdade, ANTES de
// montar `<EventoPageClient>` — diferente da tentativa anterior de
// `permanentRedirect()` aqui, que rodava incondicionalmente e sem nenhum
// dado buscado antes dela (mesmo assim, não emitia 308 real; ver commit
// 6195cac). Nunca redireciona por id numérico aqui (evita competir com o
// 308 do middleware) nem quando o slug já bate com a URL.
export default async function EventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNumericId = /^\d+$/.test(id);

  if (!isNumericId) {
    const evento = await getEventForMetadata(id);
    if (evento?.slug && evento.slug !== id) {
      redirect(`/evento/${evento.slug}`);
    }
  }

  return <EventoPageClient />;
}
