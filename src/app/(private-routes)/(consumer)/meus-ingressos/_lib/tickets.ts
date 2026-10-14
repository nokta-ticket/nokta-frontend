import type { Tone } from "@/components/ui/badge";
import { formatEventDate, formatTime } from "@/lib/format";

/** Item de `GET /tickets` (carteira do comprador). */
export interface UserTicket {
  id: number;
  code: string;
  status: number;
  createdAt: string;
  event: {
    id: number;
    nome: string;
    data: string | null;
    horario: string | null;
    thumbnail: string | null;
    endereco: { localidade: string; uf: string } | null;
  } | null;
  ticket: {
    id: number;
    nome: string;
    tipo: number;
    valor: number;
    lote?: number;
  };
}

/** `GET /tickets/:id` — mesmo ingresso com o evento completo. */
export interface TicketDetail {
  id: number;
  code: string;
  status: number;
  createdAt: string;
  orderId: number;
  event: {
    id: number;
    slug?: string | null;
    nome: string;
    descricao?: string | null;
    data: string | null;
    horario: string | null;
    local?: string | null;
    thumbnails: { id: number; path: string }[];
    endereco: {
      cep?: string;
      logradouro: string;
      bairro?: string;
      localidade: string;
      numero: string;
      uf: string;
    } | null;
  } | null;
  ticket: {
    id: number;
    nome: string;
    tipo: number;
    valor: number;
    lote: number;
  };
}

export interface PaginateInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

/**
 * UserTicketStatus do backend. 1 e 2 são os que a tela sempre tratou; 3 e 4
 * entram com tom semântico pra nunca aparecer "sem status" — se o backend
 * usar outro significado, só o rótulo muda aqui.
 */
export const TICKET_STATUS_META: Record<number, { label: string; tone: Tone }> = {
  1: { label: "Válido", tone: "success" },
  2: { label: "Usado", tone: "neutral" },
  3: { label: "Em revenda", tone: "warning" },
  4: { label: "Cancelado", tone: "danger" },
};

export const TIPO_LABELS: Record<number, string> = {
  1: "Inteira",
  2: "Meia-entrada",
  3: "Gratuito",
};

export function ticketStatusMeta(status: number) {
  return TICKET_STATUS_META[status] ?? { label: "Ingresso", tone: "neutral" as Tone };
}

/** Ingresso ainda vale pra entrar: não foi validado E o evento ainda não começou. */
export function isUpcoming(t: Pick<UserTicket, "status" | "event">): boolean {
  if (t.status === 2) return false;
  if (!t.event?.data) return true;

  const dateOnly = t.event.data.slice(0, 10); // YYYY-MM-DD

  // HH:mm do horário — Prisma pode devolver ISO completo ou "HH:mm:ss".
  let hhmm = "23:59";
  if (t.event.horario) {
    const h = t.event.horario;
    if (h.includes("T")) {
      const d = new Date(h);
      hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    } else {
      hhmm = h.slice(0, 5);
    }
  }

  // Compara como UTC (mesmo critério da exibição do horário).
  const eventStart = new Date(`${dateOnly}T${hhmm}:00Z`);
  return eventStart > new Date();
}

/** "Sáb, 17 de outubro · 22h" a partir dos campos crus do evento. */
export function ticketDateLabel(event: { data: string | null; horario: string | null } | null | undefined): string {
  if (!event?.data) return "";
  const date = formatEventDate(event.data);
  const time = formatTime(event.horario);
  if (!time) return date;
  const [h, m] = time.split(":");
  return `${date} · ${h}h${m === "00" ? "" : m}`;
}

/** Agrupa por evento mantendo o primeiro ingresso como representante. */
export function groupByEvent(list: UserTicket[]): { item: UserTicket; count: number }[] {
  const map = new Map<string, { item: UserTicket; count: number }>();
  for (const t of list) {
    const key = String(t.event?.id ?? t.id);
    if (!map.has(key)) map.set(key, { item: t, count: 0 });
    map.get(key)!.count++;
  }
  return Array.from(map.values());
}
