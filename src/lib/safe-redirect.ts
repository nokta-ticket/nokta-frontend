/**
 * Valida que um `redirect` vindo de query string é um caminho interno seguro
 * — nunca um domínio externo. Bloqueia "//host", "/\host" (protocol-relative)
 * e qualquer coisa com "://" embutido, que navegadores/alguns parsers ainda
 * interpretam como absoluto mesmo começando com "/".
 */
export function isSafeInternalRedirect(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//") || path.startsWith("/\\")) return false;
  if (path.includes("://")) return false;
  return true;
}
