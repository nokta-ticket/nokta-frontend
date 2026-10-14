"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectInput } from "@/components/ui/select-input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { getErrorMessage } from "@/lib/axios";
import { toast } from "@/lib/toast";
import type { OrderItemSettableStatus, VenuePreparationItem } from "@/services/venue-operation";
import { useOrderStations } from "../_hooks/use-order-catalog";
import { useVenuePreparationItems, useVenuePreparationMutations } from "../_hooks/use-venue-preparation";
import { minutesSince } from "../_lib/time";

type ColumnKey = "SENT" | "IN_PREPARATION" | "READY" | "DELIVERED";

const COLUMNS: { status: ColumnKey; label: string; tone: Tone; icon: IconName; nextStatus?: OrderItemSettableStatus; nextLabel?: string; nextIcon?: IconName }[] = [
  { status: "SENT", label: "Novos", tone: "brand", icon: "bell", nextStatus: "IN_PREPARATION", nextLabel: "Iniciar preparo", nextIcon: "fire" },
  { status: "IN_PREPARATION", label: "Em preparo", tone: "warning", icon: "fire", nextStatus: "READY", nextLabel: "Marcar pronto", nextIcon: "check" },
  { status: "READY", label: "Prontos", tone: "success", icon: "check-circle", nextStatus: "DELIVERED", nextLabel: "Entregue", nextIcon: "check-double" },
  { status: "DELIVERED", label: "Entregues", tone: "neutral", icon: "check-double" },
];

/** Acima disso o tempo de espera vira alerta (cor de atenção). */
const LATE_MINUTES = 15;

