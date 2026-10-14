import type { AgendaEvent } from "@/lib/agenda/types";

/**
 * Agenda de demonstração (só em NEXT_PUBLIC_MOCK_API=1). Nomes e links são
 * fictícios: servem para ver a página com cards preenchidos sem chave da
 * API do Ticketmaster.
 */
const DAY = 86_400_000;
const day = (n: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(Date.now() + n * DAY));

const seed: [string, number, string, string, string, string, number | null, string][] = [
  ["Noite Eletrônica no Centro", 2, "23:00", "Galpão Central", "São Paulo", "SP", 80, "Eletrônica"],
  ["Festival de Inverno — Edição Paulista", 5, "14:00", "Parque da Cidade", "São Paulo", "SP", 180, "Festival"],
  ["Samba de Domingo", 6, "16:00", "Quadra da Vila", "São Paulo", "SP", 40, "Samba"],
  ["Turnê Acústica", 9, "21:00", "Teatro Municipal de Exemplo", "Rio de Janeiro", "RJ", 120, "MPB"],
  ["Baile Funk Open Air", 12, "22:00", "Arena Zona Sul", "Rio de Janeiro", "RJ", 60, "Funk"],
  ["Rock na Praça", 14, "18:00", "Praça da Estação", "Belo Horizonte", "MG", null, "Rock"],
  ["Sertanejo Universitário", 16, "22:00", "Arena Expo", "Curitiba", "PR", 90, "Sertanejo"],
  ["House Sunset", 19, "17:00", "Rooftop Bela Vista", "São Paulo", "SP", 70, "Eletrônica"],
];

export const MOCK_AGENDA: AgendaEvent[] = seed.map(([name, offset, time, venue, city, uf, price, genre], i) => ({
  id: `tm-demo-${i + 1}`,
  source: "ticketmaster",
  name,
  date: day(offset),
  time,
  venue,
  city,
  uf,
  address: null,
  image: null,
  url: "https://www.ticketmaster.com.br/",
  priceMin: price,
  priceMax: price ? price * 2 : null,
  status: "onsale",
  genre,
}));
