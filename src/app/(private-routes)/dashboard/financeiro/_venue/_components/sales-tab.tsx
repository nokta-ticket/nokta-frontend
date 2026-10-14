"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTablePagination, DataTableRow, DataTableShell, DataTableToolbar, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput, useDebouncedValue } from "@/components/ui/search-input";
import { RowsSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { VENUE_PAYMENT_METHOD_LABEL, type VenueFinancePeriodParams, type VenuePaymentMethod, type VenuePaymentStatus, type VenueSale } from "@/services/venue-finance";
import { useVenueFinanceSales } from "../_hooks/use-venue-finance-sales";
import { MethodChip, Money, PAYMENT_METHODS, formatDateTimeSP } from "./finance-shared";
import { SaleDetailSheet } from "./sale-detail-sheet";

const LIMIT = 20;

function SaleStatus({ status }: { status: VenuePaymentStatus }) {
  return <StatusBadge tone={status === "CONFIRMED" ? "success" : "neutral"}>{status === "CONFIRMED" ? "Confirmada" : "Cancelada"}</StatusBadge>;
}

/** Vendas (pagamentos) do período com filtros, paginação e detalhe em gaveta. */
export function SalesTab({ orgId, locationId, params, periodLabel }: { orgId: number; locationId: number; params: VenueFinancePeriodParams; periodLabel: string }) {
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState<VenuePaymentMethod | "">("");
  const [status, setStatus] = useState<VenuePaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const debounced = useDebouncedValue(search.trim());

  const query = useVenueFinanceSales(orgId, locationId, {
    ...params,
    method: method || undefined,
    status: status || undefined,
    search: debounced || undefined,
    page,
    limit: LIMIT,
  });
  const rows: VenueSale[] = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / LIMIT));
  const filtered = Boolean(debounced || method || status);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const empty = (
    <EmptyState
      icon="receipt"
      title={filtered ? "Nenhuma venda com esses filtros" : `Nenhuma venda em ${periodLabel.toLowerCase()}`}
      description={filtered ? "Tente limpar a busca ou trocar o método." : "As comandas fechadas na operação aparecem aqui."}
      action={
        filtered ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setMethod("");
              setStatus("");
              setPage(1);
            }}
          >
            Limpar filtros
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-4">
      <DataTableToolbar>
        <div className="flex w-full flex-1 items-center gap-2 sm:max-w-xl">
          <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Comanda, cliente ou referência" className="min-w-0 flex-1" />
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()} className="shrink-0 sm:hidden">
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <NativeSelect aria-label="Método" value={method} onChange={(e) => resetPage(setMethod)(e.target.value as VenuePaymentMethod | "")} className="min-w-0 flex-1 sm:w-44 sm:flex-none">
            <option value="">Método: todos</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {VENUE_PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect aria-label="Status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value as VenuePaymentStatus | "")} className="min-w-0 flex-1 sm:w-40 sm:flex-none">
            <option value="">Status: todos</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="CANCELED">Canceladas</option>
          </NativeSelect>
          <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => query.refetch()} className="hidden shrink-0 sm:inline-flex">
            <Icon name="refresh" size={14} className={cn(query.isFetching && "animate-spin")} />
          </Button>
        </div>
      </DataTableToolbar>

      {query.isError ? (
        <ErrorState description="Não foi possível carregar as vendas." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <RowsSkeleton rows={6} />
      ) : rows.length === 0 ? (
        empty
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Quando</DataTableHeadCell>
                  <DataTableHeadCell>Comanda</DataTableHeadCell>
                  <DataTableHeadCell>Método</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                  <DataTableHeadCell align="right">Bruto</DataTableHeadCell>
                  <DataTableHeadCell align="right">Taxa est.</DataTableHeadCell>
                  <DataTableHeadCell align="right">Líquido</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {rows.map((s, i) => (
                  <DataTableRow key={s.id} index={i} onClick={() => setSelected(s.id)} selected={selected === s.id}>
                    <DataTableCell className="tnum whitespace-nowrap text-muted-foreground">{formatDateTimeSP(s.confirmedAt)}</DataTableCell>
                    <DataTableCell>
                      <span className="block font-medium text-foreground">{s.tab.publicCode}</span>
                      <span className="block text-caption text-muted-foreground">{s.tab.customerName ?? "Sem nome"}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <MethodChip method={s.method} />
                    </DataTableCell>
                    <DataTableCell>
                      <SaleStatus status={s.status} />
                    </DataTableCell>
                    <DataTableCell num className={cn(s.status === "CANCELED" && "text-muted-foreground line-through")}>
                      {formatBRLCents(s.amountCents)}
                    </DataTableCell>
                    <DataTableCell num>{s.financialSnapshot ? <Money cents={-s.financialSnapshot.estimatedFeeCents} tone={s.financialSnapshot.estimatedFeeCents ? "out" : "muted"} /> : <span className="text-subtle-foreground">—</span>}</DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {s.financialSnapshot ? formatBRLCents(s.financialSnapshot.estimatedNetCents) : <span className="font-normal text-subtle-foreground">—</span>}
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
                  onClick={() => setSelected(s.id)}
                  title={`${s.tab.publicCode} · ${s.tab.customerName ?? "Sem nome"}`}
                  subtitle={
                    <span className="inline-flex items-center gap-2">
                      <span className="tnum">{formatDateTimeSP(s.confirmedAt)}</span>
                      <span aria-hidden>·</span>
                      <MethodChip method={s.method} className="text-muted-foreground" />
                    </span>
                  }
                  badge={<SaleStatus status={s.status} />}
                  meta={[
                    { label: "Bruto", value: formatBRLCents(s.amountCents), num: true },
                    { label: "Líquido est.", value: s.financialSnapshot ? formatBRLCents(s.financialSnapshot.estimatedNetCents) : "—", num: true },
                  ]}
                />
              ))}
            </MobileCardList>
          }
          footer={<DataTablePagination page={page} lastPage={lastPage} total={total} perPage={LIMIT} noun="vendas" onPageChange={setPage} />}
        />
      )}

      <SaleDetailSheet orgId={orgId} paymentId={selected} open={selected !== null} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
