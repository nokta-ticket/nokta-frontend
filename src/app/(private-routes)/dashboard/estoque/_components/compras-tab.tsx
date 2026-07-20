"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { formatCents, formatStockQuantity, VENUE_PURCHASE_STATUS_LABEL, type VenuePurchase } from "@/services/venue-stock";
import { useVenueStockSuppliers } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockPurchaseMutations, useVenueStockPurchases } from "../_hooks/use-venue-stock-purchases";
import { PurchaseFormDialog } from "./purchase-form-dialog";
import { GenericStatusBadge } from "./stock-status-badge";
import { ConfirmDialog } from "../../cardapio/_components/confirm-dialog";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function purchaseStatusTone(status: VenuePurchase["status"]) {
  if (status === "RECEIVED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  return "neutral" as const;
}

export function ComprasTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<VenuePurchase | null>(null);
  const [receiving, setReceiving] = useState<VenuePurchase | null>(null);
  const [canceling, setCanceling] = useState<VenuePurchase | null>(null);

  const { data: suppliers } = useVenueStockSuppliers(orgId);
  const { data, isLoading, isError, refetch } = useVenueStockPurchases(orgId, locationId, { limit: 50 });
  const { cancel, receive } = useVenueStockPurchaseMutations(orgId, locationId);

  const list = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-black/60">Compras registradas nesta unidade.</p>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Registrar compra
        </Button>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as compras." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhuma compra registrada"
          description="Registre a primeira compra para começar a lançar entradas de estoque."
          actionLabel="Registrar compra"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setDetail(p)}>
                  <TableCell className="font-medium">{p.publicCode}</TableCell>
                  <TableCell>{p.supplier?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <GenericStatusBadge label={VENUE_PURCHASE_STATUS_LABEL[p.status]} tone={purchaseStatusTone(p.status)} />
                  </TableCell>
                  <TableCell className="text-right">{formatCents(p.totalCostCents)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {p.status === "DRAFT" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setReceiving(p)}>Receber</Button>
                        <Button size="sm" variant="ghost" onClick={() => setCanceling(p)}>Cancelar</Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PurchaseFormDialog orgId={orgId} locationId={locationId} suppliers={suppliers ?? []} open={formOpen} onOpenChange={setFormOpen} />

      <Sheet open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Compra {detail?.publicCode}</SheetTitle>
          </SheetHeader>
          {detail ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Status</span>
                <GenericStatusBadge label={VENUE_PURCHASE_STATUS_LABEL[detail.status]} tone={purchaseStatusTone(detail.status)} />
              </div>
              {detail.supplier ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/60">Fornecedor</span>
                  <span>{detail.supplier.nome}</span>
                </div>
              ) : null}
              <div className="space-y-2">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-black/10 p-2 text-sm">
                    <div>
                      <p className="font-medium">{item.inventoryItem.nome}</p>
                      <p className="text-xs text-black/50">{formatStockQuantity(item.quantityBase, item.inventoryItem.baseUnit)}</p>
                    </div>
                    <span>{formatCents(item.totalCostCents)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>{formatCents(detail.totalCostCents)}</span>
              </div>
              {detail.status === "CANCELED" && detail.cancelReason ? (
                <p className="text-sm text-black/50">Motivo do cancelamento: {detail.cancelReason}</p>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={receiving !== null}
        onOpenChange={(v) => !v && setReceiving(null)}
        title="Receber compra"
        description="Isso vai dar entrada nos itens no estoque e recalcular o custo médio. Depois de recebida, a compra não pode mais ser editada."
        confirmLabel="Confirmar recebimento"
        destructive={false}
        loading={receive.isPending}
        onConfirm={() =>
          receiving &&
          receive.mutate(receiving.id, {
            onSuccess: () => {
              toast.success("Compra recebida — estoque atualizado.");
              setReceiving(null);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Não foi possível receber a compra.")),
          })
        }
      />

      <ConfirmDialog
        open={canceling !== null}
        onOpenChange={(v) => !v && setCanceling(null)}
        title="Cancelar compra"
        description="Uma compra em rascunho pode ser cancelada sem afetar o estoque."
        confirmLabel="Cancelar compra"
        loading={cancel.isPending}
        onConfirm={() =>
          canceling &&
          cancel.mutate(
            { purchaseId: canceling.id },
            {
              onSuccess: () => {
                toast.success("Compra cancelada.");
                setCanceling(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
            },
          )
        }
      />
    </div>
  );
}
