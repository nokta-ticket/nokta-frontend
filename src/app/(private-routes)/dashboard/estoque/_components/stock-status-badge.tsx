import { StatusBadge, type Tone } from "@/components/ui/badge";
import {
  VENUE_BALANCE_STATUS_LABEL,
  VENUE_PURCHASE_STATUS_LABEL,
  VENUE_STOCK_COUNT_STATUS_LABEL,
  VENUE_STOCK_TRANSFER_STATUS_LABEL,
  type VenueInventoryBalanceStatus,
  type VenuePurchaseStatus,
  type VenueStockCountStatus,
  type VenueStockTransferStatus,
} from "@/services/venue-stock";

/** Tons semânticos por status — fonte única pra badges, barras e steppers do estoque. */
export const STOCK_STATUS_TONE: Record<VenueInventoryBalanceStatus, Tone> = { OK: "success", LOW_STOCK: "warning", OUT_OF_STOCK: "danger" };
export const PURCHASE_STATUS_TONE: Record<VenuePurchaseStatus, Tone> = { DRAFT: "neutral", RECEIVED: "success", CANCELED: "danger" };
export const COUNT_STATUS_TONE: Record<VenueStockCountStatus, Tone> = { DRAFT: "info", COMPLETED: "success", CANCELED: "danger" };
export const TRANSFER_STATUS_TONE: Record<VenueStockTransferStatus, Tone> = { DRAFT: "neutral", SENT: "warning", RECEIVED: "success", CANCELED: "danger" };

export function StockStatusBadge({ status }: { status: VenueInventoryBalanceStatus }) {
  return <StatusBadge tone={STOCK_STATUS_TONE[status]}>{VENUE_BALANCE_STATUS_LABEL[status]}</StatusBadge>;
}

export function PurchaseStatusBadge({ status }: { status: VenuePurchaseStatus }) {
  return <StatusBadge tone={PURCHASE_STATUS_TONE[status]}>{VENUE_PURCHASE_STATUS_LABEL[status]}</StatusBadge>;
}

export function CountStatusBadge({ status }: { status: VenueStockCountStatus }) {
  return (
    <StatusBadge tone={COUNT_STATUS_TONE[status]} pulse={status === "DRAFT"}>
      {VENUE_STOCK_COUNT_STATUS_LABEL[status]}
    </StatusBadge>
  );
}

export function TransferStatusBadge({ status }: { status: VenueStockTransferStatus }) {
  return <StatusBadge tone={TRANSFER_STATUS_TONE[status]}>{VENUE_STOCK_TRANSFER_STATUS_LABEL[status]}</StatusBadge>;
}

export function ArchivedBadge({ archived }: { archived: boolean }) {
  return <StatusBadge tone={archived ? "neutral" : "success"}>{archived ? "Arquivado" : "Ativo"}</StatusBadge>;
}

/** Export público usado por outras frentes (financeiro, promotores) — assinatura mantida. */
export function GenericStatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
