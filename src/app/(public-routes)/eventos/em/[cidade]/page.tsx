import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { EventCardStatic } from "@/components/events/event-card-static";
import { JsonLd, breadcrumbLd, itemListLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { citiesFrom, citySlug, getAgenda } from "@/lib/agenda";
import { staticApiHost } from "@/lib/server-api";
import { MAIN_CITIES, mainCity, type CityInfo } from "@/lib/seo/cities";
import { buildMetadata } from "@/lib/seo/metadata";
import { getPublicNoktaEvents, noktaEventsInCity } from "@/lib/seo/public-events";
import { canonicalFor } from "@/lib/seo/site";
import { AgendaCard } from "../../../agenda/_components/agenda-card";
import { AgendaDisclosure } from "../../../agenda/_components/agenda-disclosure";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ cidade: string }> };

export function generateStaticParams() {
  return MAIN_CITIES.map((c) => ({ cidade: c.slug }));
}

/**
 * Eventos de uma cidade: os vendidos na Nokta (API pública) + a agenda de
 * outras plataformas (link pra venda oficial). Uma busca só de cada fonte,
 * filtrada aqui, também alimenta os links "outras cidades".
 */
const loadCity = cache(async (rawSlug: string) => {
  const slug = citySlug(decodeURIComponent(rawSlug));
  const [allNokta, allAgenda] = await Promise.all([getPublicNoktaEvents(staticApiHost()), getAgenda()]);
  const nokta = noktaEventsInCity(allNokta, slug);
  const agenda = allAgenda.filter((e) => e.city && citySlug(e.city) === slug);

  const fromData = nokta[0] ? { name: nokta[0].endereco.localidade, uf: nokta[0].endereco.uf || null } : agenda[0]?.city ? { name: agenda[0].city, uf: agenda[0].uf } : null;
  const known = mainCity(slug);
  const city: CityInfo | null = known ?? (fromData ? { slug, name: fromData.name, uf: fromData.uf } : null);

  // Cidades com evento (Nokta + agenda), mais movimentadas primeiro.
  const counts = new Map<string, { name: string; slug: string; count: number }>();
  for (const e of allNokta) {
    if (!e.endereco?.localidade) continue;
    const s = citySlug(e.endereco.localidade);
    const cur = counts.get(s) ?? { name: e.endereco.localidade, slug: s, count: 0 };
    cur.count += 1;
    counts.set(s, cur);
  }
  for (const c of citiesFrom(allAgenda)) {
    const cur = counts.get(c.slug) ?? { name: c.name, slug: c.slug, count: 0 };
    cur.count += c.count;
    counts.set(c.slug, cur);
  }
  const otherCities = [...counts.values()].filter((c) => c.slug !== slug).sort((a, b) => b.count - a.count);

  return { slug, city, nokta, agenda, otherCities };
});

