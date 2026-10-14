"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import type { IconName } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";
import { formatBRLCents } from "@/lib/format";
import { formatDurationMs, formatRate, type VenueInsightsAlerts, type VenueInsightsFilterParams, type VenueInsightsLocationComparisonRow } from "@/services/venue-insights";
import { useVenueInsightsAlerts, useVenueInsightsLocationsComparison, useVenueInsightsOverview } from "../../_hooks/use-venue-insights";
import { hourLabel, InsightsBarChart, InsightsPanel, InsightsTimelineChart, RankList } from "../insights-charts";
import { COMPARISON_HINT } from "../insights-filter-bar";
import { InsightsStatCard, MiniStat, MiniStatGrid, StatGrid } from "../insights-metric-card";
import { InsightsTable, type InsightsColumn } from "../insights-ranking-table";
import { joinNames, plural, TabError, TabSkeleton } from "../insights-states";

const count = (n: number) => n.toLocaleString("pt-BR");

export function VisaoGeralTab({ orgId, params, hasMultipleLocations }: { orgId: number; params: VenueInsightsFilterParams; hasMultipleLocations: boolean }) {
  const overview = useVenueInsightsOverview(orgId, params);
  const alerts = useVenueInsightsAlerts(orgId, params);
  const compareLocations = hasMultipleLocations && params.locationId === undefined;
  const locations = useVenueInsightsLocationsComparison(orgId, params, compareLocations);

  if (overview.isLoading) return <TabSkeleton />;
  if (overview.isError || !overview.data) return <TabError onRetry={() => void overview.refetch()} />;

  const data = overview.data;
  const hint = COMPARISON_HINT[params.comparison ?? "NONE"];
  // Um dia só: a linha do tempo teria um ponto; o gráfico por hora já conta a história.
  const singleBucket = data.timeline.length <= 1;
  const coverage = data.cards.guestsServed.coverage;
  const guestsHint = coverage !== null && coverage < 1 ? `${formatRate(coverage)} das comandas com contagem de clientes` : hint;

  return (
    <div className="space-y-6">
      <StatGrid>
        <InsightsStatCard label="Faturamento" icon="sack-dollar" format="currency" comparison={data.cards.revenueCents} hint={hint} />
        <InsightsStatCard label="Resultado" icon="chart-line" format="currency" comparison={data.cards.operationalResultCents} hint={hint ? `Operacional estimado · ${hint}` : "Operacional estimado"} />
        <InsightsStatCard label="Ticket médio" icon="receipt" format="currency" comparison={data.cards.averageTicketCents} hint={hint} />
        <InsightsStatCard label="Clientes atendidos" icon="users" comparison={data.cards.guestsServed} hint={guestsHint} />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="Margem bruta" value={formatBRLCents(data.secondary.grossMarginCents)} />
        <MiniStat label="CMV" value={formatBRLCents(data.secondary.cmvCents)} />
        <MiniStat label="Tempo médio de comanda" value={formatDurationMs(data.secondary.averageTabDurationMs)} />
        <MiniStat label="Taxa de no-show" value={formatRate(data.secondary.noShowRate)} />
        <MiniStat label="Ocupação" value={data.secondary.occupancyRate !== null ? formatRate(data.secondary.occupancyRate) : "Não informado"} note={data.secondary.occupancyMessage ?? undefined} />
        <MiniStat label="Perdas de estoque" value={formatBRLCents(data.secondary.lossCents)} />
        <MiniStat label="Comandas fechadas" value={count(data.secondary.closedTabsCount)} />
        <MiniStat label="Fechamentos divergentes" value={count(data.secondary.divergentCashSessionsCount)} tone={data.secondary.divergentCashSessionsCount > 0 ? "warning" : "default"} />
      </MiniStatGrid>

      <AlertsBlock alerts={alerts.data} />

      {!singleBucket ? <InsightsTimelineChart data={data.timeline} loading={false} showResult title="Faturamento e resultado" description="Evolução ao longo do período" /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsBarChart title="Vendas por horário" description="Faturamento por hora do dia, no fuso da unidade" kind="money" seriesLabel="Faturamento" loading={false} data={data.salesByHour.map((h) => ({ label: hourLabel(h.hour), value: h.amountCents }))} />
        <InsightsPanel title="Produtos que mais faturaram" description="Top 5 do período" empty={data.topProducts.length === 0} emptyIcon="utensils" emptyTitle="Sem vendas no período" emptyDescription="Os produtos mais vendidos aparecem aqui conforme o movimento.">
          <RankList rows={data.topProducts.map((p) => ({ key: p.productId, label: p.nome, value: p.revenueCents, display: formatBRLCents(p.revenueCents) }))} />
        </InsightsPanel>
      </div>

      {compareLocations ? <LocationsComparison rows={locations.data?.locations} loading={locations.isLoading} /> : null}

      <p className="text-caption text-subtle-foreground">{data.disclaimer}</p>
    </div>
  );
}

/* ---------- alertas ---------- */

/**
 * Callout de alerta com link pra rota. No desktop o botão fica à direita;
 * no celular ele desce pra baixo do texto, senão espreme a mensagem.
 */
function AlertCallout({ tone, icon, title, href, linkLabel, children }: { tone: "warning" | "danger" | "info"; icon: IconName; title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <Callout
      tone={tone}
      icon={icon}
      title={title}
      action={
        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href={href}>{linkLabel}</Link>
        </Button>
      }
    >
      <p>{children}</p>
      <Button asChild variant="link" className="mt-1.5 h-auto px-0 text-sm sm:hidden">
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </Callout>
  );
}

function AlertsBlock({ alerts }: { alerts: VenueInsightsAlerts | undefined }) {
  if (!alerts) return null;

  const overdueCents = alerts.overduePayables.reduce((acc, p) => acc + p.remainingCents, 0);
  const divergenceCents = alerts.divergentCashSessions.reduce((acc, s) => acc + (s.differenceCents ?? 0), 0);

  const items: ReactNode[] = [];
  if (alerts.outOfStockItems.length > 0) {
    items.push(
      <AlertCallout key="out" tone="danger" icon="warehouse" title={`${plural(alerts.outOfStockItems.length, "item zerado", "itens zerados")} no estoque`} href="/dashboard/estoque" linkLabel="Ver estoque">
        {joinNames(alerts.outOfStockItems.map((i) => i.nome))}
      </AlertCallout>,
    );
  }
  if (alerts.lowStockItems.length > 0) {
    items.push(
      <AlertCallout key="low" tone="warning" icon="box" title={`${plural(alerts.lowStockItems.length, "item", "itens")} com estoque baixo`} href="/dashboard/estoque" linkLabel="Ver estoque">
        {joinNames(alerts.lowStockItems.map((i) => i.nome))}
      </AlertCallout>,
    );
  }
  if (alerts.overduePayables.length > 0) {
    items.push(
      <AlertCallout key="overdue" tone="danger" icon="wallet" title={plural(alerts.overduePayables.length, "conta vencida", "contas vencidas")} href="/dashboard/financeiro" linkLabel="Ver financeiro">
        {formatBRLCents(overdueCents)} em aberto · {joinNames(alerts.overduePayables.map((p) => p.description))}
      </AlertCallout>,
    );
  }
  if (alerts.divergentCashSessions.length > 0) {
    items.push(
      <AlertCallout key="cash" tone="warning" icon="coins" title={plural(alerts.divergentCashSessions.length, "fechamento de caixa divergente", "fechamentos de caixa divergentes")} href="/dashboard/financeiro" linkLabel="Ver financeiro">
        Diferença acumulada de {formatBRLCents(divergenceCents)} no período.
      </AlertCallout>,
    );
  }
  if (alerts.elevatedNoShow) {
    items.push(
      <AlertCallout key="noshow" tone="info" icon="calendar-check" title={`No-show elevado: ${formatRate(alerts.elevatedNoShow.rate)}`} href="/dashboard/reservas" linkLabel="Ver reservas">
        Vale confirmar as reservas com antecedência.
      </AlertCallout>,
    );
  }

  if (items.length === 0) return null;
  return <div className="space-y-3">{items}</div>;
}

/* ---------- comparação entre unidades ---------- */

const LOCATION_COLUMNS: InsightsColumn<VenueInsightsLocationComparisonRow>[] = [
  {
    key: "nome",
    header: "Unidade",
    render: (r) => (
      <span className="flex items-center gap-2">
        <span className="font-medium">{r.nome}</span>
        {r.divergentCashSessionsCount > 0 ? <StatusBadge tone="warning">{plural(r.divergentCashSessionsCount, "divergência", "divergências")}</StatusBadge> : null}
      </span>
    ),
  },
  { key: "revenue", header: "Faturamento", num: true, mobileLabel: "Faturamento", render: (r) => formatBRLCents(r.revenueCents) },
  { key: "result", header: "Resultado", num: true, mobileLabel: "Resultado", render: (r) => formatBRLCents(r.operationalResultCents) },
  { key: "ticket", header: "Ticket médio", num: true, mobileLabel: "Ticket médio", render: (r) => (r.averageTicketCents !== null ? formatBRLCents(r.averageTicketCents) : "—") },
  { key: "tabs", header: "Comandas", num: true, mobileLabel: "Comandas", render: (r) => count(r.closedTabsCount) },
  { key: "guests", header: "Clientes", num: true, mobileLabel: "Clientes", render: (r) => count(r.guestsServed) },
  { key: "noshow", header: "No-show", num: true, mobileLabel: "No-show", render: (r) => formatRate(r.noShowRate) },
  { key: "loss", header: "Perdas", num: true, mobileLabel: "Perdas", render: (r) => formatBRLCents(r.lossCents) },
];

function LocationsComparison({ rows, loading }: { rows: VenueInsightsLocationComparisonRow[] | undefined; loading: boolean }) {
  return (
    <section className="space-y-4">
      <SectionHeader title="Comparação entre unidades" description="Mesmo período, lado a lado" />
      <InsightsTable
        rows={rows ?? []}
        columns={LOCATION_COLUMNS}
        rowKey={(r) => r.locationId}
        loading={loading}
        emptyTitle="Sem dados das unidades"
        emptyIcon="store"
        title={(r) => r.nome}
        subtitle={(r) => `Tempo médio de comanda: ${formatDurationMs(r.averageTabDurationMs)}`}
        badge={(r) => (r.divergentCashSessionsCount > 0 ? <StatusBadge tone="warning">{plural(r.divergentCashSessionsCount, "divergência", "divergências")}</StatusBadge> : undefined)}
      />
    </section>
  );
}
