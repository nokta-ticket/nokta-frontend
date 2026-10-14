import type { SectionKey } from "./section-registry";

export interface Thumbnail {
  id?: number;
  url: string;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  numero: string;
  uf: string;
}

export interface IngressoLote {
  id?: number;
  nome: string;
  tipo: number;
  lote: number;
  quantidade: number;
  valor: number;
  disponivelParaVenda: boolean;
  dataLimite: string | null;
  /** Lista VIP: gratuito, fora da página do evento, retirado só pelo link até `vipAte` (ISO). */
  vip?: boolean;
  vipAte?: string | null;
  vipToken?: string | null;
}

export interface EventoData {
  id: number;
  slug?: string | null;
  nome: string;
  descricao: string;
  data: string;
  horario: string;
  status: number;
  destaque: boolean;
  classificacaoEtaria: string;
  email: string;
  whatsapp: string;
  instagram: string;
  atracoes: string;
  programacao: string;
  politicaMeiaEntrada: string;
  politicaCancelamento: string;
  thumbnails: Thumbnail[];
  endereco: Endereco;
  ingressos: IngressoLote[];
  local?: string | null;
}

export interface SectionProps {
  event: EventoData;
  onRefresh: () => void;
  /** Navega pra outra seção (atalhos da visão geral e da publicação). */
  onGoTo?: (key: SectionKey) => void;
}
