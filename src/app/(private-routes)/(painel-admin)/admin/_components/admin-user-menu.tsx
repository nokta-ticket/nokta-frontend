"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { useStaffRole } from "../_lib/staff-role";
import { STAFF_ROLE_META, metaOf } from "../_lib/status-meta";
import { fullName, initialsOf } from "../_lib/format";

function MenuItem({ icon, label, onSelect, danger }: { icon: IconName; label: string; onSelect: () => void; danger?: boolean }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm focus:bg-surface-2", danger ? "text-danger focus:text-danger" : "text-foreground")}>
      <Icon name={icon} size={14} fw className={danger ? "text-danger" : "text-muted-foreground"} />
      {label}
    </DropdownMenuItem>
  );
}

/**
 * Card do staff no rodapé da sidebar (sempre escura) ou chip na topbar.
 * Mesmo dropdown nos dois: voltar pro site e sair.
 */
export function AdminUserMenu({ variant = "sidebar" }: { variant?: "sidebar" | "topbar" }) {
  const { user, isAuthResolved, signOut } = useAuth();
  const { role } = useStaffRole();
  const router = useRouter();

  if (!isAuthResolved || !user) {
    return variant === "sidebar" ? <div className="h-14 w-full animate-pulse rounded-xl bg-white/5" /> : <div className="size-9 animate-pulse rounded-full bg-surface-2" />;
  }

  // Navegação forçada (não router.push): o cache de rota pode servir uma
  // resposta autenticada depois do logout.
  const handleLogout = () => {
    signOut();
    toast.success("Você saiu do painel.");
    window.location.href = "/admin/login";
  };

  const name = fullName(user.nome, user.sobrenome, "Administrador");
  const roleMeta = metaOf(STAFF_ROLE_META, role, "Staff");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-brand">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-caption font-bold text-brand-foreground">{initialsOf(user.nome, user.sobrenome)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{name}</span>
              <span className="block truncate text-caption text-white/55">{user.email}</span>
            </span>
            <Icon name="chevron-up" size={12} className="shrink-0 text-white/40" />
          </button>
        ) : (
          <button type="button" aria-label="Minha conta" className="flex items-center gap-2 rounded-pill p-0.5 pr-2 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand text-caption font-bold text-brand-foreground">{initialsOf(user.nome, user.sobrenome)}</span>
            <Icon name="chevron-down" size={12} className="text-muted-foreground" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} side={variant === "sidebar" ? "top" : "bottom"} sideOffset={8} className="w-64 rounded-card border-border bg-surface p-1.5 shadow-3">
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-caption text-muted-foreground">{user.email}</p>
          <StatusBadge tone={roleMeta.tone} className="mt-2">
            {roleMeta.label}
          </StatusBadge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <MenuItem icon="globe" label="Voltar pro site" onSelect={() => router.push("/")} />
        <MenuItem icon="lock" label="Segurança da conta" onSelect={() => router.push("/admin/seguranca")} />
        <DropdownMenuSeparator className="bg-border" />
        <MenuItem icon="logout" label="Sair" onSelect={handleLogout} danger />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
