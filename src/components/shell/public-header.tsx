"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { PRODUCER_DASHBOARD_PATH, PRODUCER_SIGNUP_PATH, usePlatformHref } from "@/lib/use-platform-href";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchCommand } from "./search-command";

const NAV = [
  { label: "Eventos", href: "/eventos" },
  { label: "Revenda", href: "/revenda" },
  { label: "Produtores", href: "/para-produtores" },
];

/** Só visual (span) — quem envolve decide se é Link ou botão, pra nunca aninhar <a> em <a>/<button>. */
function Avatar({ className }: { className?: string }) {
  const { isAuthenticated, isAuthResolved, user } = useAuth();
  const photo = user?.fotoPerfil ? resolveMediaUrl(user.fotoPerfil, null) : null;

  if (!isAuthResolved) return <span className={cn("block size-9 rounded-full bg-white/10", className)} aria-hidden />;
  if (!isAuthenticated) {
    return (
      <span className={cn("flex size-9 items-center justify-center rounded-full text-current", className)}>
        <Icon name="user-circle" size={24} />
      </span>
    );
  }
  return (
    <span className={cn("flex size-9 items-center justify-center overflow-hidden rounded-full bg-brand text-caption font-bold text-brand-foreground ring-2 ring-background/40", className)}>
      {photo ? <Image src={photo} alt="" width={36} height={36} className="size-full object-cover" unoptimized /> : initials(user?.nome, user?.sobrenome)}
    </span>
  );
}

function UserMenu({ scrolled }: { scrolled: boolean }) {
  const { isAuthenticated, isAuthResolved, user, role, signOut } = useAuth();
  const router = useRouter();
  const createHref = usePlatformHref(PRODUCER_SIGNUP_PATH);
  const dashboardHref = usePlatformHref(PRODUCER_DASHBOARD_PATH);

  if (!isAuthResolved) return <Avatar />;
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={cn("inline-flex h-10 items-center rounded-pill px-4 text-sm font-semibold transition-colors", scrolled ? "text-foreground hover:bg-surface-2" : "text-white/85 hover:bg-white/10 hover:text-white")}>
          Entrar
        </Link>
        <a href={createHref} className="btn-lift inline-flex h-10 items-center gap-2 rounded-pill bg-white pl-4 pr-3 text-sm font-bold text-[#16060f]">
          Criar evento
          <span className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Icon name="bolt" size={11} />
          </span>
        </a>
      </div>
    );
  }

  const isProducer = role === "PRODUTOR";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Minha conta" className={cn("flex items-center gap-2 rounded-pill p-0.5 pr-2.5 transition-colors", scrolled ? "text-foreground hover:bg-surface-2" : "text-white hover:bg-white/10")}>
          <Avatar />
          <span className="hidden max-w-[120px] truncate text-sm font-semibold xl:block">{user?.nome}</span>
          <Icon name="chevron-down" size={11} className="opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-60 rounded-card border-border bg-surface p-1.5 shadow-3">
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.nome} {user?.sobrenome}
          </p>
          <p className="truncate text-caption text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <MenuItem icon="ticket" label="Meus ingressos" onSelect={() => router.push("/meus-ingressos")} />
        <MenuItem icon="transfer" label="Minhas revendas" onSelect={() => router.push("/minhas-revendas")} />
        <MenuItem icon="heart" label="Favoritos" onSelect={() => router.push("/favoritos")} />
        <MenuItem icon="user" label="Meu perfil" onSelect={() => router.push("/perfil")} />
        <DropdownMenuSeparator className="bg-border" />
        {isProducer ? <MenuItem icon="chart-line" label="Painel do produtor" onSelect={() => window.location.assign(dashboardHref)} /> : <MenuItem icon="bolt" label="Quero produzir eventos" onSelect={() => router.push("/para-produtores")} />}
        <DropdownMenuSeparator className="bg-border" />
        <MenuItem icon="logout" label="Sair" onSelect={() => signOut()} danger />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({ icon, label, onSelect, danger }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onSelect: () => void; danger?: boolean }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm focus:bg-surface-2", danger ? "text-danger focus:text-danger" : "text-foreground")}>
      <Icon name={icon} size={14} fw className={danger ? "text-danger" : "text-muted-foreground"} />
      {label}
    </DropdownMenuItem>
  );
}

/** Links com um realce que desliza atrás do item sob o mouse. */
function DesktopNav({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ left: number; width: number } | null>(null);

  const move = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const list = listRef.current;
    if (!list) return;
    const r = e.currentTarget.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    setHover({ left: r.left - l.left, width: r.width });
  };

  return (
    <div ref={listRef} onMouseLeave={() => setHover(null)} className="relative flex items-center">
      <span aria-hidden className={cn("absolute inset-y-0 rounded-pill transition-[transform,width,opacity] duration-200 ease-out-soft", scrolled ? "bg-surface-2" : "bg-white/10", hover ? "opacity-100" : "opacity-0")} style={{ width: hover?.width ?? 0, transform: `translateX(${hover?.left ?? 0}px)` }} />
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} onMouseEnter={move} className={cn("relative z-10 flex h-10 items-center px-4 text-sm font-semibold transition-colors", scrolled ? (active ? "text-foreground" : "text-muted-foreground hover:text-foreground") : active ? "text-white" : "text-white/70 hover:text-white")}>
            {item.label}
            <span className={cn("absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand transition-opacity", active ? "opacity-100" : "opacity-0")} aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Cabeçalho do celular. Logo à esquerda; à direita a conta (pílula
 * "Entrar" de vidro ou avatar com anel rosa). Busca e navegação ficam na
 * barra inferior. Fora da home ganha o "voltar". Transparente no topo,
 * vidro escuro ao rolar.
 */
