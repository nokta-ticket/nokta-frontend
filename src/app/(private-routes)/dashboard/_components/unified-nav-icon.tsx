import { Icon, type IconName } from "@/components/ui/icon";
import type { IconKey } from "../_lib/navigation-presentation";

/**
 * Ícone de cada item da navegação unificada. A chave (`iconKey`) vem de
 * navigation-presentation.ts; aqui ela vira um nome do registry único de
 * ícones (`@/components/ui/icon`, FontAwesome). Nunca lucide.
 */
export const NAV_ICON_NAME: Record<IconKey, IconName> = {
  home: "home",
  calendar: "calendar",
  ticket: "ticket",
  scan: "qr",
  megaphone: "megaphone",
  reservation: "calendar-check",
  waitlist: "clock",
  guests: "clipboard-check",
  customers: "id-card",
  star: "star",
  tables: "chair",
  orders: "utensils",
  cash: "wallet",
  card: "credit-card",
  menu: "file-lines",
  product: "tags",
  modifier: "plus-circle",
  inventory: "box",
  purchase: "cart",
  supplier: "truck",
  dollar: "sack-dollar",
  chart: "chart-line",
  export: "download",
  users: "users",
  settings: "settings",
  tablet: "tablet",
};

export function UnifiedNavIcon({ iconKey, size = 15, className }: { iconKey: IconKey; size?: number; className?: string }) {
  return <Icon name={NAV_ICON_NAME[iconKey]} size={size} fw className={className} />;
}
