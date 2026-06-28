"use client";

import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  CalendarDays,
  Clock,
  Info,
  MapPin,
  Ticket,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { EventProgramJourney, ProgramItem } from "@/components/EventProgramJourney";
import dynamic from "next/dynamic";
const EventMap = dynamic(() => import("@/components/EventMap").then(m => m.EventMap), { ssr: false, loading: () => <div style={{ height: 180 }} className="bg-gray-100 animate-pulse" /> });
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { EnvelopeIcon } from "@/components/icons/EnvelopeIcon";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { CircleLIcon } from "@/components/icons/CircleLIcon";
import { AgeRestrictionIcon } from "@/components/icons/AgeRestrictionIcon";
import { CancellationIcon } from "@/components/icons/CancellationIcon";
import { CouponIcon } from "@/components/icons/CouponIcon";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import api from "@/lib/axios";
import { EventDetails } from "@/interfaces/events";
import { AutoplayPlugin, cn } from "@/lib/utils";
import { resolveThumbnailUrl } from "@/lib/media";

function formatDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function formatDatePill(raw: string) {
  if (!raw) return { weekday: "—", day: "—", month: "—" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { weekday: "—", day: "—", month: "—" };
  return {
    weekday: d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).toUpperCase().replace(".", ""),
    day: d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "UTC" }),
    month: d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).toUpperCase().replace(".", ""),
  };
}

function formatTime(raw: string) {
  if (!raw) return "";
  const str = typeof raw === "string" ? raw : String(raw);
  const timeMatch = str.match(/(\d{2}):(\d{2})/);
  if (timeMatch) return `${timeMatch[1]}:${timeMatch[2]}`;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }
  return "";
}

type PolicyModal = 'meiaEntrada' | 'cancelamento' | null;

type Ticket = {
  id: number;
  nome: string;
  lote: number;
  tipo: number;
  valor: number;
  quantidade: number;
  disponivelParaVenda: boolean;
  dataLimite?: string | null;
};

