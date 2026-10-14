/** Tipos do Nokta Protect — espelham `GET /admin/evidencias/*` no backend. */

export interface SearchResult {
  id: number;
  code: string;
  status: number;
  evento: string;
  comprador: string;
  dataCompra: string;
}

export interface RecentTicket {
  id: number;
  code: string;
  status: number;
  bloqueado: boolean;
  createdAt: string;
  dono: { nome: string; sobrenome: string; email: string };
  evento: { nome: string; data: string };
}

export type Severidade = "critico" | "alto" | "medio" | "baixo";
export type ScoreNivel = "muito_forte" | "forte" | "moderado" | "fraco";
export type VereditoTipo = "defesa_recomendada" | "analisar_manualmente" | "alto_risco";

export interface InvestigationData {
  ingresso: { id: number; codigo: string; status: number; statusNome: string; bloqueado: boolean; bloqueadoMotivo: string | null; resaleAddCount: number; criadoEm: string };
  evento: { id: number; nome: string; data: string; endereco: string };
  lote: { id: number; nome: string; valor: string; tipo: number; lote: number };
  comprador: { id: number; nome: string; email: string; cpf: string; telefone: string; telefoneVerificado: boolean; contaAtiva: boolean; contaCriadaEm: string; bloqueado: boolean };
  pedido: { id: number; codigo: string; status: number; statusNome: string; valorTotal: string; quantidade: number; pagoEm: string; criadoEm: string; itens: number; transacoes: number; chargebacks: number } | null;
  transferencias: Array<{ id: number; de: { id: number; nome: string; email: string }; para: { id: number; nome: string; email: string }; data: string }>;
  revendas: Array<{ id: number; vendedor: { id: number; nome: string; email: string }; comprador: { id: number; nome: string; email: string } | null; precoOriginal: string; precoRevenda: string; status: number; criadaEm: string; vendidaEm: string }>;
  historicoComprador: { pedidosPagos: number; totalIngressos: number; transferenciasRealizadas: number; revendasRealizadas: number; chargebacks: number; eventosComparecidos: number };
  indicadores: Array<{ tipo: string; severidade: Severidade; descricao: string; valor: number }>;
  score: { total: number; maximo: number; nivel: ScoreNivel; itens: Array<{ evidencia: string; pontos: number; ativo: boolean }> };
  veredito: { tipo: VereditoTipo; motivos: string[] };
  evidenciasFavoraveis: Array<{ descricao: string; presente: boolean }>;
  timeline: Array<{ data: string; tipo: string; descricao: string; ator: string | null; ip: string | null; fingerprint: string | null }>;
  checkin: { utilizado: boolean; dataHora: string | null; operadorId: number | null; ip: string | null; fingerprint: string | null; tentativasAntes: number };
  auditoria: { totalRegistros: number; integridadeVerificada: boolean; cadeiaQuebrada: unknown | null };
  eventosSeguranca: Array<{ tipo: string; ip: string | null; fingerprint: string | null; data: string }>;
  contextoCheckout?: { ip: string | null; fingerprint: string | null; userAgent: string | null; buyerPhoneVerified: boolean | null; buyerAccountActive: boolean | null; buyerAccountAgeDays: number | null } | null;
  gateway?: { gatewayId: string | null; threedsStatus: string | null; antifraudeStatus: string | null } | null;
  termosAceitos?: { versao: string; aceiteEm: string } | null;
  webhooks?: Array<{ eventType: string; signatureValid: boolean; processedOk: boolean; data: string }>;
  comunicacoes?: Array<{ canal: string; tipo: string; destinatario: string; status: string; data: string }>;
  acessosIngresso?: { totalAcessos: number; qrViews: number; ultimoAcesso: string | null } | null;
}
