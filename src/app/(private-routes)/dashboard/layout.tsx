import { Suspense, type ReactNode } from "react";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { PeriodProvider } from "@/context/PeriodContext";
import { VenueAccessProvider } from "@/context/VenueAccessContext";
import { TicketsAccessProvider } from "@/context/TicketsAccessContext";
import { DashboardQueryProvider } from "./_components/query-provider";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { Topbar } from "./_components/topbar";
import { RequireWorkspaceProvider } from "./_components/require-workspace-provider";
import { WorkspaceBlockedGate } from "./_components/workspace-blocked-gate";
import { DevThemeParam } from "./_components/dev-theme-param";

/**
 * Shell do painel: sidebar escura fixa (lg+) + coluna de conteúdo com topbar
 * sólida e <main> com fundo ambiente. O documento rola normalmente (nada de
 * `fixed inset-0`): sticky e glows dos cards funcionam, e `overflow-x-clip`
 * (não `hidden`) impede rolagem lateral sem cortar sombras.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardQueryProvider>
      <OrganizationProvider>
        <VenueAccessProvider>
          <TicketsAccessProvider>
            <PeriodProvider>
              <RequireWorkspaceProvider>
                {process.env.NODE_ENV !== "production" ? (
                  <Suspense fallback={null}>
                    <DevThemeParam />
                  </Suspense>
                ) : null}
                <div data-dashboard-shell className="flex min-h-dvh bg-background text-foreground">
                  <DashboardSidebar />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Topbar />
                    <main className="page-ambient main-edge flex min-w-0 flex-1 flex-col overflow-x-clip px-4 pb-8 pt-5 lg:px-8 lg:pb-12 lg:pt-7">
                      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
                        <WorkspaceBlockedGate>{children}</WorkspaceBlockedGate>
                      </div>
                    </main>
                  </div>
                </div>
              </RequireWorkspaceProvider>
            </PeriodProvider>
          </TicketsAccessProvider>
        </VenueAccessProvider>
      </OrganizationProvider>
    </DashboardQueryProvider>
  );
}
