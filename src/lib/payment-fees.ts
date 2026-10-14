/**
 * Taxas do pagamento (Pix / cartão) — a MESMA conta no checkout do evento e
 * na compra de revenda. Valores em REAIS (as APIs de /pagamento falam em
 * reais). A taxa do gateway (Pagar.me) é repassada ao comprador por
 * gross-up: total = (base + fixa) / (1 - percentual).
 *
 * As taxas reais vêm de GET /pagamento/info-parcelas; os fallbacks abaixo só
 * valem enquanto a resposta não chega (ou se o backend não informar).
 * Puro, sem React — testável (payment-fees.test.ts).
 */

/** Taxa de serviço padrão da Nokta; o evento informa a do workspace (`taxaServicoPercent`). */
export const TAXA_SERVICO_DEFAULT = 0.1;
/** Proteção de compra (seguro), sobre o subtotal dos ingressos. */
export const TAXA_PROTECAO = 0.1284;

const GATEWAY_PIX_RATE = 0.0109;
const GATEWAY_PIX_FIXED = 0; // Pix não tem taxa fixa na Pagar.me
const GATEWAY_CARD_1X_RATE = 0.0319;
const GATEWAY_CARD_2_6_RATE = 0.0449;
const GATEWAY_CARD_7_18_RATE = 0.0499;
const GATEWAY_CARD_FIXED = 0.99;

export type PaymentMethod = "pix" | "card";

export interface GatewayConfig {
  maxParcelas: number;
  maxSemJuros: number;
  /** Taxa por parcela em basis points (índice n-1). */
  cardRateBps: number[];
  cardFixedCents: number | null;
  pixRateBps: number | null;
  pixFixedCents: number | null;
}

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  maxParcelas: 12,
  maxSemJuros: 0,
  cardRateBps: [],
  cardFixedCents: null,
  pixRateBps: null,
  pixFixedCents: null,
};

/** Resposta de GET /pagamento/info-parcelas → config tipada (campos ausentes caem no default). */
export function parseGatewayConfig(data: unknown): GatewayConfig {
  const d = (data ?? {}) as Partial<{ maxParcelas: number; maxParcelasSemJuros: number; cardRateBps: number[]; cardFixedCents: number; pixRateBps: number; pixFixedCents: number }>;
  return {
    maxParcelas: d.maxParcelas ?? 12,
    maxSemJuros: d.maxParcelasSemJuros ?? 0,
    cardRateBps: Array.isArray(d.cardRateBps) ? d.cardRateBps : [],
    cardFixedCents: d.cardFixedCents ?? null,
    pixRateBps: d.pixRateBps ?? null,
    pixFixedCents: d.pixFixedCents ?? null,
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Percentual do gateway para `n` parcelas (0 dentro do "sem juros"). */
export function cardRateFor(cfg: GatewayConfig, n: number): number {
  if (n <= cfg.maxSemJuros) return 0;
  if (cfg.cardRateBps.length >= n) return cfg.cardRateBps[n - 1] / 10000;
  return n <= 1 ? GATEWAY_CARD_1X_RATE : n <= 6 ? GATEWAY_CARD_2_6_RATE : GATEWAY_CARD_7_18_RATE;
}

/** Taxa fixa do cartão em reais (0 dentro do "sem juros"). */
export function cardFixedFor(cfg: GatewayConfig, n: number): number {
  if (n <= cfg.maxSemJuros) return 0;
  return cfg.cardFixedCents !== null ? cfg.cardFixedCents / 100 : GATEWAY_CARD_FIXED;
}

export function pixRateFor(cfg: GatewayConfig): number {
  return cfg.pixRateBps !== null ? cfg.pixRateBps / 10000 : GATEWAY_PIX_RATE;
}

export function pixFixedFor(cfg: GatewayConfig): number {
  return cfg.pixFixedCents !== null ? cfg.pixFixedCents / 100 : GATEWAY_PIX_FIXED;
}

/** Percentual + fixa do gateway para o método escolhido (zero enquanto não escolheu). */
export function gatewayFor(cfg: GatewayConfig, method: PaymentMethod | null, parcelas: number): { pct: number; fixed: number } {
  if (method === "card") return { pct: cardRateFor(cfg, parcelas), fixed: cardFixedFor(cfg, parcelas) };
  if (method === "pix") return { pct: pixRateFor(cfg), fixed: pixFixedFor(cfg) };
  return { pct: 0, fixed: 0 };
}

/** total = (base + fixa) / (1 - pct), arredondado a centavos. */
export function grossUp(base: number, pct: number, fixed: number): number {
  return round2((base + fixed) / (1 - pct));
}

/** Total no cartão em `n` parcelas (gross-up da taxa daquela parcela). */
export function installmentTotal(cfg: GatewayConfig, base: number, n: number): number {
  return grossUp(base, cardRateFor(cfg, n), cardFixedFor(cfg, n));
}

/** Valor de cada uma das `n` parcelas. */
export function installmentValue(cfg: GatewayConfig, base: number, n: number): number {
  return installmentTotal(cfg, base, n) / n;
}
