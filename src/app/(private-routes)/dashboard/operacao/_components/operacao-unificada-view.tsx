"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronRight, Clock, Filter, History, MoreVertical, Plus, UtensilsCrossed } from "lucide-react";
import { centsToBRL } from "@/services/venue-menu";
import {
  type VenueTabListItem,
  type VenueTabType,
} from "@/services/venue-operation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVenueTabs } from "../_hooks/use-venue-tabs";
import { useVenueCashRegisters } from "../_hooks/use-venue-cash";
import { CreateTabDialog } from "./create-tab-dialog";
import { TableSessionsSheet } from "./table-sessions-sheet";
import { TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";

/**
 * Tela unificada de Operação — mesa, comanda e balcão juntos, abertos e
 * encerrados hoje, com resumo. Layout portado fielmente de um mockup de
 * referência enviado pelo usuário (cores, cards, tabs de filtro) — a única
 * responsabilidade daqui é conectar isso aos dados reais.
 *
 * Antes desta tela, comandas de balcão (fecham sozinhas assim que quitadas)
 * praticamente "somiam" do dashboard: a aba Comandas antiga abria filtrando
 * status=OPEN por padrão, e balcão nunca fica OPEN por muito tempo. Esta
 * tela sempre mostra os 3 tipos juntos, abertos e fechados, sem exigir troca
 * manual de filtro.
 */

type TypeFilter = "ALL" | VenueTabType;

const TYPE_TABS: { key: TypeFilter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "TABLE", label: "Mesas" },
  { key: "INDIVIDUAL", label: "Comandas" },
  { key: "COUNTER", label: "Balcão" },
];

/** Paleta do mockup — cores de marca por tipo, fora da paleta padrão de status do resto do dashboard (essas são só para esta tela, não redefinem TabStatusBadge). */
const TYPE_STYLE: Record<VenueTabType, { accent: string; soft: string; fg: string }> = {
  TABLE: { accent: "#7C3AED", soft: "#F1ECFB", fg: "#6D28D9" },
  INDIVIDUAL: { accent: "#F97316", soft: "#FFEDD5", fg: "#EA580C" },
  COUNTER: { accent: "#22C55E", soft: "#DCFCE7", fg: "#15803D" },
};

function TypeIcon({ type, size = 20 }: { type: VenueTabType; size?: number }) {
  if (type === "TABLE") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h18M5 8l1.5 12M19 8l-1.5 12M9 8v12M15 8v12" />
      </svg>
    );
  }
  if (type === "INDIVIDUAL") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
    </svg>
  );
}

