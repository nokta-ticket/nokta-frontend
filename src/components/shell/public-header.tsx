"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { buildPlatformUrl } from "@/lib/surfaces";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const NAV = [
  { label: "Eventos", href: "/eventos" },
  { label: "Revenda", href: "/revenda" },
  { label: "Para produtores", href: "/para-produtores" },
];

/** Só visual (span) — quem envolve decide se é Link ou botão, pra nunca aninhar <a> em <a>/<button>. */
function AvatarButton({ className }: { className?: string }) {
  const { isAuthenticated, isAuthResolved, user } = useAuth();
  const photo = user?.fotoPerfil ? resolveMediaUrl(user.fotoPerfil, null) : null;

  if (!isAuthResolved) return <span className={cn("block size-9 rounded-full bg-surface-2", className)} aria-hidden />;

  if (!isAuthenticated) {
    return (
      <span className={cn("flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-surface-2 hover:text-foreground", className)}>
        <Icon name="user-circle" size={24} />
      </span>
    );
  }

  return (
    <span className={cn("flex size-9 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-caption font-semibold text-foreground", className)}>
      {photo ? <Image src={photo} alt="" width={36} height={36} className="size-full object-cover" unoptimized /> : initials(user?.nome, user?.sobrenome)}
    </span>
  );
}

function UserMenu() {
  const { isAuthenticated, isAuthResolved, user, role, signOut } = useAuth();
  const router = useRouter();

  if (!isAuthResolved) return <AvatarButton />;
  if (!isAuthenticated) {
    return (
      <Link href="/login" className="btn-lift inline-flex h-10 items-center rounded-pill bg-foreground px-5 text-sm font-semibold text-background">
        Entrar
      </Link>
    );
  }

  const isProducer = role === "PRODUTOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Minha conta" className="flex items-center gap-2 rounded-pill p-0.5 pr-2 transition-colors hover:bg-surface-2">
          <AvatarButton />
          <Icon name="chevron-down" size={12} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-card border-border bg-surface p-1.5 shadow-3">
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{user?.nome} {user?.sobrenome}</p>
          <p className="truncate text-caption text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <MenuItem icon="ticket" label="Meus ingressos" onSelect={() => router.push("/meus-ingressos")} />
        <MenuItem icon="transfer" label="Minhas revendas" onSelect={() => router.push("/minhas-revendas")} />
        <MenuItem icon="heart" label="Favoritos" onSelect={() => router.push("/favoritos")} />
        <MenuItem icon="user" label="Meu perfil" onSelect={() => router.push("/perfil")} />
        {isProducer ? (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <MenuItem icon="chart-line" label="Painel do produtor" onSelect={() => window.location.assign(buildPlatformUrl("/dashboard/inicio"))} />
          </>
        ) : null}
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

export type HeaderChrome = "full" | "minimal";

/**
 * Cabeçalho da superfície pública (noktatickets). No celular: avatar à
 * esquerda, logo no centro, busca à direita (a navegação principal fica na
 * barra inferior). No desktop: logo, links, busca e conta.
 */
export function PublicHeader({ chrome = "full", title }: { chrome?: HeaderChrome; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const accountHref = useAuthHref();
  const isHome = pathname === "/";

  if (chrome === "minimal") {
    return (
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <button type="button" onClick={() => router.back()} aria-label="Voltar" className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
            <Icon name="arrow-left" size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            {title ? <span className="truncate text-sm font-semibold">{title}</span> : <Link href="/" aria-label="Início"><BrandLogo height={24} /></Link>}
          </div>
          <span className="size-10" aria-hidden />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe">
      {/* celular */}
      <div className="flex h-14 items-center px-3 lg:hidden">
        <div className="flex w-20 items-center">
          {isHome ? (
            <Link href={accountHref} aria-label="Minha conta" className="rounded-full">
              <AvatarButton />
            </Link>
          ) : (
            <button type="button" onClick={() => router.back()} aria-label="Voltar" className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
              <Icon name="arrow-left" size={18} />
            </button>
          )}
        </div>
        <div className="flex flex-1 justify-center">
          <Link href="/" aria-label="Início" className="press">
            <BrandLogo height={30} />
          </Link>
        </div>
        <div className="flex w-20 items-center justify-end">
          <Link href="/eventos" aria-label="Buscar eventos" className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
            <Icon name="search" size={18} />
          </Link>
        </div>
      </div>

      {/* desktop */}
      <div className="hidden lg:block">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-8 px-6">
          <Link href="/" aria-label="Início" className="press shrink-0">
            <BrandLogo height={34} />
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn("rounded-pill px-3.5 py-2 text-sm font-medium transition-colors", active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
                  {item.label}
                </Link>
              );
            })}
            <Link href="/eventos" aria-label="Buscar" className="ml-1 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-2">
              <Icon name="search" size={16} />
            </Link>
          </nav>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function useAuthHref() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? "/perfil" : "/login";
}
