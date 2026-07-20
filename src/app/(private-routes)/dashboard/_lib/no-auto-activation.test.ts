import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Teste de cobertura estático (roda sobre o .tsx fonte, não precisa de
 * DOM): nenhum arquivo novo da Fase 2 pode chamar `.mutate(`/`.activate(`
 * dentro de um `useEffect` — ativação de capacidade só pode acontecer por
 * clique explícito do usuário (briefing: "nenhuma ativação ocorre
 * automaticamente").
 */
const FILES_TO_CHECK = [
  "explorar/_components/explorar-content.tsx",
  "onboarding/_components/step-negocio.tsx",
  "onboarding/_components/step-operacao.tsx",
  "onboarding/_components/step-capacidades.tsx",
  "onboarding/_components/step-revisao.tsx",
  "configuracoes/_components/perfil-operacional-tab.tsx",
];

function extractUseEffectBodies(content: string): string[] {
  const bodies: string[] = [];
  const regex = /useEffect\(\s*\(\)\s*=>\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (depth > 0 && i < content.length) {
      if (content[i] === "{") depth++;
      if (content[i] === "}") depth--;
      i++;
    }
    bodies.push(content.slice(start, i - 1));
  }
  return bodies;
}

describe("nenhuma ativação/mutação automática em useEffect", () => {
  for (const relativePath of FILES_TO_CHECK) {
    it(`${relativePath} não chama .mutate( dentro de useEffect`, () => {
      const fullPath = path.join(__dirname, "..", relativePath);
      const content = fs.readFileSync(fullPath, "utf8");
      const effectBodies = extractUseEffectBodies(content);
      for (const body of effectBodies) {
        expect(body).not.toMatch(/\.mutate\(/);
      }
    });
  }
});
