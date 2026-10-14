import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";

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
            <p className="max-w-xs text-body text-muted-foreground">Os melhores eventos e festas em um só lugar. Compre, revenda e viva a experiência Nokta.</p>
            <div className="flex items-center gap-2">
              <a href="https://instagram.com/nokta.live" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                <Icon name="instagram" size={16} />
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3">
                <Icon name="whatsapp" size={16} />
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
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-caption text-subtle-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Nokta. Todos os direitos reservados.</span>
          <span>Feito com ♥ para quem vive a noite.</span>
        </div>
      </div>
    </footer>
  );
}
