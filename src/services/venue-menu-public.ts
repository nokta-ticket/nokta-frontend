import api from "@/lib/axios";

export interface PublicMenuPrice {
  variantId: number;
  variantNome: string;
  basePriceCents: number;
  overridePriceCents: number | null;
  effectivePriceCents: number;
}

export interface PublicMenuItem {
  id: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  available: boolean;
  prices: PublicMenuPrice[];
  favoriteCount: number;
  favoritedByVisitor: boolean;
}

export interface PublicMenuCategory {
  id: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  items: PublicMenuItem[];
}

export interface PublicVenueProfile {
  logoUrl: string | null;
  address: string | null;
  instagramUrl: string | null;
  whatsappNumber: string | null;
}

export interface PublicMenuResponse {
  organizationName: string;
  profile: PublicVenueProfile;
  menu: {
    nome: string;
    descricao: string | null;
    highlights: PublicMenuItem[];
    categories: PublicMenuCategory[];
  };
}

export const venueMenuPublicApi = {
  getByOrgSlug: (orgSlug: string, visitorToken: string) =>
    api
      .get<PublicMenuResponse>(`/cardapio-publico/${orgSlug}`, { params: { visitorToken } })
      .then((r) => r.data),
  favorite: (orgSlug: string, itemId: number, visitorToken: string) =>
    api
      .post<{ favoriteCount: number }>(`/cardapio-publico/${orgSlug}/itens/${itemId}/favoritar`, { visitorToken })
      .then((r) => r.data),
  unfavorite: (orgSlug: string, itemId: number, visitorToken: string) =>
    api
      .delete<{ favoriteCount: number }>(`/cardapio-publico/${orgSlug}/itens/${itemId}/favoritar`, {
        params: { visitorToken },
      })
      .then((r) => r.data),
};

const VISITOR_TOKEN_KEY = "nokta_cardapio_visitor_token";

/**
 * ID anônimo do visitante do cardápio público (nunca uma conta/login) —
 * gerado uma vez e persistido em localStorage, usado só para decidir
 * favoritos/destaques (ver VenueMenuItemFavorite no backend). Trocar de
 * navegador ou limpar dados gera um token novo — limitação aceita
 * explicitamente (mais estável que IP, que muda a cada troca de torre 4G).
 */
export function getVisitorToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(VISITOR_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_TOKEN_KEY, token);
  }
  return token;
}

/** Formata centavos em "R$ 0,00" — mesma regra usada no restante do app. */
export function formatCentsBRL(value: number): string {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
