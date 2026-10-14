"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

const ITEMS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Início", icon: "home", match: (p) => p === "/" },
  { href: "/eventos", label: "Buscar", icon: "search", match: (p) => p.startsWith("/eventos") || p.startsWith("/revenda") },
  { href: "/meus-ingressos", label: "Ingressos", icon: "ticket", match: (p) => p.startsWith("/meus-ingressos") || p.startsWith("/minhas-revendas") },
];

/**
 * Navegação inferior do celular — pílula flutuante de vidro escuro, 3
 * destinos. Esconde no desktop (a navegação vai pro cabeçalho).
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden">
      <div className="bottom-nav-glass pointer-events-auto flex h-16 w-full max-w-sm items-center justify-around rounded-pill px-2">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn("press relative flex h-12 w-16 flex-col items-center justify-center gap-1 rounded-pill transition-colors", active ? "text-brand" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon name={item.icon} size={20} />
              <span className={cn("absolute bottom-1 h-1 w-5 rounded-full bg-brand transition-all duration-150", active ? "scale-100 opacity-100" : "scale-50 opacity-0")} aria-hidden />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
