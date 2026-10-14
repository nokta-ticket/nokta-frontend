import type { Metadata } from "next";
import Image from "next/image";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { AREAS, type RebrandPage } from "./_data";

export const metadata: Metadata = {
  title: "Rebranding",
  description: "Relatório do redesign do front da Nokta, página por página.",
  robots: { index: false, follow: false },
};

const TOTAL = AREAS.reduce((n, a) => n + a.pages.length, 0);

const FACTS = [
  { value: String(TOTAL), label: "páginas documentadas" },
  { value: "56", label: "componentes no design system" },
  { value: "207/207", label: "testes passando" },
  { value: "OK", label: "build de produção com TS e ESLint", ok: true },
];

const PRODUCT_WIDE = [
  "Rosa como cor da marca; superfície pública sempre escura, no espírito da Gandaya; painel com tema claro e escuro.",
  "Design system documentado em DESIGN.md: tokens de cor, tipo, raio, sombra e movimento.",
  "Ícones só pelo registro FontAwesome; lucide saiu do código.",
  "Listas viram cards no celular; nenhuma tabela rola de lado.",
  "Logo nova em lettering branco e o raio da marca como favicon.",
  "Dados da empresa (razão social, CNPJ, endereço) num arquivo só, usados no rodapé e nas páginas legais.",
];

const FIXES = [
  "Tocar em “Ingressos” sem login levava pra home sem explicação; agora vai pro login e volta pra onde a pessoa ia.",
  "Login, cadastro e recuperação abrem como card por cima da página atual; clicar fora volta.",
  "Anúncio de revenda, política de cancelamento e termos da bilheteria abriam só com login; agora são públicos.",
  "Links pra plataforma não saem mais do ambiente em localhost/preview.",
  "Os dados de demonstração não entram no build de produção.",
];

function PageBlock({ page }: { page: RebrandPage }) {
  return (
    <article id={page.id} className="reveal grid scroll-mt-24 gap-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{page.name}</h3>
        <code className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-caption text-muted-foreground [overflow-wrap:anywhere]">{page.route}</code>
      </header>
      <ul className="grid max-w-3xl list-disc gap-1.5 pl-5 text-body text-muted-foreground marker:text-brand">
        {page.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="grid items-start gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <figure className="m-0 max-w-[260px] md:max-w-none">
          <div className="overflow-hidden rounded-card border border-border bg-surface-2 shadow-card">
            <Image src={`/rebranding/${page.id}-m.jpg`} alt={`${page.name} no celular`} width={330} height={931} className="block h-auto max-h-[520px] w-full object-cover object-top" unoptimized />
          </div>
          <figcaption className="mt-1.5 font-mono text-micro text-subtle-foreground">Celular · 390px</figcaption>
        </figure>
        <figure className="m-0 min-w-0">
          <div className="overflow-hidden rounded-card border border-border bg-surface-2 shadow-card">
            <Image src={`/rebranding/${page.id}-d.jpg`} alt={`${page.name} no desktop`} width={1000} height={625} className="block h-auto max-h-[440px] w-full object-cover object-top" unoptimized />
          </div>
          <figcaption className="mt-1.5 font-mono text-micro text-subtle-foreground">Desktop · 1440px</figcaption>
        </figure>
      </div>
    </article>
  );
}

/**
 * Relatório do rebranding (2026-10), página por página, com capturas do
 * localhost em modo de demonstração. Fora do índice de busca.
 */
export default function RebrandingPage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-16 pt-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14 lg:px-6">
      <nav aria-label="Índice" className="hidden text-sm lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
        {AREAS.map((area) => (
          <div key={area.id} className="mb-5">
            <a href={`#${area.id}`} className="mb-1.5 block font-semibold text-foreground hover:text-brand">
              {area.title}
            </a>
            <ol className="grid gap-0.5">
              {area.pages.map((p) => (
                <li key={p.id}>
                  <a href={`#${p.id}`} className="block rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
                    {p.name}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </nav>

      <div className="grid min-w-0 gap-16">
        <section className="grid gap-5">
          <div className="flex items-center gap-3 text-brand">
            <BrandLogo variant="bolt" height={22} className="text-brand" />
            <span className="font-mono text-caption uppercase tracking-[0.08em]">Rebranding · outubro de 2026</span>
          </div>
          <h1 className="font-display text-hero uppercase text-foreground [text-wrap:balance]">Redesign completo do front da Nokta</h1>
          <p className="max-w-[65ch] text-base text-muted-foreground">
            Todas as telas do produto refeitas num design system novo e verificadas em 390px (celular) e 1440px (desktop). As capturas abaixo saem do localhost em modo de demonstração, com eventos e dados fictícios.
          </p>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border md:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.label} className="bg-surface px-4 py-4">
                <p className={f.ok ? "text-stat font-semibold text-success" : "text-stat font-semibold tnum text-foreground"}>{f.value}</p>
                <p className="mt-1 text-caption text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon name="palette" size={14} />O que vale pro produto inteiro
            </h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-body text-muted-foreground marker:text-brand">
              {PRODUCT_WIDE.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <Icon name="check-circle" size={14} />
              Correções de comportamento
            </h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-body text-muted-foreground marker:text-brand">
              {FIXES.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        {AREAS.map((area) => (
          <section key={area.id} id={area.id} className="grid scroll-mt-24 gap-10">
            <header className="grid gap-2 border-t border-border pt-8">
              <h2 className="font-display text-[2rem] uppercase leading-none text-foreground md:text-[2.75rem]">
                {area.title}
                <span className="ml-3 align-middle font-mono text-caption tracking-[0.06em] text-brand">{area.pages.length} páginas</span>
              </h2>
              <p className="max-w-[70ch] text-body text-muted-foreground">{area.lede}</p>
            </header>
            {area.pages.map((page) => (
              <PageBlock key={page.id} page={page} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
