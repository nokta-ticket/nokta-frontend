'use client';

import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ArrowRight, ArrowLeft, Calendar, MapPin, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/axios';
import { EventoAPI } from '@/interfaces/events';
import { resolveThumbnailUrl } from '@/lib/media';
import SearchOverlay from './search-overlay';

const AUTOPLAY_MS = 6000;

// Pausa manual (botão) lida pelo plugin: o keen-slider não recria o plugin
// quando o estado React muda.
const autoplayState = { userPaused: false };

function AutoplayPlugin(slider: any) {
  let timeout: ReturnType<typeof setTimeout>;
  let hovering = false;
  let focused = false;
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clearNextTimeout() { clearTimeout(timeout); }
  function nextTimeout() {
    clearTimeout(timeout);
    if (reduceMotion || hovering || focused || autoplayState.userPaused || document.hidden) return;
    timeout = setTimeout(() => slider.next(), AUTOPLAY_MS);
  }
  const onVisibility = () => nextTimeout();
  slider.on('created', () => {
    slider.container.addEventListener('mouseenter', () => { hovering = true; clearNextTimeout(); });
    slider.container.addEventListener('mouseleave', () => { hovering = false; nextTimeout(); });
    slider.container.addEventListener('focusin', () => { focused = true; clearNextTimeout(); });
    slider.container.addEventListener('focusout', () => { focused = false; nextTimeout(); });
    document.addEventListener('visibilitychange', onVisibility);
    nextTimeout();
  });
  slider.on('destroyed', () => document.removeEventListener('visibilitychange', onVisibility));
  slider.on('dragStarted', clearNextTimeout);
  slider.on('animationEnded', nextTimeout);
  slider.on('updated', nextTimeout);
}

function NoAutoplayPlugin(_slider: any) {
  // inicializa o slider normalmente, mas sem avanço automático
}

const SLIDE_H    = 210;
const INACTIVE_H = 182;

