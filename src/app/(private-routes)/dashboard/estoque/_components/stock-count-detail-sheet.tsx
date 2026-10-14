"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatStockQuantity, type VenueStockCount } from "@/services/venue-stock";
import { useVenueStockCount, useVenueStockCountMutations } from "../_hooks/use-venue-stock-movements";
import { CountStatusBadge } from "./stock-status-badge";
import { formatShortDateTime, LevelBar, MovementDelta, plural, UNIT_SHORT } from "./stock-primitives";

function countSteps(count: VenueStockCount): StepperStep[] {
  const started: StepperStep = { label: "Contagem iniciada", description: count.notes ?? undefined, timestamp: formatShortDateTime(count.startedAt), status: "done" };
  if (count.status === "CANCELED") return [started, { label: "Cancelada", timestamp: formatShortDateTime(count.canceledAt), status: "failed" }];
  if (count.status === "COMPLETED") return [started, { label: "Concluída", description: "Divergências viraram ajustes automáticos.", timestamp: formatShortDateTime(count.completedAt), status: "done" }];
  return [started, { label: "Concluir", description: "Informe o contado de todos os itens e conclua.", status: "current" }];
}

export function StockCountDetailSheet({
  orgId,
  locationId,
  countId,
  open,
  onOpenChange,
}: {
  orgId: number;
  locationId: number;
  countId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: count, isLoading } = useVenueStockCount(orgId, countId);
  const { updateItems, complete, cancel } = useVenueStockCountMutations(orgId, locationId);
  const [counted, setCounted] = useState<Record<number, string>>({});
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!count) return;
    setCounted(Object.fromEntries(count.items.map((i) => [i.inventoryItemId, i.countedQuantity ?? ""])));
  }, [count]);

  const isDraft = count?.status === "DRAFT";

  const saveCount = (inventoryItemId: number, value: string) => {
    if (!count) return;
    setCounted((prev) => ({ ...prev, [inventoryItemId]: value }));
    updateItems.mutate(
      { countId: count.id, payload: { items: [{ inventoryItemId, countedQuantity: value || undefined }] } },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar a contagem.")) },
    );
  };

  const items = count?.items ?? [];
  const countedItems = items.filter((i) => (counted[i.inventoryItemId] ?? "") !== "");
  const pendingDivergences = items.filter((i) => {
    const value = counted[i.inventoryItemId];
    return value !== undefined && value !== "" && Number(value) !== Number(i.expectedQuantity);
  });

  const handleComplete = async () => {
    if (!count) return;
    try {
      await complete.mutateAsync(count.id);
      toast.success("Inventário concluído.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível concluir."));
    }
  };

  const handleCancel = async () => {
    if (!count) return;
    try {
      await cancel.mutateAsync(count.id);
      toast.success("Inventário cancelado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Não foi possível cancelar."));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        {isLoading || !count ? (
          <>
            <SheetHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </SheetHeader>
            <SheetBody>
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </SheetBody>
          </>
        ) : (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>Inventário {count.publicCode}</SheetTitle>
                <CountStatusBadge status={count.status} />
              </div>
              <SheetDescription>
                {plural(items.length, "item no escopo", "itens no escopo")}
                {isDraft ? ` · ${countedItems.length} contados` : ""}
              </SheetDescription>
            </SheetHeader>

            <SheetBody>
              <Stepper steps={countSteps(count)} />

              {isDraft && items.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between text-caption tnum">
                    <span className="font-medium text-foreground">
                      {countedItems.length} de {items.length} contados
                    </span>
                    <span className="text-subtle-foreground">{Math.round((countedItems.length / items.length) * 100)}%</span>
                  </div>
                  <LevelBar value={countedItems.length} max={items.length} tone="brand" className="mt-1.5" label="Progresso da contagem" />
                </div>
              ) : null}

              {isDraft && pendingDivergences.length > 0 ? (
                <Callout tone="warning" title={`${plural(pendingDivergences.length, "item diverge", "itens divergem")} do esperado`}>
                  Ao concluir, cada divergência vira um ajuste automático no saldo.
                </Callout>
              ) : null}

              <SheetSection title="Itens">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este inventário não tem itens no escopo.</p>
                ) : (
                  <ul className="-my-1 divide-y divide-border/70">
                    {items.map((item) => {
                      const value = counted[item.inventoryItemId] ?? "";
                      const diff = value !== "" ? Number(value) - Number(item.expectedQuantity) : null;
                      const diverges = diff !== null && diff !== 0;
                      return (
                        <li key={item.id} className="flex items-center gap-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{item.inventoryItem.nome}</p>
                            <p className="flex flex-wrap items-center gap-x-1.5 text-caption text-muted-foreground tnum">
                              <span>Esperado {formatStockQuantity(item.expectedQuantity, item.inventoryItem.baseUnit)}</span>
                              {!isDraft && item.countedQuantity ? <span>· contado {formatStockQuantity(item.countedQuantity, item.inventoryItem.baseUnit)}</span> : null}
                              {isDraft && diverges ? (
                                <span className={cn("font-semibold", (diff ?? 0) > 0 ? "text-money-in" : "text-money-out")}>
                                  {(diff ?? 0) > 0 ? "+" : "−"}
                                  {formatStockQuantity(Math.abs(diff ?? 0), item.inventoryItem.baseUnit)}
                                </span>
                              ) : null}
                            </p>
                          </div>
                          {isDraft ? (
                            <Input
                              className="w-32 shrink-0"
                              inputMode="decimal"
                              aria-label={`Contado de ${item.inventoryItem.nome}`}
                              placeholder="Contado"
                              suffix={UNIT_SHORT[item.inventoryItem.baseUnit]}
                              defaultValue={value}
                              onBlur={(e) => saveCount(item.inventoryItemId, e.target.value.replace(",", "."))}
                            />
                          ) : item.countedQuantity ? (
                            <MovementDelta delta={diff ?? 0} unit={item.inventoryItem.baseUnit} />
                          ) : (
                            <span className="text-caption text-subtle-foreground">Não contado</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SheetSection>
            </SheetBody>

            {isDraft ? (
              <SheetFooter>
                <Button variant="destructive-soft" onClick={() => setCanceling(true)}>
                  Cancelar inventário
                </Button>
                <Button leftIcon="clipboard-check" onClick={() => setCompleting(true)}>
                  Concluir inventário
                </Button>
              </SheetFooter>
            ) : null}
          </>
        )}
      </SheetContent>

      <ConfirmDialog
        open={completing}
        onOpenChange={setCompleting}
        title="Concluir inventário?"
        icon="clipboard-check"
        danger={pendingDivergences.length > 0}
        description={
          pendingDivergences.length > 0
            ? `${plural(pendingDivergences.length, "item será ajustado", "itens serão ajustados")} no estoque pra bater com a contagem. Isso não pode ser desfeito.`
            : "Nenhuma divergência encontrada. O inventário será marcado como concluído e não poderá mais ser editado."
        }
        confirmLabel="Concluir"
        onConfirm={handleComplete}
      />

      <ConfirmDialog
        open={canceling}
        onOpenChange={setCanceling}
        title="Cancelar inventário?"
        danger
        description="As quantidades contadas até agora são descartadas e nenhum saldo muda."
        confirmLabel="Cancelar inventário"
        cancelLabel="Voltar"
        onConfirm={handleCancel}
      />
    </Sheet>
  );
}
