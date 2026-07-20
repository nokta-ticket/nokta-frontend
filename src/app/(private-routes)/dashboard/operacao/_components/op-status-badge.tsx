import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  VENUE_ORDER_STATUS_LABEL,
  VENUE_TAB_STATUS_LABEL,
  type VenueOrderStatus,
  type VenueTabStatus,
} from "@/services/venue-operation";

const TAB_STATUS_CLASS: Record<VenueTabStatus, string> = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELED: "bg-red-100 text-red-600 border-red-200",
};

export function TabStatusBadge({ status }: { status: VenueTabStatus }) {
  return (
    <Badge variant="outline" className={cn(TAB_STATUS_CLASS[status])}>
      {VENUE_TAB_STATUS_LABEL[status]}
    </Badge>
  );
}

const ORDER_STATUS_CLASS: Record<VenueOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  SENT: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PREPARATION: "bg-amber-100 text-amber-700 border-amber-200",
  READY: "bg-violet-100 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELED: "bg-red-100 text-red-600 border-red-200",
};

export function OrderStatusBadge({ status }: { status: VenueOrderStatus }) {
  return (
    <Badge variant="outline" className={cn(ORDER_STATUS_CLASS[status])}>
      {VENUE_ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
