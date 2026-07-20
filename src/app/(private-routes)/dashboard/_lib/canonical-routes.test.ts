import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const DASHBOARD_DIR = path.join(__dirname, "..");

/**
 * Fase 4: a direção do redirect foi invertida em relação à Fase 3 — a
 * implementação real agora mora nas rotas canônicas (não mais em
 * /dashboard/venue/* ou /dashboard/tickets/*); as rotas antigas é que viram
 * redirects finos para as canônicas. Ver
 * docs/platform/unified-navigation.md "Rotas canônicas — tabela de
 * compatibilidade".
 */
const CANONICAL_OWNS_CONTENT = ["eventos", "reservas", "operacao", "cardapio", "estoque", "financeiro", "insights", "inicio"];

const LEGACY_REDIRECT_PAGES: { file: string; expectedPrefix: string }[] = [
  { file: "venue/inicio/page.tsx", expectedPrefix: "/dashboard/inicio" },
  { file: "tickets/inicio/page.tsx", expectedPrefix: "/dashboard/inicio" },
  { file: "venue/reservas/page.tsx", expectedPrefix: "/dashboard/reservas" },
  { file: "venue/operacao/page.tsx", expectedPrefix: "/dashboard/operacao" },
  { file: "venue/cardapio/page.tsx", expectedPrefix: "/dashboard/cardapio" },
  { file: "venue/estoque/page.tsx", expectedPrefix: "/dashboard/estoque" },
  { file: "venue/financeiro/page.tsx", expectedPrefix: "/dashboard/financeiro" },
  { file: "venue/insights/page.tsx", expectedPrefix: "/dashboard/insights" },
  { file: "tickets/eventos/page.tsx", expectedPrefix: "/dashboard/eventos" },
  { file: "tickets/financeiro/page.tsx", expectedPrefix: "/dashboard/financeiro" },
  { file: "tickets/insights/page.tsx", expectedPrefix: "/dashboard/insights" },
  { file: "fila-espera/page.tsx", expectedPrefix: "/dashboard/reservas" },
  { file: "operacao/mesas/page.tsx", expectedPrefix: "/dashboard/operacao" },
  { file: "operacao/comandas/page.tsx", expectedPrefix: "/dashboard/operacao" },
  { file: "operacao/pedidos/page.tsx", expectedPrefix: "/dashboard/operacao" },
  { file: "operacao/caixa/page.tsx", expectedPrefix: "/dashboard/operacao" },
];

describe("rotas canônicas possuem a implementação de verdade (não redirecionam para rota antiga)", () => {
  for (const dir of CANONICAL_OWNS_CONTENT) {
    it(`dashboard/${dir}/page.tsx não é um RouteRedirect puro para /dashboard/venue|tickets/*`, () => {
      const content = fs.readFileSync(path.join(DASHBOARD_DIR, dir, "page.tsx"), "utf8");
      const match = content.match(/RouteRedirect to="(\/dashboard\/(venue|tickets)\/[^"]+)"/);
      expect(match, `${dir}/page.tsx não deveria redirecionar para uma rota legada`).toBeNull();
    });
  }
});

describe("rotas antigas (compatibilidade) redirecionam para a rota canônica correspondente", () => {
  for (const { file, expectedPrefix } of LEGACY_REDIRECT_PAGES) {
    it(`${file} redireciona para ${expectedPrefix}`, () => {
      const content = fs.readFileSync(path.join(DASHBOARD_DIR, file), "utf8");
      const match = content.match(/to="([^"]+)"/);
      expect(match, `${file} não usa RouteRedirect to="..."`).not.toBeNull();
      expect(match![1].startsWith(expectedPrefix)).toBe(true);
    });
  }
});
