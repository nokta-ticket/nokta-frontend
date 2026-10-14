/** Lote/ingresso como vem de GET /eventos/:id/ingressos (valor em reais). */
export interface Ticket {
  id: number;
  nome: string;
  lote: number;
  tipo: number;
  valor: number;
  quantidade: number;
  disponivelParaVenda: boolean;
  dataLimite?: string | null;
}

export interface SelectedItem {
  ticketId: number;
  quantity: number;
}

export interface PromoterPreview {
  valid: boolean;
  discountApplicableCents: number;
  message: string;
}

export const isGratis = (valor: number) => Number(valor) === 0;
