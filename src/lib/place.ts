import { citySlug } from "@/lib/agenda/city";

/**
 * Lugar que filtra a home e a busca: um estado inteiro ou uma cidade.
 * O IP só decide o ESTADO (localização por IP erra a cidade em região
 * metropolitana: quem está em Mauá aparece como São Paulo). Cidade é sempre
 * escolha da pessoa.
 */
export type Place = { kind: "state" | "city"; slug: string; name: string; uf: string | null; count?: number };

/** Nome e preposição de cada UF ("no estado de São Paulo", "da Bahia"). */
const UF: Record<string, [string, "de" | "do" | "da"]> = {
  AC: ["Acre", "do"],
  AL: ["Alagoas", "de"],
  AP: ["Amapá", "do"],
  AM: ["Amazonas", "do"],
  BA: ["Bahia", "da"],
  CE: ["Ceará", "do"],
  DF: ["Distrito Federal", "do"],
  ES: ["Espírito Santo", "do"],
  GO: ["Goiás", "de"],
  MA: ["Maranhão", "do"],
  MT: ["Mato Grosso", "de"],
  MS: ["Mato Grosso do Sul", "de"],
  MG: ["Minas Gerais", "de"],
  PA: ["Pará", "do"],
  PB: ["Paraíba", "da"],
  PR: ["Paraná", "do"],
  PE: ["Pernambuco", "de"],
  PI: ["Piauí", "do"],
  RJ: ["Rio de Janeiro", "do"],
  RN: ["Rio Grande do Norte", "do"],
  RS: ["Rio Grande do Sul", "do"],
  RO: ["Rondônia", "de"],
  RR: ["Roraima", "de"],
  SC: ["Santa Catarina", "de"],
  SP: ["São Paulo", "de"],
  SE: ["Sergipe", "de"],
  TO: ["Tocantins", "do"],
};

const STATE_PREFIX = "uf-";

export function isUf(value: string | null | undefined): value is string {
  return !!value && value.toUpperCase() in UF;
}

/** "SP" → "uf-sp" (valor salvo no seletor; nunca colide com slug de cidade). */
export function stateSlug(uf: string): string {
  return `${STATE_PREFIX}${uf.toLowerCase()}`;
}

/** "uf-sp" → "SP"; qualquer outra coisa → null. */
export function ufFromSlug(slug: string): string | null {
  if (!slug.startsWith(STATE_PREFIX)) return null;
  const uf = slug.slice(STATE_PREFIX.length).toUpperCase();
  return isUf(uf) ? uf : null;
}

export function statePlace(uf: string, count?: number): Place {
  const code = uf.toUpperCase();
  return { kind: "state", slug: stateSlug(code), name: UF[code]?.[0] ?? code, uf: code, count };
}

/** Trecho de frase: "no estado de São Paulo", "no Distrito Federal", "em Mauá". */
export function placeWhere(place: Place): string {
  if (place.kind === "city") return `em ${place.name}`;
  if (place.uf === "DF") return "no Distrito Federal";
  const prep = place.uf ? UF[place.uf]?.[1] : null;
  return `no estado ${prep ?? "de"} ${place.name}`;
}

/** O evento (cidade + UF) está nesse lugar? */
export function inPlace(place: Place, city: string | null | undefined, uf: string | null | undefined): boolean {
  if (place.kind === "state") return !!uf && uf.toUpperCase() === place.uf;
  return !!city && citySlug(city) === place.slug;
}
