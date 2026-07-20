import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const DASHBOARD_DIR = path.join(__dirname, "..");

/**
 * As páginas canônicas que são puro `<RouteRedirect to="..." />` (Eventos,
 * Reservas, Fila de espera, Operação e as 4 subtelas, Cardápio, Estoque)
 * precisam mirar em algo dentro de `/dashboard/tickets/*` ou
 * `/dashboard/venue/*`. Não é estético: é o que faz a troca de organização
 * (Etapa 8) funcionar de graça — o `ProductContext` já redireciona sozinho
 * para fora de uma URL `/dashboard/tickets/*`/`/dashboard/venue/*` que a
 * organização ativa não tem mais (ver ProductContext.tsx, efeito de
 * segurança). Se uma rota canônica apontasse pra outro lugar, esse
 * mecanismo de proteção não se aplicaria e um usuário poderia ficar preso
 * numa tela que não faz mais sentido depois de trocar de organização.
 */
const REDIRECT_PAGES: { file: string; expectedPrefix: string }[] = [
  { file: "eventos/page.tsx", expectedPrefix: "/dashboard/tickets/" },
  { file: "reservas/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "fila-espera/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "operacao/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "operacao/mesas/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "operacao/comandas/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "operacao/pedidos/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "operacao/caixa/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "cardapio/page.tsx", expectedPrefix: "/dashboard/venue/" },
  { file: "estoque/page.tsx", expectedPrefix: "/dashboard/venue/" },
];

describe("rotas canônicas de redirect puro apontam para /dashboard/tickets|venue (cobertura automática de troca de organização)", () => {
  for (const { file, expectedPrefix } of REDIRECT_PAGES) {
    it(`${file} redireciona para algo em ${expectedPrefix}`, () => {
      const content = fs.readFileSync(path.join(DASHBOARD_DIR, file), "utf8");
      const match = content.match(/to="([^"]+)"/);
      expect(match, `${file} não usa RouteRedirect to="..."`).not.toBeNull();
      expect(match![1].startsWith(expectedPrefix)).toBe(true);
    });
  }
});
