/**
 * "São Paulo" → "sao-paulo" (URL das páginas de cidade). Arquivo à parte, sem
 * dependências, pra poder ir pro navegador sem levar o retrato da agenda.
 */
export function citySlug(city: string): string {
  return city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
