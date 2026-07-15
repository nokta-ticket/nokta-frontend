import type { VenueReservationsSummary } from "@/services/venue-reservations";

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-[92px] flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-center sm:text-left">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-black/50">{label}</p>
    </div>
  );
}

export function SummaryBar({ summary }: { summary: VenueReservationsSummary | undefined }) {
  if (!summary) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <StatPill label="Reservas" value={summary.totalReservations} />
      <StatPill label="Pessoas esperadas" value={summary.expectedPeople} />
      <StatPill label="Confirmadas" value={summary.confirmed} />
      <StatPill label="Já chegaram" value={summary.seated + summary.completed} />
      <StatPill label="Fila de espera" value={summary.waitlistCount} />
      <StatPill label="No-show" value={summary.noShow} />
    </div>
  );
}
