"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/context/OrganizationContext";
import { buildMenu } from "./build-menu";

function DashboardNav() {
  const pathname = usePathname();
  const { activeModuleKeys } = useOrganizations();
  const items = buildMenu(activeModuleKeys);

  return (
    <nav className="flex flex-col gap-2 text-white text-md">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-normal ${
              isActive ? "bg-violet-600 text-white" : "hover:bg-white/10"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardUserFooter() {
  const { user } = useAuth();
  const fullName = user
    ? `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim()
    : "";

  return (
    <div className="px-1 pb-2 text-xs text-white/70">
      <span className="block font-semibold text-white truncate max-w-[180px]">
        {fullName || "Usuário"}
      </span>
      <span className="block text-white/50 truncate max-w-[180px]">
        {user?.email ?? ""}
      </span>
      <Link href="/" className="mt-2 inline-block text-white/60 hover:text-white">
        Voltar para o site
      </Link>
    </div>
  );
}

function SidebarInner() {
  return (
    <>
      <div className="flex justify-center">
        <Image src="/logo-painel.svg" alt="Nokta Tickets" width={80} height={80} />
      </div>
      <Separator className="my-6 bg-white/10" />
      <DashboardNav />
      <Separator className="my-4 bg-white/10 mt-auto" />
      <DashboardUserFooter />
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
        <Image src="/logo-painel.svg" alt="Nokta Tickets" width={32} height={32} />
      </header>

      {/* Desktop: sidebar fixa */}
      <aside className="hidden lg:flex w-60 mt-5 p-4 flex-col text-sm">
        <SidebarInner />
      </aside>
    </>
  );
}
