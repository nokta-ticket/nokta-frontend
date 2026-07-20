"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { OrderItemSettableStatus, VenuePreparationItem } from "@/services/venue-operation";
import { useVenueStations } from "../../cardapio/_hooks/use-venue-stations";
import { useVenuePreparationItems, useVenuePreparationMutations } from "../_hooks/use-venue-preparation";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

const COLUMNS: { status: string; label: string; nextStatus?: OrderItemSettableStatus; nextLabel?: string }[] = [
  { status: "SENT", label: "Novos", nextStatus: "IN_PREPARATION", nextLabel: "Iniciar preparo" },
  { status: "IN_PREPARATION", label: "Em preparo", nextStatus: "READY", nextLabel: "Marcar pronto" },
  { status: "READY", label: "Prontos", nextStatus: "DELIVERED", nextLabel: "Marcar entregue" },
  { status: "DELIVERED", label: "Entregues" },
];

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function ItemCard({
  item,
  nextStatus,
  nextLabel,
  onAdvance,
  loading,
}: {
  item: VenuePreparationItem;
  nextStatus?: OrderItemSettableStatus;
  nextLabel?: string;
  onAdvance: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-black/50">
          {item.order.tab.table ? item.order.tab.table.nome : item.order.tab.publicCode}
        </span>
        <span className="text-xs text-black/40">{minutesSince(item.createdAt)} min</span>
      </div>
      <p className="mt-1 font-medium text-gray-900">
        {item.quantity}x {item.productNameSnapshot}
      </p>
      {item.variantNameSnapshot ? <p className="text-xs text-black/50">{item.variantNameSnapshot}</p> : null}
      {item.modifiers.length > 0 ? (
        <p className="text-xs text-black/50">{item.modifiers.map((m) => m.optionNameSnapshot).join(", ")}</p>
      ) : null}
      {item.notes ? <p className="text-xs text-black/40 italic">{item.notes}</p> : null}
      {nextStatus ? (
        <Button size="sm" className="mt-2 w-full" disabled={loading} onClick={onAdvance}>
          {nextLabel}
        </Button>
      ) : null}
    </div>
  );
}

function Column({
  orgId,
  locationId,
  status,
  label,
  nextStatus,
  nextLabel,
  stationId,
}: {
  orgId: number;
  locationId: number;
  status: string;
  label: string;
  nextStatus?: OrderItemSettableStatus;
  nextLabel?: string;
  stationId?: number;
}) {
  const { data: items, isLoading } = useVenuePreparationItems(orgId, locationId, {
    status,
    preparationStationId: stationId,
  });
  const { setStatus } = useVenuePreparationMutations(orgId, locationId);
  const list = items ?? [];

  return (
    <div className="min-w-[260px] flex-1 space-y-2">
      <h4 className="flex items-center justify-between text-sm font-semibold text-black/60">
        {label} <span className="text-xs font-normal text-black/40">{list.length}</span>
      </h4>
      {isLoading ? (
        <TableSkeleton rows={2} />
      ) : list.length === 0 ? (
        <p className="text-xs text-black/30">Nada por aqui.</p>
      ) : (
        list.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            nextStatus={nextStatus}
            nextLabel={nextLabel}
            loading={setStatus.isPending}
            onAdvance={() => {
              if (!nextStatus) return;
              setStatus.mutate(
                { itemId: item.id, payload: { status: nextStatus } },
                { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar o status.")) },
              );
            }}
          />
        ))
      )}
    </div>
  );
}

export function PedidosTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: stations } = useVenueStations(orgId);
  const [stationId, setStationId] = useState("ALL");
  const [mobileStatus, setMobileStatus] = useState("SENT");

  const resolvedStationId = stationId === "ALL" ? undefined : Number(stationId);

  return (
    <div className="space-y-4">
      <Select value={stationId} onValueChange={setStationId}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Estação" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas as estações</SelectItem>
          {(stations ?? []).map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>))}
        </SelectContent>
      </Select>

      {/* Desktop: colunas */}
      <div className="hidden gap-4 overflow-x-auto md:flex">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            orgId={orgId}
            locationId={locationId}
            status={col.status}
            label={col.label}
            nextStatus={col.nextStatus}
            nextLabel={col.nextLabel}
            stationId={resolvedStationId}
          />
        ))}
      </div>

      {/* Mobile: abas por status */}
      <div className="space-y-3 md:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {COLUMNS.map((col) => (
            <button
              key={col.status}
              onClick={() => setMobileStatus(col.status)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${mobileStatus === col.status ? "bg-violet-100 text-violet-700" : "text-black/60"}`}
            >
              {col.label}
            </button>
          ))}
        </div>
        {COLUMNS.filter((c) => c.status === mobileStatus).map((col) => (
          <Column
            key={col.status}
            orgId={orgId}
            locationId={locationId}
            status={col.status}
            label={col.label}
            nextStatus={col.nextStatus}
            nextLabel={col.nextLabel}
            stationId={resolvedStationId}
          />
        ))}
      </div>
    </div>
  );
}
