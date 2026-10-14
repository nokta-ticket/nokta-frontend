import { formatBRL } from "@/lib/format";

/** Lote como vem de GET /eventos/:id/ingressos (valor já convertido pra número). */
export type Ticket = {
  id: number;
  nome: string;
  lote: number;
  tipo: number;
  valor: number;
  quantidade: number;
  disponivelParaVenda: boolean;
  dataLimite?: string | null;
};

/** Regras de parcelamento de GET /pagamento/info-parcelas. */
export type InstallmentRules = {
  maxSemJuros: number;
  maxParcelas: number;
  cardRateBps: number[];
  cardFixedCents: number;
};

export const DEFAULT_INSTALLMENT_RULES: InstallmentRules = { maxSemJuros: 0, maxParcelas: 12, cardRateBps: [], cardFixedCents: 0 };

/** Taxa de serviço (reais) sobre um valor, arredondada em centavos. */
export function calcTaxa(valor: number, percent: number) {
  return Math.round(valor * percent) / 100;
}

/** Espelha o cálculo do backend (gross-up + split em centavos). */
export function calcInstallmentCents(subtotalCents: number, n: number, rules: InstallmentRules): number {
  if (n <= rules.maxSemJuros) return Math.floor(subtotalCents / n);
  const rateBps = rules.cardRateBps[n - 1] ?? 0;
  const rate = rateBps / 10000;
  const total = Math.round((subtotalCents + rules.cardFixedCents) / (1 - rate));
  return Math.floor(total / n);
}

/** "12x R$ 7,90" — a parcela máxima pra um subtotal em reais (já com taxa). */
export function maxInstallmentLabel(subtotalReais: number, rules: InstallmentRules): string {
  const cents = calcInstallmentCents(Math.round(subtotalReais * 100), rules.maxParcelas, rules);
  return `${rules.maxParcelas}x ${formatBRL(cents / 100)}`;
}

/** Linha 1 do endereço ("Av. Paulista, 1000") sem vírgula sobrando quando não há número. */
export function addressLine(addr: { logradouro?: string | null; numero?: string | null }): string {
  return [addr.logradouro, addr.numero].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");
}

/** Linha 2 do endereço ("Bela Vista · São Paulo, SP"). */
export function addressCity(addr: { bairro?: string | null; localidade?: string | null; uf?: string | null }): string {
  const city = [addr.localidade, addr.uf].map((s) => (s ?? "").trim()).filter(Boolean).join(", ");
  return [addr.bairro?.trim(), city].filter(Boolean).join(" · ");
}
