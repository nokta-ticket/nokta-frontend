"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPin } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
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
    <div className="relative flex min-h-full flex-col bg-[#f4f4f6] font-sans">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.06)] md:max-w-2xl">
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

        {/* HEADER — logo grande (112px), sobrepondo só ~20% da própria altura sobre a borda do banner (não 50%) — nome/ícones alinhados ao lado dela nessa mesma altura. */}
        <div className="flex gap-3.5 px-[18px] pb-1">
          <div className="relative -mt-6 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-black shadow-[0_4px_12px_rgba(0,0,0,.14)]">
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
                <div className="absolute h-16 w-16 rounded-full border border-white/40" />
                <span className="relative font-poppins text-base font-light tracking-[0.25em] text-white">
                  {initials(data.organizationName)}
                </span>
              </>
            )}
          </div>
          <div className="min-w-0 pt-1.5">
            <h1 className="break-words font-poppins text-[19px] font-extrabold leading-tight tracking-tight text-[#25252b]">
              {data.organizationName}
            </h1>
            <div className="mt-2 flex gap-3">
              <a
                href={profile.instagramUrl || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="text-[#3a3a40]"
              >
                <InstagramIcon size={22} />
              </a>
              <a
                href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="text-[#3a3a40]"
              >
                <WhatsappIcon size={22} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex-1 p-[18px]">
          {/* STATUS — card sempre visível, mesmo sem nenhum horário cadastrado (isOpenNow null nesse caso). */}
          <div className="mb-4 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
            {data.weekHours.length > 0 ? (
              <button
                type="button"
                onClick={() => setSchedOpen((v) => !v)}
                aria-expanded={schedOpen}
                aria-label="Ver horários da semana"
                className="flex w-full items-center gap-3.5 px-4 py-2.5 text-left"
              >
                {data.isOpenNow !== null ? (
                  <div className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold" style={{ color: data.isOpenNow ? GREEN : MAROON }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: data.isOpenNow ? GREEN : MAROON }} />
                    {data.isOpenNow ? "Aberto agora" : "Fechado agora"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold text-[#9a9aa4]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c7c7cf]" />
                    Horário não informado
                  </div>
                )}
                <div className="h-full w-px self-stretch bg-[#ececf0]" />
                <div className="min-w-0 flex-1 truncate text-[14.5px] text-[#65656f]">
                  {data.todayHoursLabel ? `Hoje • ${data.todayHoursLabel}` : "Hoje sem horário definido"}
                </div>
                <ChevronDown
                  size={20}
                  className="ml-auto shrink-0 text-[#9a9aa4] transition-transform"
                  style={{ transform: schedOpen ? "rotate(180deg)" : "none" }}
                />
              </button>
            ) : (
              <div className="flex items-center gap-3.5 px-4 py-2.5">
                {data.isOpenNow !== null ? (
                  <div className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold" style={{ color: data.isOpenNow ? GREEN : MAROON }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: data.isOpenNow ? GREEN : MAROON }} />
                    {data.isOpenNow ? "Aberto agora" : "Fechado agora"}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 whitespace-nowrap text-[15px] font-bold text-[#9a9aa4]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#c7c7cf]" />
                    Horário não informado
                  </div>
                )}
                <div className="h-full w-px self-stretch bg-[#ececf0]" />
                <div className="min-w-0 flex-1 truncate text-[14.5px] text-[#65656f]">
                  {data.todayHoursLabel ? `Hoje • ${data.todayHoursLabel}` : "Hoje sem horário definido"}
                </div>
              </div>
            )}
            {schedOpen && data.weekHours.length > 0 ? (
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

          {/* CARDÁPIO DIGITAL — outline fino, fundo branco, texto na cor da marca (referência visual enviada pelo usuário), largura total mantida. */}
          <a
            href={`/cardapio/${orgSlug}`}
            className="mb-4 flex h-14 w-full items-center justify-center gap-2.5 rounded-full border text-[18px] font-semibold"
            style={{ borderColor: MAROON, color: MAROON }}
          >
            <span aria-hidden className="text-[22px] leading-none">🍴</span>
            Cardápio Digital
          </a>

          {/* LOCALIZAÇÃO */}
          {profile.address ? (
            <div className="mb-4 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
              <div className="p-[18px]">
                {/* Área superior com altura fixa (~145px) — mapa precisa de uma altura explícita pra não ficar raso, já que a coluna do endereço sozinha não garante altura suficiente. */}
                <div className="flex h-[145px] gap-3.5">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-5 items-center gap-2.5">
                      <MapPin size={20} style={{ color: MAROON }} />
                      <h2 className="text-lg font-bold leading-none">Localização</h2>
                    </div>
                    <p className="mt-2.5 whitespace-pre-line text-[15px] leading-relaxed text-[#3a3a40]">{profile.address}</p>
                  </div>
                  {/* Embed real do Google Maps — nunca o Leaflet/CartoDB aqui: usuário pediu explicitamente o visual nativo do Maps. Sem API key (modo "output=embed" é público). Mapa grande (~175x145), preenche toda a altura da área superior, nunca uma miniatura. */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block h-full w-[175px] shrink-0 overflow-hidden rounded-xl border border-[#ececf0]"
                  >
                    <iframe
                      title="Mapa de localização"
                      src={`https://www.google.com/maps?q=${addressQuery}&output=embed`}
                      className="pointer-events-none absolute inset-0 h-full w-full"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <a
                    href={`https://waze.com/ul?q=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center overflow-hidden rounded-xl bg-[#33cbfd]"
                  >
                    {/* waze.svg tem espaço vazio maior abaixo do desenho dentro do próprio viewBox (332x114) — o desenho real fica um pouco acima do centro geométrico do arquivo, por isso o object-contain sozinho empurrava o conteúdo visualmente pra baixo em relação aos botões Uber/99. Compensado com -translate-y. */}
                    <Image
                      src="/waze.svg"
                      alt="Waze"
                      width={332}
                      height={114}
                      className="h-6 w-auto -translate-y-[3px] object-contain"
                      unoptimized
                    />
                  </a>
                  <a
                    href={`https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${addressQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center overflow-hidden rounded-xl bg-white"
                  >
                    {/* uber.svg já é o logo completo (quadrado preto + "Uber" vazado em branco) — preenche o botão inteiro. */}
                    <Image src="/uber.svg" alt="Uber" width={2000} height={2000} className="h-full w-full object-cover" unoptimized />
                  </a>
                  {/* 99.svg cortava feio em object-cover (proporção muito vertical/apertada) — mantido só como fundo (gradiente equivalente ao do SVG), com texto por cima, mesmo padrão do Uber. Sem destino pré-preenchido: diferente de Waze/Uber, a 99 não documenta nenhum deep-link oficial de endereço. Link oficial (Onelink/AppsFlyer da 99) — abre o app instalado ou a loja certa (iOS/Android), fornecido pelo usuário. */}
                  <a
                    href="https://99app-pax.onelink.me/qDRG/dcwrjtqm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 items-center justify-center gap-1 rounded-xl leading-none text-black"
                    style={{ background: "linear-gradient(135deg, #ffdd00, #ff8200)" }}
                  >
                    <span className="text-[14px] font-semibold leading-none">Vai de</span>
                    <span className="text-[19px] font-extrabold leading-none">99</span>
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {/* INFORMAÇÕES ÚTEIS — card sempre visível (mesmo sem nenhuma amenidade habilitada), mas minimalista/compacto nesse estado vazio (pedido explícito do usuário, a versão anterior ficou alta demais). */}
          <div className="mb-5 rounded-2xl border border-[#ececf0] bg-white shadow-[0_1px_2px_rgba(30,20,20,.05),0_2px_8px_rgba(30,20,20,.04)]">
            {data.amenities.length > 0 ? (
              <>
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
              </>
            ) : (
              <div className="flex items-center gap-2.5 px-[18px] py-3.5">
                <MapPin size={16} style={{ color: MAROON }} />
                <span className="text-[14px] font-semibold">Informações úteis</span>
                <span className="text-[13px] text-[#9a9aa4]">— nenhuma cadastrada</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER — faixa simples com razão social/CNPJ da Nokta (não do estabelecimento) + Instagram discreto, pedido explícito do usuário pra reduzir o rodapé anterior (card grande "Siga nas redes sociais"). */}
        <div className="flex items-center justify-between gap-3 border-t border-[#ececf0] px-[18px] py-3.5">
          <span className="-translate-y-[1.5px] text-[11px] leading-snug text-[#9a9aa4]">
            Nokta Tecnologia LTDA • CNPJ: 59.386.582/0001-39
          </span>
          <a
            href={profile.instagramUrl || "https://instagram.com"}
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram"
            aria-label="Instagram"
            className="-translate-y-[1.5px] shrink-0 text-[#9a9aa4]"
          >
            <InstagramIcon size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
