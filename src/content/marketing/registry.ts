/**
 * Índice das páginas de conteúdo do site institucional (nokta.live):
 * soluções, comparativos e guias. Fonte única pra sitemap, páginas-índice,
 * links relacionados e rodapé. Página nova → uma linha aqui.
 */
export type ContentSection = "solucoes" | "comparativos" | "guias";

export interface ContentEntry {
  section: ContentSection;
  /** Caminho completo, ex. "/solucoes/lista-vip". */
  path: string;
  /** Rótulo curto pra listas e rodapé. */
  label: string;
  /** Uma frase pros cards das páginas-índice. */
  summary: string;
  /** "YYYY-MM-DD" da última revisão do texto. */
  updated: string;
}

export const SECTION_META: Record<ContentSection, { path: string; title: string; description: string }> = {
  solucoes: { path: "/solucoes", title: "Soluções", description: "O que a Nokta resolve pra quem produz eventos e pra quem opera bar e restaurante." },
  comparativos: { path: "/comparativos", title: "Comparativos", description: "Como a Nokta se compara a outras plataformas de ingressos e sistemas para bar." },
  guias: { path: "/guias", title: "Guias", description: "Passo a passo pra vender mais ingressos, organizar festas e operar melhor a sua casa." },
};

export const CONTENT: ContentEntry[] = [
  // Preenchido pelas páginas de soluções, comparativos e guias.
  // soluções
  { section: "solucoes", path: "/solucoes/vender-ingressos-online", label: "Vender ingressos online", summary: "Lotes que viram sozinhos, Pix e cartão em 12x, QR no WhatsApp e saldo por evento.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/lista-vip", label: "Lista VIP", summary: "Um link pros stories, quantidade e horário limite, e um QR por pessoa na porta.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/check-in-de-eventos", label: "Check-in de eventos", summary: "A portaria valida o QR do ingresso com a câmera do celular, sem leitor dedicado.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/promoters", label: "Promoters", summary: "Link e código por promoter, comissão automática e as vendas de cada um no painel.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/cardapio-digital", label: "Cardápio digital", summary: "Um QR por casa, fotos, variações e item esgotado atualizado na hora.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/sistema-para-bar", label: "Sistema para bar", summary: "Comandas por mesa, pessoa ou balcão, pedido direto pro preparo e caixa que fecha batendo.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/reservas-de-mesa", label: "Reservas de mesa", summary: "Agenda do dia por status, mesas livres no horário e fila de espera em ordem.", updated: "2026-10-14" },
  { section: "solucoes", path: "/solucoes/controle-de-estoque-bar", label: "Controle de estoque", summary: "Baixa pela ficha técnica a cada venda, alerta de mínimo, compras e inventário.", updated: "2026-10-14" },
  // fim soluções
  // guias
  { section: "guias", path: "/guias/como-vender-ingressos-online", label: "Como vender ingressos online", summary: "Da escolha da plataforma à portaria, em seis passos.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/como-calcular-preco-do-ingresso", label: "Como calcular o preço do ingresso", summary: "Custos, ponto de equilíbrio, lotes e meia-entrada num exemplo com números.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/meia-entrada", label: "Meia-entrada", summary: "Quem tem direito, a cota de 40%, documentos aceitos e o desconto da pessoa idosa.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/como-divulgar-uma-festa", label: "Como divulgar uma festa", summary: "Divulgação em quatro ondas, com promoters, lista VIP e a sua base de compradores.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/como-montar-lista-vip", label: "Como montar uma lista VIP", summary: "Quantos nomes liberar, horário limite, regras e portaria sem folha impressa.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/como-criar-cardapio-digital", label: "Como criar um cardápio digital", summary: "Categorias, descrições, fotos, variações e o QR impresso do jeito certo.", updated: "2026-10-14" },
  { section: "guias", path: "/guias/como-organizar-uma-festa", label: "Como organizar uma festa", summary: "Checklist por fase, do orçamento ao fechamento do caixa.", updated: "2026-10-14" },
  // fim guias
  // comparativos
  { section: "comparativos", path: "/comparativos/nokta-vs-sympla", label: "Nokta vs Sympla", summary: "Sympla ou Nokta pra vender ingresso de festa: recursos, cobrança e o bar na mesma conta.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/alternativas-sympla", label: "Alternativas ao Sympla", summary: "Tipos de plataforma pra vender ingresso de festa e o que olhar antes de trocar.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/nokta-vs-ingresse", label: "Nokta vs Ingresse", summary: "Duas plataformas brasileiras de ingressos comparadas pelo que importa pra quem produz festa.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/nokta-vs-eventbrite", label: "Nokta vs Eventbrite", summary: "Plataforma global ou plataforma feita pra festa brasileira: o que muda na venda e na portaria.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/nokta-vs-shotgun", label: "Nokta vs Shotgun", summary: "Ingressos para música eletrônica: promoters, lista VIP, check-in e bar numa conta só.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/nokta-vs-goomer", label: "Nokta vs Goomer", summary: "Cardápio digital com QR code comparado, mais comandas, reservas e estoque na mesma conta.", updated: "2026-10-14" },
  { section: "comparativos", path: "/comparativos/nokta-vs-consumer", label: "Nokta vs Consumer", summary: "Sistema para bar e restaurante comparado, com venda de ingressos de eventos junto.", updated: "2026-10-14" },
  // fim comparativos
];

export function entriesFor(section: ContentSection): ContentEntry[] {
  return CONTENT.filter((e) => e.section === section);
}

export function entryFor(path: string): ContentEntry | undefined {
  return CONTENT.find((e) => e.path === path);
}
