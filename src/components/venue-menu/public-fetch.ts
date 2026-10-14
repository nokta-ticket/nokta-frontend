import { getApiBaseUrl } from "@/lib/surfaces";

/**
 * Busca de dados das páginas públicas do estabelecimento (cardápio, home,
 * avaliação) feita no SERVIDOR — nunca client-side puro (evita o round-trip
 * "baixar JS → hidratar → só então buscar", sentido como atraso no celular).
 *
 * No modo mock (`NEXT_PUBLIC_MOCK_API=1`, flag inlinada no build) o fetch
 * real não existe, então a resposta vem dos mesmos handlers que o axios usa
 * (`mockFetchJson`). Em produção o bloco vira código morto e o módulo de
 * mocks nem entra no bundle — mesmo padrão de `src/lib/axios.ts`.
 */
export async function fetchVenuePublic<T>(host: string | null, path: string): Promise<T | null> {
  if (process.env.NEXT_PUBLIC_MOCK_API === "1") {
    const { mockFetchJson } = await import("@/mocks/adapter");
    const result = mockFetchJson(path);
    return result && result.status < 400 ? (result.data as T) : null;
  }
  try {
    const res = await fetch(`${getApiBaseUrl(host)}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
