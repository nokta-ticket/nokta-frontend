import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fase 5.3, Etapa 1/2/5 — o Root Layout não pode usar nenhuma API dinâmica
 * (headers/cookies/searchParams): isso forçaria as TRÊS superfícies a
 * renderizar 100% dinâmicas, impedindo cache real em qualquer rota (ver
 * docs/platform/surfaces.md §18.2/§19 — era exatamente esse o bug). Em
 * troca, toda rota que exige sessão precisa declarar `force-dynamic`
 * explicitamente (nunca ficar estática por padrão só porque o Root Layout
 * parou de forçar isso globalmente).
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

describe("Root Layout — sem API dinâmica (Fase 5.3, Etapa 2)", () => {
  const source = fs.readFileSync(path.join(HERE, "layout.tsx"), "utf8");

  it("nunca importa headers/cookies de next/headers", () => {
    expect(source).not.toMatch(/from ["']next\/headers["']/);
  });

  it("renderiza incondicionalmente o mesmo shell (header/footer genérico) — decisão de host não vive mais aqui", () => {
    expect(source).not.toMatch(/isMarketing/);
    expect(source).not.toMatch(/resolveSurfaceFromHost/);
  });
});

describe("Rotas privadas — force-dynamic explícito (Fase 5.3, Etapa 5)", () => {
  it("(private-routes)/layout.tsx declara force-dynamic", () => {
    const source = fs.readFileSync(
      path.join(HERE, "(private-routes)", "layout.tsx"),
      "utf8",
    );
    expect(source).toMatch(/export const dynamic = ["']force-dynamic["']/);
  });

  it("favoritos/layout.tsx declara force-dynamic (exige sessão, mesmo vivendo em (public-routes) por convenção de pasta)", () => {
    const source = fs.readFileSync(
      path.join(HERE, "(public-routes)", "favoritos", "layout.tsx"),
      "utf8",
    );
    expect(source).toMatch(/export const dynamic = ["']force-dynamic["']/);
  });
});

describe("Landing institucional — cache real (Fase 5.3, Etapa 4)", () => {
  it("declara revalidate — Next pode gerar estaticamente e servir do cache de CDN", () => {
    const source = fs.readFileSync(
      path.join(HERE, "(public-routes)", "institucional", "page.tsx"),
      "utf8",
    );
    expect(source).toMatch(/export const revalidate = \d+/);
  });

  it("não importa next/headers (senão o revalidate não teria efeito)", () => {
    const source = fs.readFileSync(
      path.join(HERE, "(public-routes)", "institucional", "page.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/from ["']next\/headers["']/);
  });
});
