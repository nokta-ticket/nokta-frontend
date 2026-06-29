/**
 * Camada única de configuração do gateway (Pagar.me / Stone 3DS) no frontend.
 * O fluxo de checkout é o mesmo em sandbox e produção — só estes parâmetros
 * mudam por ambiente. Nada de `process.env`/URLs espalhados pelo componente.
 *
 * Ambiente definido por NEXT_PUBLIC_PAGARME_ENV ("production" = live).
 */
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
