'use client';

import Link from 'next/link';
import { Calendar, Ticket, Mic2, Music2, PartyPopper, DoorOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────
export type ProgramItem = {
  time: string;
  title: string;
  subtitle?: string;
  type: 'opening' | 'warmup' | 'artist' | 'headliner' | 'closing';
  image?: string | null;
};

interface EventProgramJourneyProps {
  items: ProgramItem[];
  ctaHref?: string;
}

// ── Helpers ────────────────────────────────────────────────────
function getLabel(type: ProgramItem['type']) {
  const map: Record<ProgramItem['type'], string> = {
    opening: 'Abertura', warmup: 'Warm-up', artist: 'Atração',
    headliner: 'Headliner', closing: 'Encerramento',
  };
  return map[type] ?? 'Programação';
}

function getIcon(type: ProgramItem['type'], size = 18) {
  switch (type) {
    case 'opening':   return <DoorOpen size={size} />;
    case 'warmup':    return <Music2   size={size} />;
    case 'headliner': return <Mic2     size={size} />;
    case 'closing':   return <PartyPopper size={size} />;
    default:          return <Mic2     size={size} />;
  }
}

function getAvatarGrad(type: ProgramItem['type']) {
  switch (type) {
    case 'warmup':    return 'linear-gradient(135deg,#A855F7,#7C3AED)';
    case 'headliner': return 'linear-gradient(135deg,#7C3AED,#2D8CFF)';
    case 'closing':   return 'linear-gradient(135deg,#94A3B8,#64748B)';
    case 'opening':   return 'linear-gradient(135deg,#38BDF8,#3B82F6)';
    default:          return 'linear-gradient(135deg,#8B5CF6,#4F46E5)';
  }
}

function getBadgeCls(type: ProgramItem['type']) {
  switch (type) {
    case 'opening':   return 'bg-sky-100 text-sky-700';
    case 'warmup':    return 'bg-purple-100 text-purple-700';
    case 'headliner': return 'bg-gradient-to-r from-[#7C3AED] to-[#2D8CFF] text-white';
    case 'closing':   return 'bg-slate-100 text-slate-500';
    default:          return 'bg-violet-100 text-violet-700';
  }
}

function getIconBg(type: ProgramItem['type']) {
  switch (type) {
    case 'opening': return { bg: '#EEF2FF', color: '#7C3AED' };
    case 'closing': return { bg: '#F1F5F9', color: '#64748B' };
    default:        return { bg: '#F1E8FF', color: '#7C3AED' };
  }
}

// ── Layout constants ───────────────────────────────────────────
const SVG_VH   = 170;
const SVG_PX_H = 170;
const SVG_TOP  = 120;
const MID_Y    = 85;
const AMP_Y    = 72;
const DOT_R    = 6;
const DOT_R_H  = 8;
const CARD_H    = 200;
const CARD_H_SM = 130; // abertura e encerramento
const MIN_COL_PX = 170; // largura mínima por coluna antes de ativar scroll

function calcLayout(items: ProgramItem[]) {
  const n = items.length;
  if (n === 0) return null;

  const dotXs = Array.from({ length: n }, (_, i) => (1000 / n) * (i + 0.5));

  // Pico explícito no item central — garante 1 único topo para qualquer n
  const peakIdx = Math.round((n - 1) / 2);
  const maxDist = Math.max(peakIdx, n - 1 - peakIdx) || 1;
  const dotYs = Array.from({ length: n }, (_, i) =>
    n === 1 ? MID_Y : MID_Y - AMP_Y * Math.cos((Math.abs(i - peakIdx) / maxDist) * (Math.PI / 2))
  );

  // SVG_VH === SVG_PX_H → mapeamento 1:1
  const dotYAbs = dotYs.map(y => SVG_TOP + y);
  const maxDotYAbs = Math.max(...dotYAbs);  // lowest dot on screen
  const cardTop = Math.round(maxDotYAbs + DOT_R_H + 28);
  const contH   = cardTop + CARD_H + 10;
  const colWPct = (100 / n) * 0.86;

  const TOTAL_PTS   = 60 * (n - 1);
  const WAVE_AMP    = 8;
  const peakProgress = peakIdx / (n - 1);

  const x0 = dotXs[0], xEnd = dotXs[n - 1];
  const wPts: string[] = [];

  for (let j = 0; j <= TOTAL_PTS; j++) {
    const progress = j / TOTAL_PTS;
    const x = x0 + progress * (xEnd - x0);

    const rawSeg = progress * (n - 1);
    const seg    = Math.min(Math.floor(rawSeg), n - 2);
    const tSeg   = rawSeg - seg;
    const archY  = dotYs[seg] + tSeg * (dotYs[seg + 1] - dotYs[seg]);

    const waveSign = -Math.tanh((progress - peakProgress) * 50);
    const wave = waveSign * WAVE_AMP * Math.sin(2 * Math.PI * (n - 1) * progress);
    wPts.push(`${j === 0 ? 'M' : 'L'} ${x.toFixed(1)},${(archY + wave).toFixed(1)}`);
  }
  const path = wPts.join(' ');

  const scrollW = n * MIN_COL_PX; // largura total do canvas scrollável
  return { n, dotXs, dotYAbs, cardTop, contH, colWPct, path, scrollW };
}

// ── Desktop timeline ───────────────────────────────────────────
function DesktopTimeline({ items }: { items: ProgramItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const layout = calcLayout(items);
  if (!layout) return null;
  const { n, dotXs, dotYAbs, cardTop, contH, colWPct, path, scrollW } = layout;
  const needsScroll = n > 5;
  const SCROLL_STEP = 280;

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full">
      {/* Botões de navegação — só aparecem quando há scroll */}
      {needsScroll && (
        <>
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-violet-600 hover:border-violet-300 transition"
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-violet-600 hover:border-violet-300 transition"
            aria-label="Rolar para direita"
          >
            <ChevronRight size={16} />
          </button>

          {/* Fades laterais */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-[#F8FAFC] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-[#F8FAFC] to-transparent" />
        </>
      )}

      {/* Área scrollável */}
      <div
        ref={scrollRef}
        className={cn('w-full', needsScroll && 'overflow-x-auto scrollbar-hide')}
        style={{ scrollSnapType: needsScroll ? 'x proximity' : undefined }}
      >
        <div className="relative" style={{ height: contH, minWidth: needsScroll ? scrollW : '100%' }}>

      {/* SVG curve */}
      <svg
        viewBox={`0 0 1000 ${SVG_VH}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: SVG_TOP, left: 0, width: '100%', height: SVG_PX_H, zIndex: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient id="prog-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="#7C3AED" />
            <stop offset="55%"  stopColor="#9061F9" />
            <stop offset="100%" stopColor="#2D8CFF" />
          </linearGradient>
          <filter id="prog-glow" x="-4%" y="-150%" width="108%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* glow */}
        <path d={path} fill="none" stroke="url(#prog-grad)" strokeWidth="8"
          strokeLinecap="round" opacity="0.18" />
        {/* line */}
        <path d={path} fill="none" stroke="url(#prog-grad)" strokeWidth="2.5"
          strokeLinecap="round" filter="url(#prog-glow)" opacity="0.9" />
      </svg>

      {/* Per-item columns */}
      {items.map((item, i) => {
        const xPct   = (dotXs[i] / 1000) * 100;
        const yAbs   = dotYAbs[i];
        const isHead = item.type === 'headliner';
        const r      = isHead ? DOT_R_H : DOT_R;
        const connH  = Math.max(4, cardTop - yAbs - r - 2);

        const isSmallCard = item.type === 'opening' || item.type === 'closing';
        const cardH = isSmallCard ? CARD_H_SM : CARD_H;

        // Items that show a badge above the dot (artist + headliner)
        const showBadgeAbove = item.type === 'artist' || item.type === 'headliner';
        // Label block height: time(18) + name(14) + badge_or_subtitle(20) + gaps(10) = ~62
        const lblH   = 64;
        const lblTop = Math.max(4, yAbs - r - 10 - lblH);

        // Card: artist/warmup/headliner get circular avatar; opening/closing get icon box
        const isArtistCard = item.type !== 'opening' && item.type !== 'closing';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xPct}%`,
              top: 0,
              transform: 'translateX(-50%)',
              width: `${colWPct}%`,
              height: contH,
              zIndex: 2,
            }}
          >
            {/* ── Label above dot ─── */}
            <div style={{ position: 'absolute', top: lblTop, left: 0, right: 0, textAlign: 'center', zIndex: 20 }}>
              {/* Time */}
              <p style={{ fontSize: 16, fontWeight: 800, color: '#6D28D9', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {item.time}
              </p>
              {/* Name: for artist/headliner show title; for others show type label */}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginTop: 3, lineHeight: 1.25 }}>
                {showBadgeAbove ? item.title : getLabel(item.type)}
              </p>
              {/* Badge (artist/headliner) or subtitle (others) */}
              {showBadgeAbove ? (
                <span
                  className={cn(
                    'mt-1 inline-flex items-center rounded-full px-2 py-[3px] text-[9px] font-bold leading-none tracking-wide',
                    getBadgeCls(item.type),
                  )}
                  style={{ display: 'inline-flex', marginTop: 4 }}
                >
                  {getLabel(item.type).toUpperCase()}
                </span>
              ) : item.subtitle ? (
                <p style={{ fontSize: 10, fontWeight: 400, color: '#64748B', marginTop: 3, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.subtitle}
                </p>
              ) : null}
            </div>

            {/* ── Dot on curve ─── */}
            <div
              style={{
                position: 'absolute',
                top: yAbs - r,
                left: '50%',
                transform: 'translateX(-50%)',
                width: r * 2,
                height: r * 2,
                borderRadius: '50%',
                background: isHead ? 'linear-gradient(135deg,#7C3AED,#2D8CFF)' : '#fff',
                border: isHead ? '2px solid rgba(255,255,255,0.5)' : '2.5px solid #7C3AED',
                boxShadow: isHead
                  ? '0 0 0 4px rgba(124,58,237,0.2), 0 2px 12px rgba(124,58,237,0.45)'
                  : '0 0 0 3px rgba(124,58,237,0.12)',
                zIndex: 15,
              }}
            />

            {/* ── Dashed connector ─── */}
            {connH > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: yAbs + r + 3,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: connH,
                  borderLeft: '1.5px dashed rgba(124,58,237,0.3)',
                  zIndex: 1,
                }}
              />
            )}

            {/* ── Card ─── */}
            <div style={{ position: 'absolute', top: cardTop, left: 0, right: 0, height: cardH, zIndex: 10 }}>
              <div
                className={cn(
                  'h-full w-full flex flex-col items-center justify-center gap-2 rounded-[18px] border bg-white px-2 text-center',
                  'transition-all duration-300 hover:-translate-y-1',
                  isHead
                    ? 'border-violet-300/50 shadow-[0_6px_24px_rgba(124,58,237,0.14)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.24)]'
                    : 'border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.07)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)]',
                )}
              >
                {isArtistCard ? (
                  // Artist / Warmup / Headliner: circular avatar + name + badge
                  <>
                    {/* Circular avatar */}
                    <div
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-[3px] ring-white"
                      style={{
                        boxShadow: isHead
                          ? '0 4px 20px rgba(124,58,237,0.45)'
                          : '0 2px 8px rgba(15,23,42,0.18)',
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-white"
                          style={{ background: getAvatarGrad(item.type) }}
                        >
                          {getIcon(item.type, 22)}
                        </div>
                      )}
                    </div>
                    <p className="w-full text-[12px] font-bold leading-tight text-[#0F172A] line-clamp-2 px-1">
                      {item.title}
                    </p>
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold leading-none tracking-wide', getBadgeCls(item.type))}>
                      {getLabel(item.type).toUpperCase()}
                    </span>
                  </>
                ) : (
                  // Opening / Closing: icon box + subtitle
                  <>
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: getIconBg(item.type).bg, color: getIconBg(item.type).color }}
                    >
                      {getIcon(item.type, 22)}
                    </div>
                    {item.subtitle && (
                      <p className="text-center text-[11px] leading-snug text-[#475569] px-1 line-clamp-3">
                        {item.subtitle}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}

// ── Mobile timeline ────────────────────────────────────────────
function MobileTimeline({ items }: { items: ProgramItem[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white px-4 py-5 shadow-sm">
      <div className="absolute bottom-5 left-[27px] top-5 w-px bg-gradient-to-b from-[#7C3AED]/40 via-[#9061F9]/25 to-[#2D8CFF]/40" />
      <div className="space-y-4">
        {items.map((item, i) => {
          const isHead = item.type === 'headliner';
          const isArtistCard = item.type !== 'opening' && item.type !== 'closing';
          return (
            <div key={i} className="relative flex gap-3.5">
              <div className="relative z-10 mt-[14px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_0_3px_rgba(124,58,237,0.1)]">
                <span className={cn('h-2.5 w-2.5 rounded-full', isHead ? 'bg-gradient-to-r from-[#7C3AED] to-[#2D8CFF] shadow-[0_0_6px_rgba(124,58,237,0.45)]' : 'bg-violet-400/70')} />
              </div>
              <div className={cn('flex-1 rounded-xl border p-3', isHead ? 'border-violet-200/60 shadow-[0_2px_10px_rgba(124,58,237,0.1)]' : 'border-[#E2E8F0] shadow-sm')}>
                <div className="flex items-start gap-3">
                  {/* Avatar/icon */}
                  {isArtistCard ? (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full" style={{ boxShadow: isHead ? '0 2px 10px rgba(124,58,237,0.35)' : '0 1px 4px rgba(15,23,42,0.14)' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white" style={{ background: getAvatarGrad(item.type) }}>
                          {getIcon(item.type, 14)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: getIconBg(item.type).bg, color: getIconBg(item.type).color }}>
                      {getIcon(item.type, 16)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[13px] font-extrabold tabular-nums text-[#6D28D9]">{item.time}</span>
                      <span className={cn('inline-flex rounded-full px-2 py-[3px] text-[9px] font-bold leading-none', getBadgeCls(item.type))}>
                        {getLabel(item.type).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-[13px] font-semibold leading-snug text-[#0F172A] line-clamp-2">{item.title}</h3>
                    {item.subtitle && (
                      <p className="mt-0.5 text-[11px] leading-snug text-[#475569] line-clamp-1">{item.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Warning banner ─────────────────────────────────────────────
function WarningBanner() {
  return (
    <p className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-500">
      <Calendar size={11} className="shrink-0" />
      Os horários podem sofrer alterações. Acompanhe nossas redes sociais.
    </p>
  );
}

// ── CTA block ──────────────────────────────────────────────────
function CTABlock({ href }: { href: string }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#E9D5FF]/80 bg-gradient-to-r from-[#F5F0FF]/80 via-white to-[#EFF6FF]/60 px-8 py-8 sm:flex-row shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
          <Ticket size={26} />
        </div>
        <div>
          <p className="text-xl font-extrabold text-[#0F172A]">Pronto para viver essa experiência?</p>
          <p className="mt-1 text-sm text-[#475569]">Garanta seu ingresso e faça parte deste momento único.</p>
        </div>
      </div>
      <Link href={href} className="shrink-0 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2D8CFF] px-10 py-3.5 text-base font-bold text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)] transition-all hover:brightness-110 hover:shadow-[0_6px_28px_rgba(124,58,237,0.4)]">
        <Ticket size={18} />
        Comprar ingresso
      </Link>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export function EventProgramJourney({ items, ctaHref }: EventProgramJourneyProps) {
  if (!items.length) {
    return (
      <section className="mt-10">
        <SectionLabel />
        <div className="mt-4 rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E8FF] text-[#7C3AED]">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#0F172A]">A programação completa será divulgada em breve.</h3>
          <p className="mt-1 text-xs text-[#475569]">Fique de olho nas atualizações do evento.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <SectionLabel />

      {/* ── Desktop ─────────────────────────────────────────────── */}
      <div className="mt-4 hidden lg:block">
        <DesktopTimeline items={items} />
        <WarningBanner />
        {ctaHref && <CTABlock href={ctaHref} />}
      </div>

      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="mt-4 lg:hidden">
        <MobileTimeline items={items} />
        <WarningBanner />
        {ctaHref && <CTABlock href={ctaHref} />}
      </div>
    </section>
  );
}

function SectionLabel() {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1 h-5 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-[#7C3AED] to-[#2D8CFF]" />
      <div>
        <h2 className="text-lg font-bold text-[#0F172A]">Programação</h2>
        <p className="mt-0.5 text-xs text-[#475569]">Confira os horários e atrações do evento.</p>
      </div>
    </div>
  );
}
