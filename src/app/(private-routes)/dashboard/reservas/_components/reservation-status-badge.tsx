import { StatusBadge, type Tone } from "@/components/ui/badge";
import { VENUE_RESERVATION_STATUS_LABEL, VENUE_WAITLIST_STATUS_LABEL, type VenueReservationStatus, type VenueWaitlistStatus } from "@/services/venue-reservations";

export const RESERVATION_STATUS_TONE: Record<VenueReservationStatus, Tone> = {
  PENDING: "warning",
  CONFIRMED: "brand",
  SEATED: "success",
  COMPLETED: "neutral",
  CANCELED: "danger",
  NO_SHOW: "danger",
};

export const WAITLIST_STATUS_TONE: Record<VenueWaitlistStatus, Tone> = {
  WAITING: "warning",
  NOTIFIED: "brand",
  SEATED: "success",
  LEFT: "neutral",
  CANCELED: "danger",
};

export function ReservationStatusBadge({ status, pulse }: { status: VenueReservationStatus; pulse?: boolean }) {
  return (
    <StatusBadge tone={RESERVATION_STATUS_TONE[status]} pulse={pulse}>
      {VENUE_RESERVATION_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function WaitlistStatusBadge({ status, pulse }: { status: VenueWaitlistStatus; pulse?: boolean }) {
  return (
    <StatusBadge tone={WAITLIST_STATUS_TONE[status]} pulse={pulse}>
      {VENUE_WAITLIST_STATUS_LABEL[status]}
    </StatusBadge>
  );
}
