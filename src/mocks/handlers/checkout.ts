import type { MockHandler } from "./types";

/**
 * Checkout / pagamento / cupom / revenda (compra) — frente B edita aqui.
 *
 * Fluxo fictício completo pra ver as telas sem backend: a reserva dura 10
 * minutos; o status do pedido devolve `pending` nas duas primeiras consultas
 * e `paid` (ou `sold`, na revenda) depois — assim o QR do Pix fica na tela
 * uns 6 segundos e o sucesso aparece sozinho. Cartão aprova direto.
 */
const RESERVATION_MINUTES = 10;
const statusCalls = new Map<string, number>();

function inMinutes(min: number) {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

function lastSegment(url: URL) {
  return decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
}

/** Devolve `pendingStatus` nas 2 primeiras chamadas pro mesmo código e `doneStatus` depois. */
function pollStatus(code: string, pendingStatus: string, doneStatus: string) {
  const n = (statusCalls.get(code) ?? 0) + 1;
  statusCalls.set(code, n);
  return n <= 2 ? pendingStatus : doneStatus;
}

// Payload Pix "copia e cola" de brincadeira (formato EMV parecido com o real).
const MOCK_PIX_PAYLOAD = "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540512.345802BR5912NOKTA EVENTS6009SAO PAULO62070503***6304ABCD";

export const checkoutHandlers: MockHandler[] = [
  {
    test: /\/pagamento\/info-parcelas$/,
    handle: () => ({ data: { maxParcelas: 12, maxParcelasSemJuros: 1, cardRateBps: [319, 449, 449, 449, 449, 449, 499, 499, 499, 499, 499, 499], cardFixedCents: 99, pixRateBps: 109, pixFixedCents: 0 } }),
  },
  {
    test: /\/pagamento\/tabela-parcelas$/,
    handle: ({ params }) => {
      const valor = Number(params.valor ?? 100);
      const bps = [319, 449, 449, 449, 449, 449, 499, 499, 499, 499, 499, 499];
      return { data: { parcelas: bps.map((b, i) => ({ n: i + 1, total: Math.round(((valor + (i === 0 ? 0 : 0.99)) / (1 - b / 10000)) * 100) / 100 })) } };
    },
  },
  {
    test: /\/cupons\/validar$/,
    method: "post",
    handle: ({ body }) => {
      const codigo = String((body as { codigo?: string })?.codigo ?? "").toUpperCase();
      return codigo === "NOKTA10" ? { data: { desconto: 10 } } : { status: 400, data: { message: "Cupom inválido" } };
    },
  },
  {
    test: /\/promoter-tracking\/code\/validate$/,
    method: "post",
    handle: ({ body }) => {
      const code = String((body as { code?: string })?.code ?? "").toUpperCase();
      if (code === "JOAO10") return { data: { valid: true, discountApplicableCents: 1000, message: "Código válido." } };
      if (code === "PROMO") return { data: { valid: true, discountApplicableCents: 0, message: "Código válido." } };
      return { data: { valid: false, discountApplicableCents: 0, message: "Código não encontrado pra este evento." } };
    },
  },
  {
    test: /\/pagamento\/reservar$/,
    method: "post",
    handle: () => ({ data: { reservationCode: `RSV-${Date.now().toString(36).toUpperCase()}`, expiresAt: inMinutes(RESERVATION_MINUTES) } }),
  },
  {
    test: /\/pagamento\/checkout$/,
    method: "post",
    handle: ({ body }) => {
      const type = (body as { type?: string })?.type;
      const orderCode = `ORD-${Date.now().toString(36).toUpperCase()}`;
      if (type === "card") return { data: { paid: true, orderCode } };
      return { data: { pixUrl: MOCK_PIX_PAYLOAD, orderCode, expiresAt: inMinutes(RESERVATION_MINUTES) } };
    },
  },
  { test: /\/pagamento\/tds-token$/, handle: () => ({ data: { tdsToken: "mock-tds-token" } }) },
  // Revenda primeiro: `/revenda/pagamento/status/X` também casaria com o status genérico abaixo.
  {
    test: /\/revenda\/pagamento\/status\/[^/]+$/,
    handle: ({ url }) => ({ data: { status: pollStatus(lastSegment(url), "pending", "sold") } }),
  },
  {
    test: /(?<!\/revenda)\/pagamento\/status\/[^/]+$/,
    handle: ({ url }) => ({ data: { status: pollStatus(lastSegment(url), "pending", "paid"), expiresAt: inMinutes(RESERVATION_MINUTES) } }),
  },
  {
    test: /\/revenda\/\d+\/comprar$/,
    method: "post",
    handle: ({ body }) => {
      const type = (body as { type?: string })?.type;
      const orderCode = `RSL-${Date.now().toString(36).toUpperCase()}`;
      if (type === "card") return { data: { paid: true, orderCode } };
      return { data: { pixUrl: MOCK_PIX_PAYLOAD, orderCode } };
    },
  },
];
