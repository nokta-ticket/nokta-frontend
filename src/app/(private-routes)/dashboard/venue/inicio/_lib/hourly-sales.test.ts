import { describe, expect, it } from "vitest";
import { hourlyTotals, peakHour } from "./hourly-sales";

describe("hourlyTotals", () => {
  it("soma a mesma hora de dias diferentes", () => {
    const totals = hourlyTotals([
      { hour: 21, amountCents: 1000 },
      { hour: 21, amountCents: 500 },
      { hour: 12, amountCents: 300 },
    ]);
    expect(totals).toHaveLength(24);
    expect(totals[21]).toBe(1500);
    expect(totals[12]).toBe(300);
    expect(totals[0]).toBe(0);
  });
});

describe("peakHour", () => {
  it("hora de maior venda", () => {
    const totals = hourlyTotals([
      { hour: 20, amountCents: 800 },
      { hour: 21, amountCents: 1500 },
    ]);
    expect(peakHour(totals)).toBe(21);
  });

  it("sem venda não há pico", () => {
    expect(peakHour(hourlyTotals([]))).toBeNull();
  });
});
