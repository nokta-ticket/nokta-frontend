import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fase 6 — provas estruturais (fonte lida como texto) dos invariantes de
 * segurança/privacidade do domínio Promoters no frontend: canal de código
 * do promoter nunca se confunde com cupom, tracking de link nunca redireciona
 * nem vira loop, e as telas do PRÓPRIO promoter nunca referenciam dado
 * pessoal do comprador (a API já nunca devolve isso — isto prova que a UI
 * também nunca tenta ler esses campos).
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(HERE, "..", "app");

function read(...segments: string[]) {
  return fs.readFileSync(path.join(...segments), "utf8");
}

describe("checkout — código do promoter é um canal próprio, nunca o mecanismo de cupom", () => {
  const CHECKOUT_SOURCE = read(APP_DIR, "(public-routes)", "eventos", "[id]", "checkout", "page.tsx");

  it("tem estado e input dedicados a promoterCode, distintos de cupomCodigo", () => {
    expect(CHECKOUT_SOURCE).toMatch(/const \[promoterCode, setPromoterCode\]/);
    expect(CHECKOUT_SOURCE).toMatch(/Código do promoter/);
  });

  it("nunca envia promoterCode para /cupons/validar (canais não se misturam)", () => {
    const cupomValidarCalls = [...CHECKOUT_SOURCE.matchAll(/\/cupons\/validar["'][\s\S]{0,200}?\)/g)].map((m) => m[0]);
    expect(cupomValidarCalls.length).toBeGreaterThan(0);
    for (const call of cupomValidarCalls) {
      expect(call).not.toMatch(/promoterCode/);
    }
  });

  it("envia promoterCode explicitamente na reserva real (/pagamento/reservar)", () => {
    const reservarCall = CHECKOUT_SOURCE.slice(
      CHECKOUT_SOURCE.indexOf("/pagamento/reservar"),
      CHECKOUT_SOURCE.indexOf("/pagamento/reservar") + 400,
    );
    expect(reservarCall).toMatch(/promoterCode: promoterCode\.trim\(\) \|\| undefined/);
  });

  it("a reserva real só é criada depois que o código do promoter é confirmado (nunca sai na frente da digitação)", () => {
    const effect = CHECKOUT_SOURCE.slice(
      CHECKOUT_SOURCE.indexOf("Criar reserva quando os dados estiverem prontos"),
      CHECKOUT_SOURCE.indexOf("Criar reserva quando os dados estiverem prontos") + 800,
    );
    expect(effect).toMatch(/!promoterCodeConfirmed/);
  });

  it("a prévia do código nunca exibe identidade do promoter (nome/email/comissão)", () => {
    const previewBlock = CHECKOUT_SOURCE.slice(
      CHECKOUT_SOURCE.indexOf("Código do promoter (opcional)"),
      CHECKOUT_SOURCE.indexOf("Código do promoter (opcional)") + 1500,
    );
    expect(previewBlock).not.toMatch(/promoterDisplayName|promoterEmail|commissionCents|comissão/i);
  });
});

describe("página do evento — tracking de link (?ref=) nunca redireciona nem vira loop", () => {
  const EVENT_PAGE_SOURCE = read(APP_DIR, "(public-routes)", "eventos", "[id]", "page.tsx");

  it("chama promoter-tracking/link e nunca deixa o erro estourar pra UI (fire-and-forget)", () => {
    const block = EVENT_PAGE_SOURCE.slice(
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter"),
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter") + 1300,
    );
    expect(block).toMatch(/resolveLink/);
    expect(block).toMatch(/\.catch\(\(\) => \{\}\)/);
  });

  it("limpa ref/utm da URL com router.replace, nunca com router.push ou window.location (nunca navega pra outro lugar)", () => {
    const block = EVENT_PAGE_SOURCE.slice(
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter"),
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter") + 1300,
    );
    expect(block).toMatch(/router\.replace/);
    expect(block).not.toMatch(/router\.push/);
    expect(block).not.toMatch(/window\.location/);
  });

  it("o efeito de tracking depende só de `id` — nunca de `searchParams`, senão a própria limpeza da URL causaria loop", () => {
    const block = EVENT_PAGE_SOURCE.slice(
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter"),
      EVENT_PAGE_SOURCE.indexOf("Tracking de link de promoter") + 1300,
    );
    const depsMatch = block.match(/\}, \[(.*?)\]\);/);
    expect(depsMatch?.[1].trim()).toBe("id");
  });
});

describe("middleware — aceite de convite de promoter é rota pública registrada", () => {
  const MIDDLEWARE_SOURCE = read(HERE, "..", "middleware.ts");

  it("registra /convites-promotor/[id] como rota pública que segue normalmente mesmo autenticado", () => {
    expect(MIDDLEWARE_SOURCE).toMatch(/\{\s*path:\s*["']\/convites-promotor\/\[id\]["'],\s*whenAutenticated:\s*["']next["']\s*\}/);
  });
});

describe("painel do próprio promoter — nunca referencia dado pessoal do comprador", () => {
  const PROMOTOR_COMPONENTS_DIR = path.join(APP_DIR, "(private-routes)", "dashboard", "promotor", "_components");
  const forbidden = /buyerName|buyerEmail|\bcpf\b|comprador|telefone/i;

  for (const file of fs.readdirSync(PROMOTOR_COMPONENTS_DIR)) {
    it(`${file} nunca lê campo de identidade do comprador`, () => {
      const source = read(PROMOTOR_COMPONENTS_DIR, file);
      expect(source).not.toMatch(forbidden);
    });
  }
});

describe("sidebar unificada — item do próprio promoter nunca fica preso num skeleton de organização", () => {
  const SIDEBAR_SOURCE = read(APP_DIR, "(private-routes)", "dashboard", "_components", "unified-sidebar.tsx");

  it("o bloco 'Meu painel de promoter' não está dentro do ramo condicional de loading da navegação da organização", () => {
    const promoterBlockIndex = SIDEBAR_SOURCE.indexOf("myPromoterProfile ?");
    const orgLoadingIndex = SIDEBAR_SOURCE.indexOf("orgNavLoading ?");
    expect(orgLoadingIndex).toBeGreaterThan(-1);
    expect(promoterBlockIndex).toBeGreaterThan(orgLoadingIndex);
    // O bloco do promoter vem depois do `groups.map(...)` já ter sido
    // fechado — ou seja, fora do ramo condicional, não dentro dele.
    const groupsCloseIndex = SIDEBAR_SOURCE.indexOf("))", orgLoadingIndex);
    expect(promoterBlockIndex).toBeGreaterThan(groupsCloseIndex);
  });
});
