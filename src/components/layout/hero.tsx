'use client';

import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import clsx from 'clsx';
import api from '@/lib/axios';
import { EventoAPI } from '@/interfaces/events';
import { resolveThumbnailUrl } from '@/lib/media';
import SearchOverlay from './search-overlay';

function AutoplayPlugin(slider: any) {
  let timeout: ReturnType<typeof setTimeout>;
  let mouseOver = false;
  function clearNextTimeout() { clearTimeout(timeout); }
  function nextTimeout() {
    clearTimeout(timeout);
    if (mouseOver) return;
    timeout = setTimeout(() => slider.next(), 3500);
  }
  slider.on('created', () => {
    slider.container.addEventListener('mouseover', () => { mouseOver = true; clearNextTimeout(); });
    slider.container.addEventListener('mouseout', () => { mouseOver = false; nextTimeout(); });
    nextTimeout();
  });
  slider.on('dragStarted', clearNextTimeout);
  slider.on('animationEnded', nextTimeout);
  slider.on('updated', nextTimeout);
}

function NoAutoplayPlugin(_slider: any) {
  // inicializa o slider normalmente, mas sem avanço automático
}

const SLIDE_H    = 210;
const INACTIVE_H = 182;

export default function HeroSlider() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Mobile
  const [mobileCurrent, setMobileCurrent] = useState(0);
  const isDragging = useRef(false);
  const [mobileSliderRef, mobileInstRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: { perView: 1.15, spacing: 12, origin: 'center' },
      slideChanged(s) { setMobileCurrent(s.track.details.rel); },
      dragStarted()   { isDragging.current = true; },
      dragEnded()     { setTimeout(() => { isDragging.current = false; }, 50); },
    },
    [NoAutoplayPlugin]
  );

  // Desktop
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: { perView: 1, spacing: 16 },
      slideChanged(s) { setCurrentSlide(s.track.details.rel); },
    },
    [AutoplayPlugin]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/eventos', { params: { destaque: true } });
        const data: EventoAPI[] = res.data.data;
        let evs = data.filter((e) => e.destaque === true);
        if (evs.length === 0) evs = data;
        setEventos(evs);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
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

  const mobileEv = eventos[mobileCurrent];
  const mobileDataFmt = new Date(mobileEv.data).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short',
  });
  const mobileHorario = mobileEv.horario?.slice(0, 5);

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
        >
          {eventos.map((ev, i) => {
            const src = resolveThumbnailUrl(ev.thumbnails?.[0], null);
            const isActive = i === mobileCurrent;
            return (
              <div
                key={ev.id}
                className="keen-slider__slide relative cursor-pointer"
                onClick={() => {
                  if (!isDragging.current && isActive) {
                    router.push(`/eventos/${ev.slug ?? ev.id}`);
                  }
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
              <span>{mobileEv.endereco.localidade} - {mobileEv.endereco.uf}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-[#414651]">
              <Calendar size={15} className="text-gray-400 shrink-0" />
              <span>{mobileDataFmt}{mobileHorario && ` às ${mobileHorario}`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DESKTOP ──────────────────────────────────────────── */}
      <section className="hidden lg:block w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative">
        <div ref={sliderRef} className="keen-slider relative z-10">
          {eventos.map((ev) => {
            const dataFmt = new Date(ev.data).toLocaleDateString('pt-BR', {
              weekday: 'short', day: '2-digit', month: 'long', year: 'numeric',
            });
            const horarioFmt = ev.horario?.slice(0, 5);
            return (
              <div key={ev.id} className="keen-slider__slide flex flex-col lg:flex-row gap-6 relative z-10">
                <div className="w-full lg:w-2/3 relative rounded-lg overflow-hidden">
                  <AspectRatio ratio={16 / 9}>
                    {(() => {
                      const src = resolveThumbnailUrl(ev.thumbnails[0], null);
                      return src ? (
                        <Image src={src} alt={ev.nome} fill className="object-cover rounded-md" priority unoptimized />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-900 to-indigo-800 rounded-md" />
                      );
                    })()}
                  </AspectRatio>
                </div>
                <Card className="w-full lg:w-1/3 flex flex-col justify-between shadow-md">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">{ev.nome}</CardTitle>
                    <div className="font-semibold flex justify-center text-sm text-muted-foreground mt-2">
                      <span className="text-center leading-tight">
                        {ev.endereco.logradouro}, {ev.endereco.localidade} - {ev.endereco.uf}
                      </span>
                    </div>
                    <div className="font-semibold flex justify-center text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-300" />
                        <span>{dataFmt}{horarioFmt && <> • {horarioFmt}h</>}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 mt-4">
                    <Button
                      className="w-full text-white bg-gradient-to-r from-[#9944CC] to-[#3399FF] hover:opacity-90"
                      onClick={() => router.push(`/eventos/${ev.slug ?? ev.id}`)}
                    >
                      Comprar Ingresso
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => router.push(`/eventos/${ev.slug ?? ev.id}`)}
                    >
                      Mais Detalhes <ArrowRight size={16} />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline" size="icon" aria-label="Anterior"
          className="absolute top-1/2 left-3 shadow-md -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
          onClick={() => instRef.current?.prev()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline" size="icon" aria-label="Próximo"
          className="absolute top-1/2 right-3 shadow-md -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
          onClick={() => instRef.current?.next()}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="flex justify-center gap-2 mt-6 z-10 relative">
          {eventos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => instRef.current?.moveToIdx(idx)}
              aria-label={`Ir para slide ${idx + 1}`}
              className={clsx(
                'w-3 h-3 transition-all rounded-full',
                currentSlide === idx ? 'bg-violet-600' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
              )}
            />
          ))}
        </div>
      </section>
    </>
  );
}
