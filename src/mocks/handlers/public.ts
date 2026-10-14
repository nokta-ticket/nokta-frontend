import { MOCK_EVENTS, MOCK_RESALES, mockEventDetails, mockTickets } from "../fixtures";
import { notFound, paginate, unauthorized, type MockHandler } from "./types";

/** Descoberta pública: home, lista, detalhe do evento, revenda (leitura). */
export const publicHandlers: MockHandler[] = [
  { test: /\/eventos\/destaques$/, handle: () => ({ data: MOCK_EVENTS.filter((e) => e.destaque) }) },
  { test: /\/eventos\/ativos$/, handle: () => ({ data: MOCK_EVENTS }) },
  { test: /\/eventos\/favoritos$/, handle: () => unauthorized() },
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
