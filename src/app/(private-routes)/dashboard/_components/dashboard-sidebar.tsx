"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { OrgSwitcher } from "./org-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UnifiedSidebar } from "./unified-sidebar";

/**
 * Conteúdo da sidebar (desktop e gaveta do celular): logo → organização →
 * grupos de navegação por capacidade → rodapé (Explore + ajuda). Fundo
 * escuro SEMPRE (`sidebar-bg`), mesmo no tema claro do painel.
 */
function SidebarInner({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/dashboard/inicio" aria-label="Início" className="press text-white">
          <BrandLogo variant="nokta" height={24} className="text-white" />
        </Link>
        {mobile ? (
          <SheetClose className="ml-auto flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
            <Icon name="close" size={16} />
            <span className="sr-only">Fechar menu</span>
          </SheetClose>
        ) : null}
      </div>

      <div className="px-4 pb-4">
        <OrgSwitcher />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        <UnifiedSidebar
          footer={
            mobile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-1.5">
                <span className="text-sm text-white/70">Tema do painel</span>
                <ThemeToggle variant="sidebar" />
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}

/**
 * Gaveta do menu no celular/tablet (< lg). O botão fica dentro da Topbar.
 * Fecha sozinha ao trocar de rota.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="Abrir menu" className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2 lg:hidden">
          <Icon name="menu" size={18} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="sidebar-bg w-[min(20rem,88vw)] border-white/10 p-0 text-white">
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SidebarInner mobile />
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="sidebar-bg sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
      <SidebarInner />
    </aside>
  );
}