function ItemCard({ item, column, nowMs, index, onAdvance, loading }: { item: VenuePreparationItem; column: (typeof COLUMNS)[number]; nowMs: number; index: number; onAdvance: () => void; loading: boolean }) {
  const minutes = minutesSince(item.createdAt, nowMs);
  const isNew = column.status === "SENT";
  const late = column.status !== "DELIVERED" && minutes >= LATE_MINUTES;
  const place = item.order.tab.table ? item.order.tab.table.nome : `Comanda ${item.order.tab.publicCode}`;
  return (
    <article className={cn("fade-up rounded-card border border-border bg-surface p-3.5 shadow-card", isNew && "pulse-ring [--pulse-size:4px]")} style={{ ["--i" as string]: index } as never}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-caption font-semibold uppercase tracking-[0.06em] text-muted-foreground">{place}</p>
        <span className={cn("inline-flex shrink-0 items-center gap-1 text-caption tnum", late ? "font-semibold text-warning" : "text-subtle-foreground")}>
          <Icon name="clock" size={10} />
          {minutes} min
        </span>
      </div>
      <p className="mt-1.5 text-[15px] font-semibold text-foreground">
        <span className="tnum">{item.quantity}×</span> {item.productNameSnapshot}
      </p>
      {item.variantNameSnapshot ? <p className="text-caption text-muted-foreground">{item.variantNameSnapshot}</p> : null}
      {item.modifiers.length > 0 ? <p className="text-caption text-muted-foreground">{item.modifiers.map((m) => m.optionNameSnapshot).join(", ")}</p> : null}
      {item.notes ? <p className="mt-1 text-caption italic text-foreground">“{item.notes}”</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {item.preparationStation ? <StatusBadge tone="neutral" dot={false}>{item.preparationStation.nome}</StatusBadge> : null}
        <span className="text-micro text-subtle-foreground">Pedido {item.order.publicCode}</span>
      </div>
      {column.nextStatus ? (
        <Button size="full" variant={column.status === "READY" ? "contrast" : "primary"} className="mt-3 h-11" loading={loading} leftIcon={column.nextIcon} onClick={onAdvance}>
          {column.nextLabel}
        </Button>
      ) : null}
    </article>
  );
}

function Column({ orgId, locationId, column, stationId, nowMs, asList }: { orgId: number; locationId: number; column: (typeof COLUMNS)[number]; stationId?: number; nowMs: number; asList?: boolean }) {
  const { data: items, isLoading, isError, refetch } = useVenuePreparationItems(orgId, locationId, { status: column.status, preparationStationId: stationId });
  const { setStatus } = useVenuePreparationMutations(orgId, locationId);
  const list = items ?? [];

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", !asList && "rounded-card border border-border bg-surface-2/60 p-3")}>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon name={column.icon} size={13} className={cn(column.tone === "brand" && "text-brand", column.tone === "warning" && "text-warning", column.tone === "success" && "text-success", column.tone === "neutral" && "text-muted-foreground")} />
          {column.label}
        </h3>
        <StatusBadge tone={column.tone} dot={false}>
          {list.length}
        </StatusBadge>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-28 rounded-card" />
          <Skeleton className="h-28 rounded-card" />
        </div>
      ) : isError ? (
        <ErrorState title="Não deu pra carregar" onRetry={() => refetch()} className="py-6" />
      ) : list.length === 0 ? (
        <EmptyState compact icon={column.icon} title="Nada por aqui" className="border-0 bg-transparent py-6" />
      ) : (
        <div className="space-y-2.5">
          {list.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              column={column}
              nowMs={nowMs}
              index={i}
              loading={setStatus.isPending && setStatus.variables?.itemId === item.id}
              onAdvance={() => {
                if (!column.nextStatus) return;
                setStatus.mutate({ itemId: item.id, payload: { status: column.nextStatus } }, { onError: (err) => toast.error(getErrorMessage(err, "Não foi possível atualizar o status.")) });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PedidosTab({ orgId, locationId }: { orgId: number; locationId: number }) {
  const { data: stations } = useOrderStations(orgId);
  const [stationId, setStationId] = useState("ALL");
  const [mobileStatus, setMobileStatus] = useState<ColumnKey>("SENT");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const resolvedStationId = stationId === "ALL" ? undefined : Number(stationId);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = {
    SENT: useVenuePreparationItems(orgId, locationId, { status: "SENT", preparationStationId: resolvedStationId }).data?.length,
    IN_PREPARATION: useVenuePreparationItems(orgId, locationId, { status: "IN_PREPARATION", preparationStationId: resolvedStationId }).data?.length,
    READY: useVenuePreparationItems(orgId, locationId, { status: "READY", preparationStationId: resolvedStationId }).data?.length,
  };

  const stationOptions = [{ value: "ALL", label: "Todas as estações" }, ...(stations ?? []).filter((s) => s.active).map((s) => ({ value: String(s.id), label: s.nome }))];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Novos" icon="bell" value={counts.SENT ?? null} hint="aguardando a cozinha ou o bar" />
        <StatCard label="Em preparo" icon="fire" value={counts.IN_PREPARATION ?? null} hint="sendo feitos agora" />
        <StatCard label="Prontos" icon="check-circle" value={counts.READY ?? null} hint="esperando entrega na mesa" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SelectInput value={stationId} onValueChange={setStationId} options={stationOptions} className="md:w-64" />
        <SegmentedControl className="md:hidden" fullWidth size="sm" value={mobileStatus} onChange={setMobileStatus} options={COLUMNS.map((c) => ({ value: c.status, label: c.label }))} />
      </div>

      {/* Desktop: Kanban em 4 colunas */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <Column key={col.status} orgId={orgId} locationId={locationId} column={col} stationId={resolvedStationId} nowMs={nowMs} />
        ))}
      </div>

      {/* Celular: um status por vez, lista corrida */}
      <div className="md:hidden">
        {COLUMNS.filter((c) => c.status === mobileStatus).map((col) => (
          <Column key={col.status} orgId={orgId} locationId={locationId} column={col} stationId={resolvedStationId} nowMs={nowMs} asList />
        ))}
      </div>
    </div>
  );
}
