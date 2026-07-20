import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fase 5.1, Etapa 8 — o cookie "user" é só hint de UI, nunca fonte de
 * autorização. Prova estrutural do contrato: todo 401 da API limpa o
 * cookie auxiliar (nunca o mantém como se a sessão continuasse válida), e o
 * valor lido dele só decide qual TELA de login mostrar — nunca é usado para
 * decidir se a requisição foi bem-sucedida ou para ler dados de resposta.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const AXIOS_SOURCE = fs.readFileSync(path.join(HERE, "axios.ts"), "utf8");

describe("axios interceptor — cookie auxiliar nunca sobrevive a um 401", () => {
  it("todo 401 remove o cookie 'user', incondicionalmente", () => {
    const on401 = AXIOS_SOURCE.slice(AXIOS_SOURCE.indexOf("status === 401"));
    expect(on401).toMatch(/Cookies\.remove\(["']user["']\)/);
  });

  it("o valor do cookie só é usado pra escolher a tela de login, nunca pra decidir sucesso/autorização", () => {
    const on401 = AXIOS_SOURCE.slice(AXIOS_SOURCE.indexOf("status === 401"), AXIOS_SOURCE.indexOf("status === 401") + 800);
    // Único uso do valor parseado é montar `loginPath` — nunca early-return,
    // nunca decide se o erro é repassado ou engolido.
    expect(on401).toMatch(/loginPath/);
    expect(on401).not.toMatch(/return\s+response/);
  });

  it("AuthContext também desloga (limpa cookie + estado) só com 401 real da API, nunca por conteúdo do próprio cookie", () => {
    const authContext = fs.readFileSync(path.join(HERE, "..", "context", "AuthContext.tsx"), "utf8");
    const section = authContext.slice(authContext.indexOf("Only sign out on 401"));
    expect(section).toMatch(/status === 401/);
    expect(section).toMatch(/signOut\(\)/);
  });
});
