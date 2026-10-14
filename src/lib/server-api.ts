import { getApiBaseUrl } from "@/lib/surfaces";

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
