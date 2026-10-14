/**
 * Agenda: eventos REAIS de outras plataformas, listados na Nokta com link
 * pra venda oficial (a Nokta não vende esses ingressos). Fontes:
 * - "ticketmaster": API Discovery + programa de afiliados (Impact).
 * - "sympla": eventos em que um produtor convidou a Nokta como afiliada
 *   (lista curada em src/content/agenda/curated.ts).
 */
export type AgendaSource = "ticketmaster" | "sympla" | "shotgun" | "outra";

export interface AgendaEvent {
  /** Único entre fontes: "tm-<id>", "sy-<slug>"… */
  id: string;
  source: AgendaSource;
  name: string;
  /** "YYYY-MM-DD" (horário de Brasília) */
  date: string;
  /** "HH:mm" ou null quando a fonte não informa */
  time: string | null;
  venue: string | null;
  city: string | null;
  uf: string | null;
  address: string | null;
  /** Imagem servida pela própria fonte (licença do feed oficial). */
  image: string | null;
  /** Link de venda oficial, já com rastreio de afiliado quando houver. */
  url: string;
  priceMin: number | null;
  priceMax: number | null;
  /** "onsale" | "offsale" | "cancelled" | "postponed" | "rescheduled" */
  status: string | null;
  genre: string | null;
}

export const SOURCE_LABEL: Record<AgendaSource, string> = {
  ticketmaster: "Ticketmaster",
  sympla: "Sympla",
  shotgun: "Shotgun",
  outra: "site oficial",
};
