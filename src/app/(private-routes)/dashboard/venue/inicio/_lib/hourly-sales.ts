/**
 * O Insights devolve `salesByHour` por dia+hora ("YYYY-MM-DDTHH" → { hour }),
 * então um período de vários dias traz a mesma hora repetida. A Início mostra
 * o padrão do dia: soma tudo nas 24 horas.
 */
export function hourlyTotals(entries: { hour: number; amountCents: number }[]): number[] {
  const totals = Array.from({ length: 24 }, () => 0);
  for (const e of entries) {
    if (e.hour >= 0 && e.hour < 24) totals[e.hour] += e.amountCents;
  }
  return totals;
}

/** Hora de maior venda, ou null se não houve venda nenhuma. */
export function peakHour(totals: number[]): number | null {
  let best: number | null = null;
  totals.forEach((v, h) => {
    if (v > 0 && (best === null || v > totals[best])) best = h;
  });
  return best;
}
