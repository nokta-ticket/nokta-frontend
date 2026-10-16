import { describe, expect, it } from "vitest";
import { inPlace, isUf, placeWhere, statePlace, stateSlug, ufFromSlug } from "./place";

describe("place", () => {
  it("estado vira slug próprio e volta", () => {
    expect(stateSlug("SP")).toBe("uf-sp");
    expect(ufFromSlug("uf-sp")).toBe("SP");
    expect(ufFromSlug("maua")).toBeNull();
    expect(ufFromSlug("uf-xx")).toBeNull();
    expect(isUf("rj")).toBe(true);
  });

  it("filtro por estado pega a região metropolitana inteira", () => {
    const sp = statePlace("SP");
    expect(inPlace(sp, "Mauá", "SP")).toBe(true);
    expect(inPlace(sp, "São Paulo", "sp")).toBe(true);
    expect(inPlace(sp, "Rio de Janeiro", "RJ")).toBe(false);
  });

  it("filtro por cidade compara o nome sem acento", () => {
    const maua = { kind: "city" as const, slug: "maua", name: "Mauá", uf: "SP" };
    expect(inPlace(maua, "Maua", "SP")).toBe(true);
    expect(inPlace(maua, "São Paulo", "SP")).toBe(false);
  });

  it("frase com a preposição certa", () => {
    expect(placeWhere(statePlace("SP"))).toBe("no estado de São Paulo");
    expect(placeWhere(statePlace("RJ"))).toBe("no estado do Rio de Janeiro");
    expect(placeWhere(statePlace("BA"))).toBe("no estado da Bahia");
    expect(placeWhere(statePlace("DF"))).toBe("no Distrito Federal");
    expect(placeWhere({ kind: "city", slug: "maua", name: "Mauá", uf: "SP" })).toBe("em Mauá");
  });
});
