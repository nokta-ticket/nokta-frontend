import { Address } from "./address";
import { Paginate } from "./paginate";

export type Thumbnail = { id?: string; url?: string; path?: string };

export type EventoAPI = {
  id: string;
  slug?: string | null;
  nome: string;
  data: string; // yyyy-MM-dd
  horario: string; // HH:mm
  local: string;
  thumbnails: Thumbnail[];
  endereco: Address;
  ativo: boolean;
  destaque?: boolean;
  favorito?: boolean;
  isFavorite?: boolean;
  percentualVendido?: number;
  ultimoLote?: boolean;
};

export interface GetEvents {
  data: EventoAPI[];
  paginate: Paginate;
}

export interface EventDetails {
  id: string;
  slug?: string | null;
  nome: string;
  descricao: string;
  programacao: string;
  data: string;
  horario: string;
  endereco: Address;
  local: string;
  info?: string | null;
  politicaCancelamento?: string | null;
  classificacaoEtaria?: string | null;
  politicaMeiaEntrada?: string | null;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  thumbnails: Thumbnail[];
  // 1=Rascunho, 2=Publicado, 3=Cancelado, 4=Finalizado (EventStatus no
  // backend) — já usado em runtime (eventos/[id]/page.tsx), só faltava no
  // tipo. Erro pré-existente corrigido na Fase 4 da unificação.
  status?: number;
}
