import api from "@/lib/axios";

// Lista VIP de um evento (nokta-api, ProducerService.getVipLists): lista de
// nomes com entrada gratuita, divulgada pelo link /vip/<evento>. Quem coloca
// o nome recebe um ingresso com QR na conta.

export interface VipListSummary {
  id: number;
  nome: string | null;
  vipAte: string | null;
  ativa: boolean;
  total: number;
  naLista: number;
  entraram: number;
}

export interface VipListName {
  id: number;
  listaId: number;
  nome: string;
  email: string;
  entrou: boolean;
  em: string;
}

export interface VipListsResponse {
  /** Endereço do evento: o link é /vip/<link>. */
  link: string;
  listas: VipListSummary[];
  nomes: VipListName[];
}

export interface VipListPayload {
  nome: string;
  total: number;
  vipAte: string;
  ativa: boolean;
}

const base = (eventId: number) => `/produtor/eventos/${eventId}/lista-vip`;

export const vipListsApi = {
  get: (eventId: number) => api.get<VipListsResponse>(base(eventId)).then((r) => r.data),
  create: (eventId: number, payload: VipListPayload) =>
    api.post<VipListsResponse>(base(eventId), payload).then((r) => r.data),
  update: (eventId: number, listId: number, payload: VipListPayload) =>
    api.put<VipListsResponse>(`${base(eventId)}/${listId}`, payload).then((r) => r.data),
  remove: (eventId: number, listId: number) => api.delete(`${base(eventId)}/${listId}`),
};
