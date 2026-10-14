import type { AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AxiosError, AxiosHeaders, getAdapter } from "axios";
import { handlers } from "./handlers";

/**
 * Adapter de API fictícia (NEXT_PUBLIC_MOCK_API=1). Intercepta as rotas
 * conhecidas (ver src/mocks/handlers/*) e devolve fixtures; o que não
 * conhece segue pro adapter real (e falha normalmente se não houver
 * backend). Nunca ativo em produção — a flag é lida em build time.
 */
function parseBody(data: unknown): unknown {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

export function installMockAdapter(api: AxiosInstance) {
  const realAdapter = getAdapter(api.defaults.adapter ?? ["xhr", "http", "fetch"]);

  const mockAdapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
    const base = config.baseURL ?? "http://mock.local";
    const url = new URL(config.url ?? "", base.endsWith("/") ? base : `${base}/`);
    for (const [k, v] of Object.entries(config.params ?? {})) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    const method = (config.method ?? "get").toLowerCase();
    const params = Object.fromEntries(url.searchParams.entries());

    for (const h of handlers) {
      if (h.method && h.method !== method) continue;
      if (!h.test.test(url.pathname)) continue;
      const result = h.handle({ url, method, body: parseBody(config.data), params });
      if (!result) continue;
      // latência fictícia pra skeletons aparecerem como na vida real
      await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));
      const status = result.status ?? 200;
      const response: AxiosResponse = {
        data: result.data,
        status,
        statusText: status === 200 ? "OK" : "Error",
        headers: new AxiosHeaders({ "content-type": "application/json" }),
        config: config as never,
      };
      if (status >= 400) {
        throw new AxiosError(`Mock ${status}`, String(status), config as never, undefined, response);
      }
      return response;
    }
    return realAdapter(config as never);
  };

  api.defaults.adapter = mockAdapter;
}

/** Pra Server Components (fetch direto): devolve a resposta mock ou null. */
export function mockFetchJson(pathWithQuery: string): { status: number; data: unknown } | null {
  const url = new URL(pathWithQuery, "http://mock.local/api/");
  const params = Object.fromEntries(url.searchParams.entries());
  for (const h of handlers) {
    if (h.method && h.method !== "get") continue;
    if (!h.test.test(url.pathname)) continue;
    const result = h.handle({ url, method: "get", body: null, params });
    if (result) return { status: result.status ?? 200, data: result.data };
  }
  return null;
}
