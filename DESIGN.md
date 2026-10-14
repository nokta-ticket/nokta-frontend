# Nokta — Design System v2 (2026-10)

Guia pra quem for construir ou reescrever qualquer tela. Fonte de verdade dos tokens: `src/app/globals.css`. Dos primitivos: `src/components/ui/`. Leia inteiro antes de escrever UI.

## 1. Identidade

- **Referência de sensação:** Gandaya (gandaya.dance) — app de festa: escuro, pôster em primeiro lugar, tipografia forte, uma cor de acento vibrante, copy leve e direta em pt-BR ("rolê", "festa", "tá acabando").
- **Cor da marca: rosa.** Escuro: `#ff3db5` (texto escuro em cima). Claro: `#e5179c` (texto branco em cima). Sempre via token `brand` — nunca hex no componente.
- **Superfície pública (noktatickets.com.br, LP, login/registro): sempre escura** (`<ForceTheme theme="dark" />` no shell). **Painel (dashboard/admin): claro OU escuro**, escuro por padrão, toggle na topbar. Toda tela do painel tem que funcionar nos dois.
- **Logo:** `<BrandLogo variant="tickets" | "nokta" />` (`src/components/brand/brand-logo.tsx`). Nunca `<Image src="/brand/...">` direto. Herda `currentColor`.
- **Fontes:** `font-sans` = Plus Jakarta Sans (tudo). `font-display` = Anton (só títulos de impacto: hero, nome do evento no destaque, chamadas grandes — sempre `uppercase`). Nunca Anton em texto corrido, labels ou botões.

## 2. Tokens (classes Tailwind)

| Grupo | Classes |
|---|---|
| Fundo/superfície | `bg-background` (página) · `bg-surface` (card) · `bg-surface-2` (input, chip, hover de linha) · `bg-surface-3` (hover mais forte) |
| Borda | `border-border` (padrão) · `border-border-strong` (ênfase, hover) |
| Texto | `text-foreground` · `text-muted-foreground` (secundário) · `text-subtle-foreground` (terciário, placeholders) |
| Marca | `bg-brand text-brand-foreground` (botão) · `text-brand` (datas, links, ativo) · `bg-brand-soft` (chip) · `ring-brand-ring` · `hover:bg-brand-hover` |
| Estado | `success` `warning` `danger` `info` `neutral`, cada um com `-bg` e `-ring`. Ex.: `bg-success-bg text-success ring-success-ring`. **Nunca `text-emerald-500`, `bg-amber-50`, `#hex`.** |
| Dinheiro | `text-money-in` (entrada) · `text-money-out` (saída) · `text-money-pending` |
| Gráficos | `--chart-1..5` (recharts: `stroke="var(--chart-1)"`) |
| Tipo | `text-hero` (clamp) · `text-display` · `text-title` · `text-stat` · `text-stat-lg` · `text-body` · `text-caption` · `text-micro` (11px — **mínimo absoluto**; `text-[10px]` é proibido) |
| Raio | `rounded-card` (16) · `rounded-input` (10) · `rounded-modal` (20) · `rounded-pill`. Escala Tailwind (`rounded-xl` etc.) continua válida. |
| Sombra | `shadow-card` (repouso) · `shadow-card-hover` · `shadow-1/2/3` (popover/modal) · `shadow-thumb` · `hairline` |
| Motion | `ease-out-soft` · `ease-in-soft` (easings). Durações em número: `duration-150/300/500`. |
| Números | `tnum` (tabular) · `td-num` (célula numérica alinhada à direita) |

## 3. Profundidade e movimento (o dono quer profundidade, não flat)

- Cards: `bg-surface border border-border rounded-card shadow-card`; interativos ganham `card-hover` (lift 2px + sombra + borda forte). Destaque: `card-accent` (glow rosa + hairline no topo) ou `card-glow` (só no hover). Não combinar os dois.
- Botões sólidos: `btn-lift` (sobe 1px com sombra rosa). Toques no celular: `press` (scale .98 no active).
- Fundo do `<main>` do painel: `page-ambient`. Blobs decorativos: `ambient-blob` (aria-hidden).
- Entradas: `fade-up` (listas, `--i` pra stagger) · `row-in` (linhas de tabela) · `slide-up` (heros/stats) · `scale-in` (popovers) · `route-enter` (template de rota). Loading: `skeleton-shimmer` (ou `<Skeleton>`).
- Loops: `pulse-ring` (ao vivo), `live-ping`, `float-slow`. Hint de primeira visita: `animate-brand-pulse` + `animate-float-y`, chave localStorage `nokta-{feature}-hint-seen`, só pra recursos fáceis de perder.
- Gestos canônicos de "brilho da marca": `.bg-nav-active` (item ativo da sidebar), `.bg-callout-{info|success|warning|danger|neutral}` (alertas em degradê horizontal — **não** borda esquerda colorida).
- Imagens de evento: `grain` (grão) e `poster-fade`/`hero-fade` (degradê de leitura).
- Respeite `prefers-reduced-motion` (já global).

