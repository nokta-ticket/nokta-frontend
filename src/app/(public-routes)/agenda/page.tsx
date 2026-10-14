import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { JsonLd, breadcrumbLd, itemListLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { canonicalFor } from "@/lib/seo/site";
import { citiesFrom, getAgenda } from "@/lib/agenda";
import { AgendaCard } from "./_components/agenda-card";
import { AgendaDisclosure } from "./_components/agenda-disclosure";

export const revalidate = 3600;

export const metadata = buildMetadata({
  site: "tickets",
  path: "/agenda",
  title: "Agenda de shows, festas e eventos no Brasil",
  description: "Próximos shows, festas e festivais em São Paulo, Rio e outras cidades, com data, local, preço e link direto para a venda oficial dos ingressos.",
  keywords: ["agenda de shows", "agenda de eventos", "shows em São Paulo", "festas em São Paulo", "eventos hoje"],
});

const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export default async function AgendaPage() {
  const events = await getAgenda();
  const cities = citiesFrom(events).slice(0, 12);
  const months = new Map<string, typeof events>();
  for (const e of events) {
    const k = monthKey(e.date);
    months.set(k, [...(months.get(k) ?? []), e]);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 lg:px-6 lg:pt-10">
      <JsonLd
        data={[
          breadcrumbLd("tickets", [
            { name: "Início", path: "/" },
            { name: "Agenda", path: "/agenda" },
          ]),
          itemListLd(events.slice(0, 50).map((e) => ({ name: e.name, url: canonicalFor("tickets", `/agenda/${e.id}`) }))),
        ]}
      />

      <header className="max-w-3xl">
        <p className="text-caption font-semibold uppercase tracking-[0.14em] text-brand">Agenda</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">Shows, festas e eventos pelo Brasil</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground lg:text-base">Os próximos eventos de outras plataformas, reunidos num lugar só. Você vê data, local e preço aqui e compra direto no site oficial de cada evento.</p>
      </header>

      {cities.length > 0 ? (
        <nav aria-label="Cidades" className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {cities.map((c) => (
            <Link key={c.slug} href={`/eventos/em/${c.slug}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/50 hover:text-brand">
              <Icon name="map-pin" size={12} className="text-brand" />
              {c.name}
              <span className="tabular-nums text-muted-foreground">{c.count}</span>
            </Link>
          ))}
        </nav>
      ) : null}

      {events.length === 0 ? (
        <EmptyState className="mt-10" icon="calendar" title="A agenda está sendo atualizada" description="Volte em breve. Enquanto isso, veja os eventos vendidos na Nokta." />
      ) : (
        <div className="mt-8 space-y-10">
          {[...months.entries()].map(([k, list]) => (
            <section key={k} aria-labelledby={`m-${k}`}>
              <h2 id={`m-${k}`} className="mb-4 text-title font-semibold capitalize tracking-tight text-foreground">
                {MONTH.format(new Date(`${k}-01T12:00:00Z`))}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((e, i) => (
                  <AgendaCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AgendaDisclosure className="mt-12" />
    </div>
  );
}
