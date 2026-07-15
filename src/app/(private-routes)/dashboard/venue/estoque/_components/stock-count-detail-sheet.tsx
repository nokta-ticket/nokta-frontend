"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatStockQuantity, VENUE_STOCK_COUNT_STATUS_LABEL, type VenueStockCount } from "@/services/venue-stock";
import { useVenueStockCount, useVenueStockCountMutations } from "../_hooks/use-venue-stock-movements";
import { GenericStatusBadge } from "./stock-status-badge";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";

function countStatusTone(status: VenueStockCount["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  return "neutral" as const;
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
  const { data: count } = useVenueStockCount(orgId, countId);
  const { updateItems, complete, cancel } = useVenueStockCountMutations(orgId, locationId);
  const [counted, setCounted] = useState<Record<number, string>>({});
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!count) return;
    setCounted(Object.fromEntries(count.items.map((i) => [i.inventoryItemId, i.countedQuantity ?? ""])));
  }, [count]);

  if (!count) return null;

  const isDraft = count.status === "DRAFT";

  const saveCount = (inventoryItemId: number, value: string) => {
    setCounted((prev) => ({ ...prev, [inventoryItemId]: value }));
    updateItems.mutate(
      { countId: count.id, payload: { items: [{ inventoryItemId, countedQuantity: value || undefined }] } },
      { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível salvar a contagem.")) },
    );
  };

  const pendingDivergences = count.items.filter((i) => {
    const value = counted[i.inventoryItemId];
    return value !== undefined && value !== "" && Number(value) !== Number(i.expectedQuantity);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Inventário {count.publicCode}
            <GenericStatusBadge label={VENUE_STOCK_COUNT_STATUS_LABEL[count.status]} tone={countStatusTone(count.status)} />
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-6">
          {count.items.map((item) => {
            const value = counted[item.inventoryItemId] ?? "";
            const diverges = value !== "" && Number(value) !== Number(item.expectedQuantity);
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.inventoryItem.nome}</p>
                  <p className="text-xs text-black/50">
                    Esperado: {formatStockQuantity(item.expectedQuantity, item.inventoryItem.baseUnit)}
                  </p>
                </div>
                {isDraft ? (
                  <Input
                    className="w-28"
                    inputMode="decimal"
                    placeholder="Contado"
                    defaultValue={value}
                    onBlur={(e) => saveCount(item.inventoryItemId, e.target.value.replace(",", "."))}
                  />
                ) : (
                  <span className={`text-sm ${diverges ? "font-medium text-amber-700" : ""}`}>
                    {item.countedQuantity ? formatStockQuantity(item.countedQuantity, item.inventoryItem.baseUnit) : "—"}
                  </span>
                )}
              </div>
            );
          })}

          {isDraft ? (
            <>
              {pendingDivergences.length > 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {pendingDivergences.length} item(ns) com contagem divergente do esperado — ao concluir, será criado um ajuste automático para cada um.
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    cancel.mutate(count.id, {
                      onSuccess: () => {
                        toast.success("Inventário cancelado.");
                        onOpenChange(false);
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
                    })
                  }
                >
                  Cancelar inventário
                </Button>
                <Button onClick={() => setCompleting(true)}>Concluir inventário</Button>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>

      <ConfirmDialog
        open={completing}
        onOpenChange={setCompleting}
        title="Concluir inventário"
        description={
          pendingDivergences.length > 0
            ? `${pendingDivergences.length} item(ns) serão ajustados no estoque para bater com a contagem. Essa ação não pode ser desfeita.`
            : "Nenhuma divergência encontrada. O inventário será marcado como concluído e não poderá mais ser editado."
        }
        confirmLabel="Concluir"
        destructive={pendingDivergences.length > 0}
        loading={complete.isPending}
        onConfirm={() =>
          complete.mutate(count.id, {
            onSuccess: () => {
              toast.success("Inventário concluído.");
              setCompleting(false);
              onOpenChange(false);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível concluir.")),
          })
        }
      />
    </Sheet>
  );
}
