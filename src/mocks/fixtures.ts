/**
 * Fixtures do modo mock (NEXT_PUBLIC_MOCK_API=1). Dados fictícios pra
 * navegar e avaliar o visual sem backend. Nunca entra em produção.
 */
import type { EventDetails, EventoAPI } from "@/interfaces/events";

const DAY = 24 * 60 * 60 * 1000;

function isoDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Seed = {
  id: number;
  slug: string;
  nome: string;
  poster: string;
  days: number;
  horario: string;
  local: string;
  cidade: string;
  uf: string;
  bairro: string;
  logradouro: string;
  destaque?: boolean;
  percentualVendido?: number;
  ultimoLote?: boolean;
  descricao: string;
  atracoes?: string;
};

const SEEDS: Seed[] = [
  { id: 101, slug: "baile-neon", nome: "Baile Neon — All Night Long", poster: "baile-neon", days: 3, horario: "23:00", local: "Galpão 21", cidade: "São Paulo", uf: "SP", bairro: "Barra Funda", logradouro: "Av. Francisco Matarazzo, 400", destaque: true, percentualVendido: 86, ultimoLote: true, descricao: "A noite mais colorida da cidade volta com três pistas, visual mapping e open bar até 2h. Line-up com DJs residentes e convidados especiais.", atracoes: "Pedro Sampaio, Gabe Pereira, Malía" },
  { id: 102, slug: "sunset-sessions", nome: "Sunset Sessions · Open Air", poster: "sunset-sessions", days: 5, horario: "16:00", local: "Parque Villa-Lobos", cidade: "São Paulo", uf: "SP", bairro: "Alto de Pinheiros", logradouro: "Av. Prof. Fonseca Rodrigues, 2001", destaque: true, percentualVendido: 42, descricao: "Música eletrônica ao pôr do sol, food trucks e área kids. Entrada gratuita para crianças até 10 anos." },
  { id: 103, slug: "virada-tropical", nome: "Virada Tropical — Réveillon 2027", poster: "virada-tropical", days: 78, horario: "20:00", local: "Pontal de Itacaré", cidade: "Itacaré", uf: "BA", bairro: "Pontal", logradouro: "Rua da Praia, s/n", destaque: true, percentualVendido: 61, descricao: "Três dias de festa na praia com open bar premium, camarote e vista pro mar. Pacotes com hospedagem disponíveis." },
  { id: 104, slug: "pagode-do-cais", nome: "Pagode do Cais", poster: "pagode-do-cais", days: 9, horario: "18:00", local: "Cais Mauá", cidade: "Porto Alegre", uf: "RS", bairro: "Centro Histórico", logradouro: "Av. Mauá, 1050", percentualVendido: 30, descricao: "Roda de samba e pagode à beira do Guaíba. Chopp gelado, petiscos e muito swing." },
  { id: 105, slug: "techno-bunker", nome: "Techno Bunker — After", poster: "techno-bunker", days: 4, horario: "05:00", local: "Local secreto", cidade: "Belo Horizonte", uf: "MG", bairro: "Santa Tereza", logradouro: "Endereço revelado no dia", percentualVendido: 95, ultimoLote: true, descricao: "After exclusivo com line-up surpresa. Local revelado 2h antes por WhatsApp." },
  { id: 106, slug: "forro-na-praca", nome: "Forró na Praça", poster: "forro-na-praca", days: 12, horario: "19:00", local: "Praça do Campo Grande", cidade: "Salvador", uf: "BA", bairro: "Campo Grande", logradouro: "Praça 2 de Julho", percentualVendido: 12, descricao: "Trio pé-de-serra, quadrilha e comidas típicas. Traga a família!" },
  { id: 107, slug: "garden-party", nome: "Garden Party — Open Bar", poster: "garden-party", days: 15, horario: "15:00", local: "Casa Vereda", cidade: "Curitiba", uf: "PR", bairro: "Batel", logradouro: "Rua Comendador Araújo, 500", percentualVendido: 55, descricao: "Festa no jardim com open bar de gin, drinks autorais e DJ set de house." },
  { id: 108, slug: "noite-do-vinil", nome: "Noite do Vinil · Disco & Funk", poster: "noite-do-vinil", days: 20, horario: "22:00", local: "Bar do Alto", cidade: "Rio de Janeiro", uf: "RJ", bairro: "Botafogo", logradouro: "Rua Voluntários da Pátria, 190", percentualVendido: 20, descricao: "Só vinil, só clássicos. Disco, funk e boogie até o sol raiar." },
  { id: 109, slug: "bloco-da-madrugada", nome: "Bloco da Madrugada", poster: "bloco-da-madrugada", days: 26, horario: "06:00", local: "Largo da Batata", cidade: "São Paulo", uf: "SP", bairro: "Pinheiros", logradouro: "Largo da Batata", percentualVendido: 70, descricao: "O bloco que começa quando os outros acabam. Concentração às 6h." },
  { id: 110, slug: "rooftop-live", nome: "Rooftop Live Sessions", poster: "rooftop-live", days: 33, horario: "19:30", local: "Edifício Copan", cidade: "São Paulo", uf: "SP", bairro: "República", logradouro: "Av. Ipiranga, 200", percentualVendido: 48, descricao: "Shows intimistas no rooftop com vista 360° da cidade." },
  { id: 111, slug: "festival-horizonte", nome: "Festival Horizonte — 3 dias", poster: "festival-horizonte", days: 45, horario: "14:00", local: "Fazenda Santa Luzia", cidade: "Campinas", uf: "SP", bairro: "Zona Rural", logradouro: "Rod. Anhanguera, km 98", destaque: true, percentualVendido: 38, descricao: "Três dias de música, camping e arte. Mais de 40 atrações em 4 palcos." },
  { id: 112, slug: "samba-de-raiz", nome: "Samba de Raiz — Roda", poster: "samba-de-raiz", days: 50, horario: "17:00", local: "Casa do Samba", cidade: "Rio de Janeiro", uf: "RJ", bairro: "Lapa", logradouro: "Rua Mem de Sá, 80", percentualVendido: 8, descricao: "A roda de samba mais tradicional da Lapa, com bambas da velha guarda." },
];

