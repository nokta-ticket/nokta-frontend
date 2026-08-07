"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Heart, LayoutGrid, List, Square, Star, X } from "lucide-react";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { formatCentsBRL, type PublicMenuCategory, type PublicMenuItem, type PublicMenuResponse } from "@/services/venue-menu-public";
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

/**
 * Extrai uma magnitude numérica comparável do nome livre de uma variação
 * (ex.: "200 ml" → 200, "1 L" → 1000, "1,5kg" → 1500) para ordenar por
 * tamanho real em vez de confiar cegamente no displayOrder cadastrado no
 * dashboard (o produtor pode cadastrar fora de ordem). Unidades de volume/
 * massa maiores (L, kg) convertem pra base ml/g pra comparar com as
 * menores (ml, g) na mesma escala; unidades sem conversão conhecida (un,
 * fatia, "P"/"M"/"G"...) usam o número puro. Retorna null quando não há
 * nenhum número no nome (nunca lança) — nesse caso o chamador cai no
 * displayOrder original, que já vem ordenado 'asc' do backend.
 */
function parseVariantSize(nome: string): number | null {
  const match = nome.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(ml|l|kg|g|un|oz)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "l") return value * 1000;
  if (unit === "kg") return value * 1000;
  return value;
}

/**
 * Variações ordenadas da menor pra maior unidade real (200ml antes de
 * 600ml antes de 1L...). Quando pelo menos uma variação tem tamanho
 * parseável, ordena por ele (as sem tamanho parseável vão pro fim, na
 * ordem original entre si); sem nenhum tamanho parseável no item inteiro,
 * mantém a ordem original (displayOrder do backend) — nunca embaralha uma
 * lista tipo "Pequeno/Médio/Grande" tentando adivinhar tamanho.
 */
