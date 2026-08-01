"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";

/**
 * Avatar + menu do usuário. `variant="topbar"` (padrão) é o chip claro da
 * topbar; `variant="sidebar"` é o card no rodapé da sidebar escura (nome +
 * e-mail + chevron) — mesmo dropdown/lógica de logout nos dois, só o
 * visual do gatilho muda.
 */
export function UserMenu({ variant = "topbar" }: { variant?: "topbar" | "sidebar" }) {
  const { user, isAuthResolved, signOut } = useAuth();
  const router = useRouter();

  if (!isAuthResolved || !user) {
    return variant === "sidebar" ? (
      <div className="h-14 w-full animate-pulse rounded-xl bg-black/5" />
    ) : (
      <div className="h-9 w-9 animate-pulse rounded-full bg-black/10" />
    );
  }

  // Navegação forçada (não router.push): o cache de rota do Next pode
  // servir uma resposta anterior autenticada mesmo após o logout — mesmo
  // padrão já usado em header-private.tsx/user-dropdown-menu.tsx.
  const handleLogout = () => {
    signOut();
    toast.success("Logout realizado com sucesso!");
    window.location.href = "/";
  };

  const firstInitial = user.nome?.charAt(0).toUpperCase() || "?";
  const lastInitial = user.sobrenome?.charAt(0).toUpperCase() || "";
  const fullName = `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none transition hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-violet-500">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="/user_default.png" alt="Avatar do usuário" />
              <AvatarFallback>
                {firstInitial}
                {lastInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{fullName || "Usuário"}</p>
              <p className="truncate text-[11px] text-black/45">{user.email}</p>
            </div>
            <ChevronDown size={16} className="shrink-0 text-black/40" />
          </button>
        ) : (
          <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/user_default.png" alt="Avatar do usuário" />
              <AvatarFallback>
                {firstInitial}
                {lastInitial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-sm font-medium sm:block">
              {fullName || "Usuário"}
            </span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{fullName || "Usuário"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/perfil")}>
          Meu perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/")}>
          Voltar para o site
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
