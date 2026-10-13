"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      {/* Mesma faixa de 64px do header (topbar h-16): o -mt-5 anula o p-5
          do aside para a logo ficar no centro vertical do header. */}
      <div className="-mt-5 mb-1 flex h-16 shrink-0 items-center justify-center">
        <NoktaWordmark className="text-[46px]" />
      </div>

      <UnifiedSidebar />

      {/* No celular o atalho do conector sai da barra do topo (não cabe ao lado
          de período e workspace) e fica aqui, junto do resto do menu. */}
      <Link
        href="/dashboard/configuracoes?tab=ia"
        className="mt-3 flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#1c1a24] text-[13.5px] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100 lg:hidden"
      >
        Conectar ao Claude
      </Link>

      <div className="mt-3 border-t border-black/10 pt-3">
        <UserMenu variant="sidebar" />
      </div>
    </>
  );
}

/**
 * Gaveta do menu no celular/tablet (< lg). O botão fica dentro da Topbar:
 * antes existia uma segunda faixa só para ele e a logo, e as duas faixas
 * juntas tomavam 136px de uma tela de 844px.
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
        <Button variant="ghost" size="icon" aria-label="Abrir menu" className="-ml-2 size-10 lg:hidden">
          <Menu className="size-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(20rem,calc(100vw-3rem))] flex-col gap-2 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-sm"
      >
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        </SheetHeader>
        <SidebarInner />
      </SheetContent>
    </Sheet>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="hidden h-full w-[272px] flex-col gap-2 border-r border-black/10 bg-white p-5 text-sm lg:flex">
      <SidebarInner />
    </aside>
  );
}
