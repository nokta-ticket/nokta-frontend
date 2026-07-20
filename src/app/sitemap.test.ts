import { describe, expect, it, vi, beforeEach } from "vitest";

async function sitemapForHost(host: string) {
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    headers: async () => ({ get: (key: string) => (key === "host" ? host : null) }),
  }));
  const { default: sitemap } = await import("./sitemap");
  return sitemap();
}

describe("sitemap — só existe (com URLs) pra www.nokta.live", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("www.nokta.live lista a home institucional e as páginas institucionais reais", async () => {
    const entries = await sitemapForHost("www.nokta.live");
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://www.nokta.live/");
    expect(urls).toContain("https://www.nokta.live/termos");
    expect(urls).toContain("https://www.nokta.live/privacidade");
  });

  it("app.nokta.live (plataforma) nunca deveria ter sitemap com URLs", async () => {
    const entries = await sitemapForHost("app.nokta.live");
    expect(entries).toEqual([]);
  });

  it("noktatickets.com.br não teve sitemap gerado nesta fase — continua vazio, sem mudança de comportamento", async () => {
    const entries = await sitemapForHost("www.noktatickets.com.br");
    expect(entries).toEqual([]);
  });
});
