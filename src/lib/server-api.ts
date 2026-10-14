import { getApiBaseUrl } from "@/lib/surfaces";
import { SITES } from "@/lib/seo/site";

/**
 * Host pra resolver a API quando não há requisição (páginas estáticas/ISR,
 * generateStaticParams): produção → API da bilheteria; preview da Vercel →
 * API de preview (VERCEL_URL é *.vercel.app); local → NEXT_PUBLIC_API_URL.
 */
export function staticApiHost(): string | null {
  if (process.env.VERCEL_ENV === "production") return new URL(SITES.tickets.url).hostname;
  return process.env.VERCEL_URL ?? null;
}

/**
 * GET na API a partir do SERVIDOR (Server Components, sitemap, metadata).
 * No modo mock (`NEXT_PUBLIC_MOCK_API=1`, inlinado no build) responde com os
 * mesmos handlers do axios; em produção o bloco vira código morto e o módulo
 * de mocks não entra no bundle.
 */
export async function serverApiGet<T>(path: string, opts: { host?: string | null; revalidate?: number | false } = {}): Promise<T | null> {
  if (process.env.NEXT_PUBLIC_MOCK_API === "1") {
    const { mockFetchJson } = await import("@/mocks/adapter");
    const result = mockFetchJson(path);
    return result && result.status < 400 ? (result.data as T) : null;
  }
  try {
    const init: RequestInit & { next?: { revalidate: number } } = opts.revalidate === false || opts.revalidate === undefined ? { cache: "no-store" } : { next: { revalidate: opts.revalidate } };
    const res = await fetch(`${getApiBaseUrl(opts.host ?? null)}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
