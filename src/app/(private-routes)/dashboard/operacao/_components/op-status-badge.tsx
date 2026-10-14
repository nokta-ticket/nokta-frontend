import { StatusBadge, type Tone } from "@/components/ui/badge";
import { VENUE_ORDER_STATUS_LABEL, VENUE_TAB_STATUS_LABEL, type VenueOrderStatus, type VenueTabStatus } from "@/services/venue-operation";

/** Tom semântico por status — fonte única pra badges, cards e colunas. */
export const TAB_STATUS_TONE: Record<VenueTabStatus, Tone> = {
  OPEN: "success",
  CLOSING: "warning",
  PAYMENT_IN_PROGRESS: "warning",
  CLOSED: "neutral",
  CANCELED: "danger",
};

export const ORDER_STATUS_TONE: Record<VenueOrderStatus, Tone> = {
  DRAFT: "neutral",
  SENT: "brand",
  IN_PREPARATION: "warning",
  READY: "success",
  DELIVERED: "neutral",
  CANCELED: "danger",
};

export function TabStatusBadge({ status, pulse }: { status: VenueTabStatus; pulse?: boolean }) {
  return (
    <StatusBadge tone={TAB_STATUS_TONE[status]} pulse={pulse}>
      {VENUE_TAB_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function OrderStatusBadge({ status }: { status: VenueOrderStatus }) {
  return <StatusBadge tone={ORDER_STATUS_TONE[status]}>{VENUE_ORDER_STATUS_LABEL[status]}</StatusBadge>;
}

/** Estado da MESA física (não da comanda): livre, ocupada ou fechando a conta. */
export function TableStateBadge({ status }: { status: VenueTabStatus | null }) {
  if (status === null) return <StatusBadge tone="success">Livre</StatusBadge>;
  if (status === "OPEN") return <StatusBadge tone="brand">Ocupada</StatusBadge>;
  if (status === "CLOSING" || status === "PAYMENT_IN_PROGRESS") return <StatusBadge tone="warning">Fechando</StatusBadge>;
  return <StatusBadge tone="neutral">{VENUE_TAB_STATUS_LABEL[status]}</StatusBadge>;
}
