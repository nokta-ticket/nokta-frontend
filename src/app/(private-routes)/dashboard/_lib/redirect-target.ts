/**
 * Monta a URL final de um redirect (rota canônica → antiga, ou antiga →
 * canônica), mesclando a query string que o usuário trouxe com a que o
 * destino já declara (`to`). Em conflito, o valor declarado em `to` sempre
 * vence — evita que um parâmetro incidental do usuário sobrescreva um
 * `?tab=x` que o próprio redirect precisa fixar.
 */
export function buildRedirectTarget(to: string, incomingQuery: string): string {
  const [path, targetQuery] = to.split("?");
  const params = new URLSearchParams(targetQuery ?? "");
  for (const [key, value] of new URLSearchParams(incomingQuery)) {
    if (!params.has(key)) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
