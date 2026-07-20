"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import { formatCents, formatStockQuantity } from "@/services/venue-stock";
import { useVenueStockAlerts } from "../_hooks/use-venue-stock-catalog";
import { StockStatusBadge } from "./stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { BlockSkeleton } from "../../_components/states/loading-state";

export function VisaoGeralTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: alerts, isLoading } = useVenueStockAlerts(orgId, locationId);

  if (isLoading) {
    return <BlockSkeleton className="h-64" />;
  }

  const list = alerts ?? [];
  const outOfStock = list.filter((a) => a.status === "OUT_OF_STOCK");
  const lowStock = list.filter((a) => a.status === "LOW_STOCK");

  if (list.length === 0) {
    return (
      <EmptyState
        title="Nenhum alerta no momento"
        description="Todos os itens estão com saldo acima do mínimo configurado nesta unidade."
      />
    );
  }

  return (
    <div className="space-y-6">
      {outOfStock.length > 0 ? (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-700">
            <PackageX size={16} /> Sem estoque ({outOfStock.length})
          </h3>
          <AlertList items={outOfStock} />
        </div>
      ) : null}

      {lowStock.length > 0 ? (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <AlertTriangle size={16} /> Estoque baixo ({lowStock.length})
          </h3>
          <AlertList items={lowStock} />
        </div>
      ) : null}
    </div>
  );
}

function AlertList({ items }: { items: NonNullable<ReturnType<typeof useVenueStockAlerts>["data"]> }) {
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.inventoryItemId} className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{a.nome}</span>
              <StockStatusBadge status={a.status} />
            </div>
            <p className="text-xs text-black/50">
              Saldo: {formatStockQuantity(a.quantityOnHand, a.baseUnit)} · Mínimo: {formatStockQuantity(a.minimumQuantity, a.baseUnit)}
            </p>
          </div>
          <div className="text-sm text-black/70 sm:text-right">
            <p>Sugestão de reposição: {formatStockQuantity(a.replenishmentSuggestion, a.baseUnit)}</p>
            <p className="text-xs text-black/50">
              Custo estimado: {formatCents(a.estimatedReplenishmentCostCents)}
              {a.latestSupplier ? ` · último fornecedor: ${a.latestSupplier.nome}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
