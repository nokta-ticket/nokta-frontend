import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { JsonLd, brtDateTime, breadcrumbLd } from "@/components/seo/json-ld";
import { formatBRL, formatEventDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { canonicalFor } from "@/lib/seo/site";
import { SOURCE_LABEL, citySlug, getAgenda, getAgendaEvent, type AgendaEvent } from "@/lib/agenda";
import { AgendaCard, OFFICIAL_LINK_PROPS, SoldAtBadge } from "../_components/agenda-card";
import { AgendaDisclosure } from "../_components/agenda-disclosure";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

function place(e: AgendaEvent): string {
  return [e.venue, e.city && `${e.city}${e.uf ? `/${e.uf}` : ""}`].filter(Boolean).join(", ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = await getAgendaEvent(id);
  if (!e) return { title: "Evento não encontrado", robots: { index: false } };
  const when = formatEventDate(e.date);
  return buildMetadata({
    site: "tickets",
    path: `/agenda/${e.id}`,
    title: `${e.name}: ingressos e data`,
    description: `${e.name}${place(e) ? ` em ${place(e)}` : ""}, ${when}${e.time ? ` às ${e.time}` : ""}. Veja local e preço e compre o ingresso no site oficial (${SOURCE_LABEL[e.source]}).`.slice(0, 160),
    image: e.image,
    // Evento que já passou sai do índice.
    noindex: e.date < new Date().toISOString().slice(0, 10),
  });
}

export default async function AgendaEventPage({ params }: Props) {
  const { id } = await params;
  const e = await getAgendaEvent(id);
  if (!e) notFound();

  const related = e.city ? (await getAgenda({ city: e.city })).filter((x) => x.id !== e.id).slice(0, 4) : [];
  const url = canonicalFor("tickets", `/agenda/${e.id}`);
  const sold = SOURCE_LABEL[e.source];

  const ld = {
    "@type": "Event",
    name: e.name,
    url,
    startDate: brtDateTime(e.date, e.time),
    eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : e.status === "postponed" ? "https://schema.org/EventPostponed" : e.status === "rescheduled" ? "https://schema.org/EventRescheduled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.image ? [e.image] : undefined,
    location: { "@type": "Place", name: e.venue || e.city || "Local a confirmar", address: { "@type": "PostalAddress", streetAddress: e.address ?? undefined, addressLocality: e.city ?? undefined, addressRegion: e.uf ?? undefined, addressCountry: "BR" } },
    offers:
      e.priceMin != null
        ? { "@type": "AggregateOffer", url: e.url, priceCurrency: "BRL", lowPrice: e.priceMin.toFixed(2), highPrice: (e.priceMax ?? e.priceMin).toFixed(2), availability: e.status === "offsale" ? "https://schema.org/SoldOut" : "https://schema.org/InStock" }
        : { "@type": "Offer", url: e.url, availability: "https://schema.org/InStock" },
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:px-6 lg:pt-10">
      <JsonLd
        data={[
          ld,
          breadcrumbLd("tickets", [
            { name: "Início", path: "/" },
            { name: "Agenda", path: "/agenda" },
            { name: e.name, path: `/agenda/${e.id}` },
          ]),
        ]}
      />

      <nav aria-label="Caminho" className="mb-4 flex items-center gap-1.5 text-caption text-muted-foreground">
        <Link href="/agenda" className="hover:text-foreground">
          Agenda
        </Link>
        {e.city ? (
          <>
            <Icon name="chevron-right" size={9} />
            <Link href={`/eventos/em/${citySlug(e.city)}`} className="hover:text-foreground">
              {e.city}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-border bg-gradient-to-br from-brand-from/40 via-surface to-brand-to/30 shadow-card">
          {e.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem do feed oficial, servida pela própria fonte
            <img src={e.image} alt={e.name} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-end p-6">
              <p className="text-2xl font-semibold leading-tight tracking-tight text-foreground/80">{e.name}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <SoldAtBadge event={e} />
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{e.name}</h1>
            <p className="mt-2 text-[15px] font-semibold text-brand lg:text-lg">
              {formatEventDate(e.date)}
              {e.time ? ` · ${e.time}` : ""}
            </p>
          </div>

          <dl className="space-y-3 rounded-card border border-border bg-surface p-4 text-sm">
            <div className="flex gap-3">
              <Icon name="map-pin" size={14} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <dt className="sr-only">Local</dt>
                <dd className="font-medium text-foreground">{e.venue || "Local a confirmar"}</dd>
                <dd className="text-muted-foreground">{[e.address, e.city && `${e.city}${e.uf ? ` · ${e.uf}` : ""}`].filter(Boolean).join(" · ")}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Icon name="ticket" size={14} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <dt className="sr-only">Preço</dt>
                <dd className="font-medium text-foreground">{e.priceMin != null ? (e.priceMax && e.priceMax !== e.priceMin ? `${formatBRL(e.priceMin)} a ${formatBRL(e.priceMax)}` : formatBRL(e.priceMin)) : "Preços no site oficial"}</dd>
                <dd className="text-muted-foreground">Valores informados por {sold}; taxas podem ser cobradas no site oficial.</dd>
              </div>
            </div>
            {e.genre ? (
              <div className="flex gap-3">
                <Icon name="music" size={14} className="mt-0.5 shrink-0 text-brand" />
                <dd className="font-medium text-foreground">{e.genre}</dd>
              </div>
            ) : null}
          </dl>

          <Button asChild size="lg" shape="pill" className="w-full">
            <a href={e.url} {...OFFICIAL_LINK_PROPS}>
              Comprar no site oficial ({sold})
              <Icon name="external" size={13} />
            </a>
          </Button>
          <p className="text-center text-caption text-muted-foreground">Você sai da Nokta e compra direto com {sold}.</p>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14" aria-labelledby="mais">
          <h2 id="mais" className="mb-4 text-title font-semibold tracking-tight text-foreground">
            Mais eventos em {e.city}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r, i) => (
              <AgendaCard key={r.id} event={r} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      <AgendaDisclosure className="mt-12" />
    </div>
  );
}
