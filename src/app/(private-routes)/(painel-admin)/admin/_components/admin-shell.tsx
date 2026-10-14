"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

/**
 * Shell do painel administrativo: sidebar fixa de 272px no desktop (sempre
 * escura), gaveta à esquerda no celular, topbar sólida e `<main>` com o
 * fundo ambiente do painel. O tema (claro/escuro) é o salvo pelo usuário —
 * escuro por padrão, toggle na topbar.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div data-dashboard-shell className="fixed inset-0 flex flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <aside className="sidebar-bg hidden w-[272px] shrink-0 lg:flex lg:flex-col">
        <AdminSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="page-ambient main-edge route-enter flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="sidebar-bg w-[min(20rem,88vw)] border-r-0 p-0 text-white [&>button]:text-white/70 [&>button:hover]:bg-white/10 [&>button:hover]:text-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu do admin</SheetTitle>
          </SheetHeader>
          <AdminSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
