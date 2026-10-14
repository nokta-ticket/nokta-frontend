"use client";

import { StatCard } from "@/components/ui/stat-card";
import { formatBRLCents } from "@/lib/format";
import type { VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsStock } from "../../_hooks/use-venue-insights";
import { InsightsPanel, ProportionBars, RankList } from "../insights-charts";
import { MiniStat, MiniStatGrid, StatGrid, TextStatCard } from "../insights-metric-card";
import { plural, TabError, TabSkeleton } from "../insights-states";

const count = (n: number) => n.toLocaleString("pt-BR");
const quantity = (n: number | string) => Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export function EstoqueTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const stock = useVenueInsightsStock(orgId, params);

  if (stock.isLoading) return <TabSkeleton />;
  if (stock.isError || !stock.data) return <TabError onRetry={() => void stock.refetch()} />;

  const data = stock.data;
  const s = data.summary;

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard label="Valor em estoque" icon="warehouse" format="currency" value={s.estimatedValueCents / 100} hint="Estimado pelo custo médio" />
        <TextStatCard label="Itens zerados" icon="box" value={count(s.outOfStockCount)} tone={s.outOfStockCount > 0 ? "danger" : "default"} hint={s.outOfStockCount > 0 ? "Sem saldo pra vender" : "Nenhum item sem saldo"} />
        <TextStatCard label="Estoque baixo" icon="warning" value={count(s.lowStockCount)} tone={s.lowStockCount > 0 ? "warning" : "default"} hint={s.lowStockCount > 0 ? "Abaixo do mínimo" : "Nenhum item abaixo do mínimo"} />
        <StatCard label="Compras no período" icon="truck" format="currency" value={s.purchasesTotalCents / 100} />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="Perdas no período" value={formatBRLCents(s.lossCents)} tone={s.lossCents > 0 ? "warning" : "default"} />
        <MiniStat label="Consumo por vendas" value={formatBRLCents(s.consumptionCents)} />
        <MiniStat label="Saldo negativo" value={count(s.negativeCount)} tone={s.negativeCount > 0 ? "danger" : "default"} />
        <MiniStat label="Ajustes de contagem" value={count(s.countAdjustmentsCount)} />
        <MiniStat label="Transferências" value={count(s.transfersCount)} />
        <MiniStat label="Giro estimado" value={s.estimatedTurnover !== null ? s.estimatedTurnover.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"} note={s.turnoverLabel} className="col-span-2" />
      </MiniStatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Perdas por motivo" description="Valor perdido agrupado por motivo" empty={data.lossByReason.length === 0} emptyIcon="box" emptyTitle="Sem perdas no período" emptyDescription="As perdas registradas aparecem aqui, agrupadas por motivo.">
          <ProportionBars color="var(--chart-4)" rows={data.lossByReason.map((l) => ({ key: l.reason, label: l.reason, value: l.amountCents, display: formatBRLCents(l.amountCents) }))} />
        </InsightsPanel>
        <InsightsPanel title="Valor em estoque por categoria" description="Onde o dinheiro está parado" empty={data.costByCategory.length === 0} emptyIcon="warehouse" emptyTitle="Sem itens em estoque" emptyDescription="O valor por categoria aparece aqui conforme houver saldo.">
          <ProportionBars rows={data.costByCategory.map((c) => ({ key: c.nome, label: c.nome, value: c.valueCents, display: formatBRLCents(c.valueCents) }))} />
        </InsightsPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Compras por fornecedor" description="Compras recebidas no período" empty={data.purchasesBySupplier.length === 0} emptyIcon="truck" emptyTitle="Sem compras no período" emptyDescription="As compras aparecem aqui conforme forem recebidas.">
          <RankList rows={data.purchasesBySupplier.map((p, i) => ({ key: p.supplierId ?? `none-${i}`, label: p.nome, value: p.totalCents, display: formatBRLCents(p.totalCents), meta: plural(p.count, "compra", "compras") }))} />
        </InsightsPanel>
        <InsightsPanel title="Itens com maior valor parado" description="Saldo atual × custo médio" empty={data.highestValueItems.length === 0} emptyIcon="warehouse" emptyTitle="Sem itens em estoque" emptyDescription="Os itens com mais valor parado aparecem aqui conforme houver saldo.">
          <RankList rows={data.highestValueItems.map((it) => ({ key: it.itemId, label: it.nome, sublabel: it.categoryNome ?? undefined, value: it.valueCents, display: formatBRLCents(it.valueCents), meta: `Saldo: ${quantity(it.quantityOnHand)}` }))} />
        </InsightsPanel>
      </div>

      <InsightsPanel title="Itens mais consumidos" description="Baixados pelas vendas do período" empty={data.mostConsumedItems.length === 0} emptyIcon="box" emptyTitle="Sem consumo no período" emptyDescription="Os itens mais consumidos aparecem aqui conforme houver vendas.">
        <RankList color="var(--chart-2)" rows={data.mostConsumedItems.map((it) => ({ key: it.itemId, label: it.nome, value: it.consumedQuantity, display: quantity(it.consumedQuantity) }))} />
      </InsightsPanel>
    </div>
  );
}
