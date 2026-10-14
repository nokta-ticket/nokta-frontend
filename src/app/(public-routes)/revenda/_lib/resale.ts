import type { Thumbnail } from "@/interfaces/events";
import { MEDIA_FALLBACK, resolveMediaUrl, resolveThumbnailUrl } from "@/lib/media";

/** Evento resumido como vem embutido num anúncio de revenda (GET /revenda, /revenda/:id). */
export interface ResaleEvent {
  id: number | string;
  slug?: string | null;
  nome: string;
  data: string;
  horario: string;
  local?: string | null;
  descricao?: string | null;
  endereco: { logradouro?: string | null; localidade: string; uf: string } | null;
  /** O backend manda `thumbnail` (string); a listagem pública manda `thumbnails` — aceitamos os dois. */
  thumbnail?: string | null;
  thumbnails?: Thumbnail[];
}

export interface ResaleItem {
  id: number;
  /** Preço que o comprador paga pelo ingresso (reais), antes das taxas. */
  buyerPrice: number;
  sellerAmount: number;
  originalPrice: number;
  status: number;
  expiresAt: string;
  /** Taxa de serviço da Nokta (%) — só vem no detalhe. */
  taxaServicoPercent?: number;
  evento: ResaleEvent | null;
  ingresso: { id?: number; nome: string; tipo: number; lote: number } | null;
}

export interface ResaleListResponse {
  data: ResaleItem[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
  paginate?: { total: number; perPage?: number; currentPage?: number; lastPage?: number };
}

export function resaleCover(r: Pick<ResaleItem, "evento">): string {
  const ev = r.evento;
  if (ev?.thumbnails?.length) return resolveThumbnailUrl(ev.thumbnails[0], MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
  return resolveMediaUrl(ev?.thumbnail ?? null, MEDIA_FALLBACK) ?? MEDIA_FALLBACK;
}

export function resalePrice(r: Pick<ResaleItem, "buyerPrice" | "originalPrice">): number {
  return Number(r.buyerPrice ?? r.originalPrice);
}

/** Quanto abaixo do preço original (0 quando é igual ou não dá pra comparar). */
export function resaleDiscountPercent(r: Pick<ResaleItem, "buyerPrice" | "originalPrice">): number {
  const price = resalePrice(r);
  const original = Number(r.originalPrice);
  if (!original || original <= price) return 0;
  return Math.round((1 - price / original) * 100);
}

/** "Pista · 2º lote" — sem repetir o lote quando o nome do ingresso já o traz. */
export function resaleTicketLabel(r: Pick<ResaleItem, "ingresso">): string {
  if (!r.ingresso) return "Ingresso";
  if (/lote/i.test(r.ingresso.nome)) return r.ingresso.nome;
  return `${r.ingresso.nome} · ${r.ingresso.lote}º lote`;
}
