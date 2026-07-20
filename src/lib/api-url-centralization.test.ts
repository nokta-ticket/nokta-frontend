import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(__dirname, "..");

/**
 * Fase 5, Etapa 5 — descoberto em produção (login quebrado por CSP): vários
 * componentes de auth liam `process.env.NEXT_PUBLIC_API_URL` direto,
 * ignorando lib/surfaces.ts (getApiBaseUrl) — em produção essa env var
 * aponta pro host bruto do Render, não pro domínio público/CSP configurado,
 * então as chamadas violavam o Content-Security-Policy e o login parava de
 * funcionar. Nunca deveria haver um segundo lugar decidindo a API — se
 * alguém reintroduzir isso, este teste quebra antes de virar bug em
 * produção.
 */
describe("nenhum arquivo lê NEXT_PUBLIC_API_URL fora de lib/surfaces.ts", () => {
  it("varredura completa do src", () => {
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (
          /\.(ts|tsx)$/.test(entry.name) &&
          !full.endsWith(path.join("lib", "surfaces.ts")) &&
          !full.endsWith(path.join("lib", "api-url-centralization.test.ts"))
        ) {
          const content = fs.readFileSync(full, "utf8");
          // Só código de verdade — comentários explicando a regra (como os
          // que este próprio commit adicionou) não contam como violação.
          if (/process\.env\.NEXT_PUBLIC_API_URL/.test(content)) {
            offenders.push(path.relative(SRC_DIR, full));
          }
        }
      }
    }

    walk(SRC_DIR);
    expect(offenders).toEqual([]);
  });
});
