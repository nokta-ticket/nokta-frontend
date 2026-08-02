"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Heart, LayoutGrid, List, MapPin, MessageCircle, Square } from "lucide-react";
import { formatCentsBRL, type PublicMenuItem, type PublicMenuResponse } from "@/services/venue-menu-public";
import { resolveMediaUrl } from "@/lib/media";

type ViewMode = "list" | "grid" | "large";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function itemPriceLabel(item: PublicMenuItem): string | null {
  if (item.prices.length === 0) return null;
  if (item.prices.length === 1) return formatCentsBRL(item.prices[0].effectivePriceCents);
  return `a partir de ${formatCentsBRL(Math.min(...item.prices.map((p) => p.effectivePriceCents)))}`;
}

/**
 * Renderer real do cardápio (nokta.live/cardapio/{slug}) — hero escuro com
 * anel, avatar circular, chips de categoria sticky, 3 modos de
 * visualização, favoritos. Componente puro: recebe os dados prontos e um
 * callback opcional de favoritar, sem acoplar a nenhuma API própria —
 * usado tanto pela página pública real (PublicMenuView, que busca os
 * dados e favorita contra o endpoint público) quanto pelo preview
 * autenticado do dashboard (MenuPreviewPhone, sem favoritar), para nunca
 * existir uma segunda implementação visual divergente.
 *
 * Mobile-first (o público real é 100% celular, em evento/bar ninguém abre
 * no notebook), mas ajustado com breakpoints md/lg/xl para tablet/desktop
 * em vez de ficar preso a um cartão de 440px centralizado.
 *
 * Rola dentro do elemento indicado por `scrollContainerSelector` (padrão
 * "main") — a página pública rola dentro de um `<main fixed inset-0
 * overflow-y-auto>|; o preview do dashboard passa o seletor do próprio
 * frame de celular. Os chips têm `sticky top-0`, cujo
 * getBoundingClientRect().top gruda em 0 quando colado e nunca reflete
 * quanto realmente rolou — por isso a appbar precisa observar o scroll do
 * container real, nunca de `window`.
 *
 * A appbar (barra escura que aparece ao rolar) é `sticky top-0` (como os
 * chips de categoria logo abaixo), nunca `fixed` — `fixed` sempre se
 * posiciona contra a viewport real do navegador, o que funciona por
 * acidente na página pública (o `<main>` já cobre a viewport inteira) mas
 * vaza pra fora do bezel quando este mesmo componente roda dentro do
 * preview de celular no dashboard (container pequeno, não a tela
 * inteira). `sticky` sempre gruda no topo do ancestral rolável mais
 * próximo, então funciona idêntico nos dois casos sem cálculo de posição.
 * O wrapper sticky fica com h-0 (nunca ocupa espaço no fluxo/empurra o
 * hero) — o conteúdo visual mora num filho absolute por cima dele.
 */
