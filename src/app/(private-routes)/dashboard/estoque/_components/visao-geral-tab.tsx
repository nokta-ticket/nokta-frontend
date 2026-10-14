"use client";

import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { formatBRLCents } from "@/lib/format";
import { formatStockQuantity } from "@/services/venue-stock";
import { useVenueStockAlerts } from "../_hooks/use-venue-stock-catalog";
import { StockStatusBadge } from "./stock-status-badge";
import { plural, StockLevel } from "./stock-primitives";

export function VisaoGeralTab({ orgId, locationId, locationName }: { orgId: number; locationId: number; locationName: string }) {
  const { data: alerts, isLoading, isError, refetch } = useVenueStockAlerts(orgId, locationId);

  if (isError) return <ErrorState description="Não foi possível carregar os alertas de reposição." onRetry={() => refetch()} />;
  if (isLoading) return <RowsSkeleton rows={5} />;

  const list = alerts ?? [];
  const outOfStock = list.filter((a) => a.status === "OUT_OF_STOCK").length;
  const lowStock = list.filter((a) => a.status === "LOW_STOCK").length;
  const totalCost = list.reduce((sum, a) => sum + a.estimatedReplenishmentCostCents, 0);

  if (list.length === 0) {
    return <EmptyState icon="check-circle" title="Nenhum alerta nesta unidade" description={`Todos os itens estão acima do mínimo em ${locationName}.`} />;
  }

  const summary = [outOfStock > 0 ? plural(outOfStock, "item zerado", "itens zerados") : null, lowStock > 0 ? plural(lowStock, "abaixo do mínimo", "abaixo do mínimo") : null].filter(Boolean).join(" e ");

  return (
    <div className="space-y-4">
      <SectionHeader title="Reposição pendente" description={`${summary} em ${locationName}.`} />

      <DataTableShell
        maxHeight="calc(100dvh - 30rem)"
        table={
          <DataTable>
            <DataTableHead>
              <tr>
                <DataTableHeadCell>Item</DataTableHeadCell>
                <DataTableHeadCell>Status</DataTableHeadCell>
                <DataTableHeadCell width={220}>Nível</DataTableHeadCell>
                <DataTableHeadCell align="right">Repor</DataTableHeadCell>
                <DataTableHeadCell align="right">Custo estimado</DataTableHeadCell>
                <DataTableHeadCell>Último fornecedor</DataTableHeadCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {list.map((a, i) => (
                <DataTableRow key={a.inventoryItemId} index={i}>
                  <DataTableCell>
                    <p className="font-semibold text-foreground">{a.nome}</p>
                    <p className="text-caption text-muted-foreground tnum">Mínimo {formatStockQuantity(a.minimumQuantity, a.baseUnit)}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <StockStatusBadge status={a.status} />
                  </DataTableCell>
                  <DataTableCell>
                    <StockLevel onHand={a.quantityOnHand} target={a.targetQuantity} status={a.status} unit={a.baseUnit} />
                  </DataTableCell>
                  <DataTableCell num className="font-medium">
                    {formatStockQuantity(a.replenishmentSuggestion, a.baseUnit)}
                  </DataTableCell>
                  <DataTableCell num>{a.estimatedReplenishmentCostCents > 0 ? formatBRLCents(a.estimatedReplenishmentCostCents) : <span className="text-subtle-foreground">Sem custo médio</span>}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{a.latestSupplier?.nome ?? <span className="text-subtle-foreground">Nunca comprado</span>}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        }
        mobile={
          <MobileCardList>
            {list.map((a, i) => (
              <MobileCard
                key={a.inventoryItemId}
                index={i}
                title={a.nome}
                badge={<StockStatusBadge status={a.status} />}
                subtitle={<StockLevel onHand={a.quantityOnHand} target={a.targetQuantity} status={a.status} unit={a.baseUnit} className="mt-1.5" />}
                meta={[
                  { label: "Repor", value: formatStockQuantity(a.replenishmentSuggestion, a.baseUnit), num: true },
                  { label: "Custo estimado", value: a.estimatedReplenishmentCostCents > 0 ? formatBRLCents(a.estimatedReplenishmentCostCents) : "Sem custo médio", num: true },
                  { label: "Mínimo", value: formatStockQuantity(a.minimumQuantity, a.baseUnit), num: true },
                  { label: "Último fornecedor", value: a.latestSupplier?.nome ?? "Nunca comprado" },
                ]}
              />
            ))}
          </MobileCardList>
        }
        footer={
          <div className="flex items-center justify-between gap-3 text-caption tnum">
            <span className="text-muted-foreground">{plural(list.length, "item pra repor", "itens pra repor")}</span>
            <span className="font-medium text-foreground">Repor tudo ≈ {formatBRLCents(totalCost)}</span>
          </div>
        }
      />
    </div>
  );
}
