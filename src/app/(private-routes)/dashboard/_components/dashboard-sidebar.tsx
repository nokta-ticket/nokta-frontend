"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UnifiedSidebar } from "./unified-sidebar";
import { UserMenu } from "./user-menu";
import { NoktaWordmark } from "@/components/brand/nokta-wordmark";

// Sidebar: logo → grupos de navegação por capacidade (Fase 4 — navegação
// unificada definitiva; ver docs/platform/unified-navigation.md "Estruturas
// transitórias removidas"). O fallback do switcher Tickets|Venue existiu
// nas Fases 3-4 só como rede de segurança durante a migração; removido
// depois de validado autenticado em produção. Rollback é por git revert.
//
// Card de perfil no rodapé (abaixo de Ajuda/Explore, dentro de
// UnifiedSidebar): mesmo UserMenu da topbar, variant="sidebar" — evita
// duas fontes de verdade pro mesmo dropdown de conta/logout.
function SidebarInner() {
  return (
    <>
      <div className="flex items-center justify-center pb-2">
        <NoktaWordmark className="text-[38px]" />
      </div>

      <UnifiedSidebar />

      <div className="mt-3 border-t border-black/10 pt-3">
        <UserMenu variant="sidebar" />
      </div>
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile: menu em Sheet */}
      <header className="flex items-center gap-3 border-b border-black/10 bg-white p-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="w-5 h-5 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 p-5 bg-white flex flex-col text-sm"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            </SheetHeader>
            <SidebarInner />
          </SheetContent>
        </Sheet>
        <NoktaWordmark className="text-[32px]" />
      </header>

      {/* Desktop: sidebar fixa */}
      <aside className="hidden h-full lg:flex w-[272px] flex-col gap-2 border-r border-black/10 bg-white p-5 text-sm">
        <SidebarInner />
      </aside>
    </>
  );
}
