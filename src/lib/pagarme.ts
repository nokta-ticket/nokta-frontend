/**
 * Camada única de configuração do gateway (Pagar.me / Stone 3DS) no frontend.
 * O fluxo de checkout é o mesmo em sandbox e produção — só estes parâmetros
 * mudam por ambiente. Nada de `process.env`/URLs espalhados pelo componente.
 *
 * Ambiente definido por NEXT_PUBLIC_PAGARME_ENV ("production" = live).
 */
import axios from "axios";

export const PAGARME_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY ?? "";

export const PAGARME_IS_LIVE = process.env.NEXT_PUBLIC_PAGARME_ENV === "production";

/** Endpoint de tokenização de cartão (público, com appId). */
export const PAGARME_TOKENS_URL = `https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`;

/** SDK 3DS da Stone — varia por ambiente. */
export const TDS_SCRIPT_URL = PAGARME_IS_LIVE
  ? "https://3ds-nx-js.stone.com.br/live/v2/3ds2.min.js"
  : "https://3ds-nx-js.stone.com.br/test/v2/3ds2.min.js";

/** 3DS é OBRIGATÓRIO para cartão na Nokta (sandbox e produção). */
export const THREEDS_ENABLED = true;

/** Tokeniza o cartão direto na Pagar.me — o número nunca passa pelo backend. */
export async function tokenizeCard(card: {
  number: string; holder_name: string; exp_month: number; exp_year: number; cvv: string;
}): Promise<string> {
  if (!PAGARME_PUBLIC_KEY) {
    throw new Error("Chave pública da Pagar.me não configurada (NEXT_PUBLIC_PAGARME_PUBLIC_KEY). Recarregue após o redeploy.");
  }
  try {
    const { data } = await axios.post(
      PAGARME_TOKENS_URL,
      { type: "card", card },
      { headers: { "Content-Type": "application/json" } },
    );
    if (!data?.id) throw new Error("Falha ao tokenizar o cartão.");
    return data.id;
  } catch (e: any) {
    const data = e?.response?.data;
    const parts: string[] = [];
    if (data?.message) parts.push(String(data.message));
    if (data?.errors) parts.push(JSON.stringify(data.errors));
    const detail = parts.join(" | ") || e?.message || "erro desconhecido";
    throw new Error(`Tokenização: ${detail}`);
  }
}

let tdsScriptPromise: Promise<void> | null = null;
/** Carrega o SDK 3DS da Stone (uma vez). */
export function loadTdsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).TDS) return Promise.resolve();
  if (tdsScriptPromise) return tdsScriptPromise;
  tdsScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TDS_SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar a autenticação 3DS."));
    document.body.appendChild(s);
  });
  return tdsScriptPromise;
}