export function MenuView({
  data,
  onToggleFavorite,
  scrollContainerSelector = "main",
}: {
  data: PublicMenuResponse;
  onToggleFavorite?: (item: PublicMenuItem) => void;
  scrollContainerSelector?: string;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | "highlights">(
    data.menu.highlights.length > 0 ? "highlights" : (data.menu.categories[0]?.id ?? "highlights"),
  );
  const [view, setView] = useState<ViewMode>("list");
  const [showAppbar, setShowAppbar] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollParent = profileRef.current?.closest(scrollContainerSelector);
    if (!scrollParent) return;
    function onScroll() {
      if (!profileRef.current) return;
      setShowAppbar(profileRef.current.getBoundingClientRect().bottom <= 52);
    }
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scrollParent.removeEventListener("scroll", onScroll);
  }, [scrollContainerSelector]);

  const activeCategory = useMemo(
    () => data.menu.categories.find((c) => c.id === activeCategoryId),
    [data, activeCategoryId],
  );

  const itemsToShow: PublicMenuItem[] =
    activeCategoryId === "highlights" ? data.menu.highlights : (activeCategory?.items ?? []);

  const { profile } = data;
  const hasContactRow = Boolean(profile.address || profile.instagramUrl || profile.whatsappNumber);

  return (
    <div className="relative min-h-full bg-[#e9e9ec] font-sans">
      <div className="mx-auto min-h-full w-full max-w-[440px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] md:max-w-2xl lg:max-w-4xl">
        {/* APPBAR — sticky (não fixed, ver comentário no topo do arquivo). h-0 pra nunca empurrar o hero abaixo; o conteúdo visual mora num filho absolute. */}
        <div className="sticky top-0 z-40 h-0">
          <div
            className={`absolute inset-x-0 top-0 h-[52px] items-center gap-4 bg-[#0f0f11] px-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-200 ${
              showAppbar ? "flex translate-y-0" : "flex -translate-y-full"
            }`}
          >
            <span className="truncate font-poppins text-sm font-medium md:text-base">{data.organizationName}</span>
            <div className="ml-auto flex gap-1">
              <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<List size={18} />} label="Lista" />
              <ViewButton active={view === "grid"} onClick={() => setView("grid")} icon={<LayoutGrid size={18} />} label="Grade" />
              <ViewButton
                active={view === "large"}
                onClick={() => setView("large")}
                icon={<Square size={18} />}
                label="Cards"
              />
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="relative flex h-[180px] items-center justify-center overflow-hidden bg-[#050505] px-6 md:h-[220px]">
          <div className="absolute -top-24 h-[280px] w-[280px] rounded-full border border-white/40 md:-top-32 md:h-[340px] md:w-[340px]" />
          <p className="relative max-w-full break-words text-center font-poppins text-2xl font-light leading-tight tracking-[0.2em] text-white md:text-[46px] md:tracking-[0.42em]">
            {data.organizationName.toUpperCase()}
          </p>
        </div>

        {/* PROFILE */}
        <div ref={profileRef} className="flex gap-4 px-5 pb-4 md:gap-6 md:px-8">
          <div className="relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-black shadow-[0_6px_18px_rgba(0,0,0,0.18)] md:-mt-14 md:h-32 md:w-32">
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
          <div className="min-w-0 pt-3">
            <h1 className="mb-2 truncate font-poppins text-xl font-semibold tracking-tight text-[#141414] md:text-2xl">
              {data.organizationName}
            </h1>
            {hasContactRow ? (
              <div className="mb-2 flex flex-wrap items-center gap-4 text-[#141414]">
                {profile.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(profile.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={profile.address}
                  >
                    <MapPin size={20} strokeWidth={1.8} />
                  </a>
                ) : null}
                {profile.instagramUrl ? (
                  <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" title="Instagram">
                    <Square size={20} strokeWidth={1.8} />
                  </a>
                ) : null}
                {profile.whatsappNumber ? (
                  <a
                    href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                  >
                    <MessageCircle size={20} strokeWidth={1.8} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* CATEGORY CHIPS */}
        <div className="sticky top-0 z-10 flex gap-2.5 overflow-x-auto bg-white px-5 py-4 md:px-8">
          {data.menu.highlights.length > 0 ? (
            <button
              onClick={() => setActiveCategoryId("highlights")}
              className={`shrink-0 whitespace-nowrap rounded-xl border px-5 py-2.5 text-sm font-medium md:text-base ${
                activeCategoryId === "highlights"
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                  : "border-[#e3e3e6] bg-white text-[#141414]"
              }`}
            >
              Destaques
            </button>
          ) : null}
          {data.menu.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl border px-5 py-2.5 text-sm font-medium md:text-base ${
                activeCategoryId === cat.id
                  ? "border-[#0a0a0a] bg-[#0a0a0a] text-white"
                  : "border-[#e3e3e6] bg-white text-[#141414]"
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* SECTION HEADER */}
        <div className="px-5 pt-1 md:px-8">
          <h2 className="mb-3 font-poppins text-xl font-semibold text-[#141414] md:text-2xl">
            {activeCategoryId === "highlights" ? "Destaques" : (activeCategory?.nome ?? "")}
          </h2>
        </div>

        {/* ITEMS */}
        <div className="px-5 pb-24 md:px-8">
          {itemsToShow.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#9a9aa0]">Nenhum item disponível aqui no momento.</p>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {itemsToShow.map((item) => (
                <ItemGridCard key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
              ))}
            </div>
          ) : view === "large" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {itemsToShow.map((item) => (
                <ItemLargeCard key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#ececee]">
              {itemsToShow.map((item) => (
                <ItemListRow key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="bg-[#1a1a1c] px-6 py-6 text-right">
          <p className="font-poppins text-sm font-bold tracking-[0.18em] text-white">
            <span className="text-[#d9a326]">N</span>OKTA
          </p>
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-[#26262a] text-white" : "text-[#8b8b90]"}`}
    >
      {icon}
    </button>
  );
}

function FavoriteButton({ item, onToggle }: { item: PublicMenuItem; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label="favoritar"
      className="absolute right-2.5 top-2.5 z-[3] grid h-9 w-9 place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
    >
      <Heart size={18} strokeWidth={2} className={item.favoritedByVisitor ? "fill-[#ef4444] stroke-[#ef4444]" : "stroke-[#ef4444]"} />
    </button>
  );
}

function ItemThumb({ item }: { item: PublicMenuItem }) {
  if (item.imageUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-black/5">
        <Image src={resolveMediaUrl(item.imageUrl) ?? item.imageUrl} alt={item.nome} fill className="object-cover" unoptimized />
      </div>
    );
  }
  return (
    <div className="relative h-full w-full rounded-xl bg-[radial-gradient(130%_100%_at_50%_130%,#33334a,#0b0b12)]" />
  );
}

function ItemLargeCard({ item, onToggleFavorite }: { item: PublicMenuItem; onToggleFavorite?: () => void }) {
  const price = itemPriceLabel(item);
  return (
    <article className={item.available ? "" : "opacity-60"}>
      <div className="relative h-[200px] md:h-[240px]">
        <ItemThumb item={item} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} /> : null}
      </div>
      <div className="pt-3.5">
        <h4 className="font-poppins text-base font-semibold text-[#141414] md:text-lg">{item.nome}</h4>
        <div className="mt-3 flex items-center justify-between gap-2">
          {price ? <span className="font-poppins text-base font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex items-center gap-1.5 text-sm text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={16} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ItemGridCard({ item, onToggleFavorite }: { item: PublicMenuItem; onToggleFavorite?: () => void }) {
  const price = itemPriceLabel(item);
  return (
    <article className={item.available ? "" : "opacity-60"}>
      <div className="relative h-[130px] md:h-[150px]">
        <ItemThumb item={item} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} /> : null}
      </div>
      <div className="pt-2.5">
        <h4 className="truncate text-sm font-semibold text-[#141414]">{item.nome}</h4>
        <div className="mt-2 flex items-center justify-between gap-2">
          {price ? <span className="text-sm font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex items-center gap-1 text-xs text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={13} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ItemListRow({ item, onToggleFavorite }: { item: PublicMenuItem; onToggleFavorite?: () => void }) {
  const price = itemPriceLabel(item);
  return (
    <article className={`flex gap-4 py-5 ${item.available ? "" : "opacity-60"}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="font-poppins text-base font-semibold text-[#141414] md:text-lg">{item.nome}</h4>
        {item.descricao ? <p className="mt-1.5 text-sm leading-snug text-[#9a9aa0]">{item.descricao}</p> : null}
        {!item.available ? (
          <span className="mt-1.5 w-fit rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/50">
            Esgotado
          </span>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-4">
          {price ? <span className="font-poppins text-base font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex items-center gap-1.5 text-sm text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={16} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="relative h-[124px] w-[152px] shrink-0">
        <ItemThumb item={item} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} /> : null}
      </div>
    </article>
  );
}
