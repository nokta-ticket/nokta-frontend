import { describe, expect, it } from "vitest";
import { DEFAULT_GATEWAY_CONFIG, cardFixedFor, cardRateFor, gatewayFor, grossUp, installmentValue, parseGatewayConfig, pixRateFor } from "./payment-fees";

describe("payment-fees", () => {
  it("usa os fallbacks do gateway quando o backend não informa", () => {
    const cfg = DEFAULT_GATEWAY_CONFIG;
    expect(cardRateFor(cfg, 1)).toBe(0.0319);
    expect(cardRateFor(cfg, 3)).toBe(0.0449);
    expect(cardRateFor(cfg, 12)).toBe(0.0499);
    expect(cardFixedFor(cfg, 1)).toBe(0.99);
    expect(pixRateFor(cfg)).toBe(0.0109);
  });

  it("prefere a tabela em bps do backend e zera dentro do sem juros", () => {
    const cfg = parseGatewayConfig({ maxParcelas: 6, maxParcelasSemJuros: 2, cardRateBps: [319, 449, 459], cardFixedCents: 50, pixRateBps: 99, pixFixedCents: 0 });
    expect(cfg.maxParcelas).toBe(6);
    expect(cardRateFor(cfg, 2)).toBe(0); // sem juros
    expect(cardFixedFor(cfg, 2)).toBe(0);
    expect(cardRateFor(cfg, 3)).toBe(0.0459);
    expect(cardFixedFor(cfg, 3)).toBe(0.5);
    expect(cardRateFor(cfg, 4)).toBe(0.0449); // além da tabela → fallback por faixa
    expect(pixRateFor(cfg)).toBe(0.0099);
  });

  it("faz o gross-up do gateway em cima da base", () => {
    expect(grossUp(100, 0.0109, 0)).toBe(101.1);
    expect(grossUp(100, 0.0319, 0.99)).toBe(104.32);
    expect(gatewayFor(DEFAULT_GATEWAY_CONFIG, null, 1)).toEqual({ pct: 0, fixed: 0 });
    expect(gatewayFor(DEFAULT_GATEWAY_CONFIG, "pix", 1)).toEqual({ pct: 0.0109, fixed: 0 });
  });

  it("calcula o valor da parcela a partir do total daquela parcela", () => {
    expect(installmentValue(DEFAULT_GATEWAY_CONFIG, 100, 1)).toBe(104.32);
    expect(installmentValue(DEFAULT_GATEWAY_CONFIG, 100, 2)).toBeCloseTo(105.74 / 2, 2);
  });
});
