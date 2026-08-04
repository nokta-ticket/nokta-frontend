"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, Instagram, MapPin, MessageCircle } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import type { VenueHomePageData } from "@/services/venue-home-public";

const MAROON = "#8a1e2c";
const GREEN = "#1f9d55";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Home pública do estabelecimento (nokta.live/{orgSlug}) — acessada pelo
 * ícone "Início" do cardápio e da avaliação. Fallback de logo/banner
 * IDÊNTICO ao MenuView (fundo preto + anel + iniciais brancas) — nunca um
 * terceiro fallback divergente (lição da rodada anterior de Avaliações).
 */
export function VenueHomeView({ data, orgSlug }: { data: VenueHomePageData; orgSlug: string }) {
  const [schedOpen, setSchedOpen] = useState(false);
  const { profile } = data;

  const addressQuery = profile.address ? encodeURIComponent(profile.address) : null;

  return (
    <div className="relative min-h-full bg-[#f4f4f6] font-sans">
      <div className="mx-auto min-h-full w-full max-w-[480px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.06)] md:max-w-2xl">
        {/* BANNER — mesmo fallback preto sólido do MenuView, nunca outro visual quando não há bannerUrl. */}
        <div className="relative h-[172px] overflow-hidden bg-[#050505]">
          {profile.bannerUrl ? (
            <Image
              src={resolveMediaUrl(profile.bannerUrl) ?? profile.bannerUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>

        {/* HEADER */}
        <div className="flex gap-4 px-[18px] pb-1">
          <div className="relative -mt-16 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-black shadow-[0_8px_20px_rgba(0,0,0,.16)] md:h-32 md:w-32">
            {profile.logoUrl ? (
              <Image
                src={resolveMediaUrl(profile.logoUrl) ?? profile.logoUrl}
                alt={data.organizationName}
                fill
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <>
                <div className="absolute h-14 w-14 rounded-full border border-white/40 md:h-[70px] md:w-[70px]" />
                <span className="relative font-poppins text-sm font-light tracking-[0.25em] text-white md:text-base">
                  {initials(data.organizationName)}
                </span>
              </>
            )}
          </div>
          <div className="min-w-0 pt-3.5">
            <h1 className="break-words font-poppins text-[22px] font-extrabold leading-tight tracking-tight text-[#25252b]">
              {data.organizationName}
            </h1>
            <div className="mt-3 flex gap-2.5">
              <a
                href={profile.instagramUrl || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="grid h-10 w-10 place-items-center rounded-[11px] border border-[#e4e4ea] text-[#3a3a40]"
              >
                <Instagram size={20} />
              </a>
              <a
                href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-[11px] border border-[#e4e4ea] text-[#3a3a40]"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="p-[18px]">
          {/* STATUS */}
          {data.isOpenNow !== null ? (
            <div className="mb-4 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
              <div className="flex items-center gap-3.5 px-4 py-4">
                <div className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold" style={{ color: data.isOpenNow ? GREEN : MAROON }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: data.isOpenNow ? GREEN : MAROON }} />
                  {data.isOpenNow ? "Aberto agora" : "Fechado agora"}
                </div>
                <div className="h-full w-px self-stretch bg-[#ececf0]" />
                <div className="min-w-0 flex-1 truncate text-[14.5px] text-[#65656f]">
                  {data.todayHoursLabel ? `Hoje • ${data.todayHoursLabel}` : "Hoje sem horário definido"}
                </div>
                <button
                  type="button"
                  onClick={() => setSchedOpen((v) => !v)}
                  aria-label="Ver horários da semana"
                  className="ml-auto text-[#9a9aa4] transition-transform"
                  style={{ transform: schedOpen ? "rotate(180deg)" : "none" }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              {schedOpen ? (
                <div className="px-[18px] pb-1">
                  {data.weekHours.map((day) => (
                    <div key={day.dayOfWeek} className="flex justify-between border-t border-[#ececf0] py-2.5 text-sm">
                      <b className="font-semibold">{day.label}</b>
                      <span className="text-[#65656f]">{day.hours ?? "Fechado"}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* VER CARDÁPIO */}
          <a
            href={`/cardapio/${orgSlug}`}
            className="mb-4 flex w-full items-center rounded-2xl px-5 py-5 text-lg font-bold text-white shadow-[0_10px_22px_rgba(138,30,44,.22)]"
            style={{ background: MAROON }}
          >
            <span className="mx-auto">Ver cardápio</span>
          </a>

          {/* LOCALIZAÇÃO */}
          {profile.address ? (
            <div className="mb-4 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
              <div className="flex items-center gap-2.5 px-[18px] pt-[18px]">
                <MapPin size={20} style={{ color: MAROON }} />
                <h2 className="text-lg font-bold">Localização</h2>
              </div>
              <div className="px-[18px] pb-[18px] pt-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-2.5 whitespace-pre-line text-[15px] leading-relaxed text-[#65656f]">{profile.address}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[14.5px] font-bold"
                      style={{ color: MAROON }}
                    >
                      Ver no mapa →
                    </a>
                  </div>
                  {/* Embed real do Google Maps — nunca o Leaflet/CartoDB aqui: usuário pediu explicitamente o visual nativo do Maps. Sem API key (modo "output=embed" é público). */}
                  <div className="h-[90px] w-[110px] shrink-0 overflow-hidden rounded-xl border border-[#ececf0]">
                    <iframe
                      title="Mapa de localização"
                      src={`https://www.google.com/maps?q=${addressQuery}&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2.5">
                  <a
                    href={`https://waze.com/ul?q=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-xl"
                  >
                    <Image src="/waze.svg" alt="Waze" width={332} height={114} className="block h-[54px] w-full object-cover" unoptimized />
                  </a>
                  <a
                    href={`https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[#e4e4ea] bg-white py-3.5 pl-4 pr-3.5"
                  >
                    <Image src="/uber.svg" alt="Uber" width={40} height={40} className="h-10 w-10 rounded-lg" unoptimized />
                    <span className="flex-1 text-[15px] font-semibold text-[#25252b]">Chamar Uber</span>
                    <ChevronRight size={18} className="text-[#9a9aa4]" />
                  </a>
                  <a
                    href="https://99app.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-[#e4e4ea] bg-white py-3.5 pl-4 pr-3.5"
                  >
                    <Image src="/99.svg" alt="99" width={40} height={40} className="h-10 w-10 rounded-lg" unoptimized />
                    <span className="flex-1 text-[15px] font-semibold text-[#25252b]">Vá de 99</span>
                    <ChevronRight size={18} className="text-[#9a9aa4]" />
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* INFORMAÇÕES ÚTEIS */}
          {data.amenities.length > 0 ? (
            <div className="mb-5 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
              <div className="flex items-center gap-2.5 px-[18px] pt-[18px]">
                <MapPin size={20} style={{ color: MAROON }} />
                <h2 className="text-lg font-bold">Informações úteis</h2>
              </div>
              <div className="px-[18px] pb-2 pt-1.5 md:grid md:grid-cols-2 md:gap-x-6">
                {data.amenities.map((item, i) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3.5 py-3.5 ${i > 0 ? "border-t border-[#ececf0] md:border-t-0" : ""} ${i > 1 ? "md:border-t md:border-[#ececf0]" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold leading-tight">{item.label}</div>
                      <div className="mt-0.5 text-[13.5px] text-[#65656f]">{item.value || "Disponível"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="border-t border-[#ececf0] px-[18px] py-[22px] text-center">
          <div className="mb-3.5 text-[14.5px] font-bold">Siga {data.organizationName} nas redes sociais</div>
          <a
            href={profile.instagramUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-grid h-11 w-11 place-items-center rounded-xl border border-[#e4e4ea] text-[#3a3a40]"
          >
            <Instagram size={22} />
          </a>
          <div className="mt-4 text-xs leading-relaxed text-[#9a9aa4]">
            © {new Date().getFullYear()} {data.organizationName}. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
