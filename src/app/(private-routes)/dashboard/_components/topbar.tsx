import { OrgSwitcher } from "./org-switcher";
import { PeriodFilter } from "./period-filter";
import { UserMenu } from "./user-menu";

/** Topbar do dashboard: organização (esq.) · filtro de período + usuário (dir.). */
export function Topbar() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/5 px-4 py-3 lg:px-8">
      <OrgSwitcher />
      <div className="flex items-center gap-3">
        <PeriodFilter />
        <UserMenu />
      </div>
    </div>
  );
}
