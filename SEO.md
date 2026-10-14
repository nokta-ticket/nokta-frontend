# SEO — regras do projeto

Leia junto com `DESIGN.md`. Vale pra qualquer página pública nova.

## Dois sites, um build
- **noktatickets.com.br** (`site: "tickets"`): quem compra ingresso. Home, busca, evento, revenda, **eventos por cidade** (`/eventos/em/[cidade]`).
- **nokta.live** (`site: "marketing"`): quem produz evento ou opera bar. LP (`/`), **soluções** (`/solucoes/*`), **comparativos** (`/comparativos/*`), **guias** (`/guias/*`), legais.
- O mesmo caminho responde nos dois hosts; o **canonical** sempre aponta pro site dono do conteúdo (`buildMetadata({ site })` cuida disso).

## Toda página pública
1. `export const metadata = buildMetadata({...})` (ou `generateMetadata` que retorna `buildMetadata`), de `@/lib/seo/metadata`. Título com a palavra-chave principal no começo (≤ 60 caracteres antes do " · Nokta"), descrição de 140–160 caracteres com a palavra-chave e um benefício concreto.
2. **Um único `<h1>`**, com a palavra-chave. H2/H3 em ordem, sem pular nível.
3. Dados estruturados com `<JsonLd>` de `@/components/seo/json-ld` (server-side): `Breadcrumbs` (já incluso no `ContentHero`), `FaqSection` (FAQPage), e o tipo da página (`softwareApplicationLd` em soluções, `articleLd` em guias e comparativos, `eventLd` em evento, `itemListLd` em listas).
4. Texto no HTML do servidor (server components). Nada de conteúdo importante só depois de fetch no navegador.
5. Links internos: cada página de conteúdo linka pelo menos 3 outras (`RelatedLinks` + links no texto) e é registrada em `src/content/marketing/registry.ts` (sitemap, índices e rodapé saem de lá).
6. Imagens com `alt` descritivo; nada de texto importante dentro de imagem.
7. Páginas privadas, de fluxo ou de teste: `noindex` (`NOINDEX` ou `buildMetadata({ noindex: true })`).

## Páginas de conteúdo (soluções, comparativos, guias)
- Estrutura: `ContentHero` → seções `ContentSection` com `Prose`/`FeatureGrid`/`ComparisonTable` → `FaqSection` (4–8 perguntas reais que as pessoas buscam) → `RelatedLinks` → `CtaBand`.
- Profundidade: 900–1.600 palavras úteis. Responda a intenção da busca nas primeiras 2 frases.
- Português do Brasil, direto, sem enrolação, sem "neste artigo vamos". Termos que as pessoas digitam no Google ("vender ingresso online", "sistema para bar", "cardápio digital QR code", "lista VIP", "taxa de ingresso", "meia-entrada").

## Comparativos com concorrentes (regras duras)
Comparação é permitida quando é **objetiva, verificável e não depreciativa** (Código de Defesa do Consumidor e Código Brasileiro de Autorregulamentação Publicitária / CONAR). Então:
- **Nunca invente** preço, taxa, prazo, número ou recurso de concorrente. Na tabela, use `null` ("Não informado") quando não houver informação pública que você tenha certeza absoluta. Prefira descrever o concorrente de forma geral e verdadeira (ex.: "plataforma de venda de ingressos e inscrições") e concentrar os detalhes nos recursos da Nokta, que estão no código.
- Nada de adjetivo contra o concorrente ("pior", "caro", "ruim"). Tom respeitoso; reconheça onde o concorrente é forte quando for verdade conhecida.
- Nome do concorrente só como referência (uso nominativo), sem logo, sem cor da marca dele.
- Toda página de comparativo tem a nota: "Comparativo feito com base em informações públicas disponíveis em {mês/ano}. Recursos e condições de outras plataformas podem mudar — confira no site oficial de cada uma. Marcas citadas pertencem aos seus titulares."
- Fatos da Nokta: só o que o produto faz de verdade (veja o próprio código: checkout, revenda oficial, lista VIP, promoters, CRM, check-in, módulo de bar). Taxas da Nokta: sem mensalidade; taxa de serviço mostrada ao comprador no checkout (padrão 10%, configurável por evento); Pix e cartão em até 12x com 3DS.
