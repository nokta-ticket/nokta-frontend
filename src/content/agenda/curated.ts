import type { AgendaEvent } from "@/lib/agenda/types";

/**
 * Eventos curados à mão — os de plataformas sem API pública em que a Nokta
 * tem permissão de divulgar (ex.: Sympla, quando o produtor convida a Nokta
 * como afiliada e passa o link de afiliado).
 *
 * Regra: só entra evento com link oficial/de afiliado autorizado e imagem
 * que o produtor liberou (ou sem imagem). Nada de copiar arte de outro site.
 *
 * Exemplo de entrada:
 * {
 *   id: "sy-nome-da-festa-2026-11-21",
 *   source: "sympla",
 *   name: "Nome da Festa",
 *   date: "2026-11-21",
 *   time: "23:00",
 *   venue: "Nome da casa",
 *   city: "São Paulo",
 *   uf: "SP",
 *   address: "Rua X, 123",
 *   image: null,
 *   url: "https://www.sympla.com.br/evento/...?..." // link de afiliado
 *   priceMin: 60, priceMax: 120,
 *   status: "onsale",
 *   genre: "Eletrônica",
 * },
 */
export const CURATED_AGENDA: AgendaEvent[] = [];
