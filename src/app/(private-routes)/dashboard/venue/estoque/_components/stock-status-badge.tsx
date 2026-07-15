import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VENUE_BALANCE_STATUS_LABEL, type VenueInventoryBalanceStatus } from "@/services/venue-stock";

export function StockStatusBadge({ status }: { status: VenueInventoryBalanceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "OUT_OF_STOCK" && "border-red-200 bg-red-50 text-red-700",
        status === "LOW_STOCK" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "OK" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {VENUE_BALANCE_STATUS_LABEL[status]}
    </Badge>
  );
}

export function ArchivedBadge({ archived }: { archived: boolean }) {
  return (
    <Badge variant="outline" className={cn(archived ? "border-black/10 bg-black/5 text-black/50" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
      {archived ? "Arquivado" : "Ativo"}
    </Badge>
  );
}

export function GenericStatusBadge({ label, tone }: { label: string; tone: "neutral" | "success" | "warning" | "danger" }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        tone === "neutral" && "border-black/10 bg-black/5 text-black/60",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        tone === "danger" && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {label}
    </Badge>
  );
}
