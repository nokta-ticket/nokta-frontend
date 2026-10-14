"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { formatBRLCents } from "@/lib/format";
import { toast } from "@/lib/toast";
import { formatStockQuantity, VENUE_INVENTORY_UNIT_LABEL, VENUE_STOCK_MOVEMENT_TYPE_LABEL, type VenueInventoryBalance, type VenueInventoryItem } from "@/services/venue-stock";
import { useVenueStockItemBalances, useVenueStockItemMovements, useVenueStockItemMutations } from "../_hooks/use-venue-stock-catalog";
import { QuantityField } from "./quantity-field";
import { ArchivedBadge, StockStatusBadge } from "./stock-status-badge";
import { formatShortDateTime, LevelBar, levelTone, MovementDelta, UNIT_SHORT } from "./stock-primitives";

function BalanceCard({ item, balance, highlighted, editing, onEdit, onCancel, onSave, saving }: { item: VenueInventoryItem; balance: VenueInventoryBalance; highlighted: boolean; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (min: string, target: string) => void; saving: boolean }) {
  const [minimumQuantity, setMinimumQuantity] = useState(balance.minimumQuantity);
  const [targetQuantity, setTargetQuantity] = useState(balance.targetQuantity);

  useEffect(() => {
    if (!editing) return;
    setMinimumQuantity(balance.minimumQuantity);
    setTargetQuantity(balance.targetQuantity);
  }, [editing, balance.minimumQuantity, balance.targetQuantity]);

  return (
    <div className={cn("rounded-xl border bg-surface p-4 shadow-card", highlighted ? "border-brand-ring" : "border-border")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{balance.location?.nome ?? `Unidade ${balance.locationId}`}</p>
          <p className="mt-0.5 text-caption text-subtle-foreground">Atualizado {formatShortDateTime(balance.updatedAt)}</p>
        </div>
        <StockStatusBadge status={balance.status} />
      </div>

      <div className="mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-stat font-medium tabular-nums leading-none tracking-tight text-foreground">{formatStockQuantity(balance.quantityOnHand, item.baseUnit)}</span>
          <span className="text-caption text-subtle-foreground tnum">alvo {formatStockQuantity(balance.targetQuantity, item.baseUnit)}</span>
        </div>
        <LevelBar value={Number(balance.quantityOnHand)} max={Number(balance.targetQuantity)} tone={levelTone(balance.status)} className="mt-2" label="Nível do estoque" />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
        {[
          { label: "Mínimo", value: formatStockQuantity(balance.minimumQuantity, item.baseUnit) },
          { label: "Custo médio", value: `${formatBRLCents(Number(balance.averageUnitCostCents))}/${UNIT_SHORT[item.baseUnit]}` },
          { label: "Valor parado", value: formatBRLCents(Number(balance.estimatedValueCents)) },
        ].map((m) => (
          <div key={m.label} className="min-w-0">
            <dt className="text-micro uppercase tracking-wider text-subtle-foreground">{m.label}</dt>
            <dd className="truncate text-sm font-medium text-foreground tnum">{m.value}</dd>
          </div>
        ))}
      </dl>

      {editing ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <FieldGroup columns={2} className="grid-cols-2">
            <QuantityField id={`min-${balance.locationId}`} label="Mínimo" value={minimumQuantity} onChange={setMinimumQuantity} suffix={UNIT_SHORT[item.baseUnit]} />
            <QuantityField id={`target-${balance.locationId}`} label="Alvo" value={targetQuantity} onChange={setTargetQuantity} suffix={UNIT_SHORT[item.baseUnit]} />
          </FieldGroup>
          <p className="text-caption text-muted-foreground">Abaixo do mínimo vira alerta; o alvo define a sugestão de reposição.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={() => onSave(minimumQuantity || "0", targetQuantity || "0")}>
              Salvar limites
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" leftIcon="sliders" className="mt-4" onClick={onEdit}>
          Editar mínimo e alvo
        </Button>
      )}
    </div>
  );
}

