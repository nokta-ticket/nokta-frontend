"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "@/lib/toast";

function MenuItem({ icon, label, onSelect, danger }: { icon: IconName; label: string; onSelect: () => void; danger?: boolean }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm focus:bg-surface-2", danger ? "text-danger focus:text-danger" : "text-foreground")}>
      <Icon name={icon} size={14} fw className={danger ? "text-danger" : "text-muted-foreground"} />
      {label}
    </DropdownMenuItem>
  );
}

/**
 * Avatar + menu da conta (topbar do painel). `variant="sidebar"` mantém a
 * assinatura antiga (card largo com nome + e-mail) pra quem ainda renderiza
 * o menu num fundo escuro. Sair sempre passa por ConfirmDialog.
 */
export function UserMenu({ variant = "topbar" }: { variant?: "topbar" | "sidebar" }) {
  const { user, isAuthResolved, signOut } = useAuth();
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  if (!isAuthResolved || !user) {
    return variant === "sidebar" ? <div className="h-12 w-full animate-pulse rounded-xl bg-white/5" /> : <div className="size-9 animate-pulse rounded-full bg-surface-2" />;
  }

  // Navegação forçada (não router.push): o cache de rota do Next pode servir
  // uma resposta anterior autenticada mesmo após o logout.
  const handleLogout = () => {
    signOut();
    toast.success("Até logo!");
    window.location.href = "/";
  };

  const fullName = `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim() || "Usuário";
  const photo = user.fotoPerfil ? resolveMediaUrl(user.fotoPerfil, null) : null;
  const avatar = (
    <span className={cn("flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-caption font-semibold", variant === "sidebar" ? "bg-white/10 text-white" : "bg-brand-soft text-brand ring-1 ring-inset ring-brand-ring")}>
      {photo ? <Image src={photo} alt="" width={36} height={36} unoptimized className="size-full object-cover" /> : initials(user.nome, user.sobrenome)}
    </span>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === "sidebar" ? (
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-brand">
              {avatar}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{fullName}</span>
                <span className="block truncate text-caption text-white/45">{user.email}</span>
              </span>
              <Icon name="chevron-down" size={11} className="shrink-0 text-white/40" />
            </button>
          ) : (
            <button type="button" aria-label="Minha conta" className="flex items-center gap-1.5 rounded-pill p-0.5 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand md:pr-2">
              {avatar}
              <Icon name="chevron-down" size={11} className="hidden text-muted-foreground md:inline-block" />
            </button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} sideOffset={8} collisionPadding={12} className="w-60 rounded-card border-border bg-surface p-1.5 shadow-3">
          <DropdownMenuLabel className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
            <p className="truncate text-caption text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <MenuItem icon="user" label="Meu perfil" onSelect={() => router.push("/perfil")} />
          <MenuItem icon="ticket" label="Ver site de ingressos" onSelect={() => router.push("/")} />
          <DropdownMenuSeparator className="bg-border" />
          <MenuItem icon="logout" label="Sair" onSelect={() => setConfirmingLogout(true)} danger />
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog open={confirmingLogout} onOpenChange={setConfirmingLogout} title="Sair da conta?" description="Você volta pra tela inicial e precisa entrar de novo pra acessar o painel." confirmLabel="Sair" icon="logout" onConfirm={handleLogout} />
    </>
  );
}
