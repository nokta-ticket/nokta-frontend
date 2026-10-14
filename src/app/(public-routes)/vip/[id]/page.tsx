import type { Metadata } from "next";
import { headers } from "next/headers";
import { getApiBaseUrl, getPublicTicketsUrl } from "@/lib/surfaces";
import { resolveMediaUrl, MEDIA_FALLBACK } from "@/lib/media";
import { VipEntry } from "./_components/VipEntry";

// Link da lista VIP que o produtor divulga: /vip/nome-do-evento. É a página
// do evento com o VIP para retirar no lugar dos lotes pagos.

interface VipListResponse {
  evento: { id: number; nome: string; slug: string | null; thumbnail: string | null };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const host = (await headers()).get("host");

  let evento: VipListResponse["evento"] | null = null;
  try {
    const res = await fetch(`${getApiBaseUrl(host)}/lista-vip/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (res.ok) evento = ((await res.json()) as VipListResponse).evento;
  } catch {
    evento = null;
  }
  // O layout raiz já aplica o template "%s · Nokta".
  if (!evento) return { title: "Lista VIP" };

  const title = `Lista VIP · ${evento.nome}`;
  const description = `Retire seu VIP para ${evento.nome} na Nokta Tickets.`;
  const bannerUrl = resolveMediaUrl(evento.thumbnail, null) ?? getPublicTicketsUrl(MEDIA_FALLBACK);
  const url = getPublicTicketsUrl(`/vip/${evento.slug ?? evento.id}`);

  return {
    title,
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
    twitter: { card: "summary_large_image", title, description, images: [bannerUrl] },
  };
}

export default function VipPage() {
  return <VipEntry />;
}
