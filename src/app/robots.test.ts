import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Fase 5.1, Etapa 6/13 — robots.txt depende do host (mesmo build atende as
 * três superfícies). `next/headers` só funciona dentro do request scope do
 * Next em runtime real, então mockamos aqui pra controlar o host por teste.
 */
async function robotsForHost(host: string) {
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    headers: async () => ({ get: (key: string) => (key === "host" ? host : null) }),
  }));
  const { default: robots } = await import("./robots");
  return robots();
}

describe("robots — indexação por superfície", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("www.nokta.live (institucional) é totalmente indexável e expõe sitemap", async () => {
    const result = await robotsForHost("www.nokta.live");
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe("https://www.nokta.live/sitemap.xml");
  });

  it("app.nokta.live (plataforma) nunca é indexável", async () => {
    const result = await robotsForHost("app.nokta.live");
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("noktatickets.com.br (bilheteria) continua indexável, só bloqueando áreas privadas", async () => {
    const result = await robotsForHost("www.noktatickets.com.br");
    const rules = result.rules as { userAgent: string; allow: string; disallow: string[] };
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toContain("/dashboard");
    expect(rules.disallow).toContain("/perfil");
  });
});
