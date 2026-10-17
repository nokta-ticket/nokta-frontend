import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

/**
 * Fase 5.1, Etapa 13 — roteamento por host entre as três superfícies.
 * Chama a função `middleware` de verdade (não um mock) com NextRequest
 * construído a partir de uma URL, cobrindo os cruzamentos exigidos pela
 * fase sem precisar de servidor rodando.
 */

function buildRequest(url: string, cookie?: string) {
  return new NextRequest(url, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("middleware — cruzamento entre as três superfícies", () => {
  it("dashboard acessado no host institucional vai para app.nokta.live, preservando o path", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/dashboard/eventos"));
    const html = await res.text();
    expect(html).toContain("https://app.nokta.live/dashboard/eventos");
  });

  it("evento público acessado no host institucional vai para a bilheteria, preservando path e query string", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/eventos/abc?utm=teste"));
    const html = await res.text();
    expect(html).toContain("https://www.noktatickets.com.br/eventos/abc?utm=teste");
  });

  it("rota pública (eventos) acessada em app.nokta.live vai para a bilheteria", async () => {
    const res = await middleware(buildRequest("https://app.nokta.live/eventos?cidade=sp"));
    const html = await res.text();
    expect(html).toContain("https://www.noktatickets.com.br/eventos?cidade=sp");
  });

  it("dashboard acessado no host da bilheteria vai para app.nokta.live", async () => {
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/dashboard/inicio"));
    const html = await res.text();
    expect(html).toContain("https://app.nokta.live/dashboard/inicio");
  });

  it("raiz do host institucional faz rewrite interno pra /institucional (não redirect — é a mesma origem)", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/institucional");
  });

  it("domínio apex sem www (nokta.live) cai no mesmo mecanismo seguro de troca de origem, apontando pro www", async () => {
    const res = await middleware(buildRequest("https://nokta.live/institucional-nao-existe"));
    const html = await res.text();
    expect(html).toContain("https://www.nokta.live/institucional-nao-existe");
  });

  it("rota pública compartilhada (eventos) na bilheteria não gera cruzamento nenhum — sem loop", async () => {
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/eventos"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("landing institucional (via rewrite) não passa por nenhuma checagem de autenticação — LP não depende de login", async () => {
    // Sem cookie "user" nenhum — se dependesse de auth, cairia no ramo de
    // redirect pra "/" (Etapa 7 exige que a LP nunca dependa disso).
    const res = await middleware(buildRequest("https://www.nokta.live/"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/institucional");
    expect(res.status).toBe(200);
  });

  it("cookie auxiliar 'user' forjado (sem sessão real) não desbloqueia rota exclusiva de outra superfície — a troca de host acontece antes de qualquer checagem de auth", async () => {
    const forged = encodeURIComponent(JSON.stringify({ role: "SUPER_ADMIN" }));
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/admin/dashboard", `user=${forged}`));
    const html = await res.text();
    // Mesmo com o cookie forjado indicando admin, o host da bilheteria
    // nunca renderiza rota exclusiva da plataforma — só troca de origem.
    expect(html).toContain("https://app.nokta.live/admin/dashboard");
  });

  it("Fase 5.2, Etapa 7: dashboard em app.nokta.live sem cookie auxiliar nenhum vai direto pro login (com `redirect` de volta), nunca renderiza o dashboard", async () => {
    // Sem authToken e sem publicRoute pra /dashboard/inicio, o middleware
    // manda pro /login guardando o destino em `redirect` (2026-10: antes
    // caía na home sem explicação — parecia um clique morto).
    const res = await middleware(buildRequest("https://app.nokta.live/dashboard/inicio?aba=x"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location") ?? "", "https://app.nokta.live");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/dashboard/inicio?aba=x");
  });

  it("rota protegida da bilheteria sem sessão também vai pro login com `redirect` (o 'Ingressos' da nav inferior)", async () => {
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/meus-ingressos"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location") ?? "", "https://www.noktatickets.com.br");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirect")).toBe("/meus-ingressos");
  });

  it("página de eventos por cidade abre sem login na bilheteria (conteúdo indexável)", async () => {
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/eventos/em/sao-paulo"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("location")).toBeNull();
  });

  it("página de eventos por cidade no host institucional vai para a bilheteria (dona do conteúdo)", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/eventos/em/sao-paulo"));
    expect(await res.text()).toContain("https://www.noktatickets.com.br/eventos/em/sao-paulo");
  });

  it("imagem padrão de compartilhamento (/opengraph-image) abre sem login em qualquer host", async () => {
    for (const host of ["www.noktatickets.com.br", "www.nokta.live"]) {
      const res = await middleware(buildRequest(`https://${host}/opengraph-image`));
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });
});

describe("middleware — Cache-Control por superfície (Fase 5.2/5.3, Etapa 5/18)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("landing institucional: o Middleware faz rewrite puro pra /institucional, sem setar Cache-Control — a página resolve cache real sozinha via `export const revalidate` (Fase 5.3, Etapa 4; o Root Layout não usa mais API dinâmica, então o Next consegue honrar isso de verdade)", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/institucional");
    expect(res.headers.get("cache-control")).toBeNull();
  });

  it("PLATFORM (app.nokta.live) nunca recebe cache público — reforço explícito de private/no-store, mesmo em rota pública compartilhada (ex.: /termos)", async () => {
    const res = await middleware(buildRequest("https://app.nokta.live/termos"));
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("checkout (rota exclusiva da bilheteria) nunca recebe cache público — fica no default seguro do Next, sem header explícito de cache público", async () => {
    // /evento/* dispara a consulta de slug do middleware (resolveEventoIdRedirect);
    // stub de 404 mantém o teste determinístico — sem stub ele fazia fetch REAL
    // na API de produção e estourava o timeout de 5s em rede lenta (flake).
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/abc/checkout"));
    const cacheControl = res.headers.get("cache-control") ?? "";
    expect(cacheControl).not.toMatch(/public/);
  });

  it("detalhe de evento (singular) acessado no host institucional vai para a bilheteria, preservando path e query string", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const res = await middleware(buildRequest("https://www.nokta.live/evento/abc?utm=teste"));
    const html = await res.text();
    expect(html).toContain("https://www.noktatickets.com.br/evento/abc?utm=teste");
  });
});

