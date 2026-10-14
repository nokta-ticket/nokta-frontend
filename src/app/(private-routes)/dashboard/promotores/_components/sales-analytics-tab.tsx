"use client";

import { useState } from "react";
import { COMMISSION_STATUS_LABEL, formatCents, promotersApi } from "@/services/promoters";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeadCell, DataTableRow, DataTableShell, MobileCard, MobileCardList } from "@/components/ui/data-table";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { usePromoterAnalytics, usePromoterOrganizationEvents, usePromoterSales } from "../_hooks/use-promoters";
import { COMMISSION_TONE, fmtDate } from "./promoter-meta";

export function SalesAnalyticsTab({ orgId, canExport }: { orgId: number; canExport: boolean }) {
  const { data: events } = usePromoterOrganizationEvents(orgId);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: metrics, isLoading: loadingMetrics } = usePromoterAnalytics(orgId, eventId);
  const { data: sales, isLoading: loadingSales, isError, refetch } = usePromoterSales(orgId, eventId);

  const download = (kind: "sales" | "commissions") => {
    window.open(promotersApi.csvUrl(orgId, kind), "_blank");
  };

  const cents = (v?: number) => (v === undefined ? undefined : v / 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <NativeSelect aria-label="Filtrar por evento" value={eventId ?? "all"} onChange={(e) => setEventId(e.target.value === "all" ? undefined : Number(e.target.value))} className="sm:w-72">
          <option value="all">Todos os eventos</option>
          {(events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </NativeSelect>
        {canExport ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon="download" onClick={() => download("sales")}>
              Vendas (CSV)
            </Button>
            <Button variant="outline" size="sm" leftIcon="download" onClick={() => download("commissions")}>
              Comissões (CSV)
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Cliques únicos" icon="link" value={metrics?.cliquesUnicosEstimados} loading={loadingMetrics} hint={metrics ? `${metrics.cliquesBrutos.toLocaleString("pt-BR")} cliques no total` : undefined} />
        <StatCard label="Pedidos pagos" icon="receipt" value={metrics?.pedidosPagos} loading={loadingMetrics} hint={metrics ? `Conversão ${(metrics.taxaConversaoAtribuicaoParaPagamento * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : undefined} />
        <StatCard label="Valor líquido vendido" icon="sack-dollar" format="currency" value={cents(metrics?.netNominalCentsAfterDiscount)} loading={loadingMetrics} hint={metrics ? `${formatCents(metrics.discountAppliedCents)} em descontos` : undefined} />
        <StatCard label="Saldo líquido" icon="scale" format="currency" value={cents(metrics?.netBalanceCents)} loading={loadingMetrics} hint="Disponível + acertado + ajustes" />
        <StatCard label="Comissão pendente" icon="clock" format="currency" value={cents(metrics?.commissionPendingCents)} loading={loadingMetrics} hint="Pode reverter se a venda cancelar" />
        <StatCard label="Comissão disponível" icon="hand-dollar" format="currency" value={cents(metrics?.commissionAvailableCents)} loading={loadingMetrics} hint="Pronta pra entrar num acerto" />
        <StatCard label="Comissão acertada" icon="check-circle" format="currency" value={cents(metrics?.commissionSettledCents)} loading={loadingMetrics} />
        <StatCard label="Ajustes" icon="undo" format="currency" value={cents(metrics?.commissionAdjustmentCents)} loading={loadingMetrics} hint="Estornos e contestações pós-acerto" />
      </div>

      {isError ? (
        <ErrorState description="Não foi possível carregar as vendas atribuídas." onRetry={() => refetch()} />
      ) : loadingSales ? (
        <Skeleton className="h-64 rounded-card" />
      ) : !sales || sales.length === 0 ? (
        <EmptyState icon="cart" title="Nenhuma venda atribuída ainda" description="Vendas feitas pelo link ou código de um promoter aparecem aqui." />
      ) : (
        <DataTableShell
          table={
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Data</DataTableHeadCell>
                  <DataTableHeadCell>Evento</DataTableHeadCell>
                  <DataTableHeadCell>Promoter</DataTableHeadCell>
                  <DataTableHeadCell>Canal</DataTableHeadCell>
                  <DataTableHeadCell align="right">Valor líquido</DataTableHeadCell>
                  <DataTableHeadCell align="right">Comissão</DataTableHeadCell>
                  <DataTableHeadCell>Status</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {sales.map((s, i) => (
                  <DataTableRow key={s.attributionId} index={i}>
                    <DataTableCell className="tnum">{fmtDate(s.attributedAt)}</DataTableCell>
                    <DataTableCell>{s.eventName}</DataTableCell>
                    <DataTableCell className="font-medium">{s.promoterDisplayName ?? "—"}</DataTableCell>
                    <DataTableCell>{s.source === "LINK" ? "Link" : "Código"}</DataTableCell>
                    <DataTableCell num>{formatCents(s.netNominalCentsAfterDiscount)}</DataTableCell>
                    <DataTableCell num className="font-semibold">
                      {formatCents(s.commissionCents)}
                    </DataTableCell>
                    <DataTableCell>{s.commissionStatus ? <StatusBadge tone={COMMISSION_TONE[s.commissionStatus]}>{COMMISSION_STATUS_LABEL[s.commissionStatus]}</StatusBadge> : <span className="text-subtle-foreground">—</span>}</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          }
          mobile={
            <MobileCardList>
              {sales.map((s, i) => (
                <MobileCard key={s.attributionId} index={i} title={s.promoterDisplayName ?? s.eventName} subtitle={`${s.eventName} · ${s.source === "LINK" ? "Link" : "Código"} · ${fmtDate(s.attributedAt)}`} badge={s.commissionStatus ? <StatusBadge tone={COMMISSION_TONE[s.commissionStatus]}>{COMMISSION_STATUS_LABEL[s.commissionStatus]}</StatusBadge> : undefined} meta={[{ label: "Valor líquido", value: formatCents(s.netNominalCentsAfterDiscount), num: true }, { label: "Comissão", value: formatCents(s.commissionCents), num: true }]} />
              ))}
            </MobileCardList>
          }
        />
      )}
    </div>
  );
}
