import { Badge } from "@/components/ui/badge";
import {
  VENUE_MENU_STATUS_LABEL,
  VENUE_PRODUCT_STATUS_LABEL,
  type VenueMenuStatus,
  type VenueProductStatus,
} from "@/services/venue-menu";
import { cn } from "@/lib/utils";

const PRODUCT_STATUS_CLASS: Record<VenueProductStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  SOLD_OUT: "bg-amber-100 text-amber-700 border-amber-200",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function ProductStatusBadge({ status }: { status: VenueProductStatus }) {
  return (
    <Badge variant="outline" className={cn(PRODUCT_STATUS_CLASS[status])}>
      {VENUE_PRODUCT_STATUS_LABEL[status]}
    </Badge>
  );
}

const MENU_STATUS_CLASS: Record<VenueMenuStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  PUBLISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function MenuStatusBadge({ status }: { status: VenueMenuStatus }) {
  return (
    <Badge variant="outline" className={cn(MENU_STATUS_CLASS[status])}>
      {VENUE_MENU_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        active
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-gray-100 text-gray-500 border-gray-200",
      )}
    >
      {active ? "Ativa" : "Inativa"}
    </Badge>
  );
}
