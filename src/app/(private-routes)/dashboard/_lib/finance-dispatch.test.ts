import { describe, expect, it } from "vitest";
import { selectFinanceDispatch } from "./finance-dispatch";

describe("selectFinanceDispatch", () => {
  it("organização híbrida (Tickets + Venue) mostra os dois blocos — nunca soma", () => {
    expect(selectFinanceDispatch(["tickets", "venue", "finance", "insights"])).toBe("both");
  });

  it("organização somente Venue mostra só o bloco Venue", () => {
    expect(selectFinanceDispatch(["venue", "finance"])).toBe("venue");
  });

  it("organização somente Tickets mostra só o bloco Tickets", () => {
    expect(selectFinanceDispatch(["tickets", "finance"])).toBe("tickets");
  });

  it("organização sem nenhum dos dois módulos não mostra nenhum bloco (nunca inventa dado)", () => {
    expect(selectFinanceDispatch([])).toBe("none");
  });
});
