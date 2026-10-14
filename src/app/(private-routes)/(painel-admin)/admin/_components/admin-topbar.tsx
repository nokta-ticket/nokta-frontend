"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { activeNavItem } from "../_lib/nav";
import { AdminTag } from "./admin-sidebar";
import { AdminUserMenu } from "./admin-user-menu";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="size-9" aria-hidden />;
  const dark = resolvedTheme === "dark";
  return (
    <Button type="button" variant="subtle" size="icon-sm" aria-label={dark ? "Usar tema claro" : "Usar tema escuro"} title={dark ? "Tema claro" : "Tema escuro"} onClick={() => setTheme(dark ? "light" : "dark")}>
      <Icon name={dark ? "sun" : "moon"} size={15} />
    </Button>
  );
}

/**
 * Barra do topo do admin: sólida (`bg-surface border-b`), nunca translúcida.
 * No celular: menu + logo; no desktop: nome da seção ativa. À direita, tema
 * e conta.
 */
export function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const active = activeNavItem(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-3 text-foreground lg:h-16 lg:px-6">
      <div className="flex min-w-0 items-center gap-1 lg:hidden">
        <Button type="button" variant="ghost" size="icon" aria-label="Abrir menu" onClick={onOpenMenu} className="-ml-1">
          <Icon name="menu" size={18} />
        </Button>
        <Link href="/admin/dashboard" aria-label="Dashboard" className="flex items-center gap-2 pl-1">
          <BrandLogo variant="nokta" height={20} />
          <AdminTag />
        </Link>
      </div>

      <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
        {active ? (
          <>
            <Icon name={active.icon} size={14} className="text-muted-foreground" />
            <p className="truncate text-sm font-semibold text-foreground">{active.label}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-foreground">Painel administrativo</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2">
        <ThemeToggle />
        <div className="hidden lg:block">
          <AdminUserMenu variant="topbar" />
        </div>
      </div>
    </header>
  );
}
