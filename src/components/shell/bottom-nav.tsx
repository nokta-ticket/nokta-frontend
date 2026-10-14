"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { useSlidingIndicator } from "@/components/ui/use-sliding-indicator";
import { cn } from "@/lib/cn";

const ITEMS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Início", icon: "home", match: (p) => p === "/" },
  { href: "/eventos", label: "Buscar", icon: "search", match: (p) => p.startsWith("/eventos") || p.startsWith("/revenda") },
  { href: "/meus-ingressos", label: "Ingressos", icon: "ticket", match: (p) => p.startsWith("/meus-ingressos") || p.startsWith("/minhas-revendas") },
];

/**
 * Navegação inferior do celular — pílula flutuante de vidro escuro, 3
 * destinos. O realce rosa DESLIZA até o destino tocado e o ícone dá um
 * "pulo" curto. Esconde no desktop (a navegação vai pro cabeçalho).
 */
export function BottomNav() {
  const pathname = usePathname();
  const { ref, rect, animate } = useSlidingIndicator<HTMLDivElement>('[aria-current="page"]', [pathname]);

  return (
    <nav aria-label="Navegação principal" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden">
      <div ref={ref} className="bottom-nav-glass pointer-events-auto relative flex h-16 w-full max-w-sm items-center justify-around rounded-pill px-2">
        {rect ? (
          <span
            aria-hidden
            className={cn("pointer-events-none absolute left-0 rounded-pill bg-brand-soft", animate && "transition-[transform,width] duration-[420ms] ease-out-soft")}
            style={{ top: rect.top, height: rect.height, width: rect.width, transform: `translateX(${rect.left}px)` }}
          >
            <span className="absolute bottom-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-brand" />
          </span>
        ) : null}
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn("press relative z-10 flex h-12 w-16 flex-col items-center justify-center rounded-pill transition-colors duration-200", active ? "text-brand" : "text-muted-foreground hover:text-foreground")}
            >
              {/* key muda quando ativa → a animação de "pulo" roda a cada troca */}
              <span key={active ? "on" : "off"} className={active ? "nav-pop" : undefined}>
                <Icon name={item.icon} size={20} />
              </span>
              {!rect && active ? <span className="absolute bottom-1 h-1 w-5 rounded-full bg-brand" aria-hidden /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