export function ItemDetailSheet({
  orgId,
  item,
  open,
  onOpenChange,
  locationId,
  onEdit,
}: {
  orgId: number;
  item: VenueInventoryItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Unidade selecionada na página — aparece primeiro e destacada. */
  locationId?: number;
  onEdit?: (item: VenueInventoryItem) => void;
}) {
  const { data: balances, isLoading: loadingBalances } = useVenueStockItemBalances(orgId, item?.id ?? null);
  const { data: movements, isLoading: loadingMovements } = useVenueStockItemMovements(orgId, item?.id ?? null);
  const { setThresholds } = useVenueStockItemMutations(orgId);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);

  useEffect(() => {
    setEditingLocationId(null);
  }, [item?.id, open]);

  const sortedBalances = [...(balances ?? [])].sort((a, b) => (a.locationId === locationId ? -1 : b.locationId === locationId ? 1 : 0));
  const recentMovements = (movements ?? []).slice(0, 12);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {item ? (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{item.nome}</SheetTitle>
                {item.archivedAt ? <ArchivedBadge archived /> : null}
              </div>
              <SheetDescription>
                {[item.category?.nome ?? "Sem categoria", item.internalCode, VENUE_INVENTORY_UNIT_LABEL[item.baseUnit]].filter(Boolean).join(" · ")}
              </SheetDescription>
            </SheetHeader>

            <SheetBody>
              <section className="space-y-2.5">
                <h4 className="text-sm font-semibold text-foreground">Saldo por unidade</h4>
                {loadingBalances ? (
                  <div className="space-y-2.5">
                    <Skeleton className="h-44 rounded-xl" />
                    <Skeleton className="h-44 rounded-xl" />
                  </div>
                ) : sortedBalances.length === 0 ? (
                  <p className="surface-inset rounded-xl p-4 text-sm text-muted-foreground">Nenhum saldo lançado ainda pra este item. Registre uma compra ou um ajuste de entrada.</p>
                ) : (
                  <div className="space-y-2.5">
                    {sortedBalances.map((b) => (
                      <BalanceCard
                        key={b.id}
                        item={item}
                        balance={b}
                        highlighted={b.locationId === locationId}
                        editing={editingLocationId === b.locationId}
                        saving={setThresholds.isPending && editingLocationId === b.locationId}
                        onEdit={() => setEditingLocationId(b.locationId)}
                        onCancel={() => setEditingLocationId(null)}
                        onSave={(minimumQuantity, targetQuantity) =>
                          setThresholds
                            .mutateAsync({ locationId: b.locationId, itemId: item.id, payload: { minimumQuantity, targetQuantity } })
                            .then(() => {
                              toast.success("Limites atualizados.");
                              setEditingLocationId(null);
                            })
                            .catch((err) => toast.error(getErrorMessage(err, "Não foi possível salvar.")))
                        }
                      />
                    ))}
                  </div>
                )}
              </section>

              <SheetSection title="Últimas movimentações">
                {loadingMovements ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                ) : recentMovements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
                ) : (
                  <ul className="-my-1 divide-y divide-border/70">
                    {recentMovements.map((m) => {
                      const positive = Number(m.quantityDelta) > 0;
                      return (
                        <li key={m.id} className="flex items-center gap-3 py-2.5">
                          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2", positive ? "text-money-in" : "text-money-out")} aria-hidden>
                            <Icon name={positive ? "plus" : "minus"} size={11} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{VENUE_STOCK_MOVEMENT_TYPE_LABEL[m.type]}</p>
                            <p className="truncate text-caption text-muted-foreground">
                              {m.location?.nome ?? `Unidade ${m.locationId}`} · {formatShortDateTime(m.createdAt)}
                              {m.reason ? ` · ${m.reason}` : ""}
                            </p>
                          </div>
                          <MovementDelta delta={m.quantityDelta} unit={item.baseUnit} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SheetSection>
            </SheetBody>

            {onEdit && !item.archivedAt ? (
              <SheetFooter>
                <Button variant="outline" leftIcon="edit" onClick={() => onEdit(item)}>
                  Editar item
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
