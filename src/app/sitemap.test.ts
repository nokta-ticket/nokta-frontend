import { describe, expect, it, vi, beforeEach } from "vitest";

async function sitemapForHost(host: string) {
  vi.resetModules();
  vi.doMock("next/headers", () => ({
    headers: async () => ({ get: (key: string) => (key === "host" ? host : null) }),
  }));
  vi.doMock("@/lib/seo/public-events", () => ({
    getPublicNoktaEvents: async () => [{ id: "1", slug: "baile-neon", nome: "Baile Neon", data: "2099-01-01", horario: "23:00", local: "Galpão", thumbnails: [], ativo: true, endereco: { localidade: "São Paulo", uf: "SP", cep: "", logradouro: "", bairro: "", numero: "" } }],
  }));
  vi.doMock("@/lib/agenda", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/agenda")>();
    return {
      ...actual,
      getAgenda: async () => [{ id: "tm-1", source: "ticketmaster", name: "Show", date: "2099-01-02", time: null, venue: null, city: "Rio de Janeiro", uf: "RJ", address: null, image: null, url: "https://example.com", priceMin: null, priceMax: null, status: null, genre: null }],
    };
  });
  const { default: sitemap } = await import("./sitemap");
  return sitemap();
}

describe("sitemap — só URLs do host que está servindo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("www.nokta.live lista a LP, os índices e todo o conteúdo do registry", async () => {
    const urls = (await sitemapForHost("www.nokta.live")).map((e) => e.url);
    expect(urls).toContain("https://www.nokta.live");
    expect(urls).toContain("https://www.nokta.live/solucoes");
    expect(urls).toContain("https://www.nokta.live/solucoes/lista-vip");
    expect(urls).toContain("https://www.nokta.live/termos");
    expect(urls.every((u) => u.startsWith("https://www.nokta.live"))).toBe(true);
    expect(urls).not.toContain("https://www.nokta.live/para-produtores");
  });

  it("app.nokta.live (plataforma) nunca deveria ter sitemap com URLs", async () => {
    const entries = await sitemapForHost("app.nokta.live");
    expect(entries).toEqual([]);
  });

  it("noktatickets.com.br lista eventos da Nokta, agenda, cidades com evento e legais", async () => {
    const urls = (await sitemapForHost("www.noktatickets.com.br")).map((e) => e.url);
    expect(urls).toContain("https://www.noktatickets.com.br");
    expect(urls).toContain("https://www.noktatickets.com.br/evento/baile-neon");
    expect(urls).toContain("https://www.noktatickets.com.br/agenda/tm-1");
    expect(urls).toContain("https://www.noktatickets.com.br/eventos/em/sao-paulo");
    expect(urls).toContain("https://www.noktatickets.com.br/eventos/em/rio-de-janeiro");
    expect(urls).not.toContain("https://www.noktatickets.com.br/eventos/em/recife");
    expect(urls).toContain("https://www.noktatickets.com.br/termos-bilheteria");
    expect(urls.every((u) => u.startsWith("https://www.noktatickets.com.br"))).toBe(true);
  });
});
