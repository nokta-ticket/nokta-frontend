"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

// Sidebar: logo → grupos de navegação por capacidade (Fase 4 — navegação
// unificada definitiva; ver docs/platform/unified-navigation.md "Estruturas
// transitórias removidas"). O fallback do switcher Tickets|Venue existiu
// nas Fases 3-4 só como rede de segurança durante a migração; removido
// depois de validado autenticado em produção. Rollback é por git revert.
function SidebarInner() {
  return (
    <>
      <div className="flex justify-center">
        <Image src="/logonokta-branca.svg" alt="Nokta" width={140} height={40} />
      </div>

      <UnifiedSidebar />
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
      <header className="flex items-center gap-3 p-4 bg-[#151619] lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="w-5 h-5 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-60 p-4 bg-black border-black flex flex-col text-sm"
          >
            <SheetHeader>
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            </SheetHeader>
            <SidebarInner />
          </SheetContent>
        </Sheet>
        <Image src="/logonokta-branca.svg" alt="Nokta" width={90} height={26} />
      </header>

      {/* Desktop: sidebar fixa */}
      <aside className="hidden lg:flex w-60 mt-5 p-4 flex-col text-sm">
        <SidebarInner />
      </aside>
    </>
  );
}
