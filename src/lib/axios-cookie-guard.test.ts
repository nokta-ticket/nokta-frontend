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

/**
 * Fase 5.2, Etapa 7 — conteúdo do cookie auxiliar reduzido ao mínimo:
 * nunca JWT, email, CPF, telefone, permissões/papéis detalhados ou dados
 * organizacionais. Prova estrutural: todo `Cookies.set("user", ...)` no
 * AuthContext só serializa os 3 campos abaixo — nenhum outro em nenhum dos
 * pontos de escrita.
 */
describe("cookie auxiliar 'user' — conteúdo mínimo (Etapa 7)", () => {
  const AUTH_CONTEXT_SOURCE = fs.readFileSync(path.join(HERE, "..", "context", "AuthContext.tsx"), "utf8");

  it("nenhum ponto de escrita do cookie serializa email/cpf/telefone/permissões/dados organizacionais", () => {
    const forbidden = [
      /token/i,
      /\bemail\b/,
      /\bcpf\b/,
      /\btelefone\b/,
      /permiss/i,
      /organiza/i,
    ];
    const writeSites = [...AUTH_CONTEXT_SOURCE.matchAll(/Cookies\.set\(\s*["']user["'][\s\S]*?\)\s*;/g)].map((m) => m[0]);
    expect(writeSites.length).toBeGreaterThan(0);
    for (const site of writeSites) {
      for (const pattern of forbidden) {
        expect(site).not.toMatch(pattern);
      }
    }
  });

  it("os únicos campos gravados são userId, role e nivelProdutor — hint de roteamento, nunca autorização", () => {
    const writeSites = [...AUTH_CONTEXT_SOURCE.matchAll(/Cookies\.set\(\s*["']user["'][\s\S]*?\)\s*;/g)].map((m) => m[0]);
    for (const site of writeSites) {
      const keys = [...site.matchAll(/(\w+):/g)].map((m) => m[1]);
      for (const key of keys) {
        expect(["userId", "role", "nivelProdutor"]).toContain(key);
      }
    }
  });
});
