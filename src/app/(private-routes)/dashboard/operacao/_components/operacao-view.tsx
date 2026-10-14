"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableEmpty, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import { SectionHeader } from "@/components/ui/section-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { VENUE_TAB_TYPE_LABEL, type VenueTabListItem, type VenueTabType, type VenueTable } from "@/services/venue-operation";
import { useVenueAreas, useVenueTables } from "../_hooks/use-venue-areas-tables";
import { useVenueCashRegisters } from "../_hooks/use-venue-cash";
import { useVenueTabs } from "../_hooks/use-venue-tabs";
import { formatClock, formatElapsed, startOfTodayIso } from "../_lib/time";
import { CreateTabDialog } from "./create-tab-dialog";
import { TabStatusBadge, TableStateBadge } from "./op-status-badge";
import { TableSessionsSheet } from "./table-sessions-sheet";

/**
 * Tela única de Operação — mesas (grade por área), comandas individuais e
 * balcão em aberto, e tudo que encerrou hoje. Comandas de balcão fecham
 * sozinhas assim que quitadas, então a lista de encerradas é a única forma
 * de "vê-las" depois — por isso ela fica sempre à vista, sem filtro manual.
 */
type TypeFilter = "ALL" | VenueTabType;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "Tudo" },
  { value: "TABLE", label: "Mesas" },
  { value: "INDIVIDUAL", label: "Comandas" },
  { value: "COUNTER", label: "Balcão" },
];

function tabLabel(tab: VenueTabListItem): string {
  if (tab.type === "TABLE") return tab.table?.nome ?? "Mesa";
  if (tab.type === "COUNTER") return `Balcão ${tab.publicCode}`;
  return `Comanda ${tab.publicCode}`;
}

