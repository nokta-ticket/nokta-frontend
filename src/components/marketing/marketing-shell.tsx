import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { JsonLd, organizationLd, websiteLd } from "@/components/seo/json-ld";
import { CONTENT, SECTION_META, type ContentSection } from "@/content/marketing/registry";
import { COMPANY, LEGAL_LINE } from "@/lib/company";
import { getPublicTicketsUrl } from "@/lib/surfaces";
import { MarketingHeader } from "./marketing-header";

const FOOTER_SECTIONS: ContentSection[] = ["solucoes", "comparativos", "guias"];

/**
 * Moldura das páginas de conteúdo do nokta.live (soluções, comparativos,
 * guias): header próprio, rodapé com links internos pra todas as páginas
 * do índice (bom pra rastreamento e pra distribuir autoridade) e os dados
 * da empresa, mais Organization/WebSite em JSON-LD.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <JsonLd data={[organizationLd(), websiteLd("marketing")]} />
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div className="space-y-4">
              <BrandLogo variant="nokta" height={26} />
              <p className="max-w-xs text-body text-muted-foreground">Ingressos, operação do bar e restaurante, reservas e financeiro numa conta só.</p>
              <div className="flex items-center gap-2">
                <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Nokta" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                  <Icon name="instagram" size={16} />
                </a>
                <a href={getPublicTicketsUrl("/")} aria-label="Bilheteria Nokta Tickets" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                  <Icon name="ticket" size={15} />
                </a>
              </div>
            </div>
            {FOOTER_SECTIONS.map((s) => {
              const items = CONTENT.filter((c) => c.section === s);
              return (
                <div key={s}>
                  <Link href={SECTION_META[s].path} className="mb-3 block text-sm font-semibold text-foreground hover:text-brand">
                    {SECTION_META[s].title}
                  </Link>
                  <ul className="space-y-2 text-body text-muted-foreground">
                    {items.map((c) => (
                      <li key={c.path}>
                        <Link href={c.path} className="transition-colors hover:text-foreground">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-10 space-y-2 border-t border-border pt-6 text-caption text-subtle-foreground">
            <p>{LEGAL_LINE}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/termos" className="hover:text-foreground">Termos de uso</Link>
              <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
              <Link href="/politica-de-cancelamento" className="hover:text-foreground">Política de cancelamento</Link>
              <span>{COMPANY.emails.support}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
