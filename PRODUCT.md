# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois grupos com necessidades bem diferentes, atendidos pelo mesmo produto:

- **Produtores de eventos** — organizam e vendem ingressos para eventos
  (shows, festas, festivais). Usam o dashboard para criar eventos, gerenciar
  ingressos, promoters, financeiro e check-in.
- **Donos e gerentes de bar/restaurante (Venue)** — operam o dia a dia do
  estabelecimento: cardápio, mesas/comandas, estoque, financeiro, reservas.
  Tarefa administrativa feita majoritariamente no desktop, sem pressa (fora
  do rush do salão) — não é uma ferramenta de POS de balcão sob pressão.
- **Clientes finais** (via superfícies públicas separadas): compram
  ingressos (`noktatickets.com.br`) e, com esta feature, consultam o
  cardápio de um bar/restaurante sem precisar de conta (`cardapio.nokta.live`).

## Product Purpose

Nokta é uma plataforma que dá a produtores de eventos e a operadores de
bar/restaurante as ferramentas para vender e operar, tudo dentro de uma
única organização/workspace. O módulo "Venue" cobre a operação de um
estabelecimento físico (cardápio, mesas, comandas, estoque, caixa,
reservas); o módulo "Tickets" cobre a venda de ingressos para eventos.
Sucesso = o operador consegue montar o catálogo/evento, vender, e
acompanhar o financeiro sem precisar de ferramentas externas.

## Positioning

Diferente de um cardápio digital genérico (ex.: um link estático feito à
mão), o cardápio da Nokta nasce direto da estrutura operacional real do
estabelecimento — categorias, variações (tamanho/sabor), adicionais,
disponibilidade — a mesma fonte de dados usada pela operação interna
(comandas, estoque). O link/QR público é gerado a partir do que já está
cadastrado, sempre em sincronia; nunca uma cópia manual que desatualiza.

## Operating Context

- Web app multi-tenant: um usuário pode pertencer a mais de uma
  organização; o dashboard sempre opera no contexto da organização
  selecionada (`OrganizationContext`).
- Módulos são ativados por capacidade (`OrganizationModule`) — nem toda
  organização tem Venue ativo.
- Cardápio (`VenueMenu` → categoria → item → produto → variação) já é
  gerenciado hoje via `/dashboard/cardapio`, com abas de Produtos,
  Categorias, Adicionais, Estações e Cardápios. Um cardápio pode estar em
  rascunho, publicado, ou arquivado (`VenueMenuStatus`); só um cardápio por
  organização é marcado como principal (`isMain`).
- Nova extensão desta tarefa: o cardápio principal publicado passa a ter
  uma página pública, sem login, acessível por link com o slug da
  organização e por QR code fixo (um único QR por organização, não por
  mesa) — pensado para ficar na bio das redes sociais e impresso nas mesas.
  Só visualização; nenhum fluxo de pedido pelo cliente final nesta etapa.

## Capabilities and Constraints

- Confirmado: QR code é único por organização (não por mesa).
- Confirmado: a URL pública usa apenas o slug da organização
  (`cardapio.nokta.live/{slug}`), sempre resolvendo para o cardápio
  principal (`isMain=true`) publicado — nunca o nome do cardápio na URL.
- Confirmado: subdomínio dedicado (`cardapio.nokta.live`), separado do
  dashboard (`app.nokta.live`) e do site de ingressos
  (`noktatickets.com.br`) — mesmo projeto/deploy, resolvido por hostname.
  Configuração de DNS/domínio na Vercel é responsabilidade do usuário,
  fora do código.
- Constraint técnica conhecida: o middleware do Next.js (Edge Runtime) tem
  um bug de bundling já documentado no código — constantes de host
  precisam ser duplicadas localmente no `middleware.ts`, nunca importadas,
  ou o valor em produção pode ficar desatualizado silenciosamente.
- `Organization` ainda não tem campo de slug — parte desta entrega.
- Idioma: interface e conteúdo sempre em português (pt-BR).

## Brand Commitments

- Nome do produto: Nokta.
- Paleta e tipografia já em uso no dashboard (violeta como cor primária,
  Poppins para hierarquia/números, Inter/Space Grotesk para o restante) —
  ver `DESIGN.md` depois de documentado.

## Evidence on Hand

- Estrutura de dados real do cardápio já implementada e em produção
  (backend `src/venue/menu/`, frontend `dashboard/cardapio/`) — usar como
  autoridade de produto, não inventar campos novos além do necessário para
  a página pública e o compartilhamento (link/QR).
- Nenhuma pesquisa formal de usuário disponível; hipóteses de uso vieram
  de decisões diretas do responsável pelo produto nesta conversa.

## Product Principles

1. A página pública nunca diverge do cardápio interno — mesma fonte de
   dados, nunca uma cópia ou snapshot manual.
2. Publicar cardápio é uma decisão explícita do operador (`VenueMenu.status`
   já existente) — a página pública nunca expõe rascunho.
3. Simplicidade acima de recursos: a página pública é só visualização;
   pedido pelo QR fica fora de escopo até ser pedido explicitamente.
4. Gerenciamento continua sendo tarefa desktop, sem pressa — o preview ao
   vivo existe para dar confiança visual, não para virar mais uma
   ferramenta operacional de tempo real sob pressão.
