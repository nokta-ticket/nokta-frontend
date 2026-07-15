"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { VENUE_STOCK_COUNT_STATUS_LABEL, type VenueStockCount } from "@/services/venue-stock";
import { useVenueStockCategories } from "../_hooks/use-venue-stock-catalog";
import { useVenueStockCountMutations, useVenueStockCounts } from "../_hooks/use-venue-stock-movements";
import { StockCountDetailSheet } from "./stock-count-detail-sheet";
import { GenericStatusBadge } from "./stock-status-badge";
import { EmptyState } from "../../../_components/states/empty-state";
import { TableSkeleton } from "../../../_components/states/loading-state";

function countStatusTone(status: VenueStockCount["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELED") return "danger" as const;
  return "neutral" as const;
}

export function InventarioTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: categories } = useVenueStockCategories(orgId);
  const { data: counts, isLoading } = useVenueStockCounts(orgId, locationId);
  const { create } = useVenueStockCountMutations(orgId, locationId);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [detailId, setDetailId] = useState<number | null>(null);

  const list = counts ?? [];
  const hasOpenDraft = list.some((c) => c.status === "DRAFT");

  const handleCreate = () => {
    create
      .mutateAsync({ categoryId: categoryId !== "all" ? Number(categoryId) : undefined })
      .then((created) => {
        toast.success("Inventário iniciado.");
        setDetailId(created.id);
      })
      .catch((err) => toast.error(getErrorMessage(err, "Não foi possível iniciar o inventário.")));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={categoryId} onValueChange={setCategoryId} disabled={hasOpenDraft}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Categoria (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={create.isPending || hasOpenDraft}>
          <Plus size={16} /> Novo inventário
        </Button>
      </div>

      {hasOpenDraft ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Já existe um inventário em andamento nesta unidade — conclua ou cancele antes de iniciar outro.
        </p>
      ) : null}

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum inventário registrado"
          description="Inicie uma contagem para conferir o saldo físico contra o saldo do sistema."
          actionLabel="Novo inventário"
          onAction={handleCreate}
        />
      ) : (
        <div className="space-y-2">
          {list.map((count) => (
            <button
              key={count.id}
              className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white p-3 text-left"
              onClick={() => setDetailId(count.id)}
            >
              <div>
                <p className="text-sm font-medium">{count.publicCode}</p>
                <p className="text-xs text-black/50">{new Date(count.startedAt).toLocaleString("pt-BR")} · {count.items.length} item(ns)</p>
              </div>
              <GenericStatusBadge label={VENUE_STOCK_COUNT_STATUS_LABEL[count.status]} tone={countStatusTone(count.status)} />
            </button>
          ))}
        </div>
      )}

      <StockCountDetailSheet
        orgId={orgId}
        locationId={locationId}
        countId={detailId}
        open={detailId !== null}
        onOpenChange={(v) => !v && setDetailId(null)}
      />
    </div>
  );
}
