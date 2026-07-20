"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { centsToBRL } from "@/services/venue-menu";
import { VENUE_TAB_TYPE_LABEL } from "@/services/venue-operation";
import { useVenueTabs } from "../_hooks/use-venue-tabs";
import { useDebounce } from "../../cardapio/_hooks/use-debounce";
import { TabStatusBadge } from "./op-status-badge";
import { EmptyState } from "../../_components/states/empty-state";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function ComandasTab({
  orgId,
  locationId,
  onOpenTabDetail,
}: {
  orgId: number;
  locationId: number;
  onOpenTabDetail: (tabId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState("OPEN");

  const { data: tabs, isLoading, isError, refetch } = useVenueTabs(orgId, locationId, {
    status: status === "ALL" ? undefined : status,
    search: debouncedSearch || undefined,
  });

  const list = tabs ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-black/40" size={16} />
          <Input className="pl-9" placeholder="Buscar por código ou cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Abertas</SelectItem>
            <SelectItem value="CLOSED">Fechadas</SelectItem>
            <SelectItem value="CANCELED">Canceladas</SelectItem>
            <SelectItem value="ALL">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as comandas." onRetry={() => refetch()} />
      ) : isLoading ? (
        <TableSkeleton />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhuma comanda encontrada" description="Abra uma comanda na aba Mesas para começar a operar." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onOpenTabDetail(tab.id)}
              className="rounded-xl border border-black/10 bg-white p-3 text-left hover:border-violet-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{tab.publicCode}</span>
                <TabStatusBadge status={tab.status} />
              </div>
              <p className="mt-1 text-xs text-black/50">
                {VENUE_TAB_TYPE_LABEL[tab.type]}
                {tab.table ? ` · ${tab.table.nome}` : ""}
                {tab.customerName ? ` · ${tab.customerName}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-black/50">{tab._count.orders} pedido(s) · {minutesSince(tab.openedAt)} min</span>
                <span className="font-semibold text-gray-900">{centsToBRL(tab.totalCents)}</span>
              </div>
              {tab.status === "OPEN" && tab.remainingCents > 0 ? (
                <p className="mt-1 text-xs text-amber-600">Restante: {centsToBRL(tab.remainingCents)}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