export function posterUrl(file: string): string {
  return `/mock/posters/${file}.svg`;
}

export const MOCK_EVENTS: EventoAPI[] = SEEDS.map((s) => ({
  id: String(s.id),
  slug: s.slug,
  nome: s.nome,
  data: isoDate(s.days),
  horario: s.horario,
  local: s.local,
  thumbnails: [{ id: String(s.id), url: posterUrl(s.poster) }],
  endereco: { cep: "00000-000", logradouro: s.logradouro, bairro: s.bairro, localidade: s.cidade, numero: "", uf: s.uf },
  ativo: true,
  destaque: s.destaque ?? false,
  isFavorite: false,
  percentualVendido: s.percentualVendido ?? 0,
  ultimoLote: s.ultimoLote ?? false,
}));

export function mockEventDetails(slugOrId: string): EventDetails | null {
  const s = SEEDS.find((x) => x.slug === slugOrId || String(x.id) === slugOrId);
  if (!s) return null;
  return {
    id: String(s.id),
    slug: s.slug,
    taxaServicoPercent: 10,
    nome: s.nome,
    descricao: s.descricao,
    programacao: "16:00 Abertura dos portões\n18:00 DJ set de abertura\n20:00 Atração principal\n23:00 Encerramento",
    data: isoDate(s.days),
    horario: s.horario,
    endereco: { cep: "00000-000", logradouro: s.logradouro, bairro: s.bairro, localidade: s.cidade, numero: "", uf: s.uf },
    local: s.local,
    info: "Evento 18+. Apresentar documento com foto na entrada.",
    politicaCancelamento: "Reembolso integral em até 7 dias após a compra, desde que solicitado até 48h antes do evento.",
    classificacaoEtaria: "18 anos",
    politicaMeiaEntrada: "Meia-entrada para estudantes, idosos e PCD mediante apresentação de documento.",
    whatsapp: "5511999999999",
    email: "contato@nokta.live",
    instagram: "nokta.live",
    thumbnails: [{ id: String(s.id), url: posterUrl(s.poster) }],
    status: 2,
  };
}

export function mockTickets(eventId: string) {
  const s = SEEDS.find((x) => String(x.id) === eventId || x.slug === eventId);
  const soldOutFirst = (s?.percentualVendido ?? 0) >= 80;
  // A página busca pelo slug: o id do lote sai do seed (não de Number(slug) = NaN,
  // que fazia todos os lotes dividirem a mesma quantidade).
  const base = (s?.id ?? 0) * 10;
  return [
    { id: base + 1, nome: "Pista — 1º lote", lote: 1, tipo: 1, valor: 60, quantidade: soldOutFirst ? 0 : 120, disponivelParaVenda: true, dataLimite: null },
    { id: base + 2, nome: "Pista — 2º lote", lote: 2, tipo: 1, valor: 80, quantidade: 300, disponivelParaVenda: true, dataLimite: null },
    { id: base + 3, nome: "Pista — Meia-entrada", lote: 2, tipo: 2, valor: 40, quantidade: 80, disponivelParaVenda: true, dataLimite: null },
    { id: base + 4, nome: "Camarote Open Bar", lote: 1, tipo: 1, valor: 220, quantidade: 40, disponivelParaVenda: true, dataLimite: null },
  ];
}

export type MockVipStatus = "ABERTA" | "ENCERRADA" | "ESGOTADA" | "INDISPONIVEL";

/**
 * Lista VIP do link `/vip/<slug>` (ou do código da lista nos primeiros
 * links). Uma lista de cada estado pra ver todos os visuais do VipClaimCard.
 */
export function mockVipLists(key: string) {
  const s = SEEDS.find((x) => x.slug === key || String(x.id) === key || `vip-${x.slug}` === key);
  if (!s) return null;
  const listas: { token: string; nome: string | null; ate: string | null; status: MockVipStatus; naLista: number; total: number }[] = [
    { token: `vip-${s.id}-aberta`, nome: "Lista do produtor", ate: new Date(Date.now() + 2 * DAY).toISOString(), status: "ABERTA", naLista: 63, total: 100 },
    { token: `vip-${s.id}-encerrada`, nome: "Lista imprensa", ate: new Date(Date.now() - DAY).toISOString(), status: "ENCERRADA", naLista: 18, total: 30 },
    { token: `vip-${s.id}-esgotada`, nome: "Aniversariantes do mês", ate: null, status: "ESGOTADA", naLista: 50, total: 50 },
  ];
  return { evento: { id: s.id, nome: s.nome, slug: s.slug, thumbnail: posterUrl(s.poster) }, listas };
}

export const MOCK_RESALES = MOCK_EVENTS.slice(0, 5).map((e, i) => ({
  id: 900 + i,
  buyerPrice: 70 + i * 10,
  sellerAmount: 60 + i * 10,
  originalPrice: 80 + i * 10,
  status: 1,
  expiresAt: new Date(Date.now() + (i + 1) * DAY).toISOString(),
  evento: { id: e.id, slug: e.slug, nome: e.nome, data: e.data, horario: e.horario, thumbnails: e.thumbnails, endereco: e.endereco, local: e.local },
  ingresso: { nome: "Pista — 2º lote", tipo: 1, lote: 2 },
}));
