import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const PRODUTOR_DIR = path.join(__dirname, "..", "..", "(painel-produtor)", "produtor");

/**
 * Fase 5 — `/produtor/*` foi unificado dentro de `/dashboard` (mesmo padrão
 * da inversão Venue/Tickets da Fase 4, ver `canonical-routes.test.ts`): o
 * shell/sidebar/header próprios do painel do produtor foram removidos, e
 * toda rota antiga virou um `RouteRedirect` fino pra rota canônica
 * correspondente dentro de `/dashboard`. Ver
 * docs/platform/unified-navigation.md "Fase 5" (repo `nokta-api`).
 */
const REMOVED_FILES = [
  "layout.tsx",
  "_components/sidebar.tsx",
  "_components/sidebar-nav.tsx",
  "_components/sidebar-links.tsx",
  "_components/sidebar-user-footer.tsx",
  "_components/logo-painel.tsx",
  "_components/n2-verification-banner.tsx",
  "eventos/_components/EventoPage.tsx",
  "eventos/loading.tsx",
  "financeiro/loading.tsx",
];

const LEGACY_REDIRECT_PAGES: { file: string; expectedPrefix: string }[] = [
  { file: "page.tsx", expectedPrefix: "/dashboard/eventos" },
  { file: "eventos/page.tsx", expectedPrefix: "/dashboard/eventos" },
  { file: "eventos/criar/page.tsx", expectedPrefix: "/dashboard/eventos/criar" },
  { file: "eventos/editar/page.tsx", expectedPrefix: "/dashboard/eventos" },
  { file: "financeiro/page.tsx", expectedPrefix: "/dashboard/financeiro" },
  { file: "metricas/page.tsx", expectedPrefix: "/dashboard/insights" },
  { file: "validar/page.tsx", expectedPrefix: "/dashboard/check-in" },
  { file: "dados-financeiros/page.tsx", expectedPrefix: "/dashboard/eventos/dados-financeiros" },
  { file: "verificar-conta/page.tsx", expectedPrefix: "/dashboard/eventos/verificar-conta" },
  { file: "onboarding/page.tsx", expectedPrefix: "/dashboard/eventos/onboarding" },
];

describe("estruturas transitórias do painel do produtor foram removidas (Fase 5)", () => {
  for (const relativePath of REMOVED_FILES) {
    it(`${relativePath} não existe mais em (painel-produtor)/produtor`, () => {
      expect(fs.existsSync(path.join(PRODUTOR_DIR, relativePath))).toBe(false);
    });
  }
});

describe("rotas antigas /produtor/* redirecionam para a rota canônica correspondente em /dashboard", () => {
  for (const { file, expectedPrefix } of LEGACY_REDIRECT_PAGES) {
    it(`produtor/${file} redireciona para ${expectedPrefix}`, () => {
      const content = fs.readFileSync(path.join(PRODUTOR_DIR, file), "utf8");
      const match = content.match(/to=\{?[`"]([^`"]+)[`"]/);
      expect(match, `produtor/${file} não usa RouteRedirect to="..."`).not.toBeNull();
      expect(match![1].startsWith(expectedPrefix)).toBe(true);
    });
  }

  it("produtor/eventos/[id]/page.tsx redireciona dinamicamente para /dashboard/eventos/${id}", () => {
    const content = fs.readFileSync(path.join(PRODUTOR_DIR, "eventos", "[id]", "page.tsx"), "utf8");
    expect(content).toMatch(/RouteRedirect to=\{`\/dashboard\/eventos\/\$\{id\}`\}/);
  });
});
