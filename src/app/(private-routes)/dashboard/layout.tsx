import type { ReactNode } from "react";
import "@/app/globals.css";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { PeriodProvider } from "@/context/PeriodContext";
import { VenueAccessProvider } from "@/context/VenueAccessContext";
import { TicketsAccessProvider } from "@/context/TicketsAccessContext";
import { DashboardQueryProvider } from "./_components/query-provider";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { Topbar } from "./_components/topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardQueryProvider>
    <OrganizationProvider>
      <VenueAccessProvider>
      <TicketsAccessProvider>
        <PeriodProvider>
          <div className="fixed inset-0 flex flex-col lg:flex-row bg-[#151619] text-white overflow-hidden">
            <DashboardSidebar />

            <div className="flex-1 lg:mt-4 rounded-t-2xl lg:rounded-tl-2xl bg-[#F9FAFA] text-black overflow-hidden flex flex-col">
              <Topbar />
              <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
            </div>
          </div>
        </PeriodProvider>
      </TicketsAccessProvider>
      </VenueAccessProvider>
    </OrganizationProvider>
    </DashboardQueryProvider>
  );
}
