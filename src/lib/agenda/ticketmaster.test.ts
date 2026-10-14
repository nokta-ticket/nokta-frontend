import { describe, expect, it } from "vitest";
import { citySlug } from "./index";
import { mapTicketmasterEvent, normalizeCity } from "./ticketmaster";

describe("normalizeCity", () => {
  it("corrige grafia sem acento e bairros enviados como cidade", () => {
    expect(normalizeCity("Sao Paulo", "SP")).toBe("São Paulo");
    expect(normalizeCity("Gávea", "RJ")).toBe("Rio de Janeiro");
    expect(normalizeCity("Barra da Tijuca", "RJ")).toBe("Rio de Janeiro");
    expect(normalizeCity("Sp", "SP")).toBe("São Paulo");
  });

  it("usa a capital da UF quando a cidade vem vazia ou inválida", () => {
    expect(normalizeCity("Nocity", "SP")).toBe("São Paulo");
    expect(normalizeCity(undefined, "PR")).toBe("Curitiba");
    expect(normalizeCity(undefined, undefined)).toBeNull();
  });

  it("mantém cidades que já vêm certas", () => {
    expect(normalizeCity("Ribeirão Preto", "SP")).toBe("Ribeirão Preto");
  });
});

describe("mapTicketmasterEvent", () => {
  it("monta o evento com cidade normalizada e imagem 16:9 perto de 1024px", () => {
    const e = mapTicketmasterEvent({
      id: "abc",
      name: "Show",
      url: "https://www.ticketmaster.com.br/event/show",
      images: [
        { url: "a.jpg", ratio: "16_9", width: 2048 },
        { url: "b.jpg", ratio: "16_9", width: 1136 },
        { url: "c.jpg", ratio: "3_2", width: 1024 },
      ],
      dates: { start: { localDate: "2026-11-01", localTime: "21:00:00" }, status: { code: "onsale" } },
      _embedded: { venues: [{ name: "Casa", city: { name: "Sao Paulo" }, state: { stateCode: "SP" } }] },
    });
    expect(e).toMatchObject({ id: "tm-abc", city: "São Paulo", time: "21:00", image: "b.jpg", status: "onsale" });
    expect(citySlug(e!.city!)).toBe("sao-paulo");
  });
});
