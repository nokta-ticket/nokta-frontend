import type { ReactNode } from "react";
import "@/app/globals.css";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { OrgSwitcher } from "./_components/org-switcher";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      <div className="fixed inset-0 flex flex-col lg:flex-row bg-[#151619] text-white overflow-hidden">
        <DashboardSidebar />

        <div className="flex-1 lg:mt-4 rounded-t-2xl lg:rounded-tl-2xl bg-[#F9FAFA] text-black overflow-hidden flex flex-col">
          {/* Topo: seletor de organização */}
          <div className="flex items-center justify-between gap-4 border-b border-black/5 px-4 lg:px-8 py-4">
            <OrgSwitcher />
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
        </div>
      </div>
    </OrganizationProvider>
  );
}