function cityWithUf(city: CityInfo): string {
  return city.uf ? `${city.name} (${city.uf})` : city.name;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const { slug, city, nokta, agenda } = await loadCity(cidade);
  if (!city) return { title: "Cidade não encontrada", robots: { index: false, follow: false } };
  const meta = buildMetadata({
    site: "tickets",
    path: `/eventos/em/${slug}`,
    title: `Eventos em ${city.name}: festas, shows e ingressos`,
    description: `Festas, shows e baladas em ${cityWithUf(city)}: veja os próximos eventos, compre ingresso com Pix ou cartão em até 12x e confira a agenda da cidade.`.slice(0, 160),
    keywords: [`eventos em ${city.name}`, `festas em ${city.name}`, `shows em ${city.name}`, `baladas em ${city.name}`, `ingressos ${city.name}`],
  });
  // Página sem nenhum evento é útil pra quem chega, mas não pro Google:
  // fora do índice, mas os links pras outras cidades continuam seguidos.
  return nokta.length + agenda.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function CityEventsPage({ params }: Props) {
  const { cidade } = await params;
  const { slug, city, nokta, agenda, otherCities } = await loadCity(cidade);
  if (!city) notFound();

  const total = nokta.length + agenda.length;
  const path = `/eventos/em/${slug}`;
  const suggestions = otherCities.length > 0 ? otherCities.slice(0, 12) : MAIN_CITIES.filter((c) => c.slug !== slug).map((c) => ({ ...c, count: 0 }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 lg:px-6 lg:pt-10">
      <JsonLd
        data={[
          breadcrumbLd("tickets", [
            { name: "Início", path: "/" },
            { name: "Eventos", path: "/eventos" },
            { name: `Eventos em ${city.name}`, path },
          ]),
          ...(total > 0
            ? [
                itemListLd([
                  ...nokta.map((e) => ({ name: e.nome, url: canonicalFor("tickets", `/evento/${e.slug ?? e.id}`) })),
                  ...agenda.slice(0, 50).map((e) => ({ name: e.name, url: canonicalFor("tickets", `/agenda/${e.id}`) })),
                ]),
              ]
            : []),
        ]}
      />

      <nav aria-label="Caminho" className="mb-4 flex items-center gap-1.5 text-caption text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>
        <Icon name="chevron-right" size={9} />
        <Link href="/eventos" className="hover:text-foreground">
          Eventos
        </Link>
        <Icon name="chevron-right" size={9} />
        <span aria-current="page" className="text-foreground">
          {city.name}
        </span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">{`Eventos em ${city.name}`}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground lg:text-base">
          {total > 0
            ? `Festas, shows e baladas em ${cityWithUf(city)} num lugar só. Os eventos vendidos na Nokta têm ingresso com Pix ou cartão em até 12x e revenda oficial; os da agenda levam direto para a venda oficial de cada um.`
            : `Ainda não temos eventos em ${cityWithUf(city)} por aqui. Enquanto isso, veja o que está rolando em outras cidades ou busque um evento pelo nome.`}
        </p>
        {total > 0 ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="ticket" size={12} className="text-brand" />
              <span className="tabular-nums font-semibold text-foreground">{nokta.length}</span> na Nokta
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={12} className="text-brand" />
              <span className="tabular-nums font-semibold text-foreground">{agenda.length}</span> na agenda
            </span>
          </p>
        ) : null}
      </header>

      {total === 0 ? (
        <section aria-labelledby="sem-eventos" className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card lg:p-8">
          <h2 id="sem-eventos" className="text-title font-semibold tracking-tight text-foreground">
            Procurando o que fazer?
          </h2>
          <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">Veja todos os eventos à venda na Nokta ou a agenda de shows e festas pelo Brasil.</p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild size="lg" shape="pill" className="btn-lift">
              <Link href="/eventos">Ver todos os eventos</Link>
            </Button>
            <Button asChild size="lg" shape="pill" variant="secondary">
              <Link href="/agenda">Ver a agenda</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {nokta.length > 0 ? (
        <section aria-labelledby="na-nokta" className="mt-10">
          <h2 id="na-nokta" className="text-title font-semibold tracking-tight text-foreground">
            Na Nokta
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">Ingresso vendido aqui, com QR no celular e revenda oficial se você não puder ir.</p>
          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nokta.map((e, i) => (
              <EventCardStatic key={e.id} event={e} priority={i < 2} className="fade-up" style={{ "--i": Math.min(i, 8) } as React.CSSProperties} />
            ))}
          </div>
        </section>
      ) : null}

      {agenda.length > 0 ? (
        <section aria-labelledby="na-agenda" className="mt-12">
          <h2 id="na-agenda" className="text-title font-semibold tracking-tight text-foreground">
            Na agenda
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">Shows e festas vendidos em outras plataformas. Você compra no site oficial de cada evento.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agenda.map((e, i) => (
              <AgendaCard key={e.id} event={e} index={i} />
            ))}
          </div>
          <AgendaDisclosure className="mt-6" />
        </section>
      ) : null}

      <section aria-labelledby="outras-cidades" className="mt-12">
        <h2 id="outras-cidades" className="text-title font-semibold tracking-tight text-foreground">
          Eventos em outras cidades
        </h2>
        <nav aria-label="Outras cidades" className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((c) => (
            <Link key={c.slug} href={`/eventos/em/${c.slug}`} className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/50 hover:text-brand">
              <Icon name="map-pin" size={12} className="text-brand" />
              {c.name}
              {c.count > 0 ? <span className="tabular-nums text-muted-foreground">{c.count}</span> : null}
            </Link>
          ))}
        </nav>
      </section>

      {total > 0 ? (
        <aside className="mt-12 flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between lg:p-6">
          <div>
            <p className="text-[15px] font-semibold text-foreground">Produz eventos em {city.name}?</p>
            <p className="mt-0.5 text-caption text-muted-foreground">Venda ingressos, lista VIP e promoters pela Nokta, sem mensalidade.</p>
          </div>
          <Button asChild shape="pill" variant="secondary" className="shrink-0">
            <Link href="/para-produtores">Quero vender pela Nokta</Link>
          </Button>
        </aside>
      ) : null}
    </div>
  );
}
