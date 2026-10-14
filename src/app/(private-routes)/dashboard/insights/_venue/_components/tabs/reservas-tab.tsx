"use client";

import { StatCard } from "@/components/ui/stat-card";
import { formatBRLCents } from "@/lib/format";
import { formatDurationMs, formatRate, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { VENUE_RESERVATION_SOURCE_LABEL } from "@/services/venue-reservations";
import { useVenueInsightsReservations } from "../../_hooks/use-venue-insights";
import { hourLabel, InsightsBarChart, InsightsPanel, ProportionBars, type ProportionRow } from "../insights-charts";
import { MiniStat, MiniStatGrid, StatGrid, TextStatCard } from "../insights-metric-card";
import { plural, TabError, TabSkeleton } from "../insights-states";

const count = (n: number) => n.toLocaleString("pt-BR");
const sourceLabel = (source: string) => (VENUE_RESERVATION_SOURCE_LABEL as Record<string, string | undefined>)[source] ?? source;

// Canceladas e no-show em cinza: a cor fica com o caminho que deu certo.
const MUTED = "var(--muted-foreground)";

export function ReservasTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const reservations = useVenueInsightsReservations(orgId, params);

  if (reservations.isLoading) return <TabSkeleton />;
  if (reservations.isError || !reservations.data) return <TabError onRetry={() => void reservations.refetch()} />;

  const data = reservations.data;
  const s = data.summary;
  const c = data.conversion;
  const w = data.waitlist;

  const statusRows: ProportionRow[] = [
    { key: "created", label: "Criadas", value: s.createdCount, display: count(s.createdCount) },
    { key: "confirmed", label: "Confirmadas", value: s.confirmedCount, display: count(s.confirmedCount) },
    { key: "completed", label: "Concluídas", value: s.completedCount, display: count(s.completedCount) },
    { key: "canceled", label: "Canceladas", value: s.canceledCount, display: count(s.canceledCount), color: MUTED },
    { key: "noshow", label: "No-show", value: s.noShowCount, display: count(s.noShowCount), color: MUTED },
  ];

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard label="Reservas criadas" icon="calendar" value={s.createdCount} />
        <TextStatCard label="Comparecimento" icon="check-circle" value={formatRate(s.attendanceRate)} hint={plural(s.completedCount, "reserva concluída", "reservas concluídas")} />
        <TextStatCard label="No-show" icon="calendar-check" value={formatRate(s.noShowRate)} tone={s.noShowCount > 0 ? "warning" : "default"} hint={plural(s.noShowCount, "reserva sem comparecimento", "reservas sem comparecimento")} />
        <StatCard label="Clientes sentados" icon="chair" value={s.seatedGuests} hint={`de ${count(s.expectedGuests)} esperados`} />
      </StatGrid>

      <MiniStatGrid>
        <MiniStat label="Clientes esperados" value={count(s.expectedGuests)} />
        <MiniStat label="Sem mesa atribuída" value={count(s.withoutTableCount)} tone={s.withoutTableCount > 0 ? "warning" : "default"} />
        <MiniStat label="Reservas com comanda" value={count(c.reservationsWithTabCount)} note={`Faturaram ${formatBRLCents(c.revenueFromReservationsCents)}`} />
        <MiniStat label="Ticket médio das reservas" value={c.averageTicketFromReservations !== null ? formatBRLCents(c.averageTicketFromReservations) : "—"} />
      </MiniStatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel title="Status das reservas" description="Fatia de cada status sobre as reservas criadas" empty={s.createdCount === 0} emptyIcon="calendar" emptyTitle="Sem reservas no período" emptyDescription="Os status aparecem aqui conforme as reservas forem criadas.">
          <ProportionBars rows={statusRows} total={s.createdCount} />
        </InsightsPanel>
        <InsightsPanel title="Origem das reservas" description="Por onde as reservas chegaram" empty={data.bySource.length === 0} emptyIcon="calendar" emptyTitle="Sem reservas no período" emptyDescription="A origem aparece aqui conforme as reservas forem criadas.">
          <ProportionBars rows={data.bySource.map((src) => ({ key: src.source, label: sourceLabel(src.source), value: src.count, display: count(src.count) }))} />
        </InsightsPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsBarChart title="Reservas por dia da semana" kind="count" seriesLabel="Reservas" color="var(--chart-2)" loading={false} data={data.byWeekday.map((d) => ({ label: d.label.slice(0, 3), value: d.count }))} />
        <InsightsBarChart title="Reservas por horário" description="Horário reservado" kind="count" seriesLabel="Reservas" color="var(--chart-2)" loading={false} data={data.byHour.map((h) => ({ label: hourLabel(h.hour), value: h.count }))} />
      </div>

      <InsightsPanel title="Fila de espera" description="Quem entrou na fila e o que aconteceu depois" empty={w.totalEntries === 0} emptyIcon="users" emptyTitle="Sem fila de espera no período" emptyDescription="As entradas na fila aparecem aqui conforme forem registradas.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MiniStat label="Entradas" value={count(w.totalEntries)} />
          <MiniStat label="Sentaram" value={count(w.seatedCount)} />
          <MiniStat label="Saíram sem sentar" value={count(w.leftCount)} tone={w.leftCount > 0 ? "warning" : "default"} />
          <MiniStat label="Canceladas" value={count(w.canceledCount)} />
          <MiniStat label="Conversão" value={formatRate(w.conversionRate)} />
          <MiniStat label="Espera média" value={formatDurationMs(w.averageWaitTimeMs)} />
          <MiniStat label="Faturamento gerado" value={formatBRLCents(w.revenueCents)} />
        </div>
      </InsightsPanel>
    </div>
  );
}
