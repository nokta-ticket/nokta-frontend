import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fase 5.1, Etapa 9 — links mortos do rodapé (e dos headers, que sofreram o
 * mesmo tipo de deriva: /ajuda e /suporte nunca existiram como página).
 * Estático de propósito: lê o código-fonte e confere cada href interno
 * contra a lista de rotas reais do App Router — pega regressão sem precisar
 * renderizar componente nem subir servidor.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));

// Rotas reais conhecidas (Etapa 9) — qualquer href interno novo nos
// arquivos abaixo precisa estar aqui OU corresponder a uma pasta real em
// src/app; mantido curto de propósito, só o que os componentes de
// navegação global (footer, headers) de fato referenciam hoje.
const KNOWN_REAL_ROUTES = new Set([
  "/",
  "/eventos",
  "/revenda",
  "/termos",
  "/privacidade",
  "/perfil",
  "/meus-ingressos",
  "/favoritos",
  "/login",
  "/register",
  "/dashboard/eventos",
  "/dashboard/eventos/onboarding",
  "/admin",
]);

function extractInternalHrefs(source: string): string[] {
  const matches = [...source.matchAll(/href=[{"'](?:`)?(\/[a-zA-Z0-9\-/]*)/g)];
  return matches.map((m) => m[1]).filter((href) => href.length > 0);
}

function assertNoDeadLinks(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  const hrefs = extractInternalHrefs(source);
  const dead = hrefs.filter((href) => !KNOWN_REAL_ROUTES.has(href));
  expect(dead, `links não reconhecidos em ${path.basename(filePath)}: ${dead.join(", ")}`).toEqual([]);
}

describe("rodapé e headers — nenhum link interno morto (Etapa 9)", () => {
  it("footer.tsx só usa rotas reais", () => {
    assertNoDeadLinks(path.join(HERE, "footer.tsx"));
  });

  it("header-public.tsx só usa rotas reais (sem /ajuda nem /suporte)", () => {
    const source = fs.readFileSync(path.join(HERE, "header-public.tsx"), "utf8");
    expect(source).not.toContain("/ajuda");
    expect(source).not.toContain("'/suporte'");
    assertNoDeadLinks(path.join(HERE, "header-public.tsx"));
  });

  it("header-private.tsx só usa rotas reais (sem /ajuda nem /suporte como rota interna)", () => {
    const source = fs.readFileSync(path.join(HERE, "header-private.tsx"), "utf8");
    expect(source).not.toContain("href: '/ajuda'");
    expect(source).not.toContain("href: '/suporte'");
  });

  it("footer.tsx não referencia mais /minha-conta, /ingressos, /notificacoes, /faq ou /contato", () => {
    const source = fs.readFileSync(path.join(HERE, "footer.tsx"), "utf8");
    for (const deadRoute of ["/minha-conta", "/ingressos", "/notificacoes", "/faq", "/contato"]) {
      expect(source).not.toContain(`"${deadRoute}"`);
    }
  });
});