function parseDateSafe(dateStr: string): Date | null {
  const parts = dateStr?.split('T')[0]?.split('-').map(Number);
  if (!parts || parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function extractTime(horario?: string | null): string | null {
  if (!horario) return null;
  const timePart = horario.includes('T') ? horario.split('T')[1] : horario;
  return timePart?.slice(0, 5) ?? null;
}

export default function HeroSlider() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Mobile
  const [mobileCurrent, setMobileCurrent] = useState(0);
  // Posição do toque inicial: distingue clique (navega) de arraste (desliza).
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const canLoop = eventos.length > 1;
  const [mobileSliderRef, mobileInstRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: canLoop,
      slides: { perView: canLoop ? 1.15 : 1, spacing: 12, origin: 'center' },
      slideChanged(s) { setMobileCurrent(s.track.details.rel); },
      disabled: eventos.length === 0,
    },
    [canLoop ? NoAutoplayPlugin : NoAutoplayPlugin]
  );

  // Desktop
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return () => { autoplayState.userPaused = false; };
  }, []);
  const [sliderRef, instRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: canLoop,
      slides: { perView: 1, spacing: 16 },
      slideChanged(s) { setCurrentSlide(s.track.details.rel); },
      disabled: eventos.length === 0,
    },
    [canLoop ? AutoplayPlugin : NoAutoplayPlugin]
  );

  function togglePause() {
    const next = !paused;
    autoplayState.userPaused = next;
    setPaused(next);
    // Ao retomar, o plugin reagenda no próximo "updated".
    if (!next) instRef.current?.update();
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/eventos/destaques');
        const data: EventoAPI[] = res.data.data ?? [];
        setEventos(data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="w-full mx-auto py-10 text-center text-sm text-gray-400">
        Carregando eventos…
      </section>
    );
  }

  if (!eventos.length) return null;

  const isSingle = eventos.length === 1;
  const mobileEv = eventos[mobileCurrent];
  const mobileDate = parseDateSafe(mobileEv.data);
  const mobileDataFmt = mobileDate
    ? mobileDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    : '';
  const mobileHorario = extractTime(mobileEv.horario);

  if (isSingle) {
    const ev = eventos[0];
    const src = resolveThumbnailUrl(ev.thumbnails?.[0], null);
    const evDate = parseDateSafe(ev.data);
    const dataFmt = evDate
      ? evDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
      : '';
    const horarioFmt = extractTime(ev.horario);

    return (
      <>
        <section className="w-full max-w-[1300px] mx-auto px-4 py-6">
          <div className="px-4 mb-5 lg:hidden">
            <button
              type="button"
              onClick={() => setOverlayOpen(true)}
              className="w-full flex items-center gap-2.5 border border-gray-200 rounded-2xl px-3.5 py-2.5 bg-gray-50"
            >
              <svg viewBox="0 0 16 16" fill="none" width="17" height="17" className="text-gray-500 shrink-0">
                <path d="m14 14-2.9-2.9M7.333 4a3.333 3.333 0 0 1 3.334 3.333m2 0A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-sans text-[14px] text-gray-400">Buscar eventos</span>
            </button>
          </div>
          <SearchOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />

          <div
            className="relative rounded-xl overflow-hidden cursor-pointer"
            style={{ height: SLIDE_H }}
            onClick={() => router.push(`/evento/${ev.slug ?? ev.id}`)}
          >
            {src ? (
              <Image src={src} alt={ev.nome} fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-indigo-800" />
            )}
          </div>

          <div className="text-center mt-4">
            <h3 className="font-sans text-[17px] font-bold text-[#181d27] uppercase leading-snug mb-3 px-4">
              {ev.nome}
            </h3>
            <div className="flex flex-col items-center gap-2">
              {ev.endereco && (
                <div className="flex items-center gap-1.5 text-[14px] text-[#414651]">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span>{ev.endereco.localidade} - {ev.endereco.uf}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[14px] text-[#414651]">
                <Calendar size={15} className="text-gray-400 shrink-0" />
                <span>{dataFmt}{horarioFmt && ` às ${horarioFmt}`}</span>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* ── MOBILE ────────────────────────────────────────── */}
      <section className="lg:hidden bg-white pt-5 pb-6">

        {/* Barra de busca */}
        <div className="px-4 mb-5">
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="w-full flex items-center gap-2.5 border border-gray-200 rounded-2xl px-3.5 py-2.5 bg-gray-50"
          >
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="17" height="17" className="text-gray-500 shrink-0">
              <path d="m14 14-2.9-2.9M7.333 4a3.333 3.333 0 0 1 3.334 3.333m2 0A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-sans text-[14px] text-gray-400">Buscar eventos</span>
          </button>
        </div>

        <SearchOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />

        {/* Carrossel — full width sem margem negativa */}
        <div
          ref={mobileSliderRef}
          className="keen-slider"
          style={{ height: SLIDE_H, touchAction: 'pan-y', overscrollBehavior: 'none' }}
          onPointerDownCapture={(e) => {
            pointerStart.current = { x: e.clientX, y: e.clientY };
          }}
        >
          {eventos.map((ev, i) => {
            const src = resolveThumbnailUrl(ev.thumbnails?.[0], null);
            const isActive = i === mobileCurrent;
            return (
              <div
                key={ev.id}
                className="keen-slider__slide relative cursor-pointer"
                onClick={(e) => {
                  const start = pointerStart.current;
                  const dx = start ? Math.abs(e.clientX - start.x) : 0;
                  const dy = start ? Math.abs(e.clientY - start.y) : 0;

                  // Movimento total pequeno em qualquer direção = tap.
                  if (dx <= 10 && dy <= 10) {
                    if (isActive) {
                      router.push(`/evento/${ev.slug ?? ev.id}`);
                    } else {
                      // Tap num banner lateral: só centraliza.
                      mobileInstRef.current?.moveToIdx(i);
                    }
                    return;
                  }

                  // dx > 10 e dx > dy → swipe horizontal: não navega (o slider desliza).
                  // dy > dx → gesto vertical: deixa o scroll rolar, não navega.
                }}
              >
                {/* inner div com altura variável, centralizado verticalmente */}
                <div
                  className="absolute left-0 right-0 rounded-xl overflow-hidden"
                  style={{
                    height: isActive ? SLIDE_H : INACTIVE_H,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    transition: 'height 0.3s ease',
                  }}
                >
                  <div className="relative w-full h-full">
                    {src ? (
                      <Image src={src} alt={ev.nome} fill className="object-cover" unoptimized draggable={false} />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-indigo-800" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        {eventos.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 px-4">
            {eventos.map((_, i) => (
              <button
                key={i}
                onClick={() => mobileInstRef.current?.moveToIdx(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === mobileCurrent ? 8 : 7,
                  height: i === mobileCurrent ? 8 : 7,
                  background: i === mobileCurrent ? '#9944CC' : '#d5d7da',
                }}
              />
            ))}
          </div>
        )}

        {/* Info do evento */}
        <div className="text-center mt-4 px-4">
          <h3 className="font-sans text-[17px] font-bold text-[#181d27] uppercase leading-snug mb-3 px-4">
            {mobileEv.nome}
          </h3>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-[14px] text-[#414651]">
              <MapPin size={15} className="text-gray-400 shrink-0" />
              <span>{mobileEv.endereco?.localidade} - {mobileEv.endereco?.uf}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-[#414651]">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <span>{mobileDataFmt}{mobileHorario && ` às ${mobileHorario}`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESKTOP ──────────────────────────────────────────── */}
      <section
        aria-roledescription="carrossel"
        aria-label="Eventos em destaque"
        className="hidden lg:block w-full max-w-[1300px] min-[1800px]:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative"
      >
        <div ref={sliderRef} className="keen-slider relative z-10">
          {eventos.map((ev, idx) => {
            const evDate = parseDateSafe(ev.data);
            const dia = evDate ? evDate.toLocaleDateString('pt-BR', { day: '2-digit' }) : '';
            const mes = evDate ? evDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : '';
            const semana = evDate ? evDate.toLocaleDateString('pt-BR', { weekday: 'long' }) : '';
            const horarioFmt = extractTime(ev.horario);
            const href = `/evento/${ev.slug ?? ev.id}`;
            const acabando = ev.ultimoLote === true || (ev.percentualVendido ?? 0) >= 80;
            const isCurrent = idx === currentSlide;
            const src = resolveThumbnailUrl(ev.thumbnails[0], null);
            return (
              <div
                key={ev.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} de ${eventos.length}: ${ev.nome}`}
                aria-hidden={!isCurrent}
                inert={!isCurrent}
                className="keen-slider__slide flex flex-row gap-6 relative z-10"
              >
                <Link
                  href={href}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="group block w-2/3 relative rounded-2xl overflow-hidden"
                >
                  {/* 1200x521: proporção real das artes enviadas (16:9 cortava as laterais). */}
                  <AspectRatio ratio={1200 / 521}>
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900 to-indigo-800" />
                    )}
                  </AspectRatio>
                </Link>
                <div className="w-1/3 flex flex-col rounded-2xl border border-gray-200 bg-white p-6 xl:p-8 shadow-[0_10px_30px_-18px_rgba(28,24,48,0.25)]">
                  <div className="flex items-start gap-5">
                    {evDate && (
                      <div className="flex shrink-0 flex-col items-center rounded-xl bg-violet-50 px-4 py-2.5 text-violet-800">
                        <span className="text-[13px] font-semibold uppercase tracking-wide">{mes}</span>
                        <span className="text-[34px] font-bold leading-none tabular-nums">{dia}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      {acabando && (
                        <span className="mb-2 inline-block rounded-md bg-orange-600 px-2 py-0.5 text-[12px] font-bold text-white">
                          Tá acabando
                        </span>
                      )}
                      <h2 className="line-clamp-2 text-2xl font-bold leading-tight text-[#181d27] xl:text-[28px]">
                        {ev.nome}
                      </h2>
                    </div>
                  </div>
                  <dl className="mt-6 space-y-3 text-[15px] text-[#414651]">
                    <div className="flex items-start gap-2.5">
                      <dt className="sr-only">Quando</dt>
                      <Calendar className="mt-0.5 h-[18px] w-[18px] shrink-0 text-violet-700" aria-hidden="true" />
                      <dd className="first-letter:uppercase">
                        {semana}
                        {horarioFmt && ` · ${horarioFmt}`}
                      </dd>
                    </div>
                    {ev.endereco && (
                      <div className="flex items-start gap-2.5">
                        <dt className="sr-only">Onde</dt>
                        <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-violet-700" aria-hidden="true" />
                        <dd>
                          {ev.endereco.logradouro}
                          <br />
                          {ev.endereco.localidade} - {ev.endereco.uf}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <Link
                    href={href}
                    className="mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-violet-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                  >
                    Ver ingressos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Evento anterior"
            onClick={() => instRef.current?.prev()}
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 transition-[background-color,transform] duration-150 hover:bg-gray-50 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center">
            {eventos.map((ev, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => instRef.current?.moveToIdx(idx)}
                aria-label={`Ir para ${ev.nome}`}
                aria-current={currentSlide === idx}
                className="grid h-6 w-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                <span
                  className={clsx(
                    'block h-2 rounded-full transition-[width,background-color] duration-200 ease-out',
                    currentSlide === idx ? 'w-6 bg-violet-700' : 'w-2 bg-gray-300 hover:bg-gray-400'
                  )}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Próximo evento"
            onClick={() => instRef.current?.next()}
            className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 transition-[background-color,transform] duration-150 hover:bg-gray-50 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          {!reduceMotion && (
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? 'Retomar troca automática' : 'Pausar troca automática'}
              className="ml-1 grid h-9 w-9 place-items-center rounded-full text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}
        </div>
      </section>
    </>
  );
}
