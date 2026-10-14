import { StatusBadge, type Tone } from "@/components/ui/badge";
import {
  VENUE_MENU_STATUS_LABEL,
  VENUE_PRODUCT_STATUS_LABEL,
  type VenueMenuStatus,
  type VenueProductStatus,
} from "@/services/venue-menu";

/** Tom semântico de cada status — fonte única pra tabela, cards e gaveta. */
export const PRODUCT_STATUS_TONE: Record<VenueProductStatus, Tone> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  SOLD_OUT: "warning",
  ARCHIVED: "neutral",
};

export const MENU_STATUS_TONE: Record<VenueMenuStatus, Tone> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export function ProductStatusBadge({ status, className }: { status: VenueProductStatus; className?: string }) {
  return (
    <StatusBadge tone={PRODUCT_STATUS_TONE[status]} className={className}>
      {VENUE_PRODUCT_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function MenuStatusBadge({ status, className }: { status: VenueMenuStatus; className?: string }) {
  return (
    <StatusBadge tone={MENU_STATUS_TONE[status]} pulse={status === "PUBLISHED"} className={className}>
      {VENUE_MENU_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function ActiveBadge({ active, className }: { active: boolean; className?: string }) {
  return (
    <StatusBadge tone={active ? "success" : "neutral"} className={className}>
      {active ? "Ativa" : "Inativa"}
    </StatusBadge>
  );
}
