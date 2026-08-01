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
}

export interface PublicMenuCategory {
  id: number;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  organizationName: string;
  menu: {
    nome: string;
    descricao: string | null;
    categories: PublicMenuCategory[];
  };
}

export const venueMenuPublicApi = {
  getByOrgSlug: (orgSlug: string) => api.get<PublicMenuResponse>(`/cardapio-publico/${orgSlug}`).then((r) => r.data),
};

/** Formata centavos em "R$ 0,00" — mesma regra usada no restante do app. */
export function formatCentsBRL(value: number): string {
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
