"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { formatBRLCents } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";
import type { PublicMenuCategory, PublicMenuItem, PublicMenuResponse, PublicMenuSection } from "@/services/venue-menu-public";
import { HeaderAction, VenuePublicFooter, VenuePublicHeader, venueInitials } from "./venue-public-header";

type ViewMode = "list" | "grid";

/**
 * Magnitude comparável do nome de uma variação ("200 ml" → 200, "1 L" → 1000)
 * pra ordenar por tamanho real, não pelo displayOrder cadastrado. Null quando
 * não há número — o chamador mantém a ordem original.
 */
function parseVariantSize(nome: string): number | null {
  const match = nome.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(ml|l|kg|g|un|oz)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "l" || unit === "kg") return value * 1000;
  return value;
}

/** Variações da menor pra maior; sem nenhum tamanho parseável, mantém a ordem (P/M/G nunca é embaralhado). */
export function sortVariantsBySize(prices: PublicMenuItem["prices"]): PublicMenuItem["prices"] {
  const sizes = prices.map((p) => parseVariantSize(p.variantNome));
  if (sizes.every((s) => s === null)) return prices;
  return prices
    .map((p, i) => ({ p, size: sizes[i] }))
    .sort((a, b) => {
      if (a.size === null && b.size === null) return 0;
      if (a.size === null) return 1;
      if (b.size === null) return -1;
      return a.size - b.size;
    })
    .map(({ p }) => p);
}

/** Variação principal (menor) + preço, sempre visível no card — nunca "a partir de". */
function itemMainPrice(item: PublicMenuItem): { price: string; variant: string | null } | null {
  if (item.prices.length === 0) return null;
  if (item.prices.length === 1) return { price: formatBRLCents(item.prices[0].effectivePriceCents), variant: null };
  const sorted = sortVariantsBySize(item.prices);
  return { price: formatBRLCents(sorted[0].effectivePriceCents), variant: sorted[0].variantNome };
}

/** Medida real (volume/massa) no nome da variação; exige unidade ("8 anos" não é tamanho). */
function parseVariantMeasure(nome: string): number | null {
  const match = nome.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(ml|cl|l|kg|g|oz)\b/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "l" || unit === "kg") return value * 1000;
  if (unit === "cl") return value * 10;
  return value;
}

/** "5 tamanhos" / "4 opções"; null sem múltiplas variações. */
function variantCountLabel(item: PublicMenuItem): string | null {
  const count = item.prices.length;
  if (count <= 1) return null;
  const measures = item.prices.map((p) => parseVariantMeasure(p.variantNome));
  const isSizes = measures.every((m) => m !== null) && new Set(measures).size === measures.length;
  return `${count} ${isSizes ? "tamanhos" : "opções"}`;
}

const STICKY_OFFSET = 56;

/**
 * Renderer do cardápio público (nokta.live/cardapio/{slug}) — também usado
 * pelo preview autenticado do painel (iframe) pra nunca existir uma segunda
 * implementação. Componente puro: recebe os dados e um callback opcional de
 * favoritar. Tema escuro da Nokta com a identidade do bar (banner, logo).
 * Rola no documento; a barra de categorias é `sticky` (nunca `fixed`, que
 * vazaria pra fora do bezel do preview).
 */
