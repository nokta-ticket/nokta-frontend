"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricCard } from "../../_components/metric-card";
import { EmptyState } from "../../_components/states/empty-state";
import { MetricsSkeleton, TableSkeleton } from "../../_components/states/loading-state";
import { ErrorState } from "../../_components/states/error-state";
import { COMMISSION_STATUS_LABEL, formatCents, promotersApi } from "@/services/promoters";
import { usePromoterAnalytics, usePromoterOrganizationEvents, usePromoterSales } from "../_hooks/use-promoters";

export function SalesAnalyticsTab({ orgId, canExport }: { orgId: number; canExport: boolean }) {
  const { data: events } = usePromoterOrganizationEvents(orgId);
  const [eventId, setEventId] = useState<number | undefined>(undefined);
  const { data: metrics, isLoading: loadingMetrics } = usePromoterAnalytics(orgId, eventId);
  const { data: sales, isLoading: loadingSales, isError, refetch } = usePromoterSales(orgId, eventId);

  const download = (kind: "sales" | "commissions") => {
    window.open(promotersApi.csvUrl(orgId, kind), "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <Select value={eventId ? String(eventId) : "all"} onValueChange={(v) => setEventId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Filtrar por evento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {(events ?? []).map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canExport ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => download("sales")}><Download size={14} /> Vendas (CSV)</Button>
            <Button variant="outline" onClick={() => download("commissions")}><Download size={14} /> Comissões (CSV)</Button>
          </div>
        ) : null}
      </div>

      {loadingMetrics || !metrics ? (
        <MetricsSkeleton count={8} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Promoters ativos" value={String(metrics.promotersAtivos)} />
          <MetricCard label="Cliques (estimativa única)" value={String(metrics.cliquesUnicosEstimados)} />
          <MetricCard label="Pedidos pagos atribuídos" value={String(metrics.pedidosPagos)} />
          <MetricCard label="Valor líquido vendido" value={formatCents(metrics.netNominalCentsAfterDiscount)} />
          <MetricCard label="Comissão pendente" value={formatCents(metrics.commissionPendingCents)} />
          <MetricCard label="Comissão disponível" value={formatCents(metrics.commissionAvailableCents)} />
          <MetricCard label="Ajustes (estorno/chargeback pós-acerto)" value={formatCents(metrics.commissionAdjustmentCents)} />
          <MetricCard label="Saldo líquido" value={formatCents(metrics.netBalanceCents)} />
        </div>
      )}

      {isError ? (
        <ErrorState description="Não foi possível carregar as vendas atribuídas." onRetry={() => refetch()} />
      ) : loadingSales ? (
        <TableSkeleton />
      ) : !sales || sales.length === 0 ? (
        <EmptyState title="Nenhuma venda atribuída ainda" description="Vendas feitas pelo link ou código de um promoter aparecem aqui." />
      ) : (
        <div className="rounded-xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Promoter</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Valor líquido</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status da comissão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.attributionId}>
                  <TableCell>{s.eventName}</TableCell>
                  <TableCell>{s.promoterDisplayName ?? "—"}</TableCell>
                  <TableCell>{s.source === "LINK" ? "Link" : "Código"}</TableCell>
                  <TableCell>{formatCents(s.netNominalCentsAfterDiscount)}</TableCell>
                  <TableCell>{formatCents(s.commissionCents)}</TableCell>
                  <TableCell>{s.commissionStatus ? COMMISSION_STATUS_LABEL[s.commissionStatus] : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