function sortVariantsBySize(prices: PublicMenuItem["prices"]): PublicMenuItem["prices"] {
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

/**
 * Variação principal (menor tamanho real) + preço, sempre visível no
 * card — nunca "a partir de", pra permitir comparar preço entre produtos
 * sem abrir nada (pedido explícito do usuário). Produto sem variação
 * (prices.length <= 1) não tem nome de variação pra mostrar, só o preço.
 */
function itemMainPriceLabel(item: PublicMenuItem): string | null {
  if (item.prices.length === 0) return null;
  const price = formatCentsBRL(item.prices[0].effectivePriceCents);
  if (item.prices.length === 1) return price;
  const sorted = sortVariantsBySize(item.prices);
  return `${sorted[0].variantNome} · ${formatCentsBRL(sorted[0].effectivePriceCents)}`;
}

/** "5 tamanhos", "3 opções" — rótulo do acionador do bottom sheet de variações; null quando não há múltiplas variações (nada a mostrar). */
function variantCountLabel(item: PublicMenuItem): string | null {
  if (item.prices.length <= 1) return null;
  const count = item.prices.length;
  const word = item.prices.every((p) => parseVariantSize(p.variantNome) !== null) ? "tamanho" : "opção";
  return `${count} ${word}${count > 1 ? (word === "tamanho" ? "s" : "ões") : ""}`;
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
  // esconde as demais. "Destaques" não tem mais chip próprio no carrossel
  // (já aparecia repetido logo abaixo do carrossel, pedido explícito do
  // usuário pra remover a duplicação) — a seção continua existindo, só sem
  // atalho de clique dedicado; o estado inicial cai direto na 1ª categoria.
  const [activeCategoryId, setActiveCategoryId] = useState<number | "highlights">(
    data.menu.categories[0]?.id ?? "highlights",
  );
  const [view, setView] = useState<ViewMode>("list");
  const [showAppbar, setShowAppbar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Item com o bottom sheet "Escolha o tamanho" aberto — só um por vez,
  // controlado aqui (não dentro de cada card) pra nunca haver dois sheets
  // montados simultaneamente e pra qualquer card (lista/grade/cards/
  // destaques) poder abrir o mesmo overlay compartilhado.
  const [variantSheetItem, setVariantSheetItem] = useState<PublicMenuItem | null>(null);
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

        COM banner: mesmo padrão exato da Home pública (venue-home-view.tsx) — aspect-ratio real (430/190, igual ao crop do dashboard) em vez de altura fixa. Imagem em object-fill (nunca corta lateral nem sobra faixa vazia — estica pra preencher 100% x 100% do container; decisão explícita do usuário de que distorção é responsabilidade do produtor que envia a imagem, nunca cortar conteúdo). */}
        <div
          className={`relative flex items-center justify-center overflow-hidden bg-[#050505] ${profile.bannerUrl ? "border-b border-black/15" : "h-[180px] px-6 md:h-[220px]"}`}
          style={profile.bannerUrl ? { aspectRatio: "430 / 190" } : undefined}
        >
          {profile.bannerUrl ? (
            <Image
              src={resolveMediaUrl(profile.bannerUrl) ?? profile.bannerUrl}
              alt=""
              fill
              className="object-fill"
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

        {/* PROFILE — mesmo padrão exato da Home pública: logo h-28/w-28 (112px), -mt-6 (24px sobrepostos ao banner, resto na área branca), nome+ícones ao lado numa única linha. Início/Busca/Avaliar são exclusivos do cardápio (a Home pública não tem), inseridos no mesmo eixo sem alterar o alinhamento logo↔texto. */}
        <div ref={profileRef} className="flex gap-3.5 px-5 pb-4 md:gap-5 md:px-8">
          <div
            className={`relative -mt-6 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,.14)] md:h-32 md:w-32 ${profile.logoUrl ? "" : "bg-black"}`}
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
                <div className="absolute h-16 w-16 rounded-full border border-white/40 md:h-[70px] md:w-[70px]" />
                <span className="relative font-poppins text-sm font-light tracking-[0.25em] text-white md:text-base">
                  {initials(displayName)}
                </span>
              </>
            )}
          </div>
          <div className="min-w-0 pt-1.5">
            <h1 className="mb-2 truncate font-poppins text-xl font-semibold tracking-tight text-[#141414] md:text-2xl">
              {displayName}
            </h1>
            {/* Início / Instagram / WhatsApp / Busca — sempre visíveis e clicáveis, nessa ordem. Instagram sem link cadastrado vai pro instagram.com genérico; WhatsApp sem número vai pro wa.me genérico (abre o app sem conversa pré-selecionada) — nunca link morto. Início linka pra Home pública (nokta.live/{orgSlug}); sem orgSlug (preview do dashboard), fica sem ação. Todos os 4 ícones (HomeIcon/InstagramIcon/WhatsappIcon/SearchIcon) são SVGs próprios do projeto em size 22 — nunca lucide aqui: um ícone lucide outline, mesmo maior, não fica com o mesmo peso visual de um SVG sólido (relatado pelo usuário: Início/Busca pareciam "mais grossos"/diferentes de Instagram/WhatsApp mesmo no mesmo tamanho). SearchIcon é o mesmo SVG do input de busca de eventos (search-overlay.tsx); HomeIcon vem de public/icons8-casa.svg. */}
            <div className="mb-2 flex flex-wrap items-center gap-4 text-[#141414]">
              {orgSlug ? (
                <a href={`/${orgSlug}`} title="Início" aria-label="Início">
                  <HomeIcon size={22} />
                </a>
              ) : (
                <button type="button" title="Início" aria-label="Início">
                  <HomeIcon size={22} />
                </button>
              )}
              <a href={profile.instagramUrl || "https://instagram.com"} target="_blank" rel="noopener noreferrer" title="Instagram">
                <InstagramIcon size={22} />
              </a>
              <a
                href={profile.whatsappNumber ? `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}` : "https://wa.me"}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
              >
                <WhatsappIcon size={22} />
              </a>
              <button type="button" onClick={() => setSearchOpen(true)} title="Buscar produto" aria-label="Buscar produto">
                <SearchIcon size={22} />
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

        {/* CATEGORIAS — carrossel de avatares circulares (foto + nome embaixo), clicar rola até o início da seção (scrollToSection), nunca esconde as demais categorias. Sem imageUrl na categoria, cai no mesmo fallback de iniciais usado em logo/avatar (nunca um terceiro estilo de fallback). "Ver todas" abre uma lista completa (modal) como atalho.

        Avatar de 76px + gap de 30px entre eles — nessa proporção, ~4
        avatares completos cabem na tela de um celular real (a referência
        visual enviada pelo usuário), sem cortar o próximo item; o resto só
        aparece arrastando. Nunca uma "caixa" com largura calculada à parte
        (isso foi tentado e ficou errado — criava um container mais estreito
        que o card e deslocado, cortando os dois lados de forma incorreta) —
        o corte em ~4 é só uma CONSEQUÊNCIA do tamanho do avatar+gap cabendo
        (ou não) na largura real do card, nunca um limite artificial.

        O scroller NUNCA usa margem negativa (-mx-5) pra simular full-bleed —
        isso foi tentado e quebrou em telas reais: quando o card ocupa a
        viewport inteira (mobile, sem sobra de max-w), a margem negativa
        empurra o elemento pra fora da viewport física, e o padding interno
        (px-5) que deveria abrir respiro na primeira/última posição do
        scroll fica "escondido" atrás desse offset — o primeiro avatar
        nasce cortado na borda, e sobra um vão vazio depois do último
        (relatado pelo usuário com print). O scroller agora ocupa a largura
        real do card (sem -mx-5/w-full), e o padding lateral (px-5/md:px-8)
        mora nele mesmo — cada ponta do scroll físico já é o respiro
        correto, sem depender de a margem negativa "vazar" pra fora de nada.

        pt-1.5 no flex interno: `overflow-x-auto` corta o eixo Y na altura
        exata do conteúdo (regra do CSS spec — eixo com overflow não-visible
        força o outro eixo a não ficar visible também); sem esse respiro no
        topo, a sombra do avatar (`shadow-[...]` em CategoryAvatarButton)
        ficava cortada (relatado com print). Nome de categoria usa
        `line-clamp-2` (não `truncate`) — pedido explícito do usuário pra
        quebrar em 2 linhas em vez de reticências; o botão inteiro é
        flex-col dentro de um pai `items-stretch` (padrão do flex, sem
        override), então todos os itens da mesma altura ficam alinhados
        pelo topo do círculo automaticamente. */}
        <div className="border-b border-black/[0.03] pb-6 pt-5">
          {/* leading-none corta a caixa de linha rente ao cap-height, sem
          espaço pro descendente do "g" de "Categorias" — mesmo com mb-5
          logo depois, o "g" parecia colado no carrossel abaixo (relatado
          com print). Trocado por leading-normal (caixa de linha real da
          fonte, com espaço pra descendentes); items-center no flex mantém
          título e "Ver todas" alinhados na mesma linha visual. */}
          <div className="mb-5 flex items-center justify-between px-5 md:px-8">
            <h3 className="font-poppins text-[18px] font-semibold leading-normal text-[#141414] md:text-xl">Categorias</h3>
            {data.menu.categories.length > 0 ? (
              <button
                type="button"
                onClick={() => setAllCategoriesOpen(true)}
                className="text-sm font-normal leading-normal text-[#a3a3a8]"
              >
                Ver todas →
              </button>
            ) : null}
          </div>
          <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-x-[30px] px-5 pb-1 pt-1.5 md:px-8">
              {/* Chip "Destaques" removido do carrossel — a seção Destaques já aparece logo abaixo dele, o chip era uma duplicação do mesmo conceito (pedido explícito do usuário). A seção continua existindo normalmente. */}
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
              onOpenVariants={setVariantSheetItem}
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
              onOpenVariants={setVariantSheetItem}
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

      {allCategoriesOpen ? (
        <AllCategoriesOverlay
          categories={data.menu.categories}
          activeCategoryId={activeCategoryId}
          onSelect={(id) => {
            setAllCategoriesOpen(false);
            scrollToSection(id);
          }}
          onClose={() => setAllCategoriesOpen(false)}
        />
      ) : null}

      {searchOpen ? (
        <SearchOverlay
          allItems={allItems}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={closeSearch}
          onToggleFavorite={onToggleFavorite}
          onOpenVariants={setVariantSheetItem}
          inputRef={searchInputRef}
        />
      ) : null}

      {variantSheetItem ? (
        <VariantSheet item={variantSheetItem} onClose={() => setVariantSheetItem(null)} />
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
function HighlightCard({
  item,
  onToggleFavorite,
  onOpenVariants,
}: {
  item: PublicMenuItem;
  onToggleFavorite?: () => void;
  onOpenVariants: () => void;
}) {
  const price = itemMainPriceLabel(item);
  const variantCount = variantCountLabel(item);
  return (
    <article className={`w-[200px] shrink-0 ${item.available ? "" : "opacity-60"}`}>
      <div className="relative h-[200px] overflow-hidden rounded-2xl">
        <ItemThumb item={item} />
        <FavoriteButtonSlot item={item} onToggleFavorite={onToggleFavorite} compact />
        {item.categoryNome ? (
          <div className="absolute inset-x-0 bottom-0 bg-[#0a0a0a] px-3 py-1.5 text-center text-sm font-semibold text-white">
            {item.categoryNome}
          </div>
        ) : null}
      </div>
      <div className="pt-2.5">
        <h4 className="truncate text-sm font-semibold text-[#141414]">{item.nome}</h4>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {price ? <span className="truncate text-sm font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-xs text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={11} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
        {/* min-h reserva a altura da 2ª linha sempre (com ou sem variantes) — nenhum card do carrossel fica mais alto/baixo que o vizinho por ter ou não múltiplos tamanhos. */}
        <div className="mt-0.5 min-h-[16px]">
          {variantCount ? (
            <button type="button" onClick={onOpenVariants} className="text-xs font-medium text-[#d9a326]">
              {variantCount} ›
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function FavoriteButtonSlot({
  item,
  onToggleFavorite,
  compact = false,
}: {
  item: PublicMenuItem;
  onToggleFavorite?: () => void;
  compact?: boolean;
}) {
  if (!onToggleFavorite) return null;
  return <FavoriteButton item={item} onToggle={onToggleFavorite} compact={compact} />;
}

const HighlightsSection = forwardRef<
  HTMLDivElement,
  {
    items: PublicMenuItem[];
    onToggleFavorite?: (item: PublicMenuItem) => void;
    onOpenVariants: (item: PublicMenuItem) => void;
  }
>(function HighlightsSection({ items, onToggleFavorite, onOpenVariants }, ref) {
  if (items.length === 0) return null;

  return (
    <div ref={ref} className="scroll-mt-[68px] pt-6">
      <h2 className="mb-3 border-b border-[#ececee] px-5 pb-3 font-poppins text-xl font-semibold text-[#141414] md:px-8 md:text-2xl">
        Destaques
      </h2>
      {/* Padding lateral mora DENTRO do scroller (px-5/md:px-8 aqui, não no
      container pai) — só o padding do pai cobre o início do conteúdo
      rolável; o fim do scroll expõe o scrollWidth real do flex, que sem
      padding próprio no fim deixa um vão vazio depois do último card
      (mesma causa-raiz do bug corrigido no carrossel de Categorias, só que
      por FALTA de padding em vez de margem negativa vazando). */}
      <div className="flex gap-3.5 overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <HighlightCard
            key={item.id}
            item={item}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
            onOpenVariants={() => onOpenVariants(item)}
          />
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
    onOpenVariants: (item: PublicMenuItem) => void;
  }
>(function MenuSection({ title, items, view, onToggleFavorite, onOpenVariants }, ref) {
  if (items.length === 0) return null;

  return (
    <div ref={ref} className="scroll-mt-[68px] px-5 pt-6 md:px-8">
      <h2 className="mb-3 border-b border-[#ececee] pb-3 font-poppins text-xl font-semibold text-[#141414] md:text-2xl">
        {title}
      </h2>
      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {items.map((item) => (
            <ItemGridCard
              key={item.id}
              item={item}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
              onOpenVariants={() => onOpenVariants(item)}
            />
          ))}
        </div>
      ) : view === "large" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemLargeCard
              key={item.id}
              item={item}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
              onOpenVariants={() => onOpenVariants(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <ItemListRow
              key={item.id}
              item={item}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
              onOpenVariants={() => onOpenVariants(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * Modal "Ver todas" — atalho pra lista completa de categorias, sem
 * substituir o carrossel arrastável (que continua com scroll horizontal
 * normal). Reaproveita o mesmo avatar/fallback de CategoryAvatarButton,
 * só em grade em vez de carrossel.
 */
function AllCategoriesOverlay({
  categories,
  activeCategoryId,
  onSelect,
  onClose,
}: {
  categories: PublicMenuCategory[];
  activeCategoryId: number | "highlights";
  onSelect: (id: number | "highlights") => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-white p-5 md:max-w-lg md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-poppins text-lg font-semibold text-[#141414]">Todas as categorias</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-[#8b8b90]">
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {/* Chip "Destaques" removido daqui também (mesmo pedido do carrossel principal) — este modal espelha o mesmo conjunto de chips. */}
          {categories.map((cat) => (
            <CategoryAvatarButton
              key={cat.id}
              label={cat.nome}
              imageUrl={cat.imageUrl}
              active={activeCategoryId === cat.id}
              onClick={() => onSelect(cat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchOverlay({
  allItems,
  query,
  onQueryChange,
  onClose,
  onToggleFavorite,
  onOpenVariants,
  inputRef,
}: {
  allItems: PublicMenuItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onToggleFavorite?: (item: PublicMenuItem) => void;
  onOpenVariants: (item: PublicMenuItem) => void;
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
              <ItemListRow
                key={item.id}
                item={item}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
                onOpenVariants={() => onOpenVariants(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bottom sheet "Escolha o tamanho" — aberto pelo acionador discreto do
 * card ("N tamanhos ›"), nunca lista as variações dentro do próprio card
 * (isso quebraria a altura uniforme entre cards, pedido explícito do
 * usuário). Sobe de baixo, cantos superiores arredondados, fundo do
 * cardápio visível e escurecido (overlay), altura dinâmica conforme a
 * quantidade de opções (nunca tela cheia por padrão — só um scroll
 * interno se a lista for realmente grande), fecha arrastando pra baixo,
 * tocando fora, ou pelo botão "X". `env(safe-area-inset-bottom)` evita a
 * barra de gestos do iPhone cobrir a última opção.
 */
function VariantSheet({ item, onClose }: { item: PublicMenuItem; onClose: () => void }) {
  const [dragY, setDragY] = useState(0);
  const [closing, setClosing] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortVariantsBySize(item.prices), [item.prices]);

  // Pequeno atraso pra rodar a transição de entrada/saída (translateY) em
  // vez de o sheet simplesmente "aparecer" já na posição final.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const onPointerUp = () => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    if (dragY > 80) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  const translateY = closing ? "100%" : !entered ? "100%" : `${dragY}px`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Overlay — fecha ao tocar fora, cardápio continua visível por trás, só escurecido. */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${closing || !entered ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />
      <div
        ref={sheetRef}
        className="relative z-10 flex max-h-[80vh] w-full max-w-[440px] flex-col rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.2)] md:max-w-lg"
        style={{
          transform: `translateY(${translateY})`,
          transition: dragStartY.current !== null ? "none" : "transform 200ms ease-out",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Handle de arrastar — toda a área do cabeçalho responde ao drag, não só a barrinha visual. */}
        <div
          className="flex shrink-0 cursor-grab flex-col items-center pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="h-1 w-9 rounded-full bg-black/15" />
        </div>

        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
          <div className="min-w-0">
            <h2 className="truncate font-poppins text-base font-semibold text-[#141414]">{item.nome}</h2>
            <p className="text-sm text-[#9a9aa0]">Escolha o tamanho</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/5 text-[#8b8b90]"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2">
          <div className="divide-y divide-[#ececee]">
            {/* Sem carrinho/pedido no cardápio público (só consulta) — cada linha é clicável e reage ao toque (active:bg), mas serve pra destacar/consultar a opção, não pra "adicionar" nada. */}
            {sorted.map((price) => (
              <button
                key={price.variantId}
                type="button"
                className="flex w-full items-center justify-between gap-4 rounded-xl py-3.5 text-left transition-colors active:bg-black/[0.03]"
              >
                <span className="text-[15px] text-[#141414]">{price.variantNome}</span>
                <span className="font-poppins text-[15px] font-semibold text-[#141414]">
                  {formatCentsBRL(price.effectivePriceCents)}
                </span>
              </button>
            ))}
          </div>
        </div>
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
    <button onClick={onClick} className="flex w-[76px] shrink-0 flex-col items-center gap-3">
      <div
        className={`relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-2 ${
          active ? "ring-[#0a0a0a]" : "ring-transparent"
        }`}
      >
        {imageUrl ? (
          <Image src={resolveMediaUrl(imageUrl) ?? imageUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span className="font-poppins text-sm font-light tracking-[0.2em] text-white">{initials(label)}</span>
        )}
      </div>
      <span
        className={`line-clamp-2 w-full text-center text-sm font-normal leading-tight ${
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

function FavoriteButton({
  item,
  onToggle,
  compact = false,
}: {
  item: PublicMenuItem;
  onToggle: () => void;
  /** Card de Destaques é menor — o botão de 36px chamava atenção demais nele (feedback explícito do usuário). */
  compact?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label="favoritar"
      className={`absolute z-[3] grid place-items-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] ${
        compact ? "right-2 top-2 h-7 w-7" : "right-2.5 top-2.5 h-9 w-9"
      }`}
    >
      <Heart
        size={compact ? 14 : 18}
        strokeWidth={2}
        className={item.favoritedByVisitor ? "fill-[#ef4444] stroke-[#ef4444]" : "stroke-[#ef4444]"}
      />
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

function ItemLargeCard({
  item,
  onToggleFavorite,
  onOpenVariants,
}: {
  item: PublicMenuItem;
  onToggleFavorite?: () => void;
  onOpenVariants: () => void;
}) {
  const price = itemMainPriceLabel(item);
  const variantCount = variantCountLabel(item);
  return (
    <article className={item.available ? "" : "opacity-60"}>
      <div className="relative h-[200px] md:h-[240px]">
        <ItemThumb item={item} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} /> : null}
      </div>
      <div className="pt-3.5">
        <h4 className="font-poppins text-base font-semibold text-[#141414] md:text-lg">{item.nome}</h4>
        <div className="mt-3 flex items-center justify-between gap-2">
          {price ? <span className="truncate font-poppins text-base font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={16} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
        {/* min-h reserva a altura da 2ª linha sempre — cards vizinhos na mesma grade nunca ficam com altura diferente por causa da presença/ausência de variantes. */}
        <div className="mt-1 min-h-[20px]">
          {variantCount ? (
            <button type="button" onClick={onOpenVariants} className="text-sm font-medium text-[#d9a326]">
              {variantCount} ›
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ItemGridCard({
  item,
  onToggleFavorite,
  onOpenVariants,
}: {
  item: PublicMenuItem;
  onToggleFavorite?: () => void;
  onOpenVariants: () => void;
}) {
  const price = itemMainPriceLabel(item);
  const variantCount = variantCountLabel(item);
  return (
    <article className={item.available ? "" : "opacity-60"}>
      <div className="relative h-[130px] md:h-[150px]">
        <ItemThumb item={item} />
        {onToggleFavorite ? <FavoriteButton item={item} onToggle={onToggleFavorite} /> : null}
      </div>
      <div className="pt-2.5">
        <h4 className="truncate text-sm font-semibold text-[#141414]">{item.nome}</h4>
        <div className="mt-2 flex items-center justify-between gap-2">
          {price ? <span className="truncate text-sm font-semibold text-[#141414]">{price}</span> : null}
          {item.favoriteCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-xs text-[#9a9aa0]">
              {item.favoriteCount} <Heart size={13} className="fill-[#ef4444] stroke-[#ef4444]" />
            </span>
          ) : null}
        </div>
        {/* min-h reserva a altura da 2ª linha sempre (mesmo raciocínio do ItemLargeCard). */}
        <div className="mt-0.5 min-h-[16px]">
          {variantCount ? (
            <button type="button" onClick={onOpenVariants} className="text-xs font-medium text-[#d9a326]">
              {variantCount} ›
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ItemListRow({
  item,
  onToggleFavorite,
  onOpenVariants,
}: {
  item: PublicMenuItem;
  onToggleFavorite?: () => void;
  onOpenVariants: () => void;
}) {
  const price = itemMainPriceLabel(item);
  const variantCount = variantCountLabel(item);
  return (
    <article
      className={`flex gap-4 rounded-2xl border border-[#ececee] bg-white p-3.5 ${item.available ? "" : "opacity-60"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="truncate font-poppins text-base font-semibold text-[#141414] md:text-lg">{item.nome}</h4>
        {item.descricao ? <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-[#9a9aa0]">{item.descricao}</p> : null}
        {!item.available ? (
          <span className="mt-1.5 w-fit rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/50">
            Esgotado
          </span>
        ) : null}
        {/* Card compacto sempre com a mesma altura (travada pela thumb h-[124px] ao lado) — variação principal (menor tamanho) + preço juntos numa linha, nunca "a partir de", pra comparar preço entre produtos sem abrir nada. O acionador de variantes fica numa 2ª linha discreta, abaixo do preço, sem crescer o card: abre o bottom sheet "Escolha o tamanho" (VariantSheet) em vez de listar tudo aqui. */}
        <div className="mt-auto flex flex-col gap-0.5 pt-3">
          <div className="flex items-center gap-3">
            {price ? <span className="truncate font-poppins text-base font-semibold text-[#141414]">{price}</span> : null}
            {item.favoriteCount > 0 ? (
              <span className="flex shrink-0 items-center gap-1.5 text-sm text-[#9a9aa0]">
                {item.favoriteCount} <Heart size={16} className="fill-[#ef4444] stroke-[#ef4444]" />
              </span>
            ) : null}
          </div>
          {variantCount ? (
            <button
              type="button"
              onClick={onOpenVariants}
              className="w-fit text-sm font-medium text-[#d9a326]"
            >
              {variantCount} ›
            </button>
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
