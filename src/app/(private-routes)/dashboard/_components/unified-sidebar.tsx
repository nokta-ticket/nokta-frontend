"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { useOrganizations } from "@/context/OrganizationContext";
import { usePlatformNavigation } from "../_hooks/use-platform";
import { buildUnifiedNavigation } from "../_lib/navigation-presentation";
import { UnifiedNavIcon } from "./unified-nav-icon";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sidebar unificada (Fase 3) — nada de "Tickets"/"Venue" como rótulo
 * principal. Toda a decisão de o-que-aparece vem de
 * `GET .../me/navigation` (backend); este componente só agrupa/rotula pra
 * exibição (ver navigation-presentation.ts) e destaca a rota ativa.
 */
export function UnifiedSidebar() {
  const { currentOrg } = useOrganizations();
  const pathname = usePathname();
  const { data: navigation, isLoading } = usePlatformNavigation(currentOrg?.id ?? null);

  if (isLoading || !navigation) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md bg-white/10" />
        ))}
      </div>
    );
  }

  const groups = buildUnifiedNavigation(navigation.items);

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto text-sm">
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
                  className={`flex items-center gap-3 rounded-md px-3 py-2 font-normal text-white ${
                    isActive ? "bg-violet-600" : "hover:bg-white/10"
                  }`}
                >
                  <UnifiedNavIcon iconKey={item.iconKey} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {navigation.canExplore ? (
        <div className="mt-auto">
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
    </nav>
  );
}
