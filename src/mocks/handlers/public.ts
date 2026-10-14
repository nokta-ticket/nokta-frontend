import { MOCK_EVENTS, MOCK_RESALES, mockEventDetails, mockTickets, mockVipLists } from "../fixtures";
import { notFound, paginate, unauthorized, type MockHandler } from "./types";
import { hasMockSession } from "./account";

// Mesmas taxas do `/pagamento/info-parcelas` (handlers/checkout.ts): a tabela
// de parcelas precisa bater com o valor "ou 12x" que a página do evento calcula.
const CARD_RATE_BPS = [319, 449, 449, 449, 449, 449, 499, 499, 499, 499, 499, 499];
const CARD_FIXED_CENTS = 99;
const MAX_SEM_JUROS = 1;

/** Descoberta pública: home, lista, detalhe do evento, revenda (leitura). */
export const publicHandlers: MockHandler[] = [
  { test: /\/eventos\/destaques$/, handle: () => ({ data: MOCK_EVENTS.filter((e) => e.destaque) }) },
  { test: /\/eventos\/ativos$/, handle: () => ({ data: MOCK_EVENTS }) },
  // Favoritos da conta (formato resumido da API). Sem sessão fictícia: 401.
  {
    test: /\/eventos\/favoritos$/,
    handle: () => (hasMockSession() ? { data: MOCK_EVENTS.slice(0, 5).map((e) => ({ eventoId: e.id, slug: e.slug, nome: e.nome, data: e.data, local: e.local, thumbnailUrl: e.thumbnails[0]?.url ?? null })) } : unauthorized()),
  },
  // Favoritar/desfavoritar: o front é otimista, aqui só confirma.
  { test: /\/eventos\/[^/]+\/favoritos$/, method: "patch", handle: () => ({ data: { ok: true } }) },
  { test: /\/eventos\/favoritos\/[^/]+$/, method: "delete", handle: () => ({ data: { ok: true } }) },
  {
    test: /\/eventos$/,
    handle: ({ params }) => {
      const q = (params.name ?? params.q ?? "").toLowerCase();
      const items = q ? MOCK_EVENTS.filter((e) => `${e.nome} ${e.local} ${e.endereco.localidade}`.toLowerCase().includes(q)) : MOCK_EVENTS;
      return { data: paginate(items, params) };
    },
  },
  {
    test: /\/eventos\/([^/]+)\/ingressos$/,
    handle: ({ url }) => ({ data: { data: mockTickets(decodeURIComponent(url.pathname.split("/").at(-2) ?? "")) } }),
  },
  {
    test: /\/eventos\/[^/]+$/,
    handle: ({ url }) => {
      const ev = mockEventDetails(decodeURIComponent(url.pathname.split("/").at(-1) ?? ""));
      return ev ? { data: ev } : notFound("Evento não encontrado");
    },
  },
  // Tabela de parcelas no cartão (espelha o gross-up + split do backend).
  {
    test: /\/pagamento\/tabela-parcelas$/,
    handle: ({ params }) => {
      const subtotal = Math.max(0, Number(params.subtotalCents ?? 0));
      const card = CARD_RATE_BPS.map((bps, i) => {
        const n = i + 1;
        const semJuros = n <= MAX_SEM_JUROS;
        const totalCents = semJuros ? subtotal : Math.round((subtotal + CARD_FIXED_CENTS) / (1 - bps / 10000));
        return { n, installmentCents: Math.floor(totalCents / n), totalCents, semJuros };
      });
      return { data: { card } };
    },
  },
  // Link de promoter (?ref=): o backend seta o cookie de atribuição; aqui só confirma.
  { test: /\/promoter-tracking\/link$/, method: "post", handle: () => ({ data: { valid: true } }) },
  // Lista VIP (/vip/<slug>): retirar e consultar.
  {
    test: /\/lista-vip\/[^/]+\/retirar$/,
    method: "post",
    handle: ({ url }) => ({ data: { claimed: true, alreadyClaimed: url.pathname.includes("-encerrada") } }),
  },
  {
    test: /\/lista-vip\/[^/]+$/,
    handle: ({ url }) => {
      const res = mockVipLists(decodeURIComponent(url.pathname.split("/").at(-1) ?? ""));
      return res ? { data: res } : notFound("Este link de lista VIP não é válido.");
    },
  },
  { test: /\/revenda$/, handle: ({ params }) => ({ data: paginate(MOCK_RESALES, params, 20) }) },
  {
    test: /\/revenda\/\d+$/,
    handle: ({ url }) => {
      const r = MOCK_RESALES.find((x) => x.id === Number(url.pathname.split("/").at(-1)));
      return r ? { data: r } : notFound("Anúncio não encontrado");
    },
  },
  { test: /\/geocoding$/, handle: () => ({ data: { lat: -23.5505, lng: -46.6333 } }) },
  { test: /\/event-notify\/subscribe$/, method: "post", handle: () => ({ data: { ok: true } }) },
  { test: /\/support-contact$/, method: "post", handle: () => ({ data: { ok: true } }) },
];
