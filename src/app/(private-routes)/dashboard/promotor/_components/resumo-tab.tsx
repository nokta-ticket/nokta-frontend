"use client";

import { MetricCard } from "../../_components/metric-card";
import { MetricsSkeleton } from "../../_components/states/loading-state";
import { EmptyState } from "../../_components/states/empty-state";
import { formatCents } from "@/services/promoters";
import { useMyPromoterAnalytics } from "../_hooks/use-my-promoter";

export function ResumoTab() {
  const { data: metrics, isLoading } = useMyPromoterAnalytics(true);

  if (isLoading || !metrics) return <MetricsSkeleton count={6} />;

  if (metrics.length === 0) {
    return <EmptyState title="Nenhuma atividade ainda" description="Suas métricas aparecem aqui depois do primeiro clique ou venda atribuída a você." />;
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      cliquesBrutos: acc.cliquesBrutos + m.cliquesBrutos,
      pedidosPagos: acc.pedidosPagos + m.pedidosPagos,
      ingressos: acc.ingressos + m.ingressos,
      commissionPendingCents: acc.commissionPendingCents + m.commissionPendingCents,
      commissionAvailableCents: acc.commissionAvailableCents + m.commissionAvailableCents,
      commissionSettledCents: acc.commissionSettledCents + m.commissionSettledCents,
    }),
    { cliquesBrutos: 0, pedidosPagos: 0, ingressos: 0, commissionPendingCents: 0, commissionAvailableCents: 0, commissionSettledCents: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Cliques" value={String(totals.cliquesBrutos)} />
        <MetricCard label="Pedidos pagos atribuídos a você" value={String(totals.pedidosPagos)} />
        <MetricCard label="Ingressos vendidos" value={String(totals.ingressos)} />
        <MetricCard label="Comissão pendente" value={formatCents(totals.commissionPendingCents)} />
        <MetricCard label="Comissão disponível para acerto" value={formatCents(totals.commissionAvailableCents)} />
        <MetricCard label="Comissão já acertada" value={formatCents(totals.commissionSettledCents)} />
      </div>
      <p className="text-xs text-black/50">
        &quot;Pendente&quot; é o que ainda pode ser revertido se a venda for cancelada. &quot;Disponível&quot; é o que já pode entrar num acerto. &quot;Acertada&quot; é o que a organização já
        confirmou e (quando marcado) pagou por fora do sistema.
      </p>
    </div>
  );
}
