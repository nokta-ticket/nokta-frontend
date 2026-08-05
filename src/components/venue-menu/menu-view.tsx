"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Heart, Home, Instagram, LayoutGrid, List, MessageCircle, Search, Square, Star } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
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
  orgSlug,
  disableSticky = false,
}: {
  data: PublicMenuResponse;
  onToggleFavorite?: (item: PublicMenuItem) => void;
  scrollContainerSelector?: string;
  /** Slug da organização, usado para linkar "Avaliar". Ausente no preview do dashboard (link real não faz sentido lá) — o ícone some nesse caso. */
  orgSlug?: string;
  /**
   * `position: sticky` não se comporta corretamente dentro de um ancestral
   * com `transform` (ex.: o preview do dashboard, que usa `scale()` pra
   * caber no bezel de celular) — os chips/appbar ficam presos numa posição
   * errada, criando uma faixa visual estranha. Sem solução de CSS real pra
   * isso (limitação conhecida do spec), então o preview passa
   * `disableSticky` pra virar `relative` ali, evitando o artefato — só a
   * página pública real (sem scale) usa sticky de verdade.
   */
  disableSticky?: boolean;
}) {
  // Chip "ativo" é só indicativo (destaca visualmente qual seção o clique
  // mais recente mirou) — todas as categorias (e Destaques) ficam sempre
  // visíveis, empilhadas, cada uma com seu próprio título/separador. Clicar
  // num chip rola até o início daquela seção (scrollIntoView), nunca
  // esconde as demais.
  const [activeCategoryId, setActiveCategoryId] = useState<number | "highlights">(
    data.menu.highlights.length > 0 ? "highlights" : (data.menu.categories[0]?.id ?? "highlights"),
  );
  const [view, setView] = useState<ViewMode>("list");
  const [showAppbar, setShowAppbar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef(new Map<number | "highlights", HTMLDivElement>());

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

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const scrollToSection = (id: number | "highlights") => {
    setActiveCategoryId(id);
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Busca cruza TODAS as categorias (não só a ativa) — o usuário pode não
  // lembrar em qual categoria o produto está.
  const allItems = useMemo(
    () => data.menu.categories.flatMap((c) => c.items),
    [data.menu.categories],
  );

  const { profile } = data;
  // Nome exibido publicamente é o do CARDÁPIO (menu.nome, editável em
  // "Nome do cardápio" no dashboard) — nunca o nome da organização
  // (data.organizationName), que é um dado interno/de conta, não o nome do
  // estabelecimento que o cliente vê.
  const displayName = data.menu.nome;

  return (
    <div className="relative min-h-full bg-[#e9e9ec] font-sans">
      <div className="mx-auto min-h-full w-full max-w-[440px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] md:max-w-2xl lg:max-w-4xl">
        {/* APPBAR — sticky (não fixed, ver comentário no topo do arquivo). h-0 pra nunca empurrar o hero abaixo; o conteúdo visual mora num filho absolute. disableSticky também esconde a appbar por completo (nunca aparece de forma torta dentro do preview escalado). */}
        {disableSticky ? null : (
        <div className="sticky top-0 z-40 h-0">
          <div
            className={`absolute inset-x-0 top-0 h-[52px] items-center gap-4 bg-[#0f0f11] px-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-200 ${
              showAppbar ? "flex translate-y-0" : "flex -translate-y-full"
            }`}
          >
            <span className="truncate font-poppins text-sm font-medium md:text-base">{displayName}</span>
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
        )}

        {/* HERO — banner real do perfil quando definido (mesma imagem editada em "Banner do cardápio (capa)" no dashboard, só a imagem, sem nome sobreposto); sem banner, mantém o fallback de sempre (fundo escuro + nome + anel decorativo, altura fixa). Borda inferior só com banner: uma imagem clara/branca se misturava com o fundo da página logo abaixo, sem nenhuma linha demarcando onde o banner termina.

        COM banner: altura fixa (h-[180px]) trocada por aspect-ratio real (1600/400, igual ao crop do dashboard) — a altura do hero passa a variar com a largura da tela pra manter a proporção exata da imagem, então object-cover nunca corta nada (a imagem recortada já tem exatamente essa proporção) e nunca sobra tarja de fundo nas bordas (o que acontecia com object-contain + altura fixa: sobrava fundo escuro visível nas laterais/topo sempre que a proporção não batia). */}
        <div
          className={`relative flex items-center justify-center overflow-hidden bg-[#050505] ${profile.bannerUrl ? "border-b border-black/15" : "h-[180px] px-6 md:h-[220px]"}`}
          style={profile.bannerUrl ? { aspectRatio: "1600 / 400" } : undefined}
        >
          {profile.bannerUrl ? (
            <Image
              src={resolveMediaUrl(profile.bannerUrl) ?? profile.bannerUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <>
              <div className="absolute -top-24 h-[280px] w-[280px] rounded-full border border-white/40 md:-top-32 md:h-[340px] md:w-[340px]" />
              <p className="relative max-w-full break-words text-center font-poppins text-2xl font-light leading-tight tracking-[0.2em] text-white md:text-[46px] md:tracking-[0.42em]">
                {displayName.toUpperCase()}
              </p>
            </>
          )}
        </div>

        {/* PROFILE */}
        <div ref={profileRef} className="flex gap-4 px-5 pb-4 md:gap-6 md:px-8">
          <div
            className={`relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] md:-mt-14 md:h-32 md:w-32 ${profile.logoUrl ? "" : "bg-black"}`}
          >
            {profile.logoUrl ? (
              <>
                {/* Vidro fosco atrás da logo — sem isso, uma logo com fundo transparente sobreposta na borda do banner se misturava direto com a foto atrás dela. */}
                <div className="absolute inset-0 rounded-full bg-white/55 backdrop-blur-md" />
                <Image
                  src={resolveMediaUrl(profile.logoUrl) ?? profile.logoUrl}
                  alt={displayName}
                  fill
                  className="relative rounded-full object-cover"
                  unoptimized
                />
              </>
            ) : (
              <>
                <div className="absolute h-14 w-14 rounded-full border border-white/40 md:h-[70px] md:w-[70px]" />
                <span className="relative font-poppins text-sm font-light tracking-[0.25em] text-white md:text-base">
                  {initials(displayName)}
                </span>
              </>
            )}
          </div>
          <div className="min-w-0 pt-3">
            <h1 className="mb-2 truncate font-poppins text-xl font-semibold tracking-tight text-[#141414] md:text-2xl">
              {displayName}
            </h1>
            {/* Início / Instagram / WhatsApp / Busca — sempre visíveis e clicáveis, nessa ordem. Instagram sem link cadastrado vai pro instagram.com genérico; WhatsApp sem número vai pro wa.me genérico (abre o app sem conversa pré-selecionada) — nunca link morto. Início linka pra Home pública (nokta.live/{orgSlug}); sem orgSlug (preview do dashboard), fica sem ação. */}
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[#141414]">
              {orgSlug ? (
                <a href={`/${orgSlug}`} title="Início" aria-label="Início">
                  <Home size={20} strokeWidth={1.8} />
                </a>
              ) : (
                <button type="button" title="Início" aria-label="Início">
                  <Home size={20} strokeWidth={1.8} />
                </button>
              )}
              <a href={profile.instagramUrl || "https://instagram.com"} target="_blank" rel="noopener noreferrer" title="Instagram">
                <Instagram size={20} strokeWidth={1.8} />
              </a>
              <a
                href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
              >
                <MessageCircle size={20} strokeWidth={1.8} />
              </a>
              <button type="button" onClick={() => setSearchOpen(true)} title="Buscar produto" aria-label="Buscar produto">
                <Search size={20} strokeWidth={1.8} />
              </button>
            </div>
            {orgSlug ? (
              <a
                href={`/avaliacao/${orgSlug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#d9a326]"
              >
                Avaliar
                <Star size={16} strokeWidth={1.8} fill="#d9a326" />
              </a>
            ) : null}
          </div>
        </div>

        {/* CATEGORIAS — carrossel de avatares circulares (foto + nome embaixo), clicar rola até o início da seção (scrollToSection), nunca esconde as demais categorias. Sem imageUrl na categoria, cai no mesmo fallback de iniciais usado em logo/avatar (nunca um terceiro estilo de fallback). */}
        <div className="px-5 pt-5 md:px-8">
          <h3 className="mb-3 font-poppins text-lg font-semibold text-[#141414] md:text-xl">Categorias</h3>
          <div className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {data.menu.highlights.length > 0 ? (
              <CategoryAvatarButton
                label="Destaques"
                imageUrl={null}
                active={activeCategoryId === "highlights"}
                onClick={() => scrollToSection("highlights")}
              />
            ) : null}
            {data.menu.categories.map((cat) => (
              <CategoryAvatarButton
                key={cat.id}
                label={cat.nome}
                imageUrl={cat.imageUrl}
                active={activeCategoryId === cat.id}
                onClick={() => scrollToSection(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* SECTIONS — todas as categorias (e Destaques) empilhadas em sequência, cada uma com título próprio funcionando como separador visual entre a categoria anterior e a próxima (pedido explícito do usuário: "acabou Cervejas, avisar que começa a próxima"). */}
        <div className="pb-24">
          {data.menu.highlights.length > 0 ? (
            <HighlightsSection
              ref={(el) => {
                if (el) sectionRefs.current.set("highlights", el);
                else sectionRefs.current.delete("highlights");
              }}
              items={data.menu.highlights}
              onToggleFavorite={onToggleFavorite}
            />
          ) : null}
          {data.menu.categories.map((cat) => (
            <MenuSection
              key={cat.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(cat.id, el);
                else sectionRefs.current.delete(cat.id);
              }}
              title={cat.nome}
              items={cat.items}
              view={view}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>

        {/* FOOTER — mesmo rodapé da Home pública (venue-home-view.tsx): faixa simples com razão social/CNPJ da Nokta + Instagram discreto, no lugar do antigo "NOKTA" estilizado em faixa preta. */}
        <div className="flex items-center justify-between gap-3 border-t border-[#ececee] px-[18px] py-3.5">
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

      {searchOpen ? (
        <SearchOverlay
          allItems={allItems}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={closeSearch}
          onToggleFavorite={onToggleFavorite}
          inputRef={searchInputRef}
        />
      ) : null}
    </div>
  );
}

/**
 * Card do carrossel de Destaques — foto grande + faixa colorida com o
 * nome da categoria de origem por cima da foto + nome/preço do produto
 * embaixo (referência visual enviada pelo usuário). Sempre em carrossel
 * horizontal, independente do modo de visualização (lista/grade/cards)
 * escolhido pro resto do cardápio — pedido explícito: "quero a lista na
 * horizontal e não vertical igual o restante".
 */
function HighlightCard({ item, onToggleFavorite }: { item: PublicMenuItem; onToggleFavorite?: () => void }) {
  const price = itemPriceLabel(item);
  return (
    <article className={`w-[168px] shrink-0 ${item.available ? "" : "opacity-60"}`}>
      <div className="relative h-[168px] overflow-hidden rounded-2xl">
        <ItemThumb item={item} />
        <FavoriteButtonSlot item={item} onToggleFavorite={onToggleFavorite} />
        {item.categoryNome ? (
          <div className="absolute inset-x-0 bottom-0 bg-[#1f7a3d] px-3 py-1.5 text-center text-sm font-semibold text-white">
            {item.categoryNome}
          </div>
        ) : null}
      </div>
      <div className="pt-2.5">
        <h4 className="truncate text-sm font-semibold text-[#141414]">{item.nome}</h4>
        <div className="mt-1.5 flex items-center justify-between gap-2">
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

function FavoriteButtonSlot({ item, onToggleFavorite }: { item: PublicMenuItem; onToggleFavorite?: () => void }) {
  if (!onToggleFavorite) return null;
  return <FavoriteButton item={item} onToggle={onToggleFavorite} />;
}

const HighlightsSection = forwardRef<
  HTMLDivElement,
  { items: PublicMenuItem[]; onToggleFavorite?: (item: PublicMenuItem) => void }
>(function HighlightsSection({ items, onToggleFavorite }, ref) {
  if (items.length === 0) return null;

  return (
    <div ref={ref} className="scroll-mt-[68px] px-5 pt-6 md:px-8">
      <h2 className="mb-3 border-b border-[#ececee] pb-3 font-poppins text-xl font-semibold text-[#141414] md:text-2xl">
        Destaques
      </h2>
      <div className="flex gap-3.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <HighlightCard key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
        ))}
      </div>
    </div>
  );
});

/**
 * Uma seção do cardápio (categoria): título próprio + lista de itens no
 * modo de visualização ativo (lista/grade/cards). O título funciona como
 * separador visual entre o fim de uma categoria e o início da próxima, já
 * que todas as seções ficam empilhadas na mesma página (pedido explícito
 * do usuário — antes só a categoria selecionada no chip aparecia,
 * escondendo as demais). Sem itens, a seção inteira nem renderiza (nunca
 * um título "Cervejas" seguido de nada). Destaques usa HighlightsSection
 * (carrossel sempre horizontal), nunca esta.
 */
const MenuSection = forwardRef<
  HTMLDivElement,
  {
    title: string;
    items: PublicMenuItem[];
    view: ViewMode;
    onToggleFavorite?: (item: PublicMenuItem) => void;
  }
>(function MenuSection({ title, items, view, onToggleFavorite }, ref) {
  if (items.length === 0) return null;

  return (
    <div ref={ref} className="scroll-mt-[68px] px-5 pt-6 md:px-8">
      <h2 className="mb-3 border-b border-[#ececee] pb-3 font-poppins text-xl font-semibold text-[#141414] md:text-2xl">
        {title}
      </h2>
      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <ItemGridCard key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
          ))}
        </div>
      ) : view === "large" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemLargeCard key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <ItemListRow key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
});

function SearchOverlay({
  allItems,
  query,
  onQueryChange,
  onClose,
  onToggleFavorite,
  inputRef,
}: {
  allItems: PublicMenuItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onToggleFavorite?: (item: PublicMenuItem) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? allItems.filter((item) => item.nome.toLowerCase().includes(normalizedQuery))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex shrink-0 items-center gap-4 border-b border-[#ececee] px-4 py-4 md:px-8">
        <button type="button" onClick={onClose} aria-label="Voltar" className="text-[#141414]">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <h1 className="font-poppins text-base font-semibold text-[#141414] md:text-lg">Pesquisar</h1>
      </div>

      <div className="shrink-0 px-4 pt-4 pb-2 md:px-8">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="O que você procura?"
          // text-base (16px) sempre, mesmo em mobile — abaixo de 16px o
          // Safari/iOS dá zoom automático na página inteira ao focar o
          // input (autoFocus dispara isso na hora que o overlay abre).
          className="w-full rounded-full border-2 border-[#d9a326] px-5 py-3 text-base text-[#141414] outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 md:px-8">
        {!normalizedQuery ? (
          <p className="py-10 text-center text-sm text-[#9a9aa0]">Digite para buscar produtos no cardápio.</p>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#9a9aa0]">Nenhum produto encontrado.</p>
        ) : (
          <div className="divide-y divide-[#ececee]">
            {results.map((item) => (
              <ItemListRow key={item.id} item={item} onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryAvatarButton({
  label,
  imageUrl,
  active,
  onClick,
}: {
  label: string;
  imageUrl: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex shrink-0 flex-col items-center gap-2">
      <div
        className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-black ring-2 md:h-20 md:w-20 ${
          active ? "ring-[#0a0a0a]" : "ring-transparent"
        }`}
      >
        {imageUrl ? (
          <Image src={resolveMediaUrl(imageUrl) ?? imageUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span className="font-poppins text-xs font-light tracking-[0.2em] text-white">{initials(label)}</span>
        )}
      </div>
      <span
        className={`max-w-[72px] truncate text-xs font-medium md:max-w-[88px] md:text-sm ${
          active ? "text-[#0a0a0a]" : "text-[#8b8b90]"
        }`}
      >
        {label}
      </span>
    </button>
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
    <article
      className={`flex gap-4 rounded-2xl border border-[#ececee] bg-white p-3.5 ${item.available ? "" : "opacity-60"}`}
    >
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
