"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { ADMIN_NAV, activeNavItem } from "../_lib/nav";
import { AdminUserMenu } from "./admin-user-menu";

/** Etiqueta "Admin" ao lado da logo — distingue este painel do dashboard do produtor. */
export function AdminTag({ className }: { className?: string }) {
  return <span className={cn("rounded-pill bg-brand/15 px-2 py-0.5 text-micro font-bold uppercase tracking-[0.1em] text-brand ring-1 ring-inset ring-brand/30", className)}>Admin</span>;
}

/**
 * Conteúdo da sidebar (desktop fixa e gaveta do celular). A base é sempre
 * escura (`sidebar-bg`), em qualquer tema — por isso os textos são brancos
 * direto, não `text-foreground`.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link href="/admin/dashboard" aria-label="Dashboard" className="press flex items-center gap-2.5">
          <BrandLogo variant="nokta" height={22} className="text-white" />
          <AdminTag />
        </Link>
      </div>

      <nav aria-label="Menu do admin" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {ADMIN_NAV.map((group) => (
          <div key={group.title} className="pt-3 first:pt-1">
            <p className="px-3 pb-1.5 text-micro font-semibold uppercase tracking-[0.12em] text-white/35">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active?.href === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isActive ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150", isActive ? "bg-nav-active text-white" : "text-white/65 hover:bg-white/5 hover:text-white")}>
                      <Icon name={item.icon} size={14} fw className={isActive ? "text-brand" : "text-white/50"} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <AdminUserMenu variant="sidebar" />
      </div>
    </div>
  );
}
