"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatBRLCents } from "@/lib/format";
import type { VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsFinance } from "../../_hooks/use-venue-insights";
import { InsightsPanel, ProportionBars } from "../insights-charts";
import { MiniStat, MiniStatGrid, StatGrid, TextStatCard } from "../insights-metric-card";
import { plural, TabError, TabSkeleton } from "../insights-states";

const count = (n: number) => n.toLocaleString("pt-BR");

export function FinanceiroTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const finance = useVenueInsightsFinance(orgId, params);

  if (finance.isLoading) return <TabSkeleton />;
  if (finance.isError || !finance.data) return <TabError onRetry={() => void finance.refetch()} />;

  const data = finance.data;
  const o = data.overview;
  const negative = o.operationalResultCents < 0;

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard label="Faturamento" icon="sack-dollar" format="currency" value={o.grossRevenueCents / 100} />
        <StatCard label="Receita líquida estimada" icon="wallet" format="currency" value={o.netRevenueCents / 100} hint="Descontadas as taxas estimadas" />
        <StatCard label="Despesas" icon="receipt" format="currency" value={o.expensesCents / 100} />
        <TextStatCard label="Resultado operacional" icon="chart-line" value={formatBRLCents(o.operationalResultCents)} tone={negative ? "danger" : "default"} hint={negative ? "Estimado · negativo no período" : "Estimado"} />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="CMV" value={formatBRLCents(o.cmvCents)} />
        <MiniStat label="Margem bruta" value={formatBRLCents(o.grossMarginCents)} />
        <MiniStat label="Taxas estimadas" value={formatBRLCents(o.estimatedFeeCents)} />
        <MiniStat label="Outras receitas" value={formatBRLCents(o.otherIncomeCents)} />
        <MiniStat label="Contas a pagar em aberto" value={count(o.payablesOpenCount)} />
        <MiniStat label="Contas vencidas" value={count(o.payablesOverdueCount)} tone={o.payablesOverdueCount > 0 ? "danger" : "default"} />
      </MiniStatGrid>

      <InsightsPanel title="Despesas por categoria" description="Despesas pagas ou incorridas no período" empty={data.expensesByCategory.length === 0} emptyIcon="receipt" emptyTitle="Sem despesas no período" emptyDescription="As despesas aparecem aqui por categoria conforme forem lançadas.">
        <ProportionBars color="var(--chart-4)" rows={data.expensesByCategory.map((e) => ({ key: e.categoryId, label: e.nome, value: e.amountCents, display: formatBRLCents(e.amountCents) }))} />
      </InsightsPanel>

      <div className="grid gap-4 sm:grid-cols-2">
        <InsightsPanel
          title="Divergência de caixa"
          description="Fechamentos com diferença entre contado e esperado"
          action={
            <Button asChild variant="subtle" size="sm">
              <Link href="/dashboard/financeiro">Ver caixa</Link>
            </Button>
          }
        >
          <p className={`text-stat font-medium tabular-nums leading-none tracking-tight ${data.cashDivergence.sessionsCount > 0 ? "text-warning" : "text-foreground"}`}>{count(data.cashDivergence.sessionsCount)}</p>
          <p className="mt-2 text-caption text-muted-foreground">{data.cashDivergence.sessionsCount > 0 ? `${plural(data.cashDivergence.sessionsCount, "fechamento", "fechamentos")} · ${formatBRLCents(data.cashDivergence.totalDifferenceCents)} de diferença acumulada` : "Nenhum fechamento com diferença no período"}</p>
        </InsightsPanel>
        <InsightsPanel
          title="Conciliação de pagamentos"
          description="Dias e métodos conferidos com a adquirente"
          action={
            <Button asChild variant="subtle" size="sm">
              <Link href="/dashboard/financeiro">Ver conciliação</Link>
            </Button>
          }
        >
          <p className="text-stat font-medium tabular-nums leading-none tracking-tight text-foreground">
            {count(data.reconciliation.divergentCount)} <span className="text-base font-normal text-muted-foreground">/ {count(data.reconciliation.totalCount)}</span>
          </p>
          <p className="mt-2 text-caption text-muted-foreground">{data.reconciliation.divergentCount > 0 ? `${plural(data.reconciliation.divergentCount, "linha divergente", "linhas divergentes")} de ${count(data.reconciliation.totalCount)} conferidas` : "Nenhuma divergência nas linhas conferidas"}</p>
        </InsightsPanel>
      </div>

      <p className="text-caption text-subtle-foreground">{o.disclaimer}</p>
    </div>
  );
}
