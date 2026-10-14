/**
 * Autenticação 3DS (SDK da Stone) — o passo obrigatório antes de tokenizar
 * um cartão na Nokta (sandbox e produção). Compartilhado pelo checkout do
 * evento e pela compra de revenda; o SDK em si é carregado por
 * `loadTdsScript()` (lib/pagarme.ts) e preenche os `ThreeDsContainers`.
 */

export interface TdsResult {
  tds_server_trans_id?: string;
  trans_status?: string;
  challenge_canceled?: boolean;
}

interface TdsSdk {
  init: (config: Record<string, unknown>, order: Record<string, unknown>) => Promise<TdsResult | TdsResult[]>;
}

declare global {
  interface Window {
    TDS?: TdsSdk;
  }
}

export interface BillingAddress {
  country: string;
  state: string;
  city: string;
  zip_code: string;
  line_1: string;
  line_2: string;
}

/**
 * Monta o pedido que o SDK 3DS manda ao banco emissor. O telefone do
 * usuário vem como "+55DDDNÚMERO": tiramos o país e separamos DDD/número,
 * com fallback neutro quando não há telefone cadastrado.
 */
export function buildTdsOrderData(args: {
  card: { number: string; holder_name: string; exp_month: number; exp_year: number; billing_address: BillingAddress };
  amountCents: number;
  customer: { name: string; email: string; document: string; code: string; phone?: string | null };
  items: { description: string; code: string }[];
}): Record<string, unknown> {
  const phoneDigits = (args.customer.phone ?? "").replace(/\D/g, "");
  const localPhone = phoneDigits.startsWith("55") && phoneDigits.length > 11 ? phoneDigits.slice(2) : phoneDigits;
  const areaCode = localPhone.slice(0, 2);
  const phoneNumber = localPhone.slice(2);

  return {
    payments: [{ payment_method: "credit_card", credit_card: { card: args.card }, amount: args.amountCents }],
    customer: {
      name: args.customer.name,
      email: args.customer.email,
      document: args.customer.document,
      code: args.customer.code,
      phones: { mobile_phone: { country_code: "55", area_code: areaCode || "11", number: phoneNumber || "999999999" } },
    },
    items: args.items,
    shipping: { recipient_name: args.customer.name, address: args.card.billing_address },
    requestor_url: window.location.origin,
  };
}

/**
 * Roda o desafio 3DS. Bloqueio antecipado (UX): só `trans_status` Y ou A
 * seguem — a decisão final (Y vs A, conforme a política do admin) é do
 * backend, usando o status que a própria Pagar.me devolve.
 */
export async function authenticate3ds(tdsToken: string, orderData: Record<string, unknown>): Promise<{ tdsTransactionId: string; tdsTransStatus: string }> {
  const sdk = window.TDS;
  if (!sdk) throw new Error("A autenticação 3DS não carregou. Recarregue a página e tente de novo.");

  const response = await sdk.init(
    {
      token: tdsToken,
      tds_method_container_element: document.getElementById("tdsMethodContainer"),
      challenge_container_element: document.getElementById("challengeContainer"),
      use_default_challenge_iframe_style: true,
      challenge_window_size: "03",
    },
    orderData,
  );

  const tds = Array.isArray(response) ? response[0] : response;
  if (!tds?.tds_server_trans_id || tds?.challenge_canceled) {
    throw new Error(`Autenticação 3DS não concluída (${tds?.challenge_canceled ? "cancelada pelo usuário" : "sem transaction_id"}).`);
  }
  const status = String(tds.trans_status ?? "").toUpperCase();
  if (status !== "Y" && status !== "A") {
    throw new Error(`Não foi possível autenticar o cartão (3DS status: ${status || "vazio"}).`);
  }
  return { tdsTransactionId: tds.tds_server_trans_id, tdsTransStatus: String(tds.trans_status) };
}
