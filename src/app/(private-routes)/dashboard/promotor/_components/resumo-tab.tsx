"use client";

import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useMyPromoterAnalytics } from "../_hooks/use-my-promoter";

export function ResumoTab() {
  const { data: metrics, isLoading } = useMyPromoterAnalytics(true);

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
    );
  }

  if (metrics.length === 0) {
    return <EmptyState icon="chart-line" title="Nenhuma atividade ainda" description="Suas métricas aparecem aqui depois do primeiro clique ou venda atribuída a você." />;
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      cliquesBrutos: acc.cliquesBrutos + m.cliquesBrutos,
      pedidosPagos: acc.pedidosPagos + m.pedidosPagos,
      ingressos: acc.ingressos + m.ingressos,
      commissionPendingCents: acc.commissionPendingCents + m.commissionPendingCents,
      commissionAvailableCents: acc.commissionAvailableCents + m.commissionAvailableCents,
      commissionSettledCents: acc.commissionSettledCents + m.commissionSettledCents,
      commissionAdjustmentCents: acc.commissionAdjustmentCents + m.commissionAdjustmentCents,
      netBalanceCents: acc.netBalanceCents + m.netBalanceCents,
    }),
    { cliquesBrutos: 0, pedidosPagos: 0, ingressos: 0, commissionPendingCents: 0, commissionAvailableCents: 0, commissionSettledCents: 0, commissionAdjustmentCents: 0, netBalanceCents: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Cliques" icon="link" value={totals.cliquesBrutos} />
        <StatCard label="Pedidos pagos" icon="receipt" value={totals.pedidosPagos} hint="Atribuídos a você" />
        <StatCard label="Ingressos vendidos" icon="ticket" value={totals.ingressos} />
        <StatCard label="Saldo líquido" icon="scale" format="currency" value={totals.netBalanceCents / 100} hint="Disponível + acertada + ajustes" />
        <StatCard label="Comissão pendente" icon="clock" format="currency" value={totals.commissionPendingCents / 100} hint="Pode reverter se a venda cancelar" />
        <StatCard label="Disponível pra acerto" icon="hand-dollar" format="currency" value={totals.commissionAvailableCents / 100} />
        <StatCard label="Já acertada" icon="check-circle" format="currency" value={totals.commissionSettledCents / 100} hint="Confirmada pela organização" />
        <StatCard label="Ajustes" icon="undo" format="currency" value={totals.commissionAdjustmentCents / 100} hint="Estornos após acerto" />
      </div>
      <Callout tone="neutral" icon="lightbulb">
        “Pendente” ainda pode ser revertido se a venda for cancelada. “Disponível” já pode entrar num acerto. “Acertada” é o que a organização confirmou e (quando marcado) pagou por fora. “Ajustes” são vendas já acertadas que depois foram estornadas ou contestadas — descontam de um próximo acerto e podem deixar o saldo negativo.
      </Callout>
    </div>
  );
}
