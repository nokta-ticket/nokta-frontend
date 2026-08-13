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

  it("Fase 5.2, Etapa 7: dashboard em app.nokta.live sem cookie auxiliar nenhum termina no login, nunca renderiza o dashboard", async () => {
    // 1º hop: sem authToken e sem publicRoute pra /dashboard/inicio, o
    // middleware manda pra "/" (REDIRECT_WHEN_NOT_AUTHENTICATION_ROUTE).
    const firstHop = await middleware(buildRequest("https://app.nokta.live/dashboard/inicio"));
    expect(firstHop.status).toBe(307);
    const firstLocation = firstHop.headers.get("location") ?? "";
    expect(firstLocation).not.toContain("/dashboard");

    // 2º hop: seguindo esse redirect, "/" em app.nokta.live (sem authToken)
    // vai pro login — nunca pro dashboard.
    const secondHop = await middleware(buildRequest(new URL(firstLocation, "https://app.nokta.live").toString()));
    expect(secondHop.status).toBe(307);
    expect(secondHop.headers.get("location")).toContain("/login");
  });
});

describe("middleware — Cache-Control por superfície (Fase 5.2/5.3, Etapa 5/18)", () => {
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
    const res = await middleware(buildRequest("https://www.noktatickets.com.br/evento/abc/checkout"));
    const cacheControl = res.headers.get("cache-control") ?? "";
    expect(cacheControl).not.toMatch(/public/);
  });

  it("detalhe de evento (singular) acessado no host institucional vai para a bilheteria, preservando path e query string", async () => {
    const res = await middleware(buildRequest("https://www.nokta.live/evento/abc?utm=teste"));
    const html = await res.text();
    expect(html).toContain("https://www.noktatickets.com.br/evento/abc?utm=teste");
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
