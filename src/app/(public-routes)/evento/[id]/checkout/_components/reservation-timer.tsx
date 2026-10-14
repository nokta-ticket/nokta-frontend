import { StatusBadge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

/** Chip da contagem regressiva da reserva: neutro → amarelo nos últimos 2 min → vermelho ao esgotar. */
export function ReservationTimer({ display, secondsLeft, expired }: { display: string; secondsLeft: number | null; expired: boolean }) {
  const tone = expired ? "danger" : secondsLeft !== null && secondsLeft <= 120 ? "warning" : "neutral";
  return (
    <StatusBadge tone={tone} dot={false} className="h-8 px-3 text-sm tnum">
      <Icon name="clock" size={12} />
      {expired ? "Tempo esgotado" : display}
    </StatusBadge>
  );
}
