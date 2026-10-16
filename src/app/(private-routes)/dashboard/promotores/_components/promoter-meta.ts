import type { Tone } from "@/components/ui/badge";
import type { AssignmentStatus, CommissionEntryStatus, OrganizationPromoterStatus, SettlementStatus } from "@/services/promoters";

export const ORG_PROMOTER_TONE: Record<OrganizationPromoterStatus, Tone> = { ACTIVE: "success", INVITED: "info", SUSPENDED: "warning", REMOVED: "danger" };
export const ASSIGNMENT_TONE: Record<AssignmentStatus, Tone> = { ACTIVE: "success", PAUSED: "warning", ENDED: "neutral" };
export const SETTLEMENT_TONE: Record<SettlementStatus, Tone> = { DRAFT: "neutral", CONFIRMED: "warning", PAID_MANUALLY: "success", CANCELLED: "danger" };
export const COMMISSION_TONE: Record<Exclude<CommissionEntryStatus, null>, Tone> = { PENDING: "warning", AVAILABLE: "success", REVERSED: "danger", SETTLED: "info" };

export function publicEventUrl(publicToken: string, slugOrId: string | number) {
  return `https://www.noktatickets.com.br/evento/${slugOrId}?ref=${publicToken}`;
}

export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