## 4. Primitivos (`@/components/ui`)

| Componente | Uso |
|---|---|
| `Button` | `variant`: `primary` (rosa) · `contrast` (pílula branca, estilo Gandaya) · `secondary` · `outline` · `ghost` · `subtle` · `destructive` · `destructive-soft` · `link`. `size`: `sm` `md` `lg` `full` `icon` `icon-sm` `icon-lg`. `shape="pill"`. Props `loading`, `leftIcon`, `rightIcon`, `asChild`. **Nunca `<Link><Button/></Link>`** — use `<Button asChild><Link/></Button>`. |
| `Input`, `Textarea`, `Field`, `FieldGroup` | `Field` dá label/dica/erro. `Input` aceita `leftIcon`, `prefix`, `suffix`. Altura 44px no celular / 40 no desktop. |
| `Card*` | `Card` (+`interactive`, `glow`, `accent`), `CardHeader/Title/Description/Action/Content/Footer`. |
| `Dialog*` | Folha inferior no celular, centralizado no desktop. Estrutura: `DialogHeader` → `DialogBody` (rola) → `DialogFooter`. `size="sm|md|lg|xl"`. |
| `Sheet*` | `side="right"` (detalhe/edição desktop) ou `"bottom"` (ação no celular). `SheetSection` pra blocos internos. |
| `ConfirmDialog` | Toda confirmação. **`window.confirm` é proibido.** |
| `Tabs*` | `variant="pill"` (poucas abas) ou `"line"` (muitas; rola no celular). |
| `SegmentedControl` | Filtros mutuamente exclusivos com pílula deslizante. |
| `StatusBadge` | `tone` semântico + ponto. `Badge` (shadcn) continua pra etiquetas genéricas. |
| `StatCard` | Número grande com count-up, trend em pill, ícone inline. Sempre 3 por página de lista. |
| `PageHeader` | Título `font-medium`, `back`, `badge`, `meta`, `actions`. `description` opcional (pule se redundante). |
| `SectionHeader` | Título de seção h2 + ação à direita. Sem eyebrow. |
| `EmptyState`, `ErrorState` | Ícone da entidade, frase curta, ação. Mensagem muda conforme o motivo. `null` ≠ 0 ("Não informado", nunca "0"). |
| `Skeleton`, `RowsSkeleton` | Loading. Todo `loading.tsx` copia o layout real da página. |
| `Icon` | **Único jeito de usar ícone.** `name` tipado (FontAwesome). `lucide-react` está proibido em código novo. Ícone inline com o texto, na cor do texto — **sem caixinha colorida atrás**. |
| `BrandLogo` | Logo. |
| `AppToaster` + `toast` (`@/lib/toast`) | Toast depois de todo save. `toast.info("em construção")` em botão sem backend. |

## 5. Regras de layout

### Celular primeiro (o front TEM que ser perfeito no celular)
- Breakpoints: celular `<md` (768), tablet `md`, desktop `lg+` (1024). Desenhe o celular primeiro e expanda.
- Gutter: `px-4` no celular, `px-6` no desktop; container `max-w-7xl` (público) / largura do shell (painel).
- Toque: alvo mínimo 44px (botões `h-11`/`size-11` em ações primárias no celular). Fonte de input 16px no celular (já global).
- Safe area: `pb-safe`/`pt-safe` em barras fixas. A nav inferior pública ocupa ~90px: páginas com ela precisam de `pb-28` no fim (o footer já tem).
- **Listagens do painel: tabela no desktop, cards no celular (`<md`).** Tabela com scroll horizontal no celular foi rejeitada pelo dono. A paginação é compartilhada.
- Filtros com 4+ grupos: painel lateral (260px, sticky) no desktop, drawer no celular. Menos que isso: popover.
- Ações de linha: ícones inline (`Button size="icon-sm" variant="subtle"`), não dropdown. Destrutiva: `hover:text-danger hover:bg-danger-bg`. Desabilitada: `opacity-40` + `title` explicando.
- Dropdowns/popovers/overlays sempre via portal (Radix já faz).
- Nunca `overflow-x-hidden` em wrapper de página (quebra sticky e corta glows). Se precisar, `overflow-x-clip` no `<main>`.

