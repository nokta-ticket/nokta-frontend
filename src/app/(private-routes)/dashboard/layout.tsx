import type { ReactNode } from "react";
import "@/app/globals.css";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { PeriodProvider } from "@/context/PeriodContext";
import { VenueAccessProvider } from "@/context/VenueAccessContext";
import { TicketsAccessProvider } from "@/context/TicketsAccessContext";
import { DashboardQueryProvider } from "./_components/query-provider";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { Topbar } from "./_components/topbar";
import { RequireWorkspaceProvider } from "./_components/require-workspace-provider";
import { WorkspaceBlockedGate } from "./_components/workspace-blocked-gate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardQueryProvider>
    <OrganizationProvider>
      <VenueAccessProvider>
      <TicketsAccessProvider>
        <PeriodProvider>
        <RequireWorkspaceProvider>
          <div data-dashboard-shell className="fixed inset-0 flex flex-col lg:flex-row bg-[#faf9fd] text-foreground overflow-hidden">
            <DashboardSidebar />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Topbar />
              <div className="flex-1 overflow-y-auto overscroll-y-contain p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:p-8">
                <WorkspaceBlockedGate>{children}</WorkspaceBlockedGate>
              </div>
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
