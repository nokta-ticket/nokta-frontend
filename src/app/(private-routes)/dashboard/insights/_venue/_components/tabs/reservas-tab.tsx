"use client";

import { formatCentsBRL, formatDurationMs, formatRate, type VenueInsightsFilterParams } from "@/services/venue-insights";
import { useVenueInsightsReservations } from "../../_hooks/use-venue-insights";
import { InsightsCountByWeekdayChart } from "../insights-charts";
import { InsightsRankingTable } from "../insights-ranking-table";
import { MetricsSkeleton } from "../../../../_components/states/loading-state";

export function ReservasTab({ orgId, params }: { orgId: number; params: VenueInsightsFilterParams }) {
  const { data, isLoading } = useVenueInsightsReservations(orgId, params);

  if (isLoading || !data) {
    return <MetricsSkeleton count={4} />;
  }

  const weekdayRows = data.byWeekday.map((w) => ({ label: w.label.slice(0, 3), count: w.count }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicator label="Reservas criadas" value={String(data.summary.createdCount)} />
        <Indicator label="Confirmadas" value={String(data.summary.confirmedCount)} />
        <Indicator label="Concluídas" value={String(data.summary.completedCount)} />
        <Indicator label="Canceladas" value={String(data.summary.canceledCount)} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicator label="No-shows" value={String(data.summary.noShowCount)} tone={data.summary.noShowCount > 0 ? "warning" : "neutral"} />
        <Indicator label="Taxa de no-show" value={formatRate(data.summary.noShowRate)} />
        <Indicator label="Taxa de comparecimento" value={formatRate(data.summary.attendanceRate)} />
        <Indicator label="Sem mesa atribuída" value={String(data.summary.withoutTableCount)} />
        <Indicator label="Clientes esperados" value={String(data.summary.expectedGuests)} />
        <Indicator label="Clientes sentados" value={String(data.summary.seatedGuests)} />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="text-sm font-medium">Conversão em vendas</h3>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><p className="text-xs text-black/50">Reservas com comanda</p><p className="text-lg font-semibold">{data.conversion.reservationsWithTabCount}</p></div>
          <div><p className="text-xs text-black/50">Faturamento gerado</p><p className="text-lg font-semibold">{formatCentsBRL(data.conversion.revenueFromReservationsCents)}</p></div>
          <div><p className="text-xs text-black/50">Ticket médio</p><p className="text-lg font-semibold">{data.conversion.averageTicketFromReservations !== null ? formatCentsBRL(data.conversion.averageTicketFromReservations) : "—"}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InsightsCountByWeekdayChart data={weekdayRows} isLoading={isLoading} title="Reservas por dia da semana" />
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Por origem</h3>
          <InsightsRankingTable
            rows={data.bySource}
            keyExtractor={(r) => r.source}
            emptyTitle="Sem reservas no período"
            emptyDescription="A origem das reservas aparecerá aqui conforme forem criadas."
            columns={[
              { header: "Origem", render: (r) => r.source },
              { header: "Quantidade", align: "right", mobileLabel: "Quantidade", render: (r) => String(r.count) },
            ]}
          />
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="text-sm font-medium">Fila de espera</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><p className="text-xs text-black/50">Entradas</p><p className="text-lg font-semibold">{data.waitlist.totalEntries}</p></div>
          <div><p className="text-xs text-black/50">Sentaram</p><p className="text-lg font-semibold">{data.waitlist.seatedCount}</p></div>
          <div><p className="text-xs text-black/50">Saíram sem sentar</p><p className="text-lg font-semibold">{data.waitlist.leftCount}</p></div>
          <div><p className="text-xs text-black/50">Canceladas</p><p className="text-lg font-semibold">{data.waitlist.canceledCount}</p></div>
          <div><p className="text-xs text-black/50">Taxa de conversão</p><p className="text-lg font-semibold">{formatRate(data.waitlist.conversionRate)}</p></div>
          <div><p className="text-xs text-black/50">Tempo médio de espera</p><p className="text-lg font-semibold">{formatDurationMs(data.waitlist.averageWaitTimeMs)}</p></div>
          <div><p className="text-xs text-black/50">Faturamento gerado</p><p className="text-lg font-semibold">{formatCentsBRL(data.waitlist.revenueCents)}</p></div>
        </div>
      </div>
    </div>
  );
}

function Indicator({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "warning" }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-3">
      <p className="text-xs text-black/50">{label}</p>
      <p className={`text-lg font-semibold ${tone === "warning" ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