describe("middleware — redirect provisório do FERVO para a lista VIP (até 00:00 de 18/10)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("antes do prazo, /evento/<slug> e /evento/22 vão pra /vip/<slug> com 307, preservando a query", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T23:00:00Z"));
    for (const url of [
      "https://www.noktatickets.com.br/evento/fervo-house-fervo-music-bar?utm_source=ig",
      "https://www.noktatickets.com.br/evento/22?utm_source=ig",
    ]) {
      const res = await middleware(buildRequest(url));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("https://www.noktatickets.com.br/vip/fervo-house-fervo-music-bar?utm_source=ig");
    }
  });

  it("checkout do FERVO e outros eventos não são afetados", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T23:00:00Z"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ slug: "fervo-house-fervo-music-bar" }), { status: 200 })));
    const checkout = await middleware(buildRequest("https://www.noktatickets.com.br/evento/fervo-house-fervo-music-bar/checkout"));
    expect(checkout.headers.get("location")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ slug: "baile-neon" }), { status: 200 })));
    const outro = await middleware(buildRequest("https://www.noktatickets.com.br/evento/baile-neon"));
    expect(outro.headers.get("location")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("depois da meia-noite de 18/10 o redirect some sozinho", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-18T03:00:00Z"));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ slug: "fervo-house-fervo-music-bar" }), { status: 200 })));
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/fervo-house-fervo-music-bar"));
    expect(res.headers.get("location")).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe("middleware — compatibilidade de /evento/{id-ou-slug-antigo} com link antigo (id numérico ou slug pré-renomeação)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("id numérico com slug cadastrado: 308 real pra /evento/{slug}, preservando sufixo de path (ex.: /checkout)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ slug: "noite-de-marca-maria" }), { status: 200 })),
    );
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/9/checkout"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://www.noktatickets.com.br/evento/noite-de-marca-maria/checkout");
  });

  it("id numérico SEM slug cadastrado: segue normalmente (next), nunca redireciona pra 'undefined'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ slug: null }), { status: 200 })),
    );
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/9"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("evento inexistente (API responde 404): segue normalmente, nunca bloqueia a navegação", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/999999"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("falha de rede no lookup: segue normalmente, nunca derruba a navegação por causa disto", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/9"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("URL já com o slug atual: consulta a API (não dá pra saber sem isso, já que slug antigo também não é numérico), mas nunca redireciona pra si mesma", async () => {
    const fetchSpy = vi.fn(
      async () => new Response(JSON.stringify({ slug: "noite-de-marca-maria" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/noite-de-marca-maria"));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("slug antigo (nome do evento mudou desde que o link foi compartilhado): 308 real pro slug atual, preservando sufixo de path", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ slug: "modo-baile-on" }), { status: 200 })),
    );
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/noite-de-marca-maria/checkout"));
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://www.noktatickets.com.br/evento/modo-baile-on/checkout");
  });
});
