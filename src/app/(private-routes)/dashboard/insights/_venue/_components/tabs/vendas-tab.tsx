"use client";

import { StatCard } from "@/components/ui/stat-card";
import { formatBRLCents } from "@/lib/format";
import { VENUE_PAYMENT_METHOD_LABEL } from "@/services/venue-finance";
import { VENUE_INSIGHTS_ORIGIN_LABEL, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsSales } from "../../_hooks/use-venue-insights";
import { hourLabel, InsightsBarChart, InsightsPanel, InsightsTimelineChart, ProportionBars, RankList } from "../insights-charts";
import { COMPARISON_HINT, GRANULARITY_DESCRIPTION } from "../insights-filter-bar";
import { InsightsStatCard, MiniStat, MiniStatGrid, StatGrid } from "../insights-metric-card";
import { plural, TabError, TabSkeleton } from "../insights-states";

const methodLabel = (method: string) => (VENUE_PAYMENT_METHOD_LABEL as Record<string, string | undefined>)[method] ?? method;
const originLabel = (origin: string) => VENUE_INSIGHTS_ORIGIN_LABEL[origin] ?? origin;

function WithCount({ label, count }: { label: string; count: string }) {
  return (
    <>
      {label} <span className="text-muted-foreground">· {count}</span>
    </>
  );
}

export function VendasTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const sales = useVenueInsightsSales(orgId, params);

  if (sales.isLoading) return <TabSkeleton />;
  if (sales.isError || !sales.data) return <TabError onRetry={() => void sales.refetch()} />;

  const data = sales.data;
  const s = data.summary;
  const hint = COMPARISON_HINT[params.comparison ?? "NONE"];

  return (
    <div className="space-y-6">
      <StatGrid>
        <InsightsStatCard label="Faturamento" icon="sack-dollar" format="currency" comparison={s.grossRevenueCents} hint={hint} />
        <InsightsStatCard label="Ticket médio" icon="receipt" format="currency" comparison={s.averageTicketCents} hint={hint} />
        <StatCard label="Pagamentos confirmados" icon="check-circle" value={s.paymentsCount} />
        <StatCard label="Receita líquida estimada" icon="wallet" format="currency" value={s.netRevenueCents / 100} hint="Descontadas as taxas estimadas" />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="Desconto médio" value={s.averageDiscountCents !== null ? formatBRLCents(s.averageDiscountCents) : "—"} />
        <MiniStat label="Total em descontos" value={formatBRLCents(s.totalDiscountCents)} />
        <MiniStat label="Taxa de serviço" value={formatBRLCents(s.totalServiceChargeCents)} />
        <MiniStat label="Comandas canceladas" value={s.canceledTabsCount.toLocaleString("pt-BR")} tone={s.canceledTabsCount > 0 ? "warning" : "default"} />
      </MiniStatGrid>

      <InsightsTimelineChart title="Faturamento ao longo do período" description={GRANULARITY_DESCRIPTION[params.granularity ?? "DAY"]} loading={false} data={data.timeline.map((p) => ({ date: p.date, revenueCents: p.amountCents }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsBarChart title="Vendas por horário" description="Faturamento por hora do dia" kind="money" seriesLabel="Faturamento" loading={false} data={data.byHour.map((h) => ({ label: hourLabel(h.hour), value: h.amountCents }))} />
        <InsightsBarChart title="Vendas por dia da semana" description="Faturamento somado por dia da semana" kind="money" seriesLabel="Faturamento" loading={false} data={data.byWeekday.map((w) => ({ label: w.label.slice(0, 3), value: w.amountCents }))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Formas de pagamento" description="Valor bruto por método" empty={data.byPaymentMethod.length === 0} emptyIcon="credit-card" emptyTitle="Sem pagamentos no período" emptyDescription="As formas de pagamento aparecem aqui conforme os pagamentos forem confirmados.">
          <ProportionBars rows={data.byPaymentMethod.map((m) => ({ key: m.method, label: <WithCount label={methodLabel(m.method)} count={plural(m.count, "pagamento", "pagamentos")} />, value: m.grossCents, display: formatBRLCents(m.grossCents) }))} />
        </InsightsPanel>
        <InsightsPanel title="Origem das comandas" description="Total fechado por origem" empty={data.byOrigin.length === 0} emptyIcon="receipt" emptyTitle="Sem comandas fechadas no período" emptyDescription="A origem das comandas aparece aqui conforme forem fechadas.">
          <ProportionBars rows={data.byOrigin.map((o) => ({ key: o.origin, label: <WithCount label={originLabel(o.origin)} count={plural(o.count, "comanda", "comandas")} />, value: o.totalCents, display: formatBRLCents(o.totalCents) }))} />
        </InsightsPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Maiores comandas" description="Top 5 por total fechado" empty={data.topTabsByTotal.length === 0} emptyIcon="receipt" emptyTitle="Sem comandas fechadas no período">
          <RankList rows={data.topTabsByTotal.map((t) => ({ key: t.id, label: t.publicCode, sublabel: t.customerName ?? undefined, value: t.totalCents, display: formatBRLCents(t.totalCents) }))} />
        </InsightsPanel>
        <InsightsPanel title="Maiores descontos" description="Comandas com mais desconto" empty={data.topTabsByDiscount.length === 0} emptyIcon="tag" emptyTitle="Sem descontos no período">
          <RankList rows={data.topTabsByDiscount.map((t) => ({ key: t.id, label: t.publicCode, sublabel: t.customerName ?? undefined, value: t.discountCents, display: formatBRLCents(t.discountCents), meta: `Total da comanda: ${formatBRLCents(t.totalCents)}` }))} />
        </InsightsPanel>
      </div>
    </div>
  );
}