export function MenuView({
  data,
  onToggleFavorite,
  orgSlug,
}: {
  data: PublicMenuResponse;
  onToggleFavorite?: (item: PublicMenuItem) => void;
  /** Slug da organização — liga "Início" e "Avaliar". Ausente no preview do painel. */
  orgSlug?: string;
  /** Mantidos por compatibilidade com chamadores antigos (o layout atual rola no documento). */
  scrollContainerSelector?: string;
  disableSticky?: boolean;
}) {
  const [section, setSection] = useState<PublicMenuSection>("MENU");
  const [view, setView] = useState<ViewMode>("list");
  const [searchOpen, setSearchOpen] = useState(false);
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Um sheet de cada tipo por vez, controlado aqui — qualquer card abre o mesmo overlay.
  const [variantSheetItem, setVariantSheetItem] = useState<PublicMenuItem | null>(null);
  // Só o ID: favoritar dentro do detalhe precisa refletir o `data` atualizado.
  const [detailItemId, setDetailItemId] = useState<number | null>(null);
  const sectionRefs = useRef(new Map<number | "highlights", HTMLElement>());
  const topRef = useRef<HTMLDivElement>(null);

  const hasTobacco = data.menu.categories.some((c) => c.section === "TOBACCO");
  const hasMenu = data.menu.categories.some((c) => (c.section ?? "MENU") === "MENU");
  const hasBothSections = hasTobacco && hasMenu;
  const activeSection: PublicMenuSection = hasBothSections ? section : hasTobacco ? "TOBACCO" : "MENU";
  const visibleCategories = data.menu.categories.filter((c) => (c.section ?? "MENU") === activeSection && c.items.length > 0);
  const visibleHighlights = data.menu.highlights.filter((i) => (i.section ?? "MENU") === activeSection);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => String(visibleCategories[0]?.id ?? ""));

  // Busca cruza TODAS as categorias — o cliente pode não saber onde o produto está.
  const allItems = useMemo(() => data.menu.categories.flatMap((c) => c.items), [data.menu.categories]);
  const detailItem = detailItemId === null ? null : (allItems.find((i) => i.id === detailItemId) ?? data.menu.highlights.find((i) => i.id === detailItemId) ?? null);

  // Chip ativo acompanha a rolagem (seção mais próxima do topo da barra).
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const entries = [...sectionRefs.current.entries()].filter(([key]) => key !== "highlights");
    if (entries.length === 0) return;
    const ratio = new Map<number | "highlights", boolean>();
    const observer = new IntersectionObserver(
      (observed) => {
        for (const e of observed) {
          const key = entries.find(([, el]) => el === e.target)?.[0];
          if (key !== undefined) ratio.set(key, e.isIntersecting);
        }
        const first = entries.find(([key]) => ratio.get(key));
        if (first) setActiveCategoryId(String(first[0]));
      },
      { rootMargin: `-${STICKY_OFFSET + 8}px 0px -60% 0px`, threshold: 0 },
    );
    entries.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleCategories.length, activeSection]);

  const scrollToSection = (id: number | "highlights") => {
    setActiveCategoryId(String(id));
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const switchSection = (next: PublicMenuSection) => {
    setSection(next);
    const first = data.menu.categories.find((c) => (c.section ?? "MENU") === next);
    if (first) setActiveCategoryId(String(first.id));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const { profile } = data;
  // Nome público é o do CARDÁPIO (editável no painel), não o da organização.
  const displayName = data.menu.nome;
  const favoriteFor = (item: PublicMenuItem) => (onToggleFavorite ? () => onToggleFavorite(item) : undefined);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <VenuePublicHeader
          name={displayName}
          logoUrl={profile.logoUrl}
          bannerUrl={profile.bannerUrl}
          actions={
            <>
              {orgSlug ? <HeaderAction href={`/${orgSlug}`} label="Início do estabelecimento" icon="home" /> : null}
              <HeaderAction href={profile.instagramUrl || "https://instagram.com"} label="Instagram" icon="instagram" external />
              <HeaderAction href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"} label="WhatsApp" icon="whatsapp" external />
              <HeaderAction onClick={() => setSearchOpen(true)} label="Buscar no cardápio" icon="search" />
              {orgSlug ? (
                <Button asChild variant="outline" size="sm" shape="pill" className="ml-auto h-11">
                  <a href={`/avaliacao/${orgSlug}`}>
                    <Icon name="star" size={13} className="text-warning" />
                    Avaliar
                  </a>
                </Button>
              ) : null}
            </>
          }
        >
          {data.menu.descricao ? <p className="mt-3 px-4 text-body text-muted-foreground md:px-6">{data.menu.descricao}</p> : null}
        </VenuePublicHeader>

        <div ref={topRef} className="scroll-mt-2" />

        {hasBothSections ? (
          <div className="px-4 pt-5 md:px-6">
            <SegmentedControl fullWidth value={activeSection} onChange={switchSection} options={[{ value: "MENU", label: "Cardápio", icon: "utensils" }, { value: "TOBACCO", label: "Tabacaria", icon: "fire" }]} />
          </div>
        ) : null}

        {activeSection === "TOBACCO" ? (
          <div className="px-4 pt-4 md:px-6">
            <Callout tone="warning" icon="id-card">
              Venda proibida para menores de 18 anos.
            </Callout>
          </div>
        ) : null}

        {/* Barra pegajosa: categorias + modo de visualização. */}
        <div className="sticky top-0 z-30 mt-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 md:px-6">
            {visibleCategories.length > 0 ? (
              <Tabs value={activeCategoryId} onValueChange={(v) => scrollToSection(Number(v))} className="min-w-0 flex-1 gap-0">
                <TabsList variant="line" className="border-b-0">
                  {visibleCategories.map((cat) => (
                    <TabsTrigger key={cat.id} value={String(cat.id)} className="h-14">
                      {cat.nome}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <span className="flex-1" />
            )}
            <div className="flex shrink-0 items-center gap-0.5">
              {visibleCategories.length > 3 ? (
                <button type="button" onClick={() => setAllCategoriesOpen(true)} aria-label="Todas as categorias" title="Todas as categorias" className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
                  <Icon name="layers" size={15} />
                </button>
              ) : null}
              <button type="button" onClick={() => setView(view === "list" ? "grid" : "list")} aria-label={view === "list" ? "Ver em grade" : "Ver em lista"} title={view === "list" ? "Ver em grade" : "Ver em lista"} className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground">
                <Icon name={view === "list" ? "grid" : "list"} size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="pb-6">
          {visibleHighlights.length > 0 ? (
            <section
              ref={(el) => {
                if (el) sectionRefs.current.set("highlights", el);
                else sectionRefs.current.delete("highlights");
              }}
              className="pt-6"
              style={{ scrollMarginTop: STICKY_OFFSET + 8 }}
            >
              <h2 className="mb-3 flex items-center gap-2 px-4 text-title font-semibold tracking-tight md:px-6">
                <Icon name="fire" size={16} className="text-brand" />
                Destaques
              </h2>
              <div className="snap-row gap-3 px-4 pb-2 md:px-6">
                {visibleHighlights.map((item, i) => (
                  <HighlightCard key={item.id} item={item} first={i === 0} onToggleFavorite={favoriteFor(item)} onOpenVariants={() => setVariantSheetItem(item)} onOpenDetail={() => setDetailItemId(item.id)} />
                ))}
              </div>
            </section>
          ) : null}

          {visibleCategories.length === 0 && visibleHighlights.length === 0 ? (
            <div className="px-4 pt-8 md:px-6">
              <EmptyState icon="utensils" title="Cardápio em preparação" description="Os itens aparecem aqui assim que forem publicados." />
            </div>
          ) : null}

          {visibleCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(cat.id, el);
                else sectionRefs.current.delete(cat.id);
              }}
              className="px-4 pt-7 md:px-6"
              style={{ scrollMarginTop: STICKY_OFFSET + 8 }}
            >
              <div className="mb-3">
                <h2 className="text-title font-semibold tracking-tight">{cat.nome}</h2>
                {cat.descricao ? <p className="mt-0.5 text-caption text-muted-foreground">{cat.descricao}</p> : null}
              </div>
              {view === "grid" ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {cat.items.map((item, i) => (
                    <ItemGridCard key={item.id} item={item} index={i} onToggleFavorite={favoriteFor(item)} onOpenVariants={() => setVariantSheetItem(item)} onOpenDetail={() => setDetailItemId(item.id)} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cat.items.map((item, i) => (
                    <ItemListRow key={item.id} item={item} index={i} onToggleFavorite={favoriteFor(item)} onOpenVariants={() => setVariantSheetItem(item)} onOpenDetail={() => setDetailItemId(item.id)} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {hasBothSections ? (
            <div className="px-4 pt-10 md:px-6">
              <button type="button" onClick={() => switchSection(activeSection === "MENU" ? "TOBACCO" : "MENU")} className="press card-hover flex w-full items-center justify-between gap-4 rounded-card border border-border bg-surface px-5 py-4 text-left shadow-card">
                <span className="flex items-center gap-3">
                  <Icon name={activeSection === "MENU" ? "fire" : "utensils"} size={16} className="text-brand" />
                  <span className="text-base font-semibold text-foreground">{activeSection === "MENU" ? "Tabacaria" : "Cardápio"}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                  {activeSection === "MENU" ? "Ver essências" : "Voltar pro cardápio"}
                  <Icon name="arrow-right" size={10} />
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <VenuePublicFooter instagramUrl={profile.instagramUrl} />
      </div>

      <AllCategoriesSheet open={allCategoriesOpen} categories={visibleCategories} activeCategoryId={activeCategoryId} onSelect={(id) => { setAllCategoriesOpen(false); scrollToSection(id); }} onClose={() => setAllCategoriesOpen(false)} />

      <SearchSheet open={searchOpen} allItems={allItems} query={searchQuery} onQueryChange={setSearchQuery} onClose={closeSearch} onToggleFavorite={onToggleFavorite} onOpenVariants={setVariantSheetItem} onOpenDetail={(item) => setDetailItemId(item.id)} />

      <VariantSheet item={variantSheetItem} onClose={() => setVariantSheetItem(null)} />

      <ProductDetailSheet item={detailItem} onClose={() => setDetailItemId(null)} onToggleFavorite={detailItem ? favoriteFor(detailItem) : undefined} onOpenVariants={() => detailItem && setVariantSheetItem(detailItem)} />
    </div>
  );
}

/* ---------- peças ---------- */

function ItemThumb({ item, sizes = "160px", className, priority }: { item: PublicMenuItem; sizes?: string; className?: string; priority?: boolean }) {
  const src = item.imageUrl ? resolveMediaUrl(item.imageUrl, null) : null;
  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl bg-surface-2", className)}>
      {src ? <Image src={src} alt={item.nome} fill sizes={sizes} priority={priority} className="object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center text-subtle-foreground"><Icon name="utensils" size={20} /></div>}
    </div>
  );
}

function FavoriteButton({ item, onToggle, className }: { item: PublicMenuItem; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={item.favoritedByVisitor}
      aria-label={item.favoritedByVisitor ? "Remover dos favoritos" : "Favoritar"}
      className={cn("press flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-thumb backdrop-blur-sm transition-colors", item.favoritedByVisitor && "text-brand", className)}
    >
      <Icon name={item.favoritedByVisitor ? "heart" : "heart-outline"} size={16} />
    </button>
  );
}

function FavoriteCount({ item, className }: { item: PublicMenuItem; className?: string }) {
  if (item.favoriteCount <= 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption text-muted-foreground tnum", className)}>
      <Icon name="heart" size={10} className="text-brand" />
      {item.favoriteCount}
    </span>
  );
}

function VariantsLink({ item, onOpenVariants, className }: { item: PublicMenuItem; onOpenVariants: () => void; className?: string }) {
  const label = variantCountLabel(item);
  if (!label) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpenVariants();
      }}
      className={cn("inline-flex min-h-8 items-center gap-1 text-caption font-semibold text-brand", className)}
    >
      {label}
      <Icon name="chevron-right" size={9} />
    </button>
  );
}

function PriceLine({ item, size = "md" }: { item: PublicMenuItem; size?: "sm" | "md" | "lg" }) {
  const main = itemMainPrice(item);
  if (!main) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", size === "sm" ? "text-sm" : size === "lg" ? "text-title" : "text-base")}>
      <span className="font-semibold text-foreground tnum">{main.price}</span>
      {main.variant ? <span className="text-caption text-muted-foreground">{main.variant}</span> : null}
    </span>
  );
}

function HighlightCard({ item, first, onToggleFavorite, onOpenVariants, onOpenDetail }: { item: PublicMenuItem; first?: boolean; onToggleFavorite?: () => void; onOpenVariants: () => void; onOpenDetail: () => void }) {
  return (
    <article onClick={onOpenDetail} className={cn("press w-44 cursor-pointer md:w-52", !item.available && "opacity-60")}>
      <div className="relative aspect-square">
        <ItemThumb item={item} sizes="208px" className="rounded-card" priority={first} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} className="absolute right-2 top-2 size-10" /> : null}
        {item.categoryNome ? <span className="absolute bottom-2 left-2 rounded-pill bg-background/85 px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.06em] text-foreground backdrop-blur-sm">{item.categoryNome}</span> : null}
      </div>
      <div className="pt-2.5">
        <h3 className="truncate text-sm font-semibold text-foreground">{item.nome}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <PriceLine item={item} size="sm" />
          <FavoriteCount item={item} />
        </div>
        <div className="min-h-6">
          <VariantsLink item={item} onOpenVariants={onOpenVariants} />
        </div>
      </div>
    </article>
  );
}

function ItemListRow({ item, index, onToggleFavorite, onOpenVariants, onOpenDetail }: { item: PublicMenuItem; index: number; onToggleFavorite?: () => void; onOpenVariants: () => void; onOpenDetail: () => void }) {
  return (
    <article onClick={onOpenDetail} className={cn("press card-hover fade-up flex cursor-pointer gap-3.5 rounded-card border border-border bg-surface p-3.5 shadow-card", !item.available && "opacity-60")} style={{ ["--i" as string]: index } as never}>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">{item.nome}</h3>
        {item.descricao ? <p className="mt-1 line-clamp-2 text-caption leading-snug text-muted-foreground">{item.descricao}</p> : null}
        {!item.available ? (
          <div className="mt-1.5">
            <StatusBadge tone="neutral">Esgotado</StatusBadge>
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 pt-2.5">
          <PriceLine item={item} />
          <FavoriteCount item={item} />
          <VariantsLink item={item} onOpenVariants={onOpenVariants} className="ml-auto" />
        </div>
      </div>
      <div className="relative size-24 shrink-0 md:size-28">
        <ItemThumb item={item} sizes="112px" />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} className="absolute -bottom-1.5 -right-1.5 size-10" /> : null}
      </div>
    </article>
  );
}

function ItemGridCard({ item, index, onToggleFavorite, onOpenVariants, onOpenDetail }: { item: PublicMenuItem; index: number; onToggleFavorite?: () => void; onOpenVariants: () => void; onOpenDetail: () => void }) {
  return (
    <article onClick={onOpenDetail} className={cn("press fade-up cursor-pointer", !item.available && "opacity-60")} style={{ ["--i" as string]: index } as never}>
      <div className="relative aspect-square">
        <ItemThumb item={item} sizes="(max-width: 768px) 50vw, 240px" className="rounded-card" />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} className="absolute right-2 top-2 size-10" /> : null}
        {!item.available ? <StatusBadge tone="neutral" className="absolute bottom-2 left-2">Esgotado</StatusBadge> : null}
      </div>
      <div className="pt-2.5">
        <h3 className="truncate text-sm font-semibold text-foreground">{item.nome}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <PriceLine item={item} size="sm" />
          <FavoriteCount item={item} />
        </div>
        <div className="min-h-6">
          <VariantsLink item={item} onOpenVariants={onOpenVariants} />
        </div>
      </div>
    </article>
  );
}

function AllCategoriesSheet({ open, categories, activeCategoryId, onSelect, onClose }: { open: boolean; categories: PublicMenuCategory[]; activeCategoryId: string; onSelect: (id: number) => void; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Categorias</SheetTitle>
          <SheetDescription>Toque pra ir direto pra seção.</SheetDescription>
        </SheetHeader>
        <SheetBody className="pb-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {categories.map((cat) => {
              const active = String(cat.id) === activeCategoryId;
              const src = cat.imageUrl ? resolveMediaUrl(cat.imageUrl, null) : null;
              return (
                <button key={cat.id} type="button" onClick={() => onSelect(cat.id)} className="press flex flex-col items-center gap-2 text-center">
                  <span className={cn("relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-surface-2 ring-2", active ? "ring-brand" : "ring-transparent")}>
                    {src ? <Image src={src} alt="" fill sizes="64px" className="object-cover" unoptimized /> : <span className="text-sm font-semibold tracking-[0.1em] text-muted-foreground">{venueInitials(cat.nome)}</span>}
                  </span>
                  <span className={cn("line-clamp-2 text-caption leading-tight", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function SearchSheet({ open, allItems, query, onQueryChange, onClose, onToggleFavorite, onOpenVariants, onOpenDetail }: { open: boolean; allItems: PublicMenuItem[]; query: string; onQueryChange: (value: string) => void; onClose: () => void; onToggleFavorite?: (item: PublicMenuItem) => void; onOpenVariants: (item: PublicMenuItem) => void; onOpenDetail: (item: PublicMenuItem) => void }) {
  const normalized = query.trim().toLowerCase();
  const results = normalized ? allItems.filter((item) => item.nome.toLowerCase().includes(normalized) || item.descricao?.toLowerCase().includes(normalized)) : [];
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[92dvh]">
        <SheetHeader>
          <SheetTitle>Buscar no cardápio</SheetTitle>
          <SheetDescription>Busca em todas as categorias.</SheetDescription>
        </SheetHeader>
        <div className="px-5 pb-3">
          <SearchInput value={query} onChange={onQueryChange} placeholder="O que você procura?" autoFocus />
        </div>
        <SheetBody className="gap-2.5 pt-0">
          {!normalized ? (
            <p className="py-10 text-center text-body text-muted-foreground">Digite o nome de um produto.</p>
          ) : results.length === 0 ? (
            <EmptyState compact icon="search" title="Nenhum produto encontrado" description="Tenta outro nome ou olha as categorias." />
          ) : (
            results.map((item, i) => <ItemListRow key={item.id} item={item} index={i} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} onOpenVariants={() => onOpenVariants(item)} onOpenDetail={() => onOpenDetail(item)} />)
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/** Folha "Escolha o tamanho" — nunca lista variações dentro do card (altura uniforme). Só consulta, sem carrinho. */
function VariantSheet({ item, onClose }: { item: PublicMenuItem | null; onClose: () => void }) {
  const sorted = useMemo(() => (item ? sortVariantsBySize(item.prices) : []), [item]);
  return (
    <Sheet open={item !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{item?.nome ?? ""}</SheetTitle>
          <SheetDescription>{item && variantCountLabel(item)?.endsWith("tamanhos") ? "Tamanhos e preços" : "Opções e preços"}</SheetDescription>
        </SheetHeader>
        <SheetBody className="gap-0 pb-6">
          <ul className="divide-y divide-border">
            {sorted.map((price) => (
              <li key={price.variantId} className="flex min-h-12 items-center justify-between gap-4 py-3">
                <span className="text-[15px] text-foreground">{price.variantNome}</span>
                <span className="text-[15px] font-semibold text-foreground tnum">{formatBRLCents(price.effectivePriceCents)}</span>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

/** Detalhe do produto: foto grande, descrição, harmonização, preço e alergênicos. */
function ProductDetailSheet({ item, onClose, onToggleFavorite, onOpenVariants }: { item: PublicMenuItem | null; onClose: () => void; onToggleFavorite?: () => void; onOpenVariants: () => void }) {
  return (
    <Sheet open={item !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[92dvh]" showCloseButton={false}>
        {item ? (
          <>
            <SheetBody className="gap-5 px-0 pt-2">
              <div className="relative mx-4 aspect-[4/3] md:mx-6">
                <ItemThumb item={item} sizes="(max-width: 768px) 100vw, 768px" className="rounded-card" />
                <button type="button" onClick={onClose} aria-label="Fechar" className="press absolute left-3 top-3 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-thumb backdrop-blur-sm">
                  <Icon name="close" size={16} />
                </button>
                {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} className="absolute right-3 top-3" /> : null}
              </div>
              <div className="px-5 md:px-6">
                <SheetTitle className="text-title">{item.nome}</SheetTitle>
                <SheetDescription className="mt-1">{item.descricao ?? "Sem descrição."}</SheetDescription>
                {item.harmonizaCom ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                    <Icon name="wine" size={11} className="text-brand" />
                    Harmoniza com {item.harmonizaCom}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <PriceLine item={item} size="lg" />
                  <FavoriteCount item={item} />
                  {!item.available ? <StatusBadge tone="neutral">Esgotado</StatusBadge> : null}
                </div>
                {variantCountLabel(item) ? (
                  <Button variant="outline" size="sm" shape="pill" rightIcon="chevron-right" className="mt-3" onClick={onOpenVariants}>
                    Ver {variantCountLabel(item)}
                  </Button>
                ) : null}
                {item.contraindicacoes ? (
                  <Callout tone="warning" icon="warning" title="Alergênicos" className="mt-5">
                    {item.contraindicacoes}
                  </Callout>
                ) : null}
              </div>
            </SheetBody>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
