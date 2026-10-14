import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { COMPANY } from "@/lib/company";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/** Bloco "quem somos" usado no fim de todo documento legal — nunca repita os dados cadastrais inline. */
export function LegalContact({ title = "Contato", intro, className }: { title?: string; intro?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-card border border-border bg-surface p-5 text-sm shadow-card", className)}>
      {intro ? <p className="mb-3 text-muted-foreground">{intro}</p> : null}
      <p className="font-semibold text-foreground">{COMPANY.legalName}</p>
      <dl className="mt-2 space-y-1 text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-subtle-foreground">CNPJ</dt>
          <dd className="tnum">{COMPANY.cnpj}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-subtle-foreground">Endereço</dt>
          <dd>{COMPANY.addressLine}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-subtle-foreground">{title === "Contato" ? "E-mail" : title}</dt>
          <dd>
            <a href={`mailto:${COMPANY.emails.support}`} className="text-brand underline-offset-4 hover:underline">
              {COMPANY.emails.support}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Página legal (termos, privacidade, cancelamento). Coluna confortável de
 * leitura, índice no topo, cabeçalho com a identificação da empresa e
 * "Última atualização". O texto vem pronto em `sections` — este componente
 * só cuida da forma.
 */
export function LegalDocument({ title, lastUpdated, intro, sections, related, children }: { title: string; lastUpdated?: string; intro?: ReactNode; sections: LegalSection[]; related?: { label: string; href: string }[]; children?: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-balance text-display font-medium tracking-tight text-foreground">{title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
          <span>
            {COMPANY.legalName} · CNPJ <span className="tnum">{COMPANY.cnpj}</span>
          </span>
          {lastUpdated ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" size={11} />
              Última atualização: {lastUpdated}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-caption text-subtle-foreground">{COMPANY.addressLine}</p>
      </header>

      {intro ? <div className="legal-prose mt-8 text-[15px] leading-7 text-foreground/90">{intro}</div> : null}

      <nav aria-label="Índice" className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold text-foreground">Nesta página</p>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex gap-2 text-muted-foreground transition-colors hover:text-foreground">
                <span className="tnum w-5 shrink-0 text-subtle-foreground">{i + 1}.</span>
                <span>{s.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              <span className="tnum mr-2 text-subtle-foreground">{i + 1}.</span>
              {s.title}
            </h2>
            <div className="mt-3 text-[15px] leading-7 text-foreground/90 [&_a]:text-brand [&_a]:underline-offset-4 [&_a:hover]:underline [&_li+li]:mt-1 [&_p+p]:mt-3 [&_p+ul]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul+p]:mt-3">{s.content}</div>
          </section>
        ))}
      </div>

      {children}

      {related && related.length > 0 ? (
        <footer className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm">
          {related.map((r) => (
            <Link key={r.href} href={r.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {r.label}
            </Link>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
