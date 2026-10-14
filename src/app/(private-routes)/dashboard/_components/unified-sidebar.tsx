"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { usePlatformNavigation } from "../_hooks/use-platform";
import { buildFullCatalogPreview, buildUnifiedNavigation, type UnifiedNavGroup } from "../_lib/navigation-presentation";
import { UnifiedNavIcon } from "./unified-nav-icon";
import { useMyPromoterProfile } from "../promotor/_hooks/use-my-promoter";

/**
 * Terminais nunca teve uma capability própria no catálogo de navegação do
 * backend (só era liberado por permissão local dentro da antiga aba de
 * Operação) — por isso não vem de `buildUnifiedNavigation`, é injetado aqui
 * como item fixo no grupo Operação, condicionado à permissão granular
 * `venue.operation.devices.manage`.
 */
const TERMINAIS_ROUTE = "/dashboard/operacao/terminais";

function isActiveRoute(pathname: string, route: string): boolean {
  const path = route.split("?")[0];
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Item da sidebar (fundo escuro sempre): ativo ganha o brilho da marca. */
export function SidebarNavLink({ href, label, icon, active, iconKey }: { href: string; label: string; icon?: IconName; iconKey?: Parameters<typeof UnifiedNavIcon>[0]["iconKey"]; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors",
        active ? "bg-nav-active text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
      )}
    >
      {iconKey ? <UnifiedNavIcon iconKey={iconKey} className={active ? "text-brand" : "text-white/45"} /> : icon ? <Icon name={icon} size={15} fw className={active ? "text-brand" : "text-white/45"} /> : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavGroupLabel({ children }: { children: string }) {
  return <p className="mb-1.5 px-3 text-micro font-semibold uppercase tracking-wider text-white/40">{children}</p>;
}

function NavGroupList({ groups, pathname }: { groups: UnifiedNavGroup[]; pathname: string }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.group}>
          {/* Seção com um único item de mesmo nome (Início) não repete o título. */}
          {group.items.length === 1 && group.items[0].label === group.groupLabel ? null : <NavGroupLabel>{group.groupLabel}</NavGroupLabel>}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <SidebarNavLink key={item.key} href={item.route} label={item.label} iconKey={item.iconKey} active={isActiveRoute(pathname, item.route)} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Sidebar unificada — toda a decisão de o-que-aparece vem de
 * `GET .../me/navigation` (backend); este componente só agrupa/rotula pra
 * exibição (ver navigation-presentation.ts) e destaca a rota ativa.
 *
 * Sem nenhuma capacidade ativada ainda (organização recém-criada, onboarding
 * não concluído, ou nem workspace criado) exibe um preview estático com
 * TODAS as funcionalidades da plataforma (FULL_CATALOG_PREVIEW) — cada
 * página já degrada graciosamente sem organização/capacidade real.
 *
 * Dentro da própria rota de onboarding a query real nem é disparada
 * (`isOnboarding ? null : ...`); fora dela, o critério de preview é
 * "nenhuma capacidade ativa", não "sem organização" — currentOrg já existe
 * bem antes da 1ª capacidade.
 */
export function UnifiedSidebar({ footer }: { footer?: React.ReactNode }) {
  const { currentOrg } = useOrganizations();
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");
  const { data: navigation, isLoading } = usePlatformNavigation(isOnboarding ? null : currentOrg?.id ?? null);
  // Independente da organização selecionada — ser promoter não depende de
  // nenhuma capacidade de organização. Só mais um item na mesma sidebar.
  const { data: myPromoterProfile } = useMyPromoterProfile();
  const { can: canVenue } = useVenueAccess();

  // Só a organização espera `navigation` — um promoter sem organização
  // própria nunca deve ficar preso num skeleton infinito por causa disso.
  const orgNavLoading = !isOnboarding && currentOrg !== null && (isLoading || !navigation);
  const hasAnyCapability = (navigation?.items.length ?? 0) > 0;
  const previewMode = isOnboarding || (!orgNavLoading && !hasAnyCapability);
  const groups = previewMode ? buildFullCatalogPreview() : navigation ? buildUnifiedNavigation(navigation.items) : [];

  // Terminais só existe quando o grupo Operação já apareceu (Venue ativo) e o
  // usuário tem a permissão granular — nunca em preview.
  const groupsWithTerminais = previewMode
    ? groups
    : groups.map((g) =>
        g.group === "OPERACAO" && canVenue("venue.operation.devices.manage")
          ? { ...g, items: [...g.items, { key: "TERMINAIS", label: "Terminais", route: TERMINAIS_ROUTE, iconKey: "tablet" as const }] }
          : g,
      );

  const showExplore = previewMode || Boolean(navigation?.canExplore);

  return (
    <nav aria-label="Navegação do painel" className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-5">
        {orgNavLoading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 w-full animate-pulse rounded-xl bg-white/5" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : (
          <NavGroupList groups={groupsWithTerminais} pathname={pathname} />
        )}

        {!isOnboarding && myPromoterProfile ? (
          <div>
            <NavGroupLabel>Promotor</NavGroupLabel>
            <SidebarNavLink href="/dashboard/promotor" label="Meu painel de promotor" icon="megaphone" active={pathname.startsWith("/dashboard/promotor")} />
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-3 pt-6">
        {showExplore ? (
          <div>
            <NavGroupLabel>Descoberta</NavGroupLabel>
            <SidebarNavLink href="/dashboard/explorar" label="Explore a Nokta" icon="compass" active={pathname.startsWith("/dashboard/explorar")} />
          </div>
        ) : null}

        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Icon name="question" size={14} className="text-brand" />
            Precisa de ajuda?
          </p>
          <p className="mt-1 text-caption leading-snug text-white/55">Guias rápidos e tutoriais na central de ajuda.</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href="/ajuda" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-caption font-semibold text-white/85 transition-colors hover:text-white">
              Central de ajuda
              <Icon name="external" size={10} />
            </a>
            <Link href="/dashboard/configuracoes?tab=ia" className="inline-flex items-center gap-1.5 text-caption font-semibold text-brand transition-colors hover:text-brand-hover">
              <Icon name="magic" size={10} />
              Conectar ao Claude
            </Link>
          </div>
        </div>

        {footer}
      </div>
    </nav>
  );
}