function MobileHeader({ isHome, scrolled, isAuthenticated, isAuthResolved, onBack }: { isHome: boolean; scrolled: boolean; isAuthenticated: boolean; isAuthResolved: boolean; onBack: () => void }) {
  return (
    <header className={cn("sticky top-0 z-40 pt-safe transition-[background-color,box-shadow] duration-300 lg:hidden", scrolled ? "bg-background/80 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" : "bg-background")}>
      <div className="flex h-16 items-center gap-2.5 px-5">
        {!isHome ? (
          <button type="button" onClick={onBack} aria-label="Voltar" className="press -ml-1 flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-foreground ring-1 ring-white/10">
            <Icon name="arrow-left" size={16} />
          </button>
        ) : null}
        <Link href="/" aria-label="Início" className="press">
          <BrandLogo height={isHome ? 30 : 26} />
        </Link>
        <div className="ml-auto flex items-center">
          {!isAuthResolved ? (
            <span className="h-9 w-[92px] rounded-pill bg-white/[0.06]" aria-hidden />
          ) : isAuthenticated ? (
            <Link href="/perfil" aria-label="Minha conta" className="press rounded-full ring-2 ring-brand/70 ring-offset-2 ring-offset-background">
              <Avatar />
            </Link>
          ) : (
            <Link href="/login" className="press inline-flex h-9 items-center gap-2 rounded-pill bg-white/[0.07] pl-1.5 pr-3.5 text-[13px] font-semibold text-foreground ring-1 ring-white/10">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Icon name="user" size={10} />
              </span>
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return scrolled;
}

export type HeaderChrome = "full" | "minimal";

/**
 * Cabeçalho da bilheteria.
 * Desktop: "ilha" flutuante — transparente por cima do banner no topo da
 * página; ao rolar vira um pill de vidro compacto, com links (realce que
 * desliza), busca (⌘K ou Ctrl K), Entrar e "Criar evento".
 * Celular: avatar · logo · busca, sólido ao rolar; a navegação principal
 * fica na barra inferior.
 */
/**
 * Rótulo do atalho de busca: ⌘K no Mac/iPad, Ctrl K no resto. Começa vazio e
 * só aparece depois de montar, porque o servidor não sabe o sistema (evita
 * erro de hidratação).
 */
function useShortcutLabel(): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
    setLabel(/mac|iphone|ipad|ipod/i.test(platform) ? "⌘K" : "Ctrl K");
  }, []);
  return label;
}

export function PublicHeader({ chrome = "full", title }: { chrome?: HeaderChrome; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthResolved } = useAuth();
  const scrolled = useScrolled();
  const [searchOpen, setSearchOpen] = useState(false);
  const isHome = pathname === "/";
  // Só a home tem banner full-bleed por baixo do header; nas outras rotas o
  // header já nasce "rolado" (fundo de vidro) pra não flutuar sobre texto.
  const overlay = isHome && !scrolled;

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const shortcut = useShortcutLabel();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (chrome === "minimal") {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <button type="button" onClick={() => router.back()} aria-label="Voltar" className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
            <Icon name="arrow-left" size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            {title ? (
              <span className="truncate text-sm font-semibold">{title}</span>
            ) : (
              <Link href="/" aria-label="Início">
                <BrandLogo height={24} />
              </Link>
            )}
          </div>
          <span className="size-10" aria-hidden />
        </div>
      </header>
    );
  }

  return (
    <>
      <MobileHeader isHome={isHome} scrolled={scrolled} isAuthenticated={isAuthenticated} isAuthResolved={isAuthResolved} onBack={() => router.back()} />

      {/* desktop: ilha flutuante */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 hidden lg:block">
        <div className={cn("mx-auto px-6 transition-[padding,max-width] duration-300 ease-out-soft", scrolled ? "max-w-6xl pt-3" : "max-w-7xl pt-5")}>
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-pill pl-5 pr-2 transition-[height,background-color,box-shadow,backdrop-filter] duration-300 ease-out-soft",
              scrolled ? "h-14 bg-background/70 shadow-3 ring-1 ring-white/10 backdrop-blur-xl" : "h-16 bg-transparent",
              overlay ? "text-white" : "text-foreground",
            )}
          >
            <Link href="/" aria-label="Início" className="press mr-4 shrink-0 text-current">
              <BrandLogo height={scrolled ? 26 : 32} className="transition-[height,width] duration-300" />
            </Link>
            <DesktopNav scrolled={!overlay} />
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={openSearch} className={cn("group flex h-10 items-center gap-2 rounded-pill pl-3.5 pr-2 text-sm transition-colors", overlay ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
                <Icon name="search" size={14} />
                <span className="hidden xl:inline">Buscar</span>
                {shortcut ? <kbd className={cn("hidden whitespace-nowrap rounded-md border px-1.5 py-0.5 text-micro font-medium xl:block", overlay ? "border-white/20 text-white/60" : "border-border text-subtle-foreground")}>{shortcut}</kbd> : null}
              </button>
              <UserMenu scrolled={!overlay} />
            </div>
          </div>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
