"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/pt-br";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { EventoAPI } from "@/interfaces/events";
import { MEDIA_FALLBACK, resolveThumbnailUrl } from "@/lib/media";
import { formatarDataCurta } from "@/lib/formatarData";
import EventCard from "./EventCard";
import EventCardSmall from "./EventCardSmall";

dayjs.extend(isBetween);
dayjs.locale("pt-br");

/* ─── tipos ─────────────────────────────────────────────── */
type Periodo =
  | "hoje"
  | "amanhã"
  | "nesta semana"
  | "neste final de semana"
  | "na próxima semana"
  | "neste mês";

const PERIODOS: Periodo[] = [
  "hoje",
  "amanhã",
  "nesta semana",
  "neste final de semana",
  "na próxima semana",
  "neste mês",
];

const ULTIMO_CHAMADA_THRESHOLD = 80;

/* ─── helpers de data ────────────────────────────────────── */
function toDay(isoDate: string) {
  return dayjs(isoDate.split("T")[0]);
}

function filtrarPorPeriodo(events: EventoAPI[], periodo: Periodo): EventoAPI[] {
  const hoje = dayjs().startOf("day");

  switch (periodo) {
    case "hoje":
      return events.filter((e) => toDay(e.data).isSame(hoje, "day"));
    case "amanhã":
      return events.filter((e) =>
        toDay(e.data).isSame(hoje.add(1, "day"), "day")
      );
    case "nesta semana":
      return events.filter((e) =>
        toDay(e.data).isBetween(hoje, hoje.add(7, "day"), "day", "[]")
      );
    case "neste final de semana": {
      const diaSemana = hoje.day();
      const diasAteSabado = (6 - diaSemana + 7) % 7 || 7;
      const sabado = hoje.add(diasAteSabado, "day");
      const domingo = sabado.add(1, "day");
      return events.filter((e) => {
        const d = toDay(e.data);
        return d.isSame(sabado, "day") || d.isSame(domingo, "day");
      });
    }
    case "na próxima semana":
      return events.filter((e) =>
        toDay(e.data).isBetween(
          hoje.add(7, "day"),
          hoje.add(14, "day"),
          "day",
          "[]"
        )
      );
    case "neste mês":
      return events.filter((e) => toDay(e.data).isSame(hoje, "month"));
    default:
      return events;
  }
}

function porMaisVendidos(events: EventoAPI[]): EventoAPI[] {
  return [...events].sort(
    (a, b) => (b.percentualVendido ?? 0) - (a.percentualVendido ?? 0)
  );
}

