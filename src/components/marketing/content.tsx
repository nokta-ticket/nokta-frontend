import Link from "next/link";
import type { ReactNode } from "react";
import { FaqList } from "@/components/ui/faq";
import { Icon, type IconName } from "@/components/ui/icon";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo/json-ld";
import { CONTENT, type ContentEntry } from "@/content/marketing/registry";
import { cn } from "@/lib/cn";
import { CtaButtons } from "./cta-buttons";

/**
 * Blocos das páginas de conteúdo (soluções, comparativos, guias). Todos
 * server components: o texto vem no HTML, que é o que o Google lê primeiro.
 * Regras de escrita em DESIGN.md §6; regras de SEO em SEO.md.
 */

export interface Crumb {
  name: string;
  path: string;
}

/** Trilha de navegação visível + BreadcrumbList em JSON-LD. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Nokta", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbLd("marketing", all)} />
      <nav aria-label="Você está em" className="text-caption text-subtle-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 ? <Icon name="chevron-right" size={9} className="opacity-60" /> : null}
              {i < all.length - 1 ? (
                <Link href={c.path === "/" ? "/institucional" : c.path} className="hover:text-foreground">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-muted-foreground">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Topo da página: trilha, H1 (único na página), subtítulo e CTAs. */
export function ContentHero({ crumbs, title, lede, updated, cta = true, children }: { crumbs: Crumb[]; title: ReactNode; lede: ReactNode; updated?: string; cta?: boolean; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="ambient-blob -right-24 -top-24 size-[26rem] opacity-70" />
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-8 lg:px-6 lg:pb-16 lg:pt-12">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-5 text-balance font-display text-[2.6rem] uppercase leading-[0.95] text-foreground lg:text-[4rem]">{title}</h1>
        <p className="mt-5 max-w-[62ch] text-lg text-muted-foreground">{lede}</p>
        {updated ? (
          <p className="mt-3 text-caption text-subtle-foreground">
            Atualizado em <time dateTime={updated}>{new Date(`${updated}T12:00:00-03:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</time>
          </p>
        ) : null}
        {cta ? <CtaButtons className="mt-7" /> : null}
        {children}
      </div>
    </section>
  );
}

/** Seção de texto. `title` vira H2 com âncora (links diretos e sumário). */
export function ContentSection({ id, title, children, className, wide }: { id: string; title?: ReactNode; children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <section id={id} aria-labelledby={title ? `${id}-t` : undefined} className={cn("reveal mx-auto scroll-mt-24 px-4 py-10 lg:px-6 lg:py-14", wide ? "max-w-6xl" : "max-w-3xl", className)}>
      {title ? (
        <h2 id={`${id}-t`} className="text-balance text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground lg:text-[2rem]">
          {title}
        </h2>
      ) : null}
      <div className={cn(title && "mt-5")}>{children}</div>
    </section>
  );
}

/** Texto corrido com tipografia confortável (parágrafos, listas, links). */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 text-[16px] leading-7 text-muted-foreground",
        "[&_a]:font-medium [&_a]:text-brand [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li::marker]:text-brand",
        "[&_h3]:pt-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Grade de recursos com ícone inline (sem caixinha). */
export function FeatureGrid({ items, columns = 3 }: { items: { icon: IconName; title: string; text: string }[]; columns?: 2 | 3 }) {
  return (
    <ul className={cn("grid gap-4", columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2")}>
      {items.map((f) => (
        <li key={f.title} className="rounded-card border border-border bg-surface p-5 shadow-card">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <Icon name={f.icon} size={15} className="text-brand" />
            {f.title}
          </p>
          <p className="mt-2 text-body text-muted-foreground">{f.text}</p>
        </li>
      ))}
    </ul>
  );
}

export type Cell = string | boolean | null;

/**
 * Tabela comparativa. `true` = tem, `false` = não tem, `null` = não
 * informado publicamente (nunca chute). Rola de lado só dentro do próprio
 * container no celular; a primeira coluna fica fixa.
 */
export function ComparisonTable({ columns, rows, caption, note }: { columns: string[]; rows: { label: string; cells: Cell[] }[]; caption: string; note?: ReactNode }) {
  const render = (c: Cell) =>
    c === true ? (
      <span className="inline-flex items-center gap-1.5 text-success">
        <Icon name="check-circle" size={13} />
        Sim
      </span>
    ) : c === false ? (
      <span className="inline-flex items-center gap-1.5 text-subtle-foreground">
        <Icon name="minus" size={12} />
        Não
      </span>
    ) : c === null ? (
      <span className="text-subtle-foreground">Não informado</span>
    ) : (
      <span className="text-foreground">{c}</span>
    );
  return (
    <figure className="m-0">
      <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.08em] text-subtle-foreground">
                Recurso
              </th>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={cn("px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.08em]", i === 0 ? "text-brand" : "text-subtle-foreground")}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-3 text-left font-medium text-foreground">
                  {r.label}
                </th>
                {r.cells.map((c, i) => (
                  <td key={i} className={cn("border-t border-border px-4 py-3 align-top", i === 0 && "bg-brand-soft/40")}>
                    {render(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? <figcaption className="mt-3 text-caption leading-5 text-subtle-foreground">{note}</figcaption> : null}
    </figure>
  );
}

/** Perguntas frequentes visíveis + FAQPage em JSON-LD (respostas em texto puro). */
export function FaqSection({ id = "perguntas", title = "Perguntas frequentes", items }: { id?: string; title?: string; items: { q: string; a: string }[] }) {
  return (
    <ContentSection id={id} title={title}>
      <JsonLd data={faqLd(items)} />
      <FaqList items={items} name={id} />
    </ContentSection>
  );
}

/** Faixa final de conversão. */
export function CtaBand({ title = "Comece hoje, sem mensalidade", text = "Crie a conta, ligue só as partes que a sua operação usa e venda no mesmo dia." }: { title?: string; text?: string }) {
  return (
    <section className="reveal mx-auto max-w-6xl px-4 pb-16 pt-6 lg:px-6 lg:pb-24">
      <div className="card-accent relative overflow-hidden rounded-[24px] border border-border bg-surface p-7 lg:flex lg:items-center lg:justify-between lg:p-12">
        <div className="ambient-blob -right-16 -top-16 size-72" aria-hidden />
        <div className="relative max-w-xl">
          <h2 className="text-balance font-display text-[2rem] uppercase leading-none text-foreground lg:text-[2.6rem]">{title}</h2>
          <p className="mt-3 text-body text-muted-foreground">{text}</p>
        </div>
        <CtaButtons className="relative mt-6 lg:mt-0" />
      </div>
    </section>
  );
}

/** Links internos pra outras páginas do índice (mesma seção ou escolhidas). */
export function RelatedLinks({ currentPath, paths, title = "Leia também" }: { currentPath: string; paths?: string[]; title?: string }) {
  const items: ContentEntry[] = paths ? (paths.map((p) => CONTENT.find((c) => c.path === p)).filter(Boolean) as ContentEntry[]) : CONTENT.filter((c) => c.path !== currentPath).slice(0, 4);
  if (!items.length) return null;
  return (
    <ContentSection id="relacionados" title={title} wide>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((c) => (
          <li key={c.path}>
            <Link href={c.path} className="card-hover group block h-full rounded-card border border-border bg-surface p-5 shadow-card">
              <p className="text-[15px] font-semibold text-foreground group-hover:text-brand">{c.label}</p>
              <p className="mt-2 text-body text-muted-foreground">{c.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentSection>
  );
}

/** Página-índice de uma seção (cards de todas as páginas dela). */
export function SectionIndex({ entries }: { entries: ContentEntry[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((c) => (
        <li key={c.path}>
          <Link href={c.path} className="card-hover group flex h-full flex-col rounded-card border border-border bg-surface p-6 shadow-card">
            <p className="text-lg font-semibold text-foreground group-hover:text-brand">{c.label}</p>
            <p className="mt-2 flex-1 text-body text-muted-foreground">{c.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              Ler
              <Icon name="arrow-right" size={11} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
