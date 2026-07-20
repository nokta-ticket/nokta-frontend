import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.join(__dirname, "..", "..", "..", "..");

const REMOVED_FILES = [
  "context/ProductContext.tsx",
  "lib/feature-flags.ts",
  "app/(private-routes)/dashboard/_components/context-switcher.tsx",
  "app/(private-routes)/dashboard/_components/build-menu.tsx",
  "app/(private-routes)/dashboard/_hooks/use-tickets-inicio.ts",
];

/**
 * Fase 4: switcher Tickets|Venue, sidebar legada e feature flag foram
 * removidos definitivamente depois de validados em produção — ver
 * docs/platform/unified-navigation.md "Estruturas transitórias removidas".
 * Rollback é por git revert, não por duas arquiteturas de navegação
 * coexistindo no código.
 */
describe("estruturas transitórias da navegação legada foram removidas (Fase 4)", () => {
  for (const relativePath of REMOVED_FILES) {
    it(`${relativePath} não existe mais`, () => {
      expect(fs.existsSync(path.join(SRC_DIR, relativePath))).toBe(false);
    });
  }

  it("nenhum arquivo de código referencia isUnifiedDashboardEnabled ou feature-flags", () => {
    const offenders: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !full.includes("legacy-removed.test")) {
          const content = fs.readFileSync(full, "utf8");
          if (content.includes("isUnifiedDashboardEnabled") || content.includes("feature-flags")) {
            offenders.push(path.relative(SRC_DIR, full));
          }
        }
      }
    }
    walk(SRC_DIR);
    expect(offenders).toEqual([]);
  });
});
