"use client";

import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/ui/stat-card";
import { formatBRLCents } from "@/lib/format";
import { formatDurationMs, type VenueInsightsFilterParams, type VenueInsightsOperation } from "@/services/venue-insights";
import { useVenueInsightsOperation } from "../../_hooks/use-venue-insights";
import { hourLabel, InsightsBarChart, InsightsPanel, ProportionBars } from "../insights-charts";
import { MiniStat, MiniStatGrid, StatGrid, TextStatCard } from "../insights-metric-card";
import { plural, TabError, TabSkeleton } from "../insights-states";

const count = (n: number) => n.toLocaleString("pt-BR");

export function OperacaoTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const operation = useVenueInsightsOperation(orgId, params);

  if (operation.isLoading) return <TabSkeleton />;
  if (operation.isError || !operation.data) return <TabError onRetry={() => void operation.refetch()} />;

  const data = operation.data;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard label="Comandas abertas" icon="receipt" value={s.openedTabsCount} />
        <StatCard label="Comandas fechadas" icon="check-circle" value={s.closedTabsCount} />
        <TextStatCard label="Tempo médio de comanda" icon="clock" value={formatDurationMs(s.averageTabDurationMs)} hint="Da abertura ao fechamento" />
        <TextStatCard label="Tempo até o 1º pedido" icon="history" value={formatDurationMs(s.averageTimeToFirstOrderMs)} hint="Depois de abrir a comanda" />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="Tempo médio de preparo" value={formatDurationMs(s.averagePreparationTimeMs)} />
        <MiniStat label="Tempo até a entrega" value={formatDurationMs(s.averageTimeToDeliveryMs)} />
        <MiniStat label="Pedidos cancelados" value={count(s.canceledOrdersCount)} tone={s.canceledOrdersCount > 0 ? "warning" : "default"} />
        <MiniStat label="Itens cancelados" value={count(s.canceledItemsCount)} />
        <MiniStat label="Desconto médio" value={s.averageDiscountCents !== null ? formatBRLCents(s.averageDiscountCents) : "—"} />
        <MiniStat label="Taxa de serviço média" value={s.averageServiceChargeRateBps !== null ? `${(s.averageServiceChargeRateBps / 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"} />
      </MiniStatGrid>

      <InsightsBarChart title="Pedidos por horário" description="Pedidos lançados por hora do dia" kind="count" seriesLabel="Pedidos" color="var(--chart-2)" loading={false} data={data.byHour.map((h) => ({ label: hourLabel(h.hour), value: h.ordersCount }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Por estação de preparo" description="Itens lançados e tempo médio de preparo" empty={data.byStation.length === 0} emptyIcon="utensils" emptyTitle="Sem itens no período" emptyDescription="A distribuição por estação aparece aqui conforme os pedidos forem lançados.">
          <ProportionBars
            scale="max"
            showShare
            color="var(--chart-2)"
            rows={data.byStation.map((st, i) => ({
              key: st.stationId ?? `none-${i}`,
              label: st.nome,
              value: st.itemCount,
              display: plural(st.itemCount, "item", "itens"),
              hint: st.averagePreparationTimeMs !== null ? `Preparo médio: ${formatDurationMs(st.averagePreparationTimeMs)}` : "Sem tempo de preparo registrado",
            }))}
          />
        </InsightsPanel>
        <InsightsPanel title="Por operador" description="Contagens neutras — não é um ranking de desempenho" empty={data.byOperator.length === 0} emptyIcon="users" emptyTitle="Sem movimento no período" emptyDescription="As contagens aparecem aqui conforme comandas forem abertas e pedidos lançados.">
          <OperatorList rows={data.byOperator} />
        </InsightsPanel>
      </div>
    </div>
  );
}

function OperatorList({ rows }: { rows: VenueInsightsOperation["byOperator"] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.userId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm first:pt-0 last:pb-0">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Icon name="user" size={12} className="text-muted-foreground" />
            Usuário #{r.userId}
          </span>
          <span className="tnum flex gap-4 text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{count(r.openedTabs)}</span> {r.openedTabs === 1 ? "comanda" : "comandas"}
            </span>
            <span>
              <span className="font-medium text-foreground">{count(r.createdOrders)}</span> {r.createdOrders === 1 ? "pedido" : "pedidos"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
