"use client";

import { useState } from "react";
import { ArrowRightLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { VenueLocation } from "@/services/venue-operation";
import {
  formatStockQuantity,
  VENUE_STOCK_MOVEMENT_TYPE_LABEL,
  VENUE_STOCK_TRANSFER_STATUS_LABEL,
  type VenueStockMovementType,
  type VenueStockTransfer,
} from "@/services/venue-stock";
import { useVenueStockMovements, useVenueStockTransferMutations, useVenueStockTransfers } from "../_hooks/use-venue-stock-movements";
import { ManualMovementDialog } from "./manual-movement-dialog";
import { TransferFormDialog } from "./transfer-form-dialog";
import { GenericStatusBadge } from "./stock-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function transferStatusTone(status: VenueStockTransfer["status"]) {
  if (status === "RECEIVED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  if (status === "SENT") return "warning" as const;
  return "neutral" as const;
}

function TransfersSection({ orgId, locations, locationId }: { orgId: number; locations: VenueLocation[]; locationId: number }) {
  const { data: transfers, isLoading } = useVenueStockTransfers(orgId);
  const { send, receive, cancel } = useVenueStockTransferMutations(orgId);
  const [formOpen, setFormOpen] = useState(false);

  const list = transfers ?? [];

  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <ArrowRightLeft size={16} /> Transferências entre unidades
        </h3>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus size={14} /> Nova transferência
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : list.length === 0 ? (
        <p className="text-sm text-black/50">Nenhuma transferência registrada ainda.</p>
      ) : (
        <div className="space-y-2">
          {list.map((t) => (
            <div key={t.id} className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {t.publicCode} · {t.fromLocation.nome} → {t.toLocation.nome}
                </p>
                <p className="text-xs text-black/50">{t.items.length} item(ns)</p>
              </div>
              <div className="flex items-center gap-2">
                <GenericStatusBadge label={VENUE_STOCK_TRANSFER_STATUS_LABEL[t.status]} tone={transferStatusTone(t.status)} />
                {t.status === "DRAFT" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        send.mutate(t.id, {
                          onSuccess: () => toast.success("Transferência enviada."),
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível enviar.")),
                        })
                      }
                    >
                      Enviar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        cancel.mutate(t.id, {
                          onError: (err) => toast.error(getErrorMessage(err, "Não foi possível cancelar.")),
                        })
                      }
                    >
                      Cancelar
                    </Button>
                  </>
                ) : null}
                {t.status === "SENT" ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      receive.mutate(t.id, {
                        onSuccess: () => toast.success("Transferência recebida — saldo atualizado."),
                        onError: (err) => toast.error(getErrorMessage(err, "Não foi possível receber.")),
                      })
                    }
                  >
                    Receber
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransferFormDialog orgId={orgId} locations={locations} defaultFromLocationId={locationId} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

export function MovimentacoesTab({ orgId, locationId, locations }: { orgId: number; locationId: number; locations: VenueLocation[] }) {
  const [type, setType] = useState<string>("all");
  const [manualOpen, setManualOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useVenueStockMovements(orgId, locationId, {
    type: type !== "all" ? (type as VenueStockMovementType) : undefined,
    limit: 100,
  });
  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(VENUE_STOCK_MOVEMENT_TYPE_LABEL) as VenueStockMovementType[]).map((t) => (
                <SelectItem key={t} value={t}>{VENUE_STOCK_MOVEMENT_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setManualOpen(true)}>
            <Plus size={16} /> Lançamento manual
          </Button>
        </div>

        {isError ? (
          <ErrorState description="Não foi possível carregar as movimentações." onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton />
        ) : list.length === 0 ? (
          <EmptyState title="Nenhuma movimentação ainda" description="Compras, consumo de vendas, perdas e ajustes aparecem aqui." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Saldo após</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{new Date(m.createdAt).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{m.inventoryItem?.nome ?? m.inventoryItemId}</TableCell>
                    <TableCell className="text-xs">{VENUE_STOCK_MOVEMENT_TYPE_LABEL[m.type]}</TableCell>
                    <TableCell className="text-right text-xs">
                      {m.inventoryItem ? formatStockQuantity(m.quantityDelta, m.inventoryItem.baseUnit) : m.quantityDelta}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {m.inventoryItem ? formatStockQuantity(m.balanceAfter, m.inventoryItem.baseUnit) : m.balanceAfter}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TransfersSection orgId={orgId} locations={locations} locationId={locationId} />

      <ManualMovementDialog orgId={orgId} locationId={locationId} open={manualOpen} onOpenChange={setManualOpen} />
    </div>
  );
}
