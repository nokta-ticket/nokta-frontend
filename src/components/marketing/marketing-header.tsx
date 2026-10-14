"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { usePlatformHref, PRODUCER_SIGNUP_PATH } from "@/lib/use-platform-href";

const NAV = [
  { label: "Soluções", href: "/solucoes" },
  { label: "Comparativos", href: "/comparativos" },
  { label: "Guias", href: "/guias" },
];

/** Cabeçalho das páginas de conteúdo do nokta.live (soluções, comparativos, guias). */
export function MarketingHeader() {
  const entrar = usePlatformHref("/login");
  const cadastro = usePlatformHref(PRODUCER_SIGNUP_PATH);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md pt-safe">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-6">
        <Link href="/institucional" aria-label="Nokta, página inicial" className="press shrink-0">
          <BrandLogo variant="nokta" height={26} />
        </Link>
        <nav aria-label="Conteúdo" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-pill px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" shape="pill" size="sm" className="hidden sm:inline-flex">
            <a href={entrar}>Entrar</a>
          </Button>
          <Button asChild variant="primary" shape="pill" size="sm">
            <a href={cadastro}>Criar conta grátis</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
