"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, Compass, Megaphone } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { usePlatformNavigation } from "../_hooks/use-platform";
import { buildFullCatalogPreview, buildUnifiedNavigation, type UnifiedNavGroup } from "../_lib/navigation-presentation";
import { UnifiedNavIcon } from "./unified-nav-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPromoterProfile } from "../promotor/_hooks/use-my-promoter";

function NavGroupList({ groups, pathname }: { groups: UnifiedNavGroup[]; pathname: string }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">{group.groupLabel}</p>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isActive = pathname === item.route || pathname.startsWith(item.route.split("?")[0] + "/");
              return (
                <Link
                  key={item.key}
                  href={item.route}
                  className={`flex items-center gap-3 rounded-md py-2 font-normal text-white ${
                    item.secondary ? "ml-4 px-3 text-xs" : "px-3"
                  } ${isActive ? "bg-violet-600" : "hover:bg-white/10"}`}
                >
                  <UnifiedNavIcon iconKey={item.iconKey} />
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
 * Sem organização ainda (ex.: onboarding, antes de criar o primeiro
 * workspace), não há nada pra `GET .../me/navigation` retornar — mostra um
 * preview estático com TODAS as funcionalidades da plataforma (como se
 * cada capacidade estivesse ativa, ver FULL_CATALOG_PREVIEW). Clicável como
 * qualquer outro item: cada página já degrada graciosamente pra um
 * EmptyState ("Nenhuma organização selecionada") sem organização — mesmo
 * padrão usado em /eventos, /equipe, /inicio etc. — então navegar por essas
 * rotas antes de criar a organização é seguro, não quebra nem dá 403.
 *
 * O onboarding cria e seleciona a organização (currentOrg) já na 1ª etapa
 * (Identificação), antes do wizard terminar — sem a checagem de rota
 * abaixo, o menu trocaria do preview completo pra navegação real (ainda
 * vazia, sem nenhuma capacidade ativa) no meio do fluxo, exatamente quando
 * o usuário está escolhendo os módulos dessa mesma organização.
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

  // Só a organização (dono/produtor/equipe) espera `navigation` — um
  // promoter sem nenhuma organização própria (ver comentário acima) nunca
  // deve ficar preso num skeleton infinito por causa disso.
  const orgNavLoading = !isOnboarding && currentOrg !== null && (isLoading || !navigation);
  const previewMode = isOnboarding || currentOrg === null;
  const groups = previewMode ? buildFullCatalogPreview() : navigation ? buildUnifiedNavigation(navigation.items) : [];

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto text-sm">
      {orgNavLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md bg-white/10" />
          ))}
        </div>
      ) : (
        <NavGroupList groups={groups} pathname={pathname} />
      )}

      {!isOnboarding && myPromoterProfile ? (
        <div>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Promoter</p>
          <Link
            href="/dashboard/promotor"
            className={`flex items-center gap-3 rounded-md px-3 py-2 font-normal text-white ${
              pathname.startsWith("/dashboard/promotor") ? "bg-violet-600" : "hover:bg-white/10"
            }`}
          >
            <Megaphone size={16} />
            Meu painel de promoter
          </Link>
        </div>
      ) : null}

      <div className="mt-auto space-y-5">
        <div>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Suporte</p>
          <span className="flex cursor-default items-center gap-3 rounded-md px-3 py-2 font-normal text-white/35">
            <CircleHelp size={16} />
            Ajuda
          </span>
        </div>

        {previewMode || navigation?.canExplore ? (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">Descoberta</p>
            <Link
              href="/dashboard/explorar"
              className={`flex items-center gap-3 rounded-md px-3 py-2 font-normal text-white ${
                pathname.startsWith("/dashboard/explorar") ? "bg-violet-600" : "hover:bg-white/10"
              }`}
            >
              <Compass size={16} />
              Explore a Nokta
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
