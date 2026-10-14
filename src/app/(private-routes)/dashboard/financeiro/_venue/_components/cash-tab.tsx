"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import type { VenueCashSessionReportQueryParams } from "@/services/venue-finance";
import { useVenueFinanceCashSessions } from "../_hooks/use-venue-finance-cash-reports";
import { CashDifference, Money, formatDateTimeSP, formatTimeSP, type CashSessionRow } from "./finance-shared";

type Filter = "all" | "divergent";

function SessionStatus({ status }: { status: CashSessionRow["status"] }) {
  return (
    <StatusBadge tone={status === "OPEN" ? "warning" : "neutral"} pulse={status === "OPEN"}>
      {status === "OPEN" ? "Aberto" : "Fechado"}
    </StatusBadge>
  );
}

/** Fechamentos de caixa do período: esperado, contado e diferença. */
export function CashTab({ orgId, locationId, sessionRange, periodLabel, onOpenSession }: { orgId: number; locationId: number; sessionRange: VenueCashSessionReportQueryParams; periodLabel: string; onOpenSession: (id: number) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const query = useVenueFinanceCashSessions(orgId, locationId, sessionRange);
  const all = (query.data ?? []) as CashSessionRow[];
  const rows = filter === "divergent" ? all.filter((s) => s.status === "CLOSED" && (s.differenceCents ?? 0) !== 0) : all;
  const closed = all.filter((s) => s.status === "CLOSED");
  const totalDiff = closed.reduce((s, x) => s + (x.differenceCents ?? 0), 0);
  const divergentCount = closed.filter((s) => (s.differenceCents ?? 0) !== 0).length;

  return (
    <div className="space-y-4">
      <DataTableToolbar className="justify-between">
        <SegmentedControl size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "Todos" }, { value: "divergent", label: "Só divergentes" }]} />
        {closed.length > 0 ? (
          <p className="text-caption text-muted-foreground">
            {closed.length} {closed.length === 1 ? "fechamento" : "fechamentos"} · {divergentCount} {divergentCount === 1 ? "divergente" : "divergentes"} · saldo{" "}
            <Money cents={totalDiff} tone={totalDiff === 0 ? "muted" : "auto"} signed strong />
          </p>
        ) : null}
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState description="Não foi possível carregar os fechamentos." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon="wallet" title={filter === "divergent" ? "Nenhum caixa divergente" : `Nenhum caixa em ${periodLabel.toLowerCase()}`} description={filter === "divergent" ? "Todos os fechamentos do período bateram." : "Quando um caixa for aberto na operação, o fechamento aparece aqui."} />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Caixa</DataTableHeadCell>
                  <DataTableHeadCell>Turno</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Esperado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Contado</DataTableHeadCell>
                  <DataTableHeadCell align="right">Diferença</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((s, i) => (
                  <DataTableRow key={s.id} index={i} onClick={() => onOpenSession(s.id)}>
                    <DataTableCell>
                      <span className="flex items-center gap-3">
                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2", s.status === "OPEN" ? "text-warning" : "text-muted-foreground")}>
                          <Icon name="wallet" size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{s.cashRegister.nome}</span>
                          <span className="block text-caption text-muted-foreground">{s.operatorName ?? "Operador não informado"}</span>
                        </span>
                      </span>
                    </DataTableCell>
                    <DataTableCell className="tnum whitespace-nowrap text-muted-foreground">
                      {formatDateTimeSP(s.openedAt)}
                      {s.closedAt ? ` às ${formatTimeSP(s.closedAt)}` : ""}
                    </DataTableCell>
                    <DataTableCell>
                      <SessionStatus status={s.status} />
                    </DataTableCell>
                    <DataTableCell num>{formatBRLCents(s.expectedCashCents)}</DataTableCell>
                    <DataTableCell num>{s.countedCashCents === null ? <span className="font-normal text-subtle-foreground">Não contado</span> : formatBRLCents(s.countedCashCents)}</DataTableCell>
                    <DataTableCell num>
                      <CashDifference cents={s.differenceCents} open={s.status === "OPEN"} />
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {rows.map((s, i) => (
                <MobileCard
                  key={s.id}
                  index={i}
                  onClick={() => onOpenSession(s.id)}
                  title={s.cashRegister.nome}
                  subtitle={`${s.operatorName ?? "Operador não informado"} · ${formatDateTimeSP(s.openedAt)}${s.closedAt ? ` às ${formatTimeSP(s.closedAt)}` : ""}`}
                  badge={<SessionStatus status={s.status} />}
                  meta={[
                    { label: "Esperado", value: formatBRLCents(s.expectedCashCents), num: true },
                    { label: "Contado", value: s.countedCashCents === null ? "Não contado" : formatBRLCents(s.countedCashCents), num: true },
                    { label: "Diferença", value: <CashDifference cents={s.differenceCents} open={s.status === "OPEN"} />, num: true },
                  ]}
                />
              ))}
            </MobileCardList>
          }
        />
      )}
    </div>
  );
}