function tabTitle(tab: VenueTabListItem): string {
  if (tab.type === "TABLE") return tab.table ? `Mesa ${tab.table.nome}` : "Mesa";
  if (tab.type === "COUNTER") return "Balcão";
  return `Comanda #${tab.publicCode}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function TabRow({
  tab,
  onClick,
  onViewTableHistory,
}: {
  tab: VenueTabListItem;
  onClick: () => void;
  /** Só chamado para tab.type === "TABLE" — ver botão de histórico abaixo. */
  onViewTableHistory?: (tableId: number, tableName: string) => void;
}) {
  const style = TYPE_STYLE[tab.type];
  const isOpen = tab.status === "OPEN" || tab.status === "CLOSING" || tab.status === "PAYMENT_IN_PROGRESS";
  const orderCount = tab._count.orders;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="relative flex cursor-pointer items-center border-t border-[#F1EFF5] px-[18px] py-4 pl-5 transition-colors first:border-t-0 hover:bg-[#FCFBFE]"
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: style.accent }} />

      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px]"
        style={{ background: style.soft, color: style.fg }}
      >
        <TypeIcon type={tab.type} />
      </div>

      <div className="ml-3.5 min-w-0 flex-1">
        <div className="text-[15px] font-semibold tracking-[-0.2px] text-[#1B1533]">{tabTitle(tab)}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#6E7180]">
          <Clock size={13} className="flex-none text-[#9B99A8]" />
          {isOpen ? "Aberta" : tab.status === "CLOSED" ? "Encerrada" : "Cancelada"} às {formatTime(tab.status === "CLOSED" && tab.closedAt ? tab.closedAt : tab.openedAt)}
        </div>
      </div>

      <div className="hidden w-[180px] flex-none sm:block">
        <strong className="block text-[13px] font-semibold text-[#1B1533]">
          {orderCount === 1 ? "1 pedido" : `${orderCount} pedidos`}
        </strong>
        {tab.customerName ? <span className="mt-1 block truncate text-[12.5px] text-[#6E7180]">{tab.customerName}</span> : null}
      </div>

      <div className="w-[110px] flex-none text-right sm:w-[150px]">
        <div className="text-[15px] font-bold tracking-[-0.2px] text-[#1B1533]">{centsToBRL(tab.totalCents)}</div>
        <span
          className="mt-1.5 inline-block rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
          style={
            tab.status === "CLOSED"
              ? { background: "#E9F9EF", color: "#15803D" }
              : { background: style.soft, color: style.fg }
          }
        >
          {tab.status === "CLOSED" ? "Pago" : tab.type === "TABLE" ? "Mesa" : tab.type === "INDIVIDUAL" ? "Comanda" : "Balcão"}
        </span>
      </div>

      {tab.type === "TABLE" && tab.tableId !== null && onViewTableHistory ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="ml-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#9B99A8] hover:bg-black/[0.04] hover:text-[#1B1533]"
              aria-label="Mais opções"
            >
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onViewTableHistory(tab.tableId as number, tab.table?.nome ?? "")}>
              <History size={14} /> Histórico da mesa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <ChevronRight size={18} className="ml-2 flex-none text-[#9B99A8]" />
    </div>
  );
}

export function OperacaoUnificadaView({
  orgId,
  locationId,
  onOpenTabDetail,
}: {
  orgId: number;
  locationId: number;
  onOpenTabDetail: (tabId: number) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [createTabOpen, setCreateTabOpen] = useState(false);
  const [historyTable, setHistoryTable] = useState<{ id: number; nome: string } | null>(null);

  const { data: registers } = useVenueCashRegisters(orgId, locationId);
  const anyCashOpen = (registers ?? []).some((r) => r.openSession !== null);
  const hasCashRegisters = (registers ?? []).length > 0;

  const {
    data: openTabs,
    isLoading: loadingOpen,
    isError: errorOpen,
    refetch: refetchOpen,
  } = useVenueTabs(orgId, locationId, { status: "OPEN,CLOSING,PAYMENT_IN_PROGRESS" });

  const {
    data: closedToday,
    isLoading: loadingClosed,
    isError: errorClosed,
    refetch: refetchClosed,
  } = useVenueTabs(orgId, locationId, { status: "CLOSED", closedAtFrom: startOfTodayIso() });

  const openList = useMemo(() => openTabs ?? [], [openTabs]);
  const closedList = useMemo(() => closedToday ?? [], [closedToday]);

  const filteredOpen = typeFilter === "ALL" ? openList : openList.filter((t) => t.type === typeFilter);

  const counts = {
    ALL: openList.length,
    TABLE: openList.filter((t) => t.type === "TABLE").length,
    INDIVIDUAL: openList.filter((t) => t.type === "INDIVIDUAL").length,
    COUNTER: openList.filter((t) => t.type === "COUNTER").length,
  };

  const mesasStat = { count: counts.TABLE, total: openList.filter((t) => t.type === "TABLE").reduce((s, t) => s + t.totalCents, 0) };
  const comandasStat = {
    count: counts.INDIVIDUAL + counts.COUNTER,
    total: openList.filter((t) => t.type === "INDIVIDUAL" || t.type === "COUNTER").reduce((s, t) => s + t.totalCents, 0),
  };
  const closedStat = { count: closedList.length, total: closedList.reduce((s, t) => s + t.totalCents, 0) };

  const isLoading = loadingOpen || loadingClosed;
  const isError = errorOpen || errorClosed;

  if (isError) {
    return (
      <ErrorState
        description="Não foi possível carregar a operação."
        onRetry={() => {
          refetchOpen();
          refetchClosed();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-[18px] flex items-center gap-3">
        <div className="ml-auto flex items-center gap-3">
          {hasCashRegisters ? (
            <span
              className="inline-flex h-[38px] items-center gap-2 rounded-[9px] px-3.5 text-[13.5px] font-medium whitespace-nowrap"
              style={anyCashOpen ? { background: "#E9F9EF", color: "#166534" } : { background: "#F1F0F5", color: "#6E7180" }}
            >
              <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: anyCashOpen ? "#22C55E" : "#9B99A8" }} />
              {anyCashOpen ? "Caixa aberto" : "Caixa fechado"}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => setCreateTabOpen(true)}
            className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#6D28D9] px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#5B21B6]"
          >
            <Plus size={16} />
            Nova venda
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-[22px] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#ECEAF1] bg-white px-2 pt-1.5">
          {TYPE_TABS.map((t) => {
            const active = typeFilter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTypeFilter(t.key)}
                className={`flex items-center gap-2 border-b-2 px-3.5 pt-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "border-[#7C3AED] font-semibold text-[#1B1533]" : "border-transparent text-[#6E7180] hover:text-[#1B1533]"
                }`}
              >
                {t.label}
                <span
                  className="rounded-[6px] px-[7px] py-0.5 text-[11.5px] font-semibold"
                  style={active ? { background: "#F1ECFB", color: "#6D28D9" } : { background: "#F1F0F5", color: "#6E7180" }}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex gap-2.5">
          <button
            type="button"
            className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#ECEAF1] bg-white px-4 text-[13.5px] font-medium text-[#1B1533] transition-colors hover:border-[#DDD9E6] hover:bg-[#FDFDFE]"
          >
            <Filter size={16} className="text-[#6E7180]" />
            Filtros
          </button>
          <button
            type="button"
            className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#ECEAF1] bg-white px-4 text-[13.5px] font-medium text-[#1B1533] transition-colors hover:border-[#DDD9E6] hover:bg-[#FDFDFE]"
          >
            <ArrowUpDown size={16} className="text-[#6E7180]" />
            Mais recentes
          </button>
        </div>
      </div>

      {/* Em aberto */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-[-0.2px] text-[#1B1533]">Em aberto</span>
        <span className="rounded-[7px] bg-[#F1ECFB] px-2.5 py-1 text-[11.5px] font-semibold text-[#6D28D9]">
          {filteredOpen.length === 1 ? "1 atendimento" : `${filteredOpen.length} atendimentos`}
        </span>
      </div>

      <div className="mb-[26px] overflow-hidden rounded-xl border border-[#ECEAF1] bg-white">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : filteredOpen.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <UtensilsCrossed size={28} className="text-black/20" />
            <p className="text-sm text-black/50">Nenhum atendimento aberto no momento.</p>
          </div>
        ) : (
          filteredOpen.map((tab) => <TabRow
              key={tab.id}
              tab={tab}
              onClick={() => onOpenTabDetail(tab.id)}
              onViewTableHistory={(tableId, tableName) => setHistoryTable({ id: tableId, nome: tableName })}
            />)
        )}
      </div>

      {/* Cards de resumo */}
      <div className="mb-[26px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="flex items-start gap-3.5 rounded-xl border border-[#ECEAF1] bg-white p-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px]" style={{ background: "#F1ECFB", color: "#6D28D9" }}>
            <TypeIcon type="TABLE" />
          </div>
          <div>
            <div className="text-[12.5px] text-[#6E7180]">Mesas abertas</div>
            <div className="mt-1 text-[22px] font-bold tracking-[-0.5px]">{mesasStat.count}</div>
            <div className="mt-1 text-[12.5px] text-[#6E7180]">{centsToBRL(mesasStat.total)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-[#ECEAF1] bg-white p-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px]" style={{ background: "#FFEDD5", color: "#EA580C" }}>
            <TypeIcon type="INDIVIDUAL" />
          </div>
          <div>
            <div className="text-[12.5px] text-[#6E7180]">Comandas abertas</div>
            <div className="mt-1 text-[22px] font-bold tracking-[-0.5px]">{comandasStat.count}</div>
            <div className="mt-1 text-[12.5px] text-[#6E7180]">{centsToBRL(comandasStat.total)}</div>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-xl border border-[#ECEAF1] bg-white p-4">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px]" style={{ background: "#DCFCE7", color: "#15803D" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <div className="text-[12.5px] text-[#6E7180]">Encerrados hoje</div>
            <div className="mt-1 text-[22px] font-bold tracking-[-0.5px]">{closedStat.count}</div>
            <div className="mt-1 text-[12.5px] text-[#6E7180]">{centsToBRL(closedStat.total)}</div>
          </div>
        </div>
      </div>

      {/* Encerrados hoje */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-[-0.2px] text-[#1B1533]">Encerrados hoje</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#ECEAF1] bg-white">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : closedList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <UtensilsCrossed size={28} className="text-black/20" />
            <p className="text-sm text-black/50">Nenhum atendimento encerrado ainda hoje.</p>
          </div>
        ) : (
          closedList.map((tab) => <TabRow
              key={tab.id}
              tab={tab}
              onClick={() => onOpenTabDetail(tab.id)}
              onViewTableHistory={(tableId, tableName) => setHistoryTable({ id: tableId, nome: tableName })}
            />)
        )}
      </div>

      <CreateTabDialog
        orgId={orgId}
        locationId={locationId}
        open={createTabOpen}
        onOpenChange={setCreateTabOpen}
        onCreated={(tab) => onOpenTabDetail(tab.id)}
      />

      {historyTable !== null ? (
        <TableSessionsSheet
          orgId={orgId}
          tableId={historyTable.id}
          tableName={historyTable.nome}
          open={historyTable !== null}
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
