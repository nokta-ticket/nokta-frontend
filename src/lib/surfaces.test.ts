import { describe, expect, it } from "vitest";
import {
  resolveSurfaceFromHost,
  isSurfaceEnforced,
  getSurfaceConfig,
  getApiBaseUrl,
  getPlatformUrl,
  getPublicTicketsUrl,
  getMarketingUrl,
  buildAbsoluteUrl,
  buildPlatformUrl,
  buildTicketsUrl,
  buildMarketingUrl,
  currentSurfaceStateToken,
} from "./surfaces";

/**
 * Fase 5, Etapa 2/5 — configuração central das duas superfícies. Cobre a
 * resolução de host -> superfície, a seleção de API por host (Etapa 5) e a
 * ausência de enforcement no localhost puro (não quebra o dev do dia a dia).
 */
describe("resolveSurfaceFromHost", () => {
  it("reconhece app.nokta.live como PLATFORM", () => {
    expect(resolveSurfaceFromHost("app.nokta.live")).toBe("PLATFORM");
  });

  it("reconhece noktatickets.com.br e www como TICKETS_PUBLIC", () => {
    expect(resolveSurfaceFromHost("noktatickets.com.br")).toBe("TICKETS_PUBLIC");
    expect(resolveSurfaceFromHost("www.noktatickets.com.br")).toBe("TICKETS_PUBLIC");
  });

  it("ignora a porta ao comparar host", () => {
    expect(resolveSurfaceFromHost("app.nokta.live:3000")).toBe("PLATFORM");
  });

  it("host desconhecido (preview, IP, etc.) cai no público — nunca expõe o dashboard por padrão", () => {
    expect(resolveSurfaceFromHost("random-preview-123.vercel.app")).toBe("TICKETS_PUBLIC");
    expect(resolveSurfaceFromHost("192.168.0.1")).toBe("TICKETS_PUBLIC");
    expect(resolveSurfaceFromHost(null)).toBe("TICKETS_PUBLIC");
    expect(resolveSurfaceFromHost(undefined)).toBe("TICKETS_PUBLIC");
  });

  it("app.localhost e tickets.localhost resolvem pra suas superfícies (validação local, Etapa 20)", () => {
    expect(resolveSurfaceFromHost("app.localhost")).toBe("PLATFORM");
    expect(resolveSurfaceFromHost("tickets.localhost")).toBe("TICKETS_PUBLIC");
  });

  it("Fase 5.1: reconhece www.nokta.live, nokta.live (sem www) e marketing.localhost como MARKETING", () => {
    expect(resolveSurfaceFromHost("www.nokta.live")).toBe("MARKETING");
    expect(resolveSurfaceFromHost("nokta.live")).toBe("MARKETING");
    expect(resolveSurfaceFromHost("marketing.localhost")).toBe("MARKETING");
  });
});

describe("isSurfaceEnforced", () => {
  it("localhost puro (sem subdomínio) não aplica separação — preserva o dev do dia a dia", () => {
    expect(isSurfaceEnforced("localhost")).toBe(false);
    expect(isSurfaceEnforced("localhost:3000")).toBe(false);
    expect(isSurfaceEnforced("127.0.0.1")).toBe(false);
  });

  it("hosts de produção e *.localhost com subdomínio aplicam separação", () => {
    expect(isSurfaceEnforced("app.nokta.live")).toBe(true);
    expect(isSurfaceEnforced("noktatickets.com.br")).toBe(true);
    expect(isSurfaceEnforced("app.localhost")).toBe(true);
    expect(isSurfaceEnforced("tickets.localhost")).toBe(true);
  });

  it("preview da Vercel não força separação por padrão (sem domínio fixo pra redirecionar)", () => {
    expect(isSurfaceEnforced("meu-preview-abc.vercel.app")).toBe(false);
  });

  it("host vazio/nulo não aplica separação", () => {
    expect(isSurfaceEnforced(null)).toBe(false);
    expect(isSurfaceEnforced("")).toBe(false);
  });

  it("Fase 5.1: www.nokta.live, nokta.live e marketing.localhost também aplicam separação", () => {
    expect(isSurfaceEnforced("www.nokta.live")).toBe(true);
    expect(isSurfaceEnforced("nokta.live")).toBe(true);
    expect(isSurfaceEnforced("marketing.localhost")).toBe(true);
  });
});

describe("getApiBaseUrl — Etapa 5, seleção de API por host em runtime", () => {
  it("app.nokta.live usa api.nokta.live", () => {
    expect(getApiBaseUrl("app.nokta.live")).toBe(getSurfaceConfig("PLATFORM").apiBaseUrl);
  });

  it("noktatickets.com.br usa api.noktatickets.com.br", () => {
    expect(getApiBaseUrl("noktatickets.com.br")).toBe(getSurfaceConfig("TICKETS_PUBLIC").apiBaseUrl);
  });

  it("localhost (com ou sem subdomínio) sempre usa a API local, nunca produção", () => {
    const local = getApiBaseUrl("localhost");
    expect(getApiBaseUrl("localhost:3000")).toBe(local);
    expect(getApiBaseUrl("app.localhost")).toBe(local);
    expect(getApiBaseUrl("tickets.localhost")).toBe(local);
    expect(getApiBaseUrl("marketing.localhost")).toBe(local);
    expect(local).not.toContain("nokta.live");
    expect(local).not.toContain("noktatickets.com.br");
  });

  it("Fase 5.1: www.nokta.live usa a mesma API pública da bilheteria (LP é estática, sem API própria)", () => {
    expect(getApiBaseUrl("www.nokta.live")).toBe(getSurfaceConfig("MARKETING").apiBaseUrl);
    expect(getApiBaseUrl("www.nokta.live")).toBe(getSurfaceConfig("TICKETS_PUBLIC").apiBaseUrl);
  });
});

describe("URLs absolutas centralizadas (Etapa 2/10)", () => {
  it("getPlatformUrl e getPublicTicketsUrl montam URL absoluta com o host certo", () => {
    expect(getPlatformUrl("/dashboard/inicio")).toBe("https://app.nokta.live/dashboard/inicio");
    expect(getPublicTicketsUrl("/eventos/abc")).toBe("https://www.noktatickets.com.br/eventos/abc");
  });

  it("buildAbsoluteUrl é consistente com os helpers específicos", () => {
    expect(buildAbsoluteUrl("PLATFORM", "/equipe")).toBe(getPlatformUrl("/equipe"));
    expect(buildAbsoluteUrl("TICKETS_PUBLIC", "/perfil")).toBe(getPublicTicketsUrl("/perfil"));
  });

  it("Fase 5.1: getMarketingUrl e os aliases build*Url resolvem pro host institucional", () => {
    expect(getMarketingUrl("/termos")).toBe("https://www.nokta.live/termos");
    expect(buildMarketingUrl("/termos")).toBe(getMarketingUrl("/termos"));
    expect(buildPlatformUrl("/login")).toBe(getPlatformUrl("/login"));
    expect(buildTicketsUrl("/")).toBe(getPublicTicketsUrl("/"));
  });
});

describe("currentSurfaceStateToken — Etapa 9, OAuth state", () => {
  it("fora do browser (SSR) nunca lança e cai no valor mais neutro", () => {
    expect(currentSurfaceStateToken()).toBe("tickets");
  });
});
