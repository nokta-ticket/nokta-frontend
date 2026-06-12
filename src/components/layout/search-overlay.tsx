'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, Music2, Utensils, Trophy, Drama, PartyPopper, Baby,
  MapPin, Calendar, SearchX,
} from 'lucide-react';
import api from '@/lib/axios';
import { EventoAPI } from '@/interfaces/events';
import { resolveThumbnailUrl } from '@/lib/media';

interface Props {
  open: boolean;
  onClose: () => void;
}

const COLLECTIONS = [
  { label: 'Shows',       icon: <Music2      size={16} /> },
  { label: 'Gastronomia', icon: <Utensils    size={16} /> },
  { label: 'Esportes',    icon: <Trophy      size={16} /> },
  { label: 'Teatro',      icon: <Drama       size={16} /> },
  { label: 'Festas',      icon: <PartyPopper size={16} /> },
  { label: 'Infantil',    icon: <Baby        size={16} /> },
];

const POPULAR = ['Festival', 'Show', 'Stand-up', 'Sertanejo', 'Eletrônico', 'Teatro'];

export default function SearchOverlay({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState<EventoAPI[]>([]);
  const [results, setResults] = useState<EventoAPI[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // ao abrir: foca o input e carrega trending
  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); setSearched(false); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
    api.get('/eventos').then((res) => {
      setTrending((res.data.data as EventoAPI[]).slice(0, 8));
    }).catch(() => {});
  }, [open]);

  // bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // busca ao vivo com debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setSearched(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/eventos', { params: { name: q } });
        setResults(res.data.data as EventoAPI[]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/eventos?q=${encodeURIComponent(q)}` : '/eventos');
    onClose();
  }

  function navigate(href: string) { router.push(href); onClose(); }

  if (!open) return null;

  const isTyping = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto lg:hidden">
      <div className="px-4 pt-5 pb-10">

        {/* Voltar */}
        <button
          onClick={onClose}
          className="font-sans flex items-center gap-1.5 text-[#9944CC] font-semibold text-[16px] mb-5"
        >
          <ArrowLeft size={20} strokeWidth={2} />
          Voltar
        </button>

        {/* Barra de busca */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2.5 border border-gray-200 rounded-2xl px-3.5 py-3 mb-7 bg-gray-50"
        >
          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="17" height="17" className="text-gray-500 shrink-0">
            <path d="m14 14-2.9-2.9M7.333 4a3.333 3.333 0 0 1 3.334 3.333m2 0A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z" stroke="currentColor" strokeWidth="1.333" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar eventos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="font-sans flex-1 text-[16px] sm:text-[14px] text-[#181d27] placeholder:text-gray-400 bg-transparent border-none outline-none"
          />
          {isTyping && (
            <button type="button" onClick={() => setQuery('')} className="text-gray-400 shrink-0 text-[12px] font-sans font-medium">
              Limpar
            </button>
          )}
        </form>

        {/* ── DIGITANDO: resultados ao vivo ── */}
        {isTyping ? (
          <>
            {searching && (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-[72px] h-[56px] rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 flex flex-col gap-2 justify-center">
                      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && searched && results.length === 0 && (
              <div className="flex flex-col items-center gap-3 pt-12 text-center">
                <SearchX size={36} className="text-gray-300" />
                <p className="font-sans text-[15px] font-semibold text-[#181d27]">Nenhum resultado encontrado</p>
                <p className="font-sans text-[13px] text-gray-400">Tente outros termos ou explore as coleções.</p>
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="flex flex-col gap-0.5">
                {results.map((ev) => {
                  const src = resolveThumbnailUrl(ev.thumbnails?.[0], null);
                  const dataFmt = new Date(ev.data).toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short',
                  });
                  return (
                    <button
                      key={ev.id}
                      onClick={() => navigate(`/eventos/${ev.slug ?? ev.id}`)}
                      className="flex items-center gap-3 py-3 text-left w-full rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-[72px] h-[56px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-200 shrink-0 relative">
                        {src && <Image src={src} alt={ev.nome} fill className="object-cover" unoptimized />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[14px] font-bold text-[#181d27] leading-snug line-clamp-2 mb-1">
                          {ev.nome}
                        </p>
                        <div className="flex items-center gap-1 text-[12px] text-gray-400">
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{ev.endereco?.localidade} - {ev.endereco?.uf}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
                          <Calendar size={11} className="shrink-0" />
                          <span>{dataFmt}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={handleSearch}
                  className="font-sans mt-3 w-full py-3 rounded-2xl border border-[#9944CC] text-[#9944CC] font-semibold text-[14px]"
                >
                  Ver todos os resultados para "{query.trim()}"
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── ESTADO PADRÃO: coleções + populares + trending ── */
          <>
            <h2 className="font-sans text-[19px] font-bold text-[#181d27] mb-3.5">Explore as coleções</h2>
            <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1 mb-7" style={{ scrollbarWidth: 'none' }}>
              {COLLECTIONS.map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(`/eventos?categoria=${encodeURIComponent(label)}`)}
                  className="font-sans inline-flex items-center gap-2 shrink-0 bg-[#fafafa] border border-[#e9eaeb] rounded-full px-4 py-2.5 text-[14px] text-[#414651] whitespace-nowrap"
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            <h2 className="font-sans text-[19px] font-bold text-[#181d27] mb-3.5">Pesquisas populares</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-3.5 mb-8">
              {POPULAR.map((term) => (
                <button
                  key={term}
                  onClick={() => navigate(`/eventos?q=${encodeURIComponent(term)}`)}
                  className="font-sans inline-flex items-center gap-1.5 text-[#9944CC] font-semibold text-[15px]"
                >
                  <TrendingUp size={15} strokeWidth={2} className="shrink-0" />
                  {term}
                </button>
              ))}
            </div>

            {trending.length > 0 && (
              <>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-sans text-[19px] font-bold text-[#181d27]">Eventos em alta</h2>
                  <button onClick={() => navigate('/eventos')} className="font-sans text-[#9944CC] font-semibold text-[14px]">
                    Ver todos
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {trending.map((ev) => {
                    const src = resolveThumbnailUrl(ev.thumbnails?.[0], null);
                    const dataFmt = new Date(ev.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                    return (
                      <div key={ev.id} onClick={() => navigate(`/eventos/${ev.slug ?? ev.id}`)} className="flex-none w-[178px] snap-start cursor-pointer">
                        <div className="w-full h-[118px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-200 mb-2.5 relative">
                          {src && <Image src={src} alt={ev.nome} fill className="object-cover" unoptimized />}
                        </div>
                        <p className="font-sans text-[15px] font-bold text-[#181d27] leading-snug mb-1.5 line-clamp-2">{ev.nome}</p>
                        <p className="font-sans text-[13px] text-gray-400 mb-1 truncate">{ev.endereco?.localidade} - {ev.endereco?.uf}</p>
                        <p className="font-sans text-[13px] font-bold text-[#181d27]">{dataFmt}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