### Página de lista (painel)
`PageHeader` → 3 `StatCard` → toolbar (busca `flex-1 max-w-xl` + filtro/segmented + refresh icon-only com `animate-spin` quando pendente) → tabela que rola **dentro** do card (`max-h-[calc(100dvh-17rem)]`, thead sticky `bg-surface/95 backdrop-blur-sm`) com paginação fora do scroll, escrita com substantivo ("de 128 pedidos") → cards no celular.

### Página de detalhe (painel)
`PageHeader` com `back`, `badge`, `meta` → grid `lg:grid-cols-[2fr_1fr]` → `Card`s → `Stepper` com timestamps. Preferência de detalhe: drawer → modal → página (página só quando tem muito conteúdo).

### Página pública (bilheteria)
Shell em `src/components/shell/` (header, `BottomNav`, footer) — nenhuma página desenha header/footer próprio nem cobre o shell com `fixed inset-0`. Rotas focadas (checkout) usam header mínimo; páginas com barra de ação própria (evento, ingresso) escondem a nav inferior (listas em `public-shell.tsx`).
Evento: a arte do produtor é um banner **818×355** — nunca cortar pra quadrado. Cards usam `aspect-video` com `object-cover`; o destaque usa a proporção inteira.

## 6. Copy e tom
- pt-BR, direto, caloroso, sem corporativês. Público: "Tá acabando", "Ver ingressos", "Quero produzir". Painel: objetivo e claro ("Nenhum pedido ainda", "Salvo").
- Títulos de seção combinam contexto + assunto num h2 só ("Pedidos por status"), sem eyebrow em cima.
- Erros dizem o que fazer. Botão sem backend: `toast.info("Em construção")`, nunca link `#` morto (esconda).
- Datas: `formatEventDate` ("Sáb, 17 de outubro"), `formatEventDateTime`, `formatTime`. Dinheiro: `formatBRL(reais)` / `formatBRLCents(cents)` (`@/lib/format`). Centavos nas APIs de venue/promoter/CRM/finance; reais nas de `/produtor` e `/pagamento`.

## 7. Código
- Rotas: `(public-routes)` (shell público), `(private-routes)/(consumer)` (área do comprador, shell público), `(private-routes)/dashboard` (shell do painel), `(private-routes)/(painel-admin)`.
- Componentes compartilhados em `src/components/ui` (kebab-case); por domínio em `src/components/{events,shell,brand,...}`; por página em `_components/` da rota. Hooks de dados em `_hooks/`, services em `src/services`.
- Tipos + constantes de meta tipadas (`STATUS_META` com `tone` semântico) no mesmo arquivo de tipos — fonte única.
- Server component nunca importa de arquivo `"use client"`; nunca passa função pra client component.
- `cn()` de `@/lib/cn` (tokens registrados no tailwind-merge). Token novo → registre lá.
- Nada de `any` novo; erros com mensagem acionável; sem `console.log` esquecido.
- Modo mock: `NEXT_PUBLIC_MOCK_API=1` (`.env.local`) responde rotas públicas com `src/mocks/fixtures.ts`. Adicione handlers em `src/mocks/adapter.ts` quando precisar ver uma tela sem backend. Nunca referencie mocks em código de produção fora de `src/lib/axios.ts`.
- Verificação visual: `npx next dev -p 3000` + screenshot headless (`chrome --headless=new --screenshot --window-size=390,1600 http://localhost:3000/rota`) em **390px e 1440px**, claro **e** escuro no painel. Diga honestamente o que não foi checado.
- Antes de entregar: `npx next build` sem erro de TS (o `ignoreBuildErrors` será removido).

## 8. Lista do que o dono rejeitou (não repetir)
Flat/hairline-only · lucide · tabela rolando de lado no celular · eyebrow colorido em cima do título · ícone em caixinha colorida · cor crua do Tailwind · `text-[10px]` · `window.confirm` · `<Link><Button/></Link>` · contagem redundante em toggles · descrição que repete o título · toolbar numa linha só pra ela · dropdown de ações de linha · "em breve" órfão no menu · hint em recurso óbvio · header do celular translúcido no painel (tem que ser sólido) · glow cortado por wrapper.
