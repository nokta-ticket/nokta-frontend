import { describe, expect, it } from "vitest";
import { toNameCase } from "./name-case";

describe("toNameCase", () => {
  it("normaliza nome digitado em maiúsculas", () => {
    expect(toNameCase("VITOR LUCIANO")).toBe("Vitor Luciano");
  });

  it("normaliza nome digitado em minúsculas e com espaços extras", () => {
    expect(toNameCase("  vitor   luciano ")).toBe("Vitor Luciano");
  });

  it("mantém conectivos minúsculos no meio, mas não no início", () => {
    expect(toNameCase("MARIA DA SILVA DOS SANTOS")).toBe("Maria da Silva dos Santos");
    expect(toNameCase("de souza")).toBe("De Souza");
  });

  it("acentos e nomes compostos", () => {
    expect(toNameCase("JOÃO ÉRICO")).toBe("João Érico");
    expect(toNameCase("ana-maria d'avila")).toBe("Ana-Maria D'Avila");
  });
});
