import type { Metadata } from "next";
import { headers } from "next/headers";
import { cache } from "react";
import { JsonLd, breadcrumbLd, eventLd } from "@/components/seo/json-ld";
import { resolveThumbnailUrl } from "@/lib/media";
import { formatEventDate, formatTime } from "@/lib/format";
import { serverApiGet } from "@/lib/server-api";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITES, canonicalFor } from "@/lib/seo/site";
import { cityPath } from "@/lib/seo/cities";
import type { EventDetails } from "@/interfaces/events";
import EventoPageClient from "./_components/EventoPageClient";

/**
 * Server wrapper: `generateMetadata` (canonical na bilheteria, Open Graph
 * com o banner real) + JSON-LD `Event` no HTML do servidor. A página em si
 * continua client-side (EventoPageClient faz o próprio fetch) — crawlers
 * que não executam JS enxergam o <head> e os dados estruturados daqui.
 */
interface TicketLite {
  valor: number | string;
  quantidade?: number | null;
  disponivelParaVenda?: boolean | null;
}
type EventWithTickets = EventDetails & { ingressos?: TicketLite[] | null };

// `cache`: generateMetadata e a página dividem a mesma busca por request.
const getEvent = cache(async (slugOrId: string): Promise<{ evento: EventWithTickets; tickets: TicketLite[] } | null> => {
  const host = (await headers()).get("host");
  const evento = await serverApiGet<EventWithTickets>(`/eventos/${encodeURIComponent(slugOrId)}`, { host, revalidate: 60 });
  if (!evento) return null;
  let tickets = evento.ingressos ?? null;
  if (!tickets) {
    const res = await serverApiGet<{ data?: TicketLite[] } | TicketLite[]>(`/eventos/${encodeURIComponent(slugOrId)}/ingressos`, { host, revalidate: 60 });
    tickets = Array.isArray(res) ? res : (res?.data ?? []);
  }
  return { evento, tickets };
});

/** Banner absoluto (o OG/JSON-LD não aceitam caminho relativo). */
function bannerOf(evento: EventDetails): string | null {
  const url = resolveThumbnailUrl(evento.thumbnails?.[0], null);
  if (!url) return null;
  return url.startsWith("/") ? `${SITES.tickets.url}${url}` : url;
}

function todayBrt(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const found = await getEvent(id);
  // O layout raiz já aplica o template "%s · Nokta".
  if (!found) return { title: "Evento", robots: { index: false, follow: true } };
  const { evento } = found;

  const city = evento.endereco?.localidade;
  const where = [evento.local, city].filter(Boolean).join(", ");
  const time = formatTime(evento.horario);
  const description = `${evento.nome}${where ? ` em ${where}` : ""}, ${formatEventDate(evento.data).toLowerCase()}${time ? ` às ${time}` : ""}. Compre seu ingresso na Nokta Tickets com Pix ou cartão em até 12x.`;

  return buildMetadata({
    site: "tickets",
    path: `/evento/${evento.slug ?? evento.id}`,
    title: `${evento.nome}: ingressos`,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}...` : description,
    // Banner real do evento; sem banner, a imagem padrão da Nokta.
    image: bannerOf(evento),
    keywords: [`ingressos ${evento.nome}`, ...(city ? [`eventos em ${city}`, `festas em ${city}`] : [])],
    // Rascunho ou evento que já passou sai do índice.
    noindex: evento.status === 1 || (evento.data ? evento.data.slice(0, 10) < todayBrt() : false),
  });
}

// Compatibilidade com /evento/{id} (link antigo, id numérico) OU slug antigo
// (evento renomeado, ver EventSlugHistory no backend) é resolvida no
// middleware (src/middleware.ts, resolveEventoIdRedirect) — 308 real ANTES
// de qualquer render, garantido em qualquer ambiente (curl, crawlers,
// navegador). NÃO tentar resolver isso aqui de novo: duas tentativas already
// confirmadas (curl + produção) como NÃO emitindo um 3xx HTTP real quando
// chamadas de dentro deste componente — nem `permanentRedirect()` (commit
// 6195cac, incondicional) nem `redirect()` condicionado a um fetch real
// (commit cb93f04, revertido) — ambas só trocam a URL client-side via RSC,
// invisível pra quem não executa JS. O middleware é o único lugar
// confirmado como funcional para isso no Next.js 15.5.12 deste projeto.
export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getEvent(id);
  if (!found) return <EventoPageClient />;

  const { evento, tickets } = found;
  const path = `/evento/${evento.slug ?? evento.id}`;
  const onSale = tickets.filter((t) => t.disponivelParaVenda !== false && (t.quantidade ?? 1) > 0);
  const priced = (onSale.length ? onSale : tickets).map((t) => Number(t.valor)).filter((v) => Number.isFinite(v));
  const city = evento.endereco?.localidade;

  return (
    <>
      <JsonLd
        data={[
          eventLd({
            name: evento.nome,
            description: evento.descricao,
            url: canonicalFor("tickets", path),
            date: evento.data,
            time: evento.horario,
            image: bannerOf(evento),
            venueName: evento.local,
            address: evento.endereco,
            prices: priced,
            soldOut: tickets.length > 0 && onSale.length === 0,
            status: evento.status,
          }),
          breadcrumbLd("tickets", [
            { name: "Início", path: "/" },
            ...(city ? [{ name: `Eventos em ${city}`, path: cityPath(city) }] : [{ name: "Eventos", path: "/eventos" }]),
            { name: evento.nome, path },
          ]),
        ]}
      />
      <EventoPageClient />
    </>
  );
}
