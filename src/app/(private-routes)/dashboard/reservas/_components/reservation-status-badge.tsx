import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  VENUE_RESERVATION_STATUS_LABEL,
  VENUE_WAITLIST_STATUS_LABEL,
  type VenueReservationStatus,
  type VenueWaitlistStatus,
} from "@/services/venue-reservations";

const RESERVATION_STATUS_CLASS: Record<VenueReservationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  SEATED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELED: "bg-red-100 text-red-600 border-red-200",
  NO_SHOW: "bg-red-100 text-red-600 border-red-200",
};

export function ReservationStatusBadge({ status }: { status: VenueReservationStatus }) {
  return (
    <Badge variant="outline" className={cn(RESERVATION_STATUS_CLASS[status])}>
      {VENUE_RESERVATION_STATUS_LABEL[status]}
    </Badge>
  );
}

const WAITLIST_STATUS_CLASS: Record<VenueWaitlistStatus, string> = {
  WAITING: "bg-amber-100 text-amber-700 border-amber-200",
  NOTIFIED: "bg-blue-100 text-blue-700 border-blue-200",
  SEATED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  LEFT: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELED: "bg-red-100 text-red-600 border-red-200",
};

export function WaitlistStatusBadge({ status }: { status: VenueWaitlistStatus }) {
  return (
    <Badge variant="outline" className={cn(WAITLIST_STATUS_CLASS[status])}>
      {VENUE_WAITLIST_STATUS_LABEL[status]}
    </Badge>
  );
}
