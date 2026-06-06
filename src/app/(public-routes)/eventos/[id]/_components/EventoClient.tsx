"use client";

import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "@/lib/toast";
import {
  CalendarDays, Clock, MapPin, Info, Ban, BadgeAlert,
  BadgePercent, Phone, Instagram, Mail, Ticket,
  ChevronLeft, ChevronRight, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AutoplayPlugin, cn } from "@/lib/utils";
import { EventDetails } from "@/interfaces/events";
import { resolveThumbnailUrl } from "@/lib/media";

// ── helpers ───────────────────────────────────────────────────
function thumbSrc(t: { path?: string; url?: string }): string {
  return resolveThumbnailUrl(t, "") ?? "";
}

function parseISODate(raw: string): Date {
  return new Date(raw);
}

function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = parseISODate(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function formatDateShort(raw: string): string {
  if (!raw) return "—";
  const d = parseISODate(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function formatTime(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }
  return raw.slice(0, 5);
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="text-violet-500">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Interactive client component ──────────────────────────────
export default function EventoClient({ evento }: { evento: EventDetails }) {
  const [currentSlide, setSlide] = useState(0);

  const [sliderRef, instRef] = useKeenSlider<HTMLDivElement>(
    { loop: true, slideChanged(s) { setSlide(s.track.details.rel); } },
    [AutoplayPlugin]
  );

  const thumbs = (evento.thumbnails ?? []).map(thumbSrc).filter(Boolean);
  const dateStr = formatDate(evento.data);
  const timeStr = formatTime(evento.horario);
  const addr = evento.endereco;

  return (
    <main className="min-h-screen bg-background animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-black">
        {thumbs.length > 0 ? (
          <>
            <div ref={sliderRef} className="keen-slider h-[260px] sm:h-[380px] md:h-[480px]">
              {thumbs.map((src, i) => (
                <div key={i} className="keen-slider__slide relative">
                  <Image
                    src={src}
                    alt={`${evento.nome} — imagem ${i + 1}`}
                    fill sizes="100vw"
                    className="object-cover opacity-90"
                    priority={i === 0}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
              ))}
            </div>

            {thumbs.length > 1 && (
              <>
                <button onClick={() => instRef.current?.prev()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition"
                  aria-label="Anterior"><ChevronLeft size={20} /></button>
                <button onClick={() => instRef.current?.next()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition"
                  aria-label="Próximo"><ChevronRight size={20} /></button>
              </>
            )}

            {thumbs.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
                {thumbs.map((_, idx) => (
                  <button key={idx} onClick={() => instRef.current?.moveToIdx(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={cn("h-1.5 rounded-full transition-all duration-300",
                      currentSlide === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                    )} />
                ))}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6 sm:px-8 animate-fade-up">
              <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-md line-clamp-2">{evento.nome}</h1>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/80">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-violet-300" />{formatDateShort(evento.data)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-violet-300" />{timeStr}h</span>
                  {addr && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-violet-300" />{addr.localidade}/{addr.uf}</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-[200px] items-center justify-center bg-gradient-to-br from-violet-900 to-indigo-900 px-4 pb-6 sm:h-[280px] animate-fade-up">
            <div className="max-w-5xl mx-auto w-full">
              <h1 className="text-2xl sm:text-4xl font-bold text-white">{evento.nome}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><CalendarDays size={14} />{formatDateShort(evento.data)}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />{timeStr}h</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up" style={{ animationDelay: "60ms" }}>
        {/* ── Left: Content ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><CalendarDays size={18} /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data e horário</p>
                <p className="font-semibold capitalize">{dateStr}</p>
                <p className="text-sm text-muted-foreground">Abertura às {timeStr}h</p>
              </div>
            </div>
            {addr && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><MapPin size={18} /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Local</p>
                  <p className="font-semibold">{addr.logradouro}, {addr.numero}</p>
                  <p className="text-sm text-muted-foreground">{addr.bairro} · {addr.localidade}/{addr.uf} · CEP {addr.cep}</p>
                </div>
              </div>
            )}
          </div>

          {evento.descricao && (
            <Section icon={<Phone size={16} />} title="Sobre o evento">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{evento.descricao}</p>
            </Section>
          )}

          {evento.programacao && (
            <>
              <Separator />
              <Section icon={<CalendarDays size={16} />} title="Programação">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line font-mono">{evento.programacao}</p>
              </Section>
            </>
          )}

          {(evento.classificacaoEtaria || evento.politicaMeiaEntrada || evento.politicaCancelamento) && (
            <>
              <Separator />
              <Section icon={<Info size={16} />} title="Informações adicionais">
                <div className="space-y-4">
                  {evento.classificacaoEtaria && (
                    <div className="flex gap-3">
                      <BadgeAlert size={16} className="shrink-0 mt-0.5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Classificação etária</p>
                        <p className="text-sm text-muted-foreground">{evento.classificacaoEtaria}</p>
                      </div>
                    </div>
                  )}
                  {evento.politicaMeiaEntrada && (
                    <div className="flex gap-3">
                      <BadgePercent size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">Meia entrada</p>
                        <p className="text-sm text-muted-foreground">{evento.politicaMeiaEntrada}</p>
                      </div>
                    </div>
                  )}
                  {evento.politicaCancelamento && (
                    <div className="flex gap-3">
                      <Ban size={16} className="shrink-0 mt-0.5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Política de cancelamento</p>
                        <p className="text-sm text-muted-foreground">{evento.politicaCancelamento}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </>
          )}

          {(evento.whatsapp || evento.email || evento.instagram) && (
            <>
              <Separator />
              <Section icon={<Phone size={16} />} title="Contato do organizador">
                <div className="flex flex-wrap gap-3">
                  {evento.whatsapp && (
                    <a href={`https://wa.me/${evento.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition">
                      <Phone size={14} className="text-emerald-500" />WhatsApp
                    </a>
                  )}
                  {evento.email && (
                    <a href={`mailto:${evento.email}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition">
                      <Mail size={14} className="text-violet-500" />{evento.email}
                    </a>
                  )}
                  {evento.instagram && (
                    <a href={`https://instagram.com/${evento.instagram.replace("@", "")}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition">
                      <Instagram size={14} className="text-pink-500" />{evento.instagram}
                    </a>
                  )}
                </div>
              </Section>
            </>
          )}
        </div>

        {/* ── Right: Sticky buy sidebar ──────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-3">
            <div className="rounded-2xl border bg-card shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-4">
                <p className="text-xs text-violet-200 font-medium uppercase tracking-wide">Ingressos</p>
                <p className="text-white font-bold text-lg">{evento.nome}</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays size={13} className="text-violet-500" />
                    <span className="capitalize">{formatDateShort(evento.data)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={13} className="text-violet-500" /><span>{timeStr}h</span>
                  </div>
                  {addr && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin size={13} className="text-violet-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{addr.logradouro}, {addr.numero} — {addr.localidade}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <Link href={`/eventos/${evento.slug ?? evento.id}/checkout`} className="block">
                  <Button className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700 gap-2 shadow">
                    <Ticket size={17} />Comprar Ingresso
                  </Button>
                </Link>
                <p className="text-center text-xs text-muted-foreground">Compra 100% segura • Ingresso online</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: evento.nome, url: window.location.href });
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success("Link copiado!");
                  }
                }}>
                <Share2 size={13} />Compartilhar
              </Button>
              <Link href="/eventos" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">Ver mais eventos</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center gap-3 border-t bg-background/95 backdrop-blur px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{evento.nome}</p>
          <p className="text-xs text-muted-foreground">{formatDateShort(evento.data)} · {timeStr}h</p>
        </div>
        <Link href={`/eventos/${evento.slug ?? evento.id}/checkout`}>
          <Button className="shrink-0 bg-violet-600 hover:bg-violet-700 gap-1.5">
            <Ticket size={15} />Comprar
          </Button>
        </Link>
      </div>
      <div className="h-20 lg:hidden" />
    </main>
  );
}
