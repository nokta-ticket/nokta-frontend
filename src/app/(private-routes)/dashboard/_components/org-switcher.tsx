"use client";

import Image from "next/image";
import { useOrganizations } from "@/context/OrganizationContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";
import { useVenuePublicProfile } from "../cardapio/_hooks/use-venue-public-profile";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  MEMBER: "Membro",
};

function orgInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Seletor de organização da sidebar (fundo escuro fixo). A logo do workspace
 * vive no perfil público do Venue (mesma query/cache do cabeçalho do
 * Cardápio) e só é buscada com o módulo Venue ativo — org só de Tickets não
 * tem perfil e tomaria 403. Sem logo, mostra as iniciais da organização.
 */
export function OrgSwitcher({ className }: { className?: string }) {
  const { organizations, currentOrg, selectOrg, activeModuleKeys, loadingOrgs } = useOrganizations();
  const hasVenue = activeModuleKeys.includes("venue");
  const { data: profile } = useVenuePublicProfile(hasVenue && currentOrg ? currentOrg.id : null);

  if (loadingOrgs) return <div className={cn("h-14 w-full animate-pulse rounded-xl bg-white/5", className)} />;
  if (!currentOrg) return null;

  const logoUrl = resolveMediaUrl(profile?.logoUrl, null);
  const avatar = logoUrl ? (
    <Image src={logoUrl} alt="" width={36} height={36} unoptimized className="size-9 shrink-0 rounded-lg object-cover" />
  ) : (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-caption font-bold text-brand ring-1 ring-inset ring-brand/30">
      {orgInitials(currentOrg.nome)}
    </span>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Organização: ${currentOrg.nome}. Trocar organização`}
          className={cn("flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand", className)}
        >
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{currentOrg.nome}</span>
            <span className="block truncate text-micro uppercase tracking-wider text-white/45">{ROLE_LABEL[currentOrg.role] ?? currentOrg.role}</span>
          </span>
          <Icon name="chevron-down" size={11} className="shrink-0 text-white/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} collisionPadding={12} className="w-[240px] max-w-[calc(100vw-1.5rem)] rounded-card border-border bg-surface p-1.5 shadow-3">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-micro uppercase tracking-wider text-subtle-foreground">Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {organizations.map((o) => {
          const active = o.id === currentOrg.id;
          return (
            <DropdownMenuItem key={o.id} onSelect={() => selectOrg(o.id)} className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-sm focus:bg-surface-2", active ? "text-foreground" : "text-muted-foreground")}>
              <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-micro font-bold", active ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted-foreground")}>
                {orgInitials(o.nome)}
              </span>
              <span className="min-w-0 flex-1 truncate">{o.nome}</span>
              {active ? <Icon name="check" size={12} className="text-brand" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
