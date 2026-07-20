import { BarChart3, Boxes, CalendarDays, Clock, DollarSign, Home, LayoutGrid, Settings, UtensilsCrossed, Users, type LucideIcon } from "lucide-react";
import type { IconKey } from "../_lib/navigation-presentation";

const ICONS: Record<IconKey, LucideIcon> = {
  home: Home,
  calendar: CalendarDays,
  clock: Clock,
  grid: LayoutGrid,
  utensils: UtensilsCrossed,
  boxes: Boxes,
  dollar: DollarSign,
  chart: BarChart3,
  users: Users,
  settings: Settings,
};

export function UnifiedNavIcon({ iconKey, size = 16 }: { iconKey: IconKey; size?: number }) {
  const Icon = ICONS[iconKey];
  return <Icon size={size} />;
}
