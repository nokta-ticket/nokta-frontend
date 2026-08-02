import { Badge } from "@/components/ui/badge";
import {
  VENUE_MENU_STATUS_LABEL,
  VENUE_PRODUCT_STATUS_LABEL,
  type VenueMenuStatus,
  type VenueProductStatus,
} from "@/services/venue-menu";
import { cn } from "@/lib/utils";

const PRODUCT_STATUS_CLASS: Record<VenueProductStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-transparent",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  SOLD_OUT: "bg-amber-100 text-amber-700 border-amber-200",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusDot() {
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />;
}

export function ProductStatusBadge({ status }: { status: VenueProductStatus }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full font-semibold", PRODUCT_STATUS_CLASS[status])}>
      {status === "ACTIVE" ? <StatusDot /> : null}
      {VENUE_PRODUCT_STATUS_LABEL[status]}
    </Badge>
  );
}

const MENU_STATUS_CLASS: Record<VenueMenuStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-transparent",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function MenuStatusBadge({ status }: { status: VenueMenuStatus }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full font-semibold", MENU_STATUS_CLASS[status])}>
      {status === "PUBLISHED" ? <StatusDot /> : null}
      {VENUE_MENU_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full font-semibold",
        active ? "bg-emerald-50 text-emerald-700 border-transparent" : "bg-gray-100 text-gray-500 border-gray-200",
      )}
    >
      {active ? <StatusDot /> : null}
      {active ? "Ativa" : "Inativa"}
    </Badge>
  );
}