function TableCard({ table, nowMs, index, onOpen, onHistory }: { table: VenueTable; nowMs: number; index: number; onOpen: () => void; onHistory: () => void }) {
  const open = table.openTab;
  const status = open ? (open.remainingCents < open.totalCents && open.remainingCents > 0 ? "PAYMENT_IN_PROGRESS" : "OPEN") : null;
  return (
    <div className={cn("card-hover fade-up relative flex flex-col rounded-card border bg-surface p-4 shadow-card", open ? "border-border" : "border-border/60")} style={{ ["--i" as string]: index } as never}>
      <button type="button" onClick={onOpen} className="press flex flex-1 flex-col text-left outline-none" aria-label={open ? `Abrir ${table.nome}` : `Abrir comanda na ${table.nome}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-semibold text-foreground">{table.nome}</p>
          {table.capacidade ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption text-subtle-foreground tnum">
              <Icon name="chair" size={11} />
              {table.capacidade}
            </span>
          ) : null}
        </div>
        <div className="mt-2.5">
          <TableStateBadge status={status} />
        </div>
        {open ? (
          <div className="mt-3 w-full space-y-0.5 pr-8">
            <p className="text-lg font-semibold text-foreground tnum">{formatBRLCents(open.totalCents)}</p>
            <p className="truncate text-caption text-muted-foreground">
              {open.customerName ? `${open.customerName} · ` : ""}
              <span className="tnum">{formatElapsed(open.openedAt, nowMs)}</span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-caption text-subtle-foreground">Toque pra abrir</p>
        )}
      </button>
      <Button variant="subtle" size="icon-sm" aria-label={`Histórico da ${table.nome}`} className="absolute bottom-2.5 right-2.5 size-8" onClick={onHistory}>
        <Icon name="history" size={12} />
      </Button>
    </div>
  );
}

function TabsTable({ tabs, closed, onOpen }: { tabs: VenueTabListItem[]; closed?: boolean; onOpen: (id: number) => void }) {
  const empty = closed ? <DataTableEmpty colSpan={6} icon="check-double" title="Nada encerrado ainda hoje" description="As comandas fechadas e as vendas de balcão aparecem aqui." /> : <DataTableEmpty colSpan={6} icon="clipboard-list" title="Nenhuma comanda em aberto" description="Abra uma comanda individual ou uma venda de balcão." />;
  return (
    <DataTableShell
      maxHeight="none"
      table={
        <DataTable>
          <DataTableHead>
            <tr>
              <DataTableHeadCell>{closed ? "Encerrada" : "Aberta"}</DataTableHeadCell>
              <DataTableHeadCell>Comanda</DataTableHeadCell>
              <DataTableHeadCell>Cliente</DataTableHeadCell>
              <DataTableHeadCell align="right">Pedidos</DataTableHeadCell>
              <DataTableHeadCell align="right">Total</DataTableHeadCell>
              <DataTableHeadCell>Status</DataTableHeadCell>
            </tr>
          </DataTableHead>
          <DataTableBody>
            {tabs.length === 0
              ? empty
              : tabs.map((tab, i) => (
                  <DataTableRow key={tab.id} index={i} onClick={() => onOpen(tab.id)}>
                    <DataTableCell className="tnum text-muted-foreground">{formatClock(closed ? (tab.closedAt ?? tab.canceledAt ?? tab.openedAt) : tab.openedAt)}</DataTableCell>
                    <DataTableCell>
                      <span className="font-semibold">{tabLabel(tab)}</span>
                      <span className="ml-2 text-caption text-subtle-foreground">{VENUE_TAB_TYPE_LABEL[tab.type]}</span>
                    </DataTableCell>
                    <DataTableCell className={cn(!tab.customerName && "text-subtle-foreground")}>{tab.customerName ?? "Não informado"}</DataTableCell>
                    <DataTableCell num>{tab._count.orders}</DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {formatBRLCents(tab.totalCents)}
                    </DataTableCell>
                    <DataTableCell>{tab.postCloseCanceledAt ? <StatusBadge tone="danger">Venda cancelada</StatusBadge> : closed && tab.status === "CLOSED" ? <StatusBadge tone="success">Paga</StatusBadge> : <TabStatusBadge status={tab.status} />}</DataTableCell>
                  </DataTableRow>
                ))}
          </DataTableBody>
        </DataTable>
      }
      mobile={
        tabs.length === 0 ? (
          <EmptyState compact icon={closed ? "check-double" : "clipboard-list"} title={closed ? "Nada encerrado ainda hoje" : "Nenhuma comanda em aberto"} />
        ) : (
          <MobileCardList>
            {tabs.map((tab, i) => (
              <MobileCard
                key={tab.id}
                index={i}
                onClick={() => onOpen(tab.id)}
                title={tabLabel(tab)}
                subtitle={`${VENUE_TAB_TYPE_LABEL[tab.type]} · ${formatClock(closed ? (tab.closedAt ?? tab.canceledAt ?? tab.openedAt) : tab.openedAt)}${tab.customerName ? ` · ${tab.customerName}` : ""}`}
                badge={tab.postCloseCanceledAt ? <StatusBadge tone="danger">Cancelada</StatusBadge> : closed && tab.status === "CLOSED" ? <StatusBadge tone="success">Paga</StatusBadge> : <TabStatusBadge status={tab.status} />}
                meta={[
                  { label: "Pedidos", value: tab._count.orders, num: true },
                  { label: "Total", value: formatBRLCents(tab.totalCents), num: true },
                ]}
              />
            ))}
          </MobileCardList>
        )
      }
    />
  );
}

export function OperacaoView({ orgId, locationId, onOpenTabDetail, nowMs }: { orgId: number; locationId: number; onOpenTabDetail: (tabId: number) => void; nowMs: number }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [areaFilter, setAreaFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [createTab, setCreateTab] = useState<{ open: boolean; table?: VenueTable }>({ open: false });
  const [historyTable, setHistoryTable] = useState<{ id: number; nome: string } | null>(null);

  const { data: registers } = useVenueCashRegisters(orgId, locationId);
  const anyCashOpen = (registers ?? []).some((r) => r.openSession !== null);
  const hasCashRegisters = (registers ?? []).length > 0;

  const { data: tables, isLoading: loadingTables, isError: errorTables, refetch: refetchTables } = useVenueTables(orgId, locationId);
  const { data: areas } = useVenueAreas(orgId, locationId);
  const { data: openTabs, isLoading: loadingOpen, isError: errorOpen, refetch: refetchOpen, isFetching: fetchingOpen } = useVenueTabs(orgId, locationId, { status: "OPEN,CLOSING,PAYMENT_IN_PROGRESS" });
  const { data: closedToday, isLoading: loadingClosed, isError: errorClosed, refetch: refetchClosed, isFetching: fetchingClosed } = useVenueTabs(orgId, locationId, { status: "CLOSED", closedAtFrom: startOfTodayIso() });

  const q = search.trim().toLowerCase();
  const matches = (text: string) => !q || text.toLowerCase().includes(q);

  const openList = useMemo(() => openTabs ?? [], [openTabs]);
  const closedList = useMemo(() => closedToday ?? [], [closedToday]);
  const activeTables = useMemo(() => (tables ?? []).filter((t) => t.active), [tables]);

  const visibleTables = activeTables.filter((t) => (areaFilter === "ALL" || t.areaId === Number(areaFilter)) && matches(`${t.nome} ${t.openTab?.customerName ?? ""} ${t.openTab?.publicCode ?? ""}`));
  const openOthers = openList.filter((t) => t.type !== "TABLE" && (typeFilter === "ALL" || t.type === typeFilter) && matches(`${t.publicCode} ${t.customerName ?? ""}`));
  const closedVisible = closedList.filter((t) => (typeFilter === "ALL" || t.type === typeFilter) && matches(`${t.publicCode} ${t.customerName ?? ""} ${t.table?.nome ?? ""}`));

  const occupied = activeTables.filter((t) => t.openTab);
  const tablesStat = { count: occupied.length, total: occupied.reduce((s, t) => s + (t.openTab?.totalCents ?? 0), 0) };
  const othersOpen = openList.filter((t) => t.type !== "TABLE");
  const othersStat = { count: othersOpen.length, total: othersOpen.reduce((s, t) => s + t.totalCents, 0) };
  const closedStat = { count: closedList.length, total: closedList.filter((t) => !t.postCloseCanceledAt).reduce((s, t) => s + t.totalCents, 0) };

  const showTables = typeFilter === "ALL" || typeFilter === "TABLE";
  const showOthers = typeFilter !== "TABLE";
  const isLoading = loadingOpen || loadingClosed;
  const isFetching = fetchingOpen || fetchingClosed;

  if (errorOpen || errorClosed || errorTables) {
    return (
      <ErrorState
        title="Não deu pra carregar a operação"
        onRetry={() => {
          refetchOpen();
          refetchClosed();
          refetchTables();
        }}
      />
    );
  }

  const areaOptions = [{ value: "ALL", label: "Todas as áreas" }, ...(areas ?? []).filter((a) => a.active).map((a) => ({ value: String(a.id), label: a.nome }))];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Mesas ocupadas" icon="chair" value={isLoading ? null : tablesStat.count} hint={`de ${activeTables.length} ${activeTables.length === 1 ? "mesa" : "mesas"} · ${formatBRLCents(tablesStat.total)} em aberto`} />
        <StatCard label="Comandas e balcão" icon="clipboard-list" value={isLoading ? null : othersStat.count} hint={`${formatBRLCents(othersStat.total)} em aberto`} />
        <StatCard label="Encerradas hoje" icon="check-double" value={isLoading ? null : closedStat.count} hint={`${formatBRLCents(closedStat.total)} faturados`} />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Mesa, comanda ou cliente…" className="flex-1 md:max-w-xl" />
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} size="sm" />
          {hasCashRegisters ? (
            <StatusBadge tone={anyCashOpen ? "success" : "neutral"} pulse={anyCashOpen}>
              {anyCashOpen ? "Caixa aberto" : "Caixa fechado"}
            </StatusBadge>
          ) : null}
          <Button
            variant="subtle"
            size="icon-sm"
            aria-label="Atualizar"
            onClick={() => {
              refetchOpen();
              refetchClosed();
              refetchTables();
            }}
          >
            <Icon name="refresh" size={13} className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {showTables ? (
        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <SectionHeader title="Mesas" />
            {areaOptions.length > 2 ? (
              <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <SegmentedControl value={areaFilter} onChange={setAreaFilter} options={areaOptions} size="sm" />
              </div>
            ) : null}
          </div>
          {loadingTables ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-card" />
              ))}
            </div>
          ) : activeTables.length === 0 ? (
            <EmptyState icon="chair" title="Nenhuma mesa cadastrada" description="Cadastre áreas e mesas na configuração do estabelecimento pra ver o salão aqui." />
          ) : visibleTables.length === 0 ? (
            <EmptyState compact icon="search" title="Nenhuma mesa encontrada" description="Tenta outra busca ou outra área." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleTables.map((table, i) => (
                <TableCard key={table.id} table={table} nowMs={nowMs} index={i} onOpen={() => (table.openTab ? onOpenTabDetail(table.openTab.id) : setCreateTab({ open: true, table }))} onHistory={() => setHistoryTable({ id: table.id, nome: table.nome })} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {showOthers ? (
        <section className="space-y-3">
          <SectionHeader title={typeFilter === "COUNTER" ? "Balcão em aberto" : typeFilter === "INDIVIDUAL" ? "Comandas em aberto" : "Comandas e balcão em aberto"} action={<span className="text-caption text-muted-foreground tnum">{openOthers.length === 1 ? "1 atendimento" : `${openOthers.length} atendimentos`}</span>} />
          {loadingOpen ? <Skeleton className="h-40 rounded-card" /> : <TabsTable tabs={openOthers} onOpen={onOpenTabDetail} />}
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="Encerradas hoje" action={<span className="text-caption text-muted-foreground tnum">{closedVisible.length === 1 ? "1 atendimento" : `${closedVisible.length} atendimentos`}</span>} />
        {loadingClosed ? <Skeleton className="h-40 rounded-card" /> : <TabsTable tabs={closedVisible} closed onOpen={onOpenTabDetail} />}
      </section>

      <CreateTabDialog orgId={orgId} locationId={locationId} open={createTab.open} onOpenChange={(v) => setCreateTab((s) => ({ ...s, open: v }))} presetTableId={createTab.table?.id} presetTableName={createTab.table?.nome} onCreated={(tab) => onOpenTabDetail(tab.id)} />

      {historyTable !== null ? (
        <TableSessionsSheet
          orgId={orgId}
          tableId={historyTable.id}
          tableName={historyTable.nome}
          open
          onOpenChange={(v) => !v && setHistoryTable(null)}
          onOpenSession={(tabId) => {
            setHistoryTable(null);
            onOpenTabDetail(tabId);
          }}
        />
      ) : null}
    </div>
  );
}
