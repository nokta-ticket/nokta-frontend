import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { COMPANY, LEGAL_LINE } from "@/lib/company";

const COLUMNS = [
  { title: "Explorar", links: [{ label: "Eventos", href: "/eventos" }, { label: "Revenda oficial", href: "/revenda" }, { label: "Para produtores", href: "/para-produtores" }] },
  { title: "Conta", links: [{ label: "Meus ingressos", href: "/meus-ingressos" }, { label: "Minhas revendas", href: "/minhas-revendas" }, { label: "Favoritos", href: "/favoritos" }, { label: "Meu perfil", href: "/perfil" }] },
  { title: "Ajuda", links: [{ label: "Central de ajuda", href: "/ajuda" }, { label: "Política de cancelamento", href: "/politica-de-cancelamento" }, { label: "Termos de uso", href: "/termos" }, { label: "Privacidade", href: "/privacidade" }] },
];

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-background pb-28 lg:pb-10">
      <div className="mx-auto max-w-7xl px-4 pt-10 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <BrandLogo height={30} />
            <p className="flex max-w-xs items-start gap-2 text-body text-muted-foreground">
              <BrandLogo variant="bolt" height={16} className="mt-1 text-brand" />
              <span>Os melhores eventos e festas em um só lugar. Compre, revenda e viva a experiência Nokta.</span>
            </p>
            <div className="flex items-center gap-2">
              <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                <Icon name="instagram" size={16} />
              </a>
              <a href={`mailto:${COMPANY.emails.support}`} aria-label="E-mail de suporte" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                <Icon name="mail" size={15} />
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-body text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 space-y-2 border-t border-border pt-6 text-caption text-subtle-foreground">
          <p>{LEGAL_LINE}</p>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {COMPANY.tradeName}. Todos os direitos reservados.
            </span>
            <a href={`mailto:${COMPANY.emails.support}`} className="transition-colors hover:text-foreground">
              {COMPANY.emails.support}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
