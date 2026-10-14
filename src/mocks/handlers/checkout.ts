import type { MockHandler } from "./types";

/** Checkout / pagamento / cupom (frente B edita aqui). */
export const checkoutHandlers: MockHandler[] = [
  {
    test: /\/pagamento\/info-parcelas$/,
    handle: () => ({ data: { maxParcelas: 12, maxParcelasSemJuros: 1, cardRateBps: [319, 449, 449, 449, 449, 449, 499, 499, 499, 499, 499, 499], cardFixedCents: 99, pixRateBps: 109, pixFixedCents: 0 } }),
  },
  {
    test: /\/cupons\/validar$/,
    method: "post",
    handle: ({ body }) => {
      const codigo = String((body as { codigo?: string })?.codigo ?? "").toUpperCase();
      return codigo === "NOKTA10" ? { data: { desconto: 10 } } : { status: 400, data: { message: "Cupom inválido" } };
    },
  },
];
