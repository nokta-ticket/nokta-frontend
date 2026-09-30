/**
 * Estado de presença das reservas do dia, do jeito que a operação precisa
 * ler na Início: quem chegou, quem ainda falta e quem não veio. "Confirmada"
 * não é presença — o cliente pode confirmar e não aparecer — então
 * PENDING e CONFIRMED contam igual (aguardando) até a tolerância passar.
 *
 * A tolerância só muda a EXIBIÇÃO: nada é gravado como NO_SHOW aqui.
 */
export type ReservationPresence = "ARRIVED" | "WAITING" | "NO_SHOW" | "CANCELED";

export const NO_SHOW_TOLERANCE_MS = 15 * 60 * 1000;

export interface PresenceInput {
  status: string;
  startAt: string;
}

export function reservationPresence(r: PresenceInput, nowMs: number): ReservationPresence {
  switch (r.status) {
    case "SEATED":
    case "COMPLETED":
      return "ARRIVED";
    case "CANCELED":
      return "CANCELED";
    case "NO_SHOW":
      return "NO_SHOW";
    default:
      return nowMs >= new Date(r.startAt).getTime() + NO_SHOW_TOLERANCE_MS ? "NO_SHOW" : "WAITING";
  }
}

export function summarizePresence<T extends PresenceInput>(list: T[], nowMs: number) {
  const withPresence = list.map((r) => ({ ...r, presence: reservationPresence(r, nowMs) }));
  const count = (p: ReservationPresence) => withPresence.filter((r) => r.presence === p).length;
  return {
    total: list.length,
    arrived: count("ARRIVED"),
    waiting: count("WAITING"),
    noShow: count("NO_SHOW"),
    canceled: count("CANCELED"),
    // O que ainda pede ação: quem não veio e quem falta chegar, em ordem de horário.
    actionable: withPresence
      .filter((r) => r.presence === "NO_SHOW" || r.presence === "WAITING")
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
  };
}
