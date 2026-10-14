import { citySlug } from "@/lib/agenda";

export interface CityInfo {
  slug: string;
  name: string;
  uf: string | null;
}

/**
 * Cidades com página própria pré-gerada (`/eventos/em/[cidade]`) e que
 * aparecem nos links "outras cidades". Outras cidades também têm página
 * (dynamicParams), desde que tenham pelo menos um evento.
 */
export const MAIN_CITIES: CityInfo[] = [
  { slug: "sao-paulo", name: "São Paulo", uf: "SP" },
  { slug: "rio-de-janeiro", name: "Rio de Janeiro", uf: "RJ" },
  { slug: "belo-horizonte", name: "Belo Horizonte", uf: "MG" },
  { slug: "curitiba", name: "Curitiba", uf: "PR" },
  { slug: "porto-alegre", name: "Porto Alegre", uf: "RS" },
  { slug: "brasilia", name: "Brasília", uf: "DF" },
  { slug: "salvador", name: "Salvador", uf: "BA" },
  { slug: "recife", name: "Recife", uf: "PE" },
  { slug: "fortaleza", name: "Fortaleza", uf: "CE" },
  { slug: "florianopolis", name: "Florianópolis", uf: "SC" },
  { slug: "campinas", name: "Campinas", uf: "SP" },
  { slug: "goiania", name: "Goiânia", uf: "GO" },
];

export function mainCity(slug: string): CityInfo | undefined {
  return MAIN_CITIES.find((c) => c.slug === slug);
}

export function cityPath(cityOrSlug: string): string {
  return `/eventos/em/${citySlug(cityOrSlug)}`;
}
