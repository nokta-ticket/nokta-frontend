"use client";

import { useRouter } from "next/navigation";
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

/** Avatar + menu do usuário (movido da sidebar para a topbar). */
export function UserMenu() {
  const { user, isAuthResolved } = useAuth();
  const router = useRouter();

  if (!isAuthResolved || !user) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-black/10" />;
  }

  const firstInitial = user.nome?.charAt(0).toUpperCase() || "?";
  const lastInitial = user.sobrenome?.charAt(0).toUpperCase() || "";
  const fullName = `${user.nome ?? ""} ${user.sobrenome ?? ""}`.trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
