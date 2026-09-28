// Conectivos que ficam minúsculos no meio do nome ("Maria da Silva").
const NAME_PARTICLES = new Set(["da", "de", "do", "das", "dos", "e"]);

/**
 * Normaliza um nome para "Primeira Letra Maiúscula", independente de como foi
 * digitado ("VITOR DA SILVA", "vitor da silva" → "Vitor da Silva").
 * Nomes compostos com hífen/apóstrofo também ("ana-maria d'avila" → "Ana-Maria D'Avila").
 */
export function toNameCase(full: string): string {
  return full
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i > 0 && NAME_PARTICLES.has(word)
        ? word
        : word.replace(/(^|[-'])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase("pt-BR")),
    )
    .join(" ");
}
