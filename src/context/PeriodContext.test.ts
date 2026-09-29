import { describe, expect, it } from "vitest";
import { periodLabel, periodToFinanceParams, type PeriodState } from "./PeriodContext";

const p = (key: PeriodState["key"], from: string | null = null, to: string | null = null): PeriodState => ({
  key,
  range: { from, to },
});

describe("periodToFinanceParams", () => {
  it("atalhos viram quickPeriod do backend", () => {
    expect(periodToFinanceParams(p("today"))).toEqual({ quickPeriod: "TODAY" });
    expect(periodToFinanceParams(p("7d"))).toEqual({ quickPeriod: "LAST_7_DAYS" });
    expect(periodToFinanceParams(p("30d"))).toEqual({ quickPeriod: "LAST_30_DAYS" });
  });

  it("personalizado vira startDate/endDate", () => {
    expect(periodToFinanceParams(p("custom", "2026-09-01", "2026-09-10"))).toEqual({
      startDate: "2026-09-01",
      endDate: "2026-09-10",
    });
  });

  it("personalizado incompleto cai em Hoje em vez de mandar datas vazias", () => {
    expect(periodToFinanceParams(p("custom", "2026-09-01", null))).toEqual({ quickPeriod: "TODAY" });
  });
});

describe("periodLabel", () => {
  it("rótulos dos atalhos", () => {
    expect(periodLabel(p("today"))).toBe("Hoje");
    expect(periodLabel(p("7d"))).toBe("Últimos 7 dias");
    expect(periodLabel(p("30d"))).toBe("Últimos 30 dias");
  });

  it("intervalo personalizado em dd/mm", () => {
    expect(periodLabel(p("custom", "2026-09-01", "2026-09-10"))).toBe("01/09 a 10/09");
    expect(periodLabel(p("custom", "2026-09-05", "2026-09-05"))).toBe("05/09");
  });
});
