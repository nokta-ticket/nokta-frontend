"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import {
  formatCents,
  formatStockQuantity,
  VENUE_STOCK_MOVEMENT_TYPE_LABEL,
  type VenueInventoryItem,
} from "@/services/venue-stock";
import { useVenueStockItemBalances, useVenueStockItemMovements, useVenueStockItemMutations } from "../_hooks/use-venue-stock-catalog";
import { StockStatusBadge } from "./stock-status-badge";
import { QuantityField } from "./quantity-field";
import { TableSkeleton } from "../../_components/states/loading-state";

export function ItemDetailSheet({
  orgId,
  item,
  open,
  onOpenChange,
}: {
  orgId: number;
  item: VenueInventoryItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: balances, isLoading: loadingBalances } = useVenueStockItemBalances(orgId, item?.id ?? null);
  const { data: movements, isLoading: loadingMovements } = useVenueStockItemMovements(orgId, item?.id ?? null);
  const { setThresholds } = useVenueStockItemMutations(orgId);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");

  useEffect(() => {
    setEditingLocationId(null);
  }, [item?.id, open]);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{item.nome}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-black/60">Saldo por unidade</h3>
            {loadingBalances ? (
              <TableSkeleton rows={2} />
            ) : (
              <div className="space-y-2">
                {(balances ?? []).map((b) => (
                  <div key={b.id} className="rounded-lg border border-black/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{b.location?.nome ?? `Unidade ${b.locationId}`}</span>
                      <StockStatusBadge status={b.status} />
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-black/70">
                      <span>Saldo: {formatStockQuantity(b.quantityOnHand, item.baseUnit)}</span>
                      <span>Custo médio: {formatCents(Number(b.averageUnitCostCents))}</span>
                      <span>Mínimo: {formatStockQuantity(b.minimumQuantity, item.baseUnit)}</span>
                      <span>Ideal: {formatStockQuantity(b.targetQuantity, item.baseUnit)}</span>
                      <span className="col-span-2">Valor estimado: {formatCents(Number(b.estimatedValueCents))}</span>
                    </div>

                    {editingLocationId === b.locationId ? (
                      <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <QuantityField label="Mínimo" value={minimumQuantity} onChange={setMinimumQuantity} />
                          <QuantityField label="Ideal" value={targetQuantity} onChange={setTargetQuantity} />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={setThresholds.isPending}
                            onClick={() =>
                              setThresholds
                                .mutateAsync({
                                  locationId: b.locationId,
                                  itemId: item.id,
                                  payload: { minimumQuantity: minimumQuantity || "0", targetQuantity: targetQuantity || "0" },
                                })
                                .then(() => {
                                  toast.success("Limites atualizados.");
                                  setEditingLocationId(null);
                                })
                                .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")))
                            }
                          >
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingLocationId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setEditingLocationId(b.locationId);
                          setMinimumQuantity(b.minimumQuantity);
                          setTargetQuantity(b.targetQuantity);
                        }}
                      >
                        Editar mínimo/ideal
                      </Button>
                    )}
                  </div>
                ))}
                {(balances ?? []).length === 0 ? (
                  <p className="text-sm text-black/50">Nenhum saldo lançado ainda para este item.</p>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-black/60">Últimas movimentações</h3>
            {loadingMovements ? (
              <TableSkeleton rows={4} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(movements ?? []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">{new Date(m.createdAt).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{m.location?.nome ?? m.locationId}</TableCell>
                      <TableCell className="text-xs">{VENUE_STOCK_MOVEMENT_TYPE_LABEL[m.type]}</TableCell>
                      <TableCell className="text-right text-xs">
                        {formatStockQuantity(m.quantityDelta, item.baseUnit)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(movements ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-black/50">
                        Nenhuma movimentação ainda.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