/* ─── sub-componente: carrossel horizontal ───────────────── */
function SectionCarousel({
  title,
  events,
  periodSelector,
}: {
  title: React.ReactNode;
  events: EventoAPI[];
  periodSelector?: React.ReactNode;
}) {
  if (events.length === 0) return null;

  return (
    <div className="mb-7">
      <div className="flex items-center justify-between mb-3 px-4">
        <h3 className="text-[17px] font-bold text-foreground flex items-center gap-1 flex-wrap">
          {title}
          {periodSelector}
        </h3>
        <Link
          href="/eventos"
          className="text-[13px] font-semibold text-violet-600 shrink-0 ml-2"
        >
          Ver tudo
        </Link>
      </div>
      <div
        className="flex gap-3.5 overflow-x-auto px-4 pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {events.map((ev) => (
          <EventCardSmall key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}

/* ─── sub-componente: item "Última chamada" ──────────────── */
function LastCallItem({ event }: { event: EventoAPI }) {
  const cover = resolveThumbnailUrl(event.thumbnails[0], MEDIA_FALLBACK);
  const href = `/eventos/${event.slug ?? event.id}`;

  return (
    <Link
      href={href}
      className="flex gap-3.5 py-3 border-b border-border last:border-b-0 items-start"
    >
      <div className="relative flex-none w-24 h-[70px] rounded-xl overflow-hidden bg-gradient-to-br from-[#2a1f4a] to-[#0f0f1a]">
        <Image
          src={cover ?? MEDIA_FALLBACK}
          alt={event.nome}
          fill
          sizes="96px"
          className="object-cover"
          loading="lazy"
          unoptimized
        />
        <span className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10 leading-tight">
          Tá acabando
        </span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[15px] font-bold leading-snug text-foreground line-clamp-2 mb-1">
          {event.nome}
        </p>
        <p className="text-[13px] text-muted-foreground truncate mb-1">
          {event.endereco?.localidade} — {event.endereco?.uf}
        </p>
        <p className="text-[13px] font-bold text-violet-600">
          {formatarDataCurta(event.data)}
        </p>
      </div>
    </Link>
  );
}

/* ─── sub-componente: dropdown de período ────────────────── */
function PeriodDropdown({
  value,
  onChange,
}: {
  value: Periodo;
  onChange: (p: Periodo) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-0.5 text-violet-600 cursor-pointer select-none">
      <span className="font-bold text-[17px]" onClick={() => setOpen((o) => !o)}>
        {value}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="none"
        viewBox="0 0 24 24"
        className={`transition-transform ${open ? "rotate-180" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <path
          stroke="#7c3aed"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m6 9 6 6 6-6"
        />
      </svg>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 min-w-[200px] bg-white border border-border rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.13)] overflow-hidden z-20">
            {PERIODOS.map((p) => (
              <button
                key={p}
                className={`w-full text-left px-4 py-3 text-[14px] font-medium transition-colors hover:bg-violet-50 ${
                  p === value ? "text-violet-600 font-bold" : "text-foreground"
                }`}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function EventGrid() {
  const [events, setEvents] = useState<EventoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("hoje");

  async function fetchEvents() {
    try {
      const res = await api.get("/eventos");
      setEvents(res.data.data as EventoAPI[]);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  /* ── Destaques da Nokta ─────────────────────────────────── */
  const destaques = useMemo(() => {
    if (events.length <= 5) return events;
    const destacados = events.filter((e) => e.destaque);
    if (destacados.length > 0) return porMaisVendidos(destacados);
    return porMaisVendidos(events).slice(0, 5);
  }, [events]);

  /* ── O que fazer [período] ──────────────────────────────── */
  const oQueFazer = useMemo(() => {
    const filtrados = filtrarPorPeriodo(events, periodo);
    if (filtrados.length <= 5) return filtrados;
    return porMaisVendidos(filtrados).slice(0, 5);
  }, [events, periodo]);

  /* ── Última chamada ─────────────────────────────────────── */
  const ultimaChamada = useMemo(
    () =>
      porMaisVendidos(
        events.filter(
          (e) =>
            (e.percentualVendido ?? 0) >= ULTIMO_CHAMADA_THRESHOLD ||
            e.ultimoLote === true
        )
      ),
    [events]
  );

  /* ── Filtro desktop ─────────────────────────────────────── */
  const filtered = useMemo(
    () =>
      events.filter((e) =>
        e.nome.toLowerCase().includes(q.toLowerCase().trim())
      ),
    [events, q]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          VERSÃO MOBILE  (oculta em lg+)
          ══════════════════════════════════════════════════════ */}
      <section className="lg:hidden mt-8 w-full pb-4">

        {/* 1. Destaques da Nokta */}
        <SectionCarousel title="Destaques da Nokta" events={destaques} />

        {/* 2. O que fazer [período] — oculto se período vazio */}
        <SectionCarousel
          title="O que fazer"
          events={oQueFazer}
          periodSelector={
            <PeriodDropdown value={periodo} onChange={setPeriodo} />
          }
        />

        {/* 3. Última chamada — oculto se nenhum qualificado */}
        {ultimaChamada.length > 0 && (
          <div className="mb-7 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[17px] font-bold text-foreground">
                Última chamada
              </h3>
              <Link
                href="/eventos"
                className="text-[13px] font-semibold text-violet-600"
              >
                Ver tudo
              </Link>
            </div>
            <ul>
              {ultimaChamada.map((ev) => (
                <li key={ev.id}>
                  <LastCallItem event={ev} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          VERSÃO DESKTOP  (oculta abaixo de lg)
          ══════════════════════════════════════════════════════ */}
      <section className="hidden lg:block mx-auto mt-12 w-full max-w-[1300px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold">Todos os eventos</h2>
          <div className="w-full max-w-sm">
            <Input
              placeholder="Pesquisar eventos"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Nenhum evento encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}

        <div className="mb-10 mt-10 flex justify-center">
          <Link href="/eventos">
            <Button className="bg-violet-600 px-10 py-4 text-sm uppercase text-white transition-colors hover:bg-violet-700">
              Ver Todos Eventos!
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
