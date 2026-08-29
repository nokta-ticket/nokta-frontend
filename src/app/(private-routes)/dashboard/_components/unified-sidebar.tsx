"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Compass, Megaphone } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { useVenueAccess } from "@/context/VenueAccessContext";
import { usePlatformNavigation } from "../_hooks/use-platform";
import { buildFullCatalogPreview, buildUnifiedNavigation, type UnifiedNavGroup } from "../_lib/navigation-presentation";
import { UnifiedNavIcon } from "./unified-nav-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPromoterProfile } from "../promotor/_hooks/use-my-promoter";

/**
 * Terminais nunca teve uma capability própria no catálogo de navegação do
 * backend (só era liberado por permissão local dentro da antiga aba de
 * Operação) — por isso não vem de `buildUnifiedNavigation`, é injetado aqui
 * como item fixo no grupo Operação, condicionado à permissão granular
 * `venue.operation.devices.manage`. Estrutura/lógica da tela (TerminaisTab)
 * continua a mesma; só a localização no menu mudou.
 */
const TERMINAIS_ROUTE = "/dashboard/operacao/terminais";

function NavGroupList({ groups, pathname }: { groups: UnifiedNavGroup[]; pathname: string }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-black/35">{group.groupLabel}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.route || pathname.startsWith(item.route.split("?")[0] + "/");
              return (
                <Link
                  key={item.key}
                  href={item.route}
                  className={`flex items-center gap-3 rounded-xl py-2 text-[14.5px] font-medium transition-colors ${
                    item.secondary ? "ml-4 px-3 text-xs" : "px-3"
                  } ${isActive ? "bg-violet-100 text-violet-600" : "text-black/65 hover:bg-black/[0.04] hover:text-foreground"}`}
                >
                  <UnifiedNavIcon iconKey={item.iconKey} className={isActive ? "text-violet-600" : "text-black/40"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Sidebar unificada (Fase 3) — nada de "Tickets"/"Venue" como rótulo
 * principal. Toda a decisão de o-que-aparece vem de
 * `GET .../me/navigation` (backend); este componente só agrupa/rotula pra
 * exibição (ver navigation-presentation.ts) e destaca a rota ativa.
 *
 * Sem nenhuma capacidade ativada ainda (organização recém-criada, onboarding
 * não concluído, ou nem workspace criado) não há nada de real pra
 * `GET .../me/navigation` mostrar — exibe um preview estático com TODAS as
 * funcionalidades da plataforma (como se cada capacidade estivesse ativa,
 * ver FULL_CATALOG_PREVIEW). Clicável como qualquer outro item: cada página
 * já degrada graciosamente sem organização/capacidade real (EmptyState +
 * RequireWorkspaceProvider pras ações de escrita), então navegar por essas
 * rotas antes de terminar o onboarding é seguro, não quebra nem dá 403.
 *
 * O onboarding cria e seleciona a organização (currentOrg) já na 1ª etapa
 * (Identificação), bem antes de qualquer capacidade ser ativada (isso só
 * acontece na etapa "Operação" ou depois). Dois cuidados por causa disso:
 * (1) dentro da própria rota de onboarding a query real nem é disparada
 * (`isOnboarding ? null : ...`) — sem isso o menu passaria pelo skeleton de
 * loading e por um estado intermediário no meio do wizard, só pra concluir
 * "nenhuma capacidade" de um jeito mais lento e picado do que já saber de
 * cara que é onboarding; (2) fora da rota de onboarding, o critério de
 * preview é "nenhuma capacidade ativa" (`navigation.items.length === 0`),
 * não "sem organização" — currentOrg já existe bem antes da 1ª capacidade.
 */
export function UnifiedSidebar() {
  const { currentOrg } = useOrganizations();
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/dashboard/onboarding");
  const { data: navigation, isLoading } = usePlatformNavigation(isOnboarding ? null : currentOrg?.id ?? null);
  // Independente da organização selecionada — ser promoter não depende de
  // nenhuma capacidade de organização (ver docs/tickets/promoters.md
  // "promoter nunca é automaticamente OrganizationMember"). Troca de papel
  // produtor/promoter sem fricção: só mais um item na mesma sidebar.
  const { data: myPromoterProfile } = useMyPromoterProfile();
  const { can: canVenue } = useVenueAccess();

  // Só a organização (dono/produtor/equipe) espera `navigation` — um
  // promoter sem nenhuma organização própria (ver comentário acima) nunca
  // deve ficar preso num skeleton infinito por causa disso.
  const orgNavLoading = !isOnboarding && currentOrg !== null && (isLoading || !navigation);
  const hasAnyCapability = (navigation?.items.length ?? 0) > 0;
  const previewMode = isOnboarding || (!orgNavLoading && !hasAnyCapability);
  const groups = previewMode ? buildFullCatalogPreview() : navigation ? buildUnifiedNavigation(navigation.items) : [];

  // Terminais só existe como item de menu quando o grupo Operação já
  // apareceu (capacidade de Venue ativa) e o usuário tem a permissão
  // granular — nunca aparece em preview (onboarding/sem capacidade), já que
  // ali "Operação" é só uma prévia sem organização real por trás.
  const groupsWithTerminais = previewMode
    ? groups
    : groups.map((g) =>
        g.group === "OPERACAO" && canVenue("venue.operation.devices.manage")
          ? { ...g, items: [...g.items, { key: "TERMINAIS", label: "Terminais", route: TERMINAIS_ROUTE, iconKey: "tablet" as const, secondary: false }] }
          : g,
      );

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto text-sm">
      {orgNavLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-xl bg-black/5" />
          ))}
        </div>
      ) : (
        <NavGroupList groups={groupsWithTerminais} pathname={pathname} />
      )}

      {!isOnboarding && myPromoterProfile ? (
        <div>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-black/35">Promoter</p>
          <Link
            href="/dashboard/promotor"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] font-medium transition-colors ${
              pathname.startsWith("/dashboard/promotor") ? "bg-violet-100 text-violet-600" : "text-black/65 hover:bg-black/[0.04] hover:text-foreground"
            }`}
          >
            <Megaphone size={16} className={pathname.startsWith("/dashboard/promotor") ? "text-violet-600" : "text-black/40"} />
            Meu painel de promoter
          </Link>
        </div>
      ) : null}

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl bg-violet-50 p-4">
          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-violet-600">
            <CircleHelp size={18} />
            Precisa de ajuda?
          </div>
          <p className="mb-3 text-xs leading-tight text-black/55">Acesse nossa central de ajuda e tutoriais</p>
          <button className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm">Acessar</button>
        </div>

        {previewMode || navigation?.canExplore ? (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-black/35">Descoberta</p>
            <Link
              href="/dashboard/explorar"
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] font-medium transition-colors ${
                pathname.startsWith("/dashboard/explorar") ? "bg-violet-100 text-violet-600" : "text-black/65 hover:bg-black/[0.04] hover:text-foreground"
              }`}
            >
              <Compass size={16} className={pathname.startsWith("/dashboard/explorar") ? "text-violet-600" : "text-black/40"} />
              Explore a Nokta
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