function formatTicketDate(raw?: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

function calcTaxa(valor: number) { return Math.round(valor * 0.1 * 100) / 100; }

// Espelha o cálculo do backend (gross-up + split em centavos)
function calcInstallmentCents(
  subtotalCents: number,
  n: number,
  maxSemJuros: number,
  cardRateBps: number[],
  cardFixedCents: number,
): number {
  const isSemJuros = n <= maxSemJuros;
  if (isSemJuros) return Math.floor(subtotalCents / n);
  const rateBps = cardRateBps[n - 1] ?? 0;
  const rate = rateBps / 10000;
  const total = Math.round((subtotalCents + cardFixedCents) / (1 - rate));
  return Math.floor(total / n);
}

export default function IngressoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setSlide] = useState(0);
  const [policyModal, setPolicyModal] = useState<PolicyModal>(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; desconto: number } | null>(null);
  const [maxSemJuros, setMaxSemJuros] = useState(0);
  const [maxParcelas, setMaxParcelas] = useState(12);
  const [cardRateBps, setCardRateBps] = useState<number[]>([]);
  const [cardFixedCents, setCardFixedCents] = useState(0);
  const [parcelasSheet, setParcelasSheet] = useState(false);
  const [parcelasData, setParcelasData] = useState<{ n: number; installmentCents: number; totalCents: number; semJuros: boolean }[]>([]);
  const [parcelasLoading, setParcelasLoading] = useState(false);

  const [sliderRef, instRef] = useKeenSlider<HTMLDivElement>(
    { loop: true, slideChanged(s) { setSlide(s.track.details.rel); } },
    [AutoplayPlugin]
  );

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<EventDetails>(`/eventos/${id}`),
      api.get(`/eventos/${id}/ingressos`),
      api.get('/pagamento/info-parcelas').catch(() => ({ data: { maxParcelasSemJuros: 0 } })),
    ])
      .then(([evtRes, ingRes, parcelasRes]) => {
        setEvento(evtRes.data);
        const raw: Ticket[] = (ingRes.data as any).data ?? ingRes.data ?? [];
        setTickets(raw.map(t => ({ ...t, valor: Number(t.valor) })));
        setMaxSemJuros(parcelasRes.data.maxParcelasSemJuros ?? 0);
        setMaxParcelas(parcelasRes.data.maxParcelas ?? 12);
        setCardRateBps(parcelasRes.data.cardRateBps ?? []);
        setCardFixedCents(parcelasRes.data.cardFixedCents ?? 0);
      })
      .catch((err: any) => toast.error(err.message ?? 'Erro ao carregar evento.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function openParcelasSheet(subtotalReais: number) {
    const subtotalCents = Math.round(subtotalReais * 100);
    if (subtotalCents <= 0) return;
    setParcelasSheet(true);
    setParcelasLoading(true);
    try {
      const { data } = await api.get(`/pagamento/tabela-parcelas?subtotalCents=${subtotalCents}`);
      setParcelasData(data.card ?? []);
    } catch {
      setParcelasData([]);
    } finally {
      setParcelasLoading(false);
    }
  }

  function changeQty(ticketId: number, delta: number, max: number) {
    setQuantities(prev => {
      const cur = prev[ticketId] ?? 0;
      const next = Math.min(max, Math.max(0, cur + delta));
      return { ...prev, [ticketId]: next };
    });
  }

  const totalSelecionado = Object.values(quantities).reduce((a, b) => a + b, 0);

  const totalValor = tickets.reduce((sum, tk) => {
    const qty = quantities[tk.id] ?? 0;
    return sum + precoComDesconto(tk.valor) * qty;
  }, 0);
  const totalSubtotalCents = Math.round(totalValor * 1.1 * 100);
  const totalParcelado = (calcInstallmentCents(totalSubtotalCents, maxParcelas, maxSemJuros, cardRateBps, cardFixedCents) / 100).toFixed(2).replace('.', ',');

  async function handleAplicarCupom() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post('/cupons/validar', { codigo: couponCode.trim(), eventoId: id });
      const data = res.data;
      setCouponApplied({ code: couponCode.trim().toUpperCase(), desconto: Number(data.desconto ?? data.percentual ?? 0) });
      setCouponOpen(false);
      toast.success(`Cupom ${couponCode.trim().toUpperCase()} aplicado!`);
    } catch {
      setCouponError('Cupom inválido ou expirado.');
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoverCupom() {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  }

  function precoComDesconto(valor: number) {
    if (!couponApplied) return valor;
    return valor * (1 - couponApplied.desconto / 100);
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-10 text-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!evento) return null;

  const thumbs = (evento.thumbnails ?? [])
    .map((t) => resolveThumbnailUrl(t, "") ?? "")
    .filter(Boolean);

  const datePill = formatDatePill(evento.data);
  const dateStr = formatDate(evento.data);
  const timeStr = formatTime(evento.horario);
  const addr = evento.endereco;
  const checkoutHref = `/eventos/${evento.slug ?? evento.id}/checkout`;

  const isEventPast = (() => {
    if (!evento.data) return false;
    const eventDate = new Date(evento.data.split("T")[0] + "T23:59:59");
    return eventDate < new Date();
  })();
  const isCancelled = evento.status === 3;
  const isEncerrado = isEventPast || isCancelled;

  function buildCheckoutUrl() {
    const base = `/eventos/${evento!.slug ?? evento!.id}/checkout`;
    const selected = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (selected.length === 0) return base;
    const params = new URLSearchParams();
    params.set('items', selected.map(([tid, qty]) => `${tid}:${qty}`).join(','));
    if (couponApplied) params.set('cupom', couponApplied.code);
    return `${base}?${params.toString()}`;
  }
  const hasInfos =
    evento.classificacaoEtaria ||
    evento.politicaMeiaEntrada ||
    evento.politicaCancelamento ||
    evento.whatsapp ||
    evento.email ||
    evento.instagram;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: evento!.nome, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F8FA]">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="w-full sm:px-6 lg:px-8 sm:pt-6 max-w-[1440px] mx-auto">
        <div className="relative sm:rounded-3xl overflow-hidden shadow-xl">

          {/*
           * O keen-slider fica invisível (slides vazios) — apenas para
           * avançar currentSlide via AutoplayPlugin e via setas manuais.
           * A altura do hero é definida aqui.
           */}
          <div
            ref={sliderRef}
            className="keen-slider h-[245px] sm:h-[280px] md:h-[340px] lg:h-[360px]"
          >
            {thumbs.map((_, i) => (
              <div key={i} className="keen-slider__slide" />
            ))}
          </div>

          {/* ── Mobile: imagem limpa sem blur ──────────────────── */}
          {thumbs.length > 0 ? (
            <div className="sm:hidden absolute inset-0">
              <Image src={thumbs[currentSlide]} alt={evento.nome} fill className="object-cover" priority unoptimized />
            </div>
          ) : (
            <div className="sm:hidden absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-900 to-blue-900" />
          )}

          {/* ── Desktop: fundo desfocado + overlays ────────────── */}
          <div className="hidden sm:block absolute inset-0 overflow-hidden">
            {thumbs.length > 0 ? (
              <Image src={thumbs[currentSlide]} alt="" fill className="object-cover scale-110 blur-md brightness-[0.50] saturate-120" priority unoptimized />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-900 to-blue-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/20 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/18" />
          </div>

          {/* ── Camada 2: conteúdo principal (oculto no mobile — infos ficam abaixo) */}
          <div className="absolute inset-0 z-10 hidden sm:flex items-center px-14 lg:px-16 gap-10">

            {/* Esquerda: informações do evento */}
            <div className="flex-1 min-w-0">
              {/* Nome do evento */}
              <h1 className="text-[2.1rem] lg:text-[2.55rem] font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-xl mb-5 sm:mb-6 max-w-[520px]">
                {evento.nome}
              </h1>

              {/* Meta info — itens empilhados, espaçamento elegante */}
              <div className="flex flex-col gap-2.5 mb-7 sm:mb-8">
                <span className="flex items-center gap-2.5 text-[13px] text-white/90 font-medium">
                  <CalendarDays size={14} className="text-violet-300 shrink-0" />
                  <span className="capitalize">{dateStr}</span>
                </span>
                {timeStr && (
                  <span className="flex items-center gap-2.5 text-[13px] text-white/90 font-medium">
                    <Clock size={14} className="text-violet-300 shrink-0" />
                    {timeStr}h
                  </span>
                )}
                {addr && (
                  <span className="flex items-center gap-2.5 text-[13px] text-white/90 font-medium">
                    <MapPin size={14} className="text-violet-300 shrink-0" />
                    {addr.logradouro}, {addr.numero} · {addr.localidade}/{addr.uf}
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3.5">
                {isEncerrado ? (
                  <Button disabled className="bg-gray-500 text-white font-bold px-8 h-12 gap-2 text-[15px] rounded-xl cursor-not-allowed opacity-70">
                    {isCancelled ? "Evento Cancelado" : "Evento Encerrado"}
                  </Button>
                ) : (
                  <Link href={checkoutHref}>
                    <Button className="bg-gradient-to-r from-[#9944CC] to-[#3399FF] hover:brightness-110 text-white font-bold px-8 h-12 gap-2 text-[15px] shadow-xl shadow-violet-900/40 transition-all rounded-xl">
                      <Ticket size={16} />
                      Comprar ingresso
                    </Button>
                  </Link>
                )}
                <button
                  onClick={handleShare}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 text-white/40 hover:text-white/80 hover:bg-white/15 transition"
                  aria-label="Compartilhar"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {/* Direita: poster/imagem do evento — oculto em mobile */}
            {thumbs.length > 0 && (
              <div className="hidden sm:block shrink-0">
                <div className="relative w-[130px] aspect-[3/4] sm:w-[160px] md:w-[195px] lg:w-[215px] rounded-[1.1rem] overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.50)] ring-1 ring-white/18">
                  <Image
                    src={thumbs[currentSlide]}
                    alt={evento.nome}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Setas do carrossel — bordas do hero, não sobre o conteúdo ── */}
          {thumbs.length > 1 && (
            <>
              <button
                onClick={() => instRef.current?.prev()}
                className="absolute left-0.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white/40 hover:bg-black/45 hover:text-white transition"
                aria-label="Anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => instRef.current?.next()}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 text-white/40 hover:bg-black/45 hover:text-white transition"
                aria-label="Próximo"
              >
                <ChevronRight size={14} />
              </button>

              {/* Dots — centro inferior */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {thumbs.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => instRef.current?.moveToIdx(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      currentSlide === idx ? "w-4 bg-white" : "w-1 bg-white/35 hover:bg-white/65"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Botão Compartilhar mobile — metade dentro/fora do hero ── */}
      <div className="sm:hidden flex justify-center -mt-5 relative z-10">
        <button
          onClick={handleShare}
          className="group flex items-center gap-2 rounded-full px-7 py-2.5 bg-white text-[#111827] text-[12px] font-bold uppercase tracking-[0.14em] shadow-[0_4px_24px_rgba(153,68,204,0.18)] border border-gray-100 hover:shadow-[0_4px_24px_rgba(153,68,204,0.32)] transition-all"
        >
          <Share2 size={13} className="text-[#9944CC]" />
          Compartilhar
        </button>
      </div>

      {/* ── INFO MOBILE (abaixo do hero) ─────────────────────────── */}
      <div className="sm:hidden px-4 pt-5 pb-2">
        {/* Nome do evento */}
        <h1
          className="font-bold leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-[#7B2FBE] via-[#9944CC] to-[#3399FF] mb-3 whitespace-nowrap overflow-hidden"
          style={{
            fontSize:
              evento.nome.length <= 16 ? '1.7rem'
              : evento.nome.length <= 22 ? '1.4rem'
              : evento.nome.length <= 30 ? '1.15rem'
              : '0.95rem',
          }}
        >
          {evento.nome}
        </h1>

        {/* Linha divisória sutil */}
        <div className="h-px w-12 bg-gradient-to-r from-[#9944CC] to-[#3399FF] rounded-full mb-3" />

        {/* Data e local */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={14} className="text-[#9944CC] shrink-0" />
            <span className="text-[13px] font-semibold text-[#374151] capitalize">
              {dateStr}{timeStr ? <span className="text-gray-400 font-normal"> · {timeStr}h</span> : ''}
            </span>
          </div>
          {addr && (
            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-[#9944CC] shrink-0" />
              <span className="text-[13px] font-semibold text-[#374151]">
                {addr.logradouro}, {addr.numero}
                <span className="text-gray-400 font-normal"> · {addr.localidade}/{addr.uf}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-16">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-10">

          {/* ── COLUNA PRINCIPAL (2/3) ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">

            {/* ── Seleção de Ingressos (mobile only) ────────────── */}
            {tickets.length > 0 && (
              <div className="lg:hidden">
                <SectionLabel>Escolha uma opção</SectionLabel>

                <div className="mt-3 flex flex-col gap-3">
                  {tickets.map((tk) => {
                    const qty = quantities[tk.id] ?? 0;
                    const valorFinal = precoComDesconto(tk.valor);
                    const taxa = calcTaxa(valorFinal);
                    const limitDate = formatTicketDate(tk.dataLimite);
                    const isGratuito = valorFinal === 0;
                    const disponivel = tk.disponivelParaVenda;
                    const subtotalCents = Math.round((valorFinal + taxa) * 100);
                    const parcelaMaxStr = (calcInstallmentCents(subtotalCents, maxParcelas, maxSemJuros, cardRateBps, cardFixedCents) / 100).toFixed(2).replace('.', ',');

                    return (
                      <div
                        key={tk.id}
                        className={cn(
                          'rounded-xl border px-4 py-3.5 flex items-center gap-4 transition',
                          qty > 0 ? 'border-[#9944CC]/40 bg-violet-50/40' : 'border-gray-200 bg-white',
                          !disponivel && 'opacity-60'
                        )}
                      >
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#0F172A] uppercase leading-snug mb-1">
                            {tk.nome}
                          </p>
                          {isGratuito ? (
                            <p className="text-[13px] font-bold text-[#9944CC]">Gratuito</p>
                          ) : (
                            <>
                              <p className="text-[13px] font-bold text-[#0F172A]">
                                {couponApplied && (
                                  <span className="line-through text-gray-400 font-normal text-[12px] mr-1">
                                    R$ {tk.valor.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                                R$ {valorFinal.toFixed(2).replace('.', ',')}
                                <span className="text-gray-400 font-normal text-[12px]">
                                  {' '}(+{taxa.toFixed(2).replace('.', ',')} taxa)
                                </span>
                              </p>
                              {valorFinal >= 60 && (
                                maxSemJuros > 0 ? (
                                  <>
                                    <p className="text-[12px] font-semibold text-emerald-600">em até {maxSemJuros}x sem juros</p>
                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                      ou {maxParcelas}x R$ {parcelaMaxStr}
                                      <button type="button" onClick={() => openParcelasSheet(valorFinal + taxa)} className="inline-flex">
                                        <Info size={12} className="text-black hover:opacity-70 transition-opacity" />
                                      </button>
                                    </p>
                                  </>
                                ) : (
                                  <div className="text-[12px] font-semibold text-emerald-600 leading-tight">
                                    <p>Parcelamento disponível em até</p>
                                    <p className="flex items-center gap-1">
                                      {maxParcelas}x R$ {parcelaMaxStr}
                                      <button type="button" onClick={() => openParcelasSheet(valorFinal + taxa)} className="inline-flex">
                                        <Info size={12} className="text-black hover:opacity-70 transition-opacity" />
                                      </button>
                                    </p>
                                  </div>
                                )
                              )}
                            </>
                          )}
                          {limitDate && (
                            <p className="text-[11px] text-gray-400 mt-0.5 italic">Vendas até {limitDate}</p>
                          )}
                          {!disponivel && (
                            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Não iniciado</p>
                          )}
                        </div>

                        {/* Seletor de quantidade */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => changeQty(tk.id, -1, tk.quantidade)}
                            disabled={qty === 0 || !disponivel}
                            className="h-8 w-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-25 flex items-center justify-center transition text-gray-600 font-bold text-lg shadow-sm"
                          >−</button>
                          <span className="w-5 text-center text-[14px] font-semibold text-[#0F172A]">{qty}</span>
                          <button
                            onClick={() => changeQty(tk.id, 1, tk.quantidade)}
                            disabled={!disponivel}
                            className="h-8 w-8 rounded-full bg-gradient-to-br from-[#B44FE8] to-[#22AAFF] hover:brightness-110 disabled:opacity-30 flex items-center justify-center transition text-white font-bold text-lg shadow-md shadow-violet-300"
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {tickets.length > 0 && <div className="lg:hidden h-px bg-gradient-to-r from-[#9944CC]/20 via-[#D86CFA]/10 to-transparent" />}

            {/* Sobre o evento — bloco editorial com barra lateral */}
            {evento.descricao && (
              <div>
                <SectionLabel>Sobre o evento</SectionLabel>
                <p className="mt-2 pl-[13px] text-[14px] text-gray-600 leading-[1.85] whitespace-pre-line">
                  {evento.descricao}
                </p>
              </div>
            )}

            <div className="h-px bg-gradient-to-r from-[#9944CC]/20 via-[#D86CFA]/10 to-transparent" />

            {/* Programação */}
            <EventProgramJourney items={parseProgramacao(evento.programacao ?? '')} ctaHref={checkoutHref} />

            {/* Info extra */}
            {evento.info && (
              <>
                <div className="h-px bg-gradient-to-r from-[#9944CC]/20 via-[#D86CFA]/10 to-transparent" />
                <div>
                  <SectionLabel>Informações gerais</SectionLabel>
                  <p className="text-[15px] text-gray-700 whitespace-pre-line leading-[1.85] mt-2">
                    {evento.info}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* ── SIDEBAR (1/3) ──────────────────────────────────── */}
          <div className="space-y-4">

            {/* Card: Data e local */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex flex-col items-center shrink-0 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 min-w-[54px]">
                  <span className="text-[9px] font-bold text-gray-400 tracking-widest leading-none uppercase">
                    {datePill.weekday}
                  </span>
                  <span className="text-[2rem] font-black text-violet-700 leading-none tabular-nums mt-1">
                    {datePill.day}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase">
                    {datePill.month}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize leading-snug">{dateStr}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                    <Clock size={11} className="text-gray-400 shrink-0" />
                    Abertura às {timeStr}h
                  </p>
                </div>
              </div>

              {addr && (
                <>
                  <div className="h-px bg-gray-100 mx-4" />
                  <div className="flex items-start gap-3 px-5 py-4">
                    <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {addr.logradouro}, {addr.numero}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {addr.bairro && `${addr.bairro} · `}{addr.localidade}, {addr.uf}
                      </p>
                      {addr.cep && (
                        <p className="text-[11px] text-gray-300 mt-0.5">CEP {addr.cep}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Card: Informações */}
            {(evento.classificacaoEtaria || evento.politicaMeiaEntrada || evento.politicaCancelamento) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
                    Informações do evento
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {evento.classificacaoEtaria && (
                    <div className="flex items-center gap-3 px-3 py-3.5">
                      <div className="h-7 w-7 flex items-center justify-center shrink-0">
                        {/18/i.test(evento.classificacaoEtaria)
                          ? <AgeRestrictionIcon size={22} className="text-[#111827]" />
                          : <CircleLIcon size={22} className="text-[#111827]" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 leading-none mb-1">Classificação etária</p>
                        <p className="text-[13px] font-bold text-[#111827]">{evento.classificacaoEtaria}</p>
                      </div>
                    </div>
                  )}
                  {evento.politicaMeiaEntrada && (
                    <button
                      onClick={() => setPolicyModal('meiaEntrada')}
                      className="w-full flex items-center gap-3 px-3 py-3.5 text-left hover:bg-gray-50 transition"
                    >
                      <div className="h-7 w-7 flex items-center justify-center shrink-0">
                        <CouponIcon size={22} className="text-[#111827]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 leading-none mb-1">Meia entrada</p>
                        <p className="text-[13px] font-bold text-[#111827]">Regras disponíveis para este evento</p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#6D3BFF] shrink-0 flex items-center gap-0.5">
                        Ver mais <ChevronRight size={13} className="mt-px" />
                      </span>
                    </button>
                  )}
                  {evento.politicaCancelamento && (
                    <button
                      onClick={() => setPolicyModal('cancelamento')}
                      className="w-full flex items-center gap-3 px-3 py-3.5 text-left hover:bg-gray-50 transition"
                    >
                      <div className="h-7 w-7 flex items-center justify-center shrink-0">
                        <CancellationIcon size={22} className="text-[#111827]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-400 leading-none mb-1">Cancelamento</p>
                        <p className="text-[13px] font-bold text-[#111827]">Política definida pelo organizador</p>
                      </div>
                      <span className="text-[12px] font-semibold text-[#6D3BFF] shrink-0 flex items-center gap-0.5">
                        Ver mais <ChevronRight size={13} className="mt-px" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal de políticas */}
            {policyModal && (
              <div
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                onClick={() => setPolicyModal(null)}
              >
                {/* overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                {/* sheet */}
                <div
                  className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-6 pt-5 pb-8 sm:pb-6 mx-0 sm:mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* drag handle mobile */}
                  <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-[#111827]">
                      {policyModal === 'meiaEntrada' ? 'Política de meia entrada' : 'Política de cancelamento'}
                    </h3>
                    <button
                      onClick={() => setPolicyModal(null)}
                      className="ml-4 shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-[13.5px] text-[#374151] leading-relaxed whitespace-pre-line">
                    {policyModal === 'meiaEntrada' ? evento.politicaMeiaEntrada : evento.politicaCancelamento}
                  </p>
                </div>
              </div>
            )}

            {/* Card: Contato */}
            {(evento.whatsapp || evento.email || evento.instagram) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
                    Fale com o organizador
                  </p>
                </div>
                <div className="px-5 py-3.5 space-y-2.5">
                  {evento.whatsapp && (
                    <a
                      href={`https://wa.me/${evento.whatsapp.replace(/\D/g, "")}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 text-sm text-gray-700 hover:text-violet-700 transition group"
                    >
                      <WhatsappIcon size={16} className="shrink-0 text-gray-900 group-hover:text-violet-600 transition" />
                      <span className="font-medium">WhatsApp</span>
                    </a>
                  )}
                  {evento.email && (
                    <a
                      href={`mailto:${evento.email}`}
                      className="flex items-center gap-3 text-sm text-gray-700 hover:text-violet-700 transition group"
                    >
                      <EnvelopeIcon size={16} className="shrink-0 text-gray-900 group-hover:text-violet-600 transition" />
                      <span className="font-medium truncate">{evento.email}</span>
                    </a>
                  )}
                  {evento.instagram && (
                    <a
                      href={`https://instagram.com/${evento.instagram.replace("@", "")}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 text-sm text-gray-700 hover:text-violet-700 transition group"
                    >
                      <InstagramIcon size={16} className="shrink-0 text-gray-900 group-hover:text-violet-600 transition" />
                      <span className="font-medium">{evento.instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Card: Localização */}
            {addr && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">
                    Localização
                  </p>
                </div>

                {/* Mapa Leaflet + OpenStreetMap */}
                <div className="relative cursor-pointer" onClick={() => setRouteOpen(true)}>
                  <EventMap
                    address={`${addr.logradouro}, ${addr.numero}, ${addr.bairro ?? ''}, ${addr.localidade}, ${addr.uf}`}
                  />
                  {/* overlay apenas para capturar clique — não cobre os botões de zoom */}
                  <div className="absolute inset-0 z-[998]" style={{ right: 40 }} onClick={() => setRouteOpen(true)} />
                </div>

                {/* Endereço + botão */}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#111827] truncate">
                      {addr.logradouro}, {addr.numero}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {addr.bairro && `${addr.bairro} · `}{addr.localidade}, {addr.uf}
                    </p>
                  </div>
                  <button
                    onClick={() => setRouteOpen(true)}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-semibold px-3.5 py-2 transition"
                  >
                    <Navigation size={13} />
                    Ver rota
                  </button>
                </div>
              </div>
            )}

            {/* Modal de rotas */}
            {routeOpen && addr && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setRouteOpen(false)}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                <div
                  className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl px-5 pt-5 pb-8 sm:pb-6 mx-0 sm:mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-[#111827]">Como você vai chegar?</h3>
                    <button onClick={() => setRouteOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-400 mb-4 leading-snug">
                    {addr.logradouro}, {addr.numero} · {addr.localidade}, {addr.uf}
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        label: 'Google Maps',
                        color: 'bg-white border border-gray-200 text-[#111827]',
                        href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${addr.logradouro}, ${addr.numero}, ${addr.localidade}, ${addr.uf}`)}`,
                      },
                      {
                        label: 'Waze',
                        color: 'bg-white border border-gray-200 text-[#111827]',
                        href: `https://waze.com/ul?q=${encodeURIComponent(`${addr.logradouro}, ${addr.numero}, ${addr.localidade}, ${addr.uf}`)}`,
                      },
                      {
                        label: 'Uber',
                        color: 'bg-white border border-gray-200 text-[#111827]',
                        href: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(`${addr.logradouro}, ${addr.numero}, ${addr.localidade}, ${addr.uf}`)}`,
                      },
                      {
                        label: '99',
                        color: 'bg-white border border-gray-200 text-[#111827]',
                        href: `https://99app.com`,
                      },
                    ].map(({ label, color, href }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('flex items-center justify-between w-full rounded-xl px-4 py-3 text-[13px] font-semibold transition hover:bg-gray-50', color)}
                      >
                        {label}
                        <ExternalLink size={13} className="text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Sticky bottom: cupom + botão comprar (mobile) ──────── */}
      {tickets.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 pt-2.5 pb-4">

          {/* Total */}
          {totalSelecionado > 0 && (
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[14px] font-bold text-[#0F172A]">
                Total <span className="text-[15px]">R$ {totalValor.toFixed(2).replace('.', ',')}</span>
              </span>
              <span className="text-[12px] text-gray-400 flex items-center gap-1">
                {maxSemJuros > 0
                  ? `ou ${maxParcelas}x R$ ${totalParcelado}`
                  : `Parcele em até ${maxParcelas}x R$ ${totalParcelado}`}
                <button type="button" onClick={() => openParcelasSheet(totalValor * 1.1)} className="inline-flex">
                  <Info size={12} className="text-black hover:opacity-70 transition-opacity" />
                </button>
              </span>
            </div>
          )}

          {/* Cupom aplicado */}
          {couponApplied ? (
            <div className="flex items-center justify-between mb-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 text-[12px] text-emerald-700 font-semibold">
                <CouponIcon size={13} />
                {couponApplied.code} · {couponApplied.desconto}% de desconto
              </div>
              <button onClick={handleRemoverCupom} className="text-gray-400 hover:text-gray-600 transition">
                <X size={14} />
              </button>
            </div>
          ) : couponOpen ? (
            /* Input de cupom */
            <div className="mb-2.5">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAplicarCupom()}
                  placeholder="Digite o cupom"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[16px] sm:text-[13px] font-medium focus:outline-none focus:border-[#9944CC] focus:ring-1 focus:ring-[#9944CC]/30 uppercase placeholder:normal-case placeholder:text-gray-400"
                />
                <button
                  onClick={handleAplicarCupom}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#9944CC] to-[#3399FF] text-white text-[12px] font-bold disabled:opacity-50 transition hover:brightness-110"
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
                <button onClick={() => { setCouponOpen(false); setCouponError(''); }} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={16} />
                </button>
              </div>
              {couponError && <p className="text-[11px] text-red-500 mt-1 pl-1">{couponError}</p>}
            </div>
          ) : (
            /* Botão abrir cupom */
            <button
              onClick={() => setCouponOpen(true)}
              className="flex items-center gap-1.5 text-[12px] text-[#9944CC] font-semibold mb-2.5 w-full justify-center hover:underline"
            >
              <CouponIcon size={14} />
              Inserir cupom de desconto
            </button>
          )}

          <Link href={totalSelecionado > 0 ? buildCheckoutUrl() : '#'} className="block">
            <button
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-[15px] text-white transition',
                totalSelecionado > 0
                  ? 'bg-gradient-to-r from-[#9944CC] to-[#3399FF] hover:brightness-110 shadow-lg shadow-violet-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {totalSelecionado > 0
                ? `Continuar · ${totalSelecionado} ingresso${totalSelecionado > 1 ? 's' : ''}`
                : 'Selecione um ingresso'}
            </button>
          </Link>
        </div>
      )}
      <div className="h-28 lg:hidden" />

      <Sheet open={parcelasSheet} onOpenChange={setParcelasSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-lg">Opções de parcelamento</SheetTitle>
          </SheetHeader>

          {parcelasLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {parcelasData.map((p) => (
                  <div
                    key={p.n}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {p.n}x de{' '}
                      <span className="font-semibold">
                        R$ {(p.installmentCents / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </span>
                    {p.semJuros && (
                      <span className="text-xs text-emerald-600 font-medium">sem juros</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[12px] font-medium text-black text-center pt-3 pb-4 border-t mt-2">
                Valores já incluem taxa de serviço e processamento.
              </p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <span className="mt-1 h-5 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#2D8CFF]" />
      <h2 className="text-lg font-bold text-[#0F172A]">{children}</h2>
    </div>
  );
}

// ── Programação helpers ───────────────────────────────────────────

function parseProgramacao(raw: string): ProgramItem[] {
  if (!raw.trim()) return [];
  const LABELS_RE = /Abertura|Warm[- ]?up|Atração|Atracao|Headliner|Encerramento/i;

  function labelToType(s: string): ProgramItem["type"] {
    const t = s.toLowerCase().replace(/[-\s]/g, "");
    if (t.includes("headliner")) return "headliner";
    if (t.includes("warmup")) return "warmup";
    if (t.includes("abertura")) return "opening";
    if (t.includes("encerramento")) return "closing";
    return "artist";
  }

  function autoType(text: string): ProgramItem["type"] {
    const t = text.toLowerCase();
    if (t.includes("headliner")) return "headliner";
    if (t.includes("warm")) return "warmup";
    if (t.includes("abertura") || t.includes("portão") || t.includes("portao")) return "opening";
    if (t.includes("encerramento")) return "closing";
    return "artist";
  }

  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[—–\-]+\s*/);
      const time = timeMatch ? timeMatch[1] : "";
      const rest = timeMatch ? line.slice(timeMatch[0].length).trim() : line;

      const endMatch = rest.match(/^(.+?)\s*[—–\-]+\s*([^—–\-]+)$/);
      if (endMatch && LABELS_RE.test(endMatch[2].trim())) {
        return { time, title: endMatch[1].trim(), subtitle: endMatch[2].trim(), type: labelToType(endMatch[2].trim()) };
      }

      const startMatch = rest.match(/^([^—–\-]+?)\s*[—–\-]+\s*(.+)$/);
      if (startMatch && LABELS_RE.test(startMatch[1].trim())) {
        return { time, title: startMatch[2].trim(), subtitle: startMatch[1].trim(), type: labelToType(startMatch[1].trim()) };
      }

      return { time, title: rest, type: autoType(rest) };
    });
}

