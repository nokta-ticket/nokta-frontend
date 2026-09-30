import { describe, expect, it } from "vitest";
import { formatMonthDelta } from "./month-revenue-card";

describe("formatMonthDelta", () => {
  it("passa de 100% sem teto", () => {
    expect(formatMonthDelta(78850, 65900)).toBe("+19,7%");
  });

  it("queda aparece com sinal de menos", () => {
    expect(formatMonthDelta(50000, 100000)).toBe("−50,0%");
  });

  it("sem mês anterior não há comparação", () => {
    expect(formatMonthDelta(78850, 0)).toBeNull();
  });
});
