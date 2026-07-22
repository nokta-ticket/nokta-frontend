export interface Thumbnail {
  id?: number
  url: string
}

export interface Endereco {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  numero: string
  uf: string
}

export interface IngressoLote {
  id?: number
  nome: string
  tipo: number
  lote: number
  quantidade: number
  valor: number
  disponivelParaVenda: boolean
  dataLimite: string | null
}

export interface EventoData {
  id: number
  nome: string
  descricao: string
  data: string
  horario: string
  status: number
  destaque: boolean
  classificacaoEtaria: string
  email: string
  whatsapp: string
  instagram: string
  atracoes: string
  programacao: string
  politicaMeiaEntrada: string
  politicaCancelamento: string
  thumbnails: Thumbnail[]
  endereco: Endereco
  ingressos: IngressoLote[]
}

export interface SectionProps {
  event: EventoData
  onRefresh: () => void
}
