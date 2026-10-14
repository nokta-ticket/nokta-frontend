/**
 * Cidade escolhida no seletor (home e busca). Fica só neste aparelho; sem
 * escolha, as telas usam "auto" (cidade do IP, ver /api/agenda).
 */
const CITY_KEY = "nk_city";

export function readSavedCity(): string | null {
  try {
    return localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export function saveCity(slug: string) {
  try {
    localStorage.setItem(CITY_KEY, slug);
  } catch {
    // Sem armazenamento (aba anônima): vale só nesta visita.
  }
}
