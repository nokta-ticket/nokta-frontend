import type { Cell } from "@/components/marketing/content";
import type { IconName } from "@/components/ui/icon";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Peças compartilhadas pelas páginas de comparativo. Regras duras em SEO.md
 * ("Comparativos com concorrentes"): célula de concorrente é `null` a menos
 * que o fato seja público e notório. Os textos da Nokta saem do produto.
 */

export const PUBLICADO = "2026-10-14";

/** Nota obrigatória (SEO.md). Texto fixo: não reescreva. */
export const NOTA_COMPARATIVO =
  "Comparativo feito com base em informações públicas disponíveis em outubro de 2026. Recursos e condições de outras plataformas podem mudar — confira no site oficial de cada uma. Marcas citadas pertencem aos seus titulares.";

export function comparativoMetadata({ path, title, description }: { path: string; title: string; description: string }) {
  return buildMetadata({ site: "marketing", path, title, description, type: "article", publishedTime: PUBLICADO });
}

export function crumbsFor(label: string, path: string) {
  return [
    { name: "Comparativos", path: "/comparativos" },
    { name: label, path },
  ];
}

type Row = { label: string; cells: Cell[] };

/** Linhas de recursos de venda de ingressos. Concorrente = `null` salvo override. */
const INGRESSOS = {
  vendaOnline: ["Venda de ingressos online", "Sim, com lotes e virada de lote"],
  mensalidade: ["Mensalidade", "Sem mensalidade"],
  taxa: ["Taxa de serviço", "Mostrada ao comprador no checkout (padrão 10%, configurável por evento)"],
  pagamento: ["Formas de pagamento", "Pix e cartão em até 12x, com 3DS"],
  saldo: ["Saldo e saque", "Separado por evento: liberado, em custódia e em saque"],
  qr: ["Entrega do ingresso", "QR code pelo WhatsApp"],
  checkin: ["Check-in na portaria", "Pelo celular, pensado pra internet instável"],
  revenda: ["Revenda de ingressos", "Revenda oficial dentro da plataforma"],
  listaVip: ["Lista VIP", "Sim, com link de inscrição"],
  promoters: ["Promoters", "Link e código próprios, com comissão"],
  crm: ["CRM e campanhas", "Base de público com campanhas por e-mail e WhatsApp"],
  cupons: ["Cupons de desconto", "Sim"],
  bar: ["Bar e restaurante na mesma conta", "Cardápio digital, comandas, reservas, estoque e financeiro"],
} as const satisfies Record<string, readonly [string, string]>;

export type IngressosKey = keyof typeof INGRESSOS;

export function linhasIngressos(outro: Partial<Record<IngressosKey, Cell>> = {}, only?: IngressosKey[]): Row[] {
  const keys = only ?? (Object.keys(INGRESSOS) as IngressosKey[]);
  return keys.map((k) => ({ label: INGRESSOS[k][0], cells: [INGRESSOS[k][1], outro[k] ?? null] }));
}

/** Linhas de recursos de operação de bar e restaurante. */
const BAR = {
  cardapio: ["Cardápio digital com QR code", "Sim, um QR pras mesas e pra bio, com esgotados atualizados na hora"],
  comandas: ["Comandas", "No painel e na maquininha do garçom"],
  preparo: ["Pedidos pro preparo", "Pedido vai direto pra cozinha ou pro bar"],
  reservas: ["Reservas e fila de espera", "Sim, com status do dia e fila em ordem"],
  estoque: ["Estoque", "Com alerta de item abaixo do mínimo"],
  financeiro: ["Financeiro e caixa", "Abertura, fechamento e diferença entre esperado e contado"],
  mensalidade: ["Mensalidade", "Sem mensalidade"],
  ingressos: ["Venda de ingressos na mesma conta", "Sim, com lotes, lista VIP e promoters"],
  crm: ["CRM e campanhas", "Campanhas por e-mail e WhatsApp"],
  equipe: ["Acesso da equipe", "Cada pessoa vê só o que o papel dela permite"],
} as const satisfies Record<string, readonly [string, string]>;

export type BarKey = keyof typeof BAR;

export function linhasBar(outro: Partial<Record<BarKey, Cell>> = {}, only?: BarKey[]): Row[] {
  const keys = only ?? (Object.keys(BAR) as BarKey[]);
  return keys.map((k) => ({ label: BAR[k][0], cells: [BAR[k][1], outro[k] ?? null] }));
}

type Feature = { icon: IconName; title: string; text: string };

/** Recursos de venda de ingressos e portaria da Nokta. */
export const RECURSOS_EVENTO: Feature[] = [
  { icon: "percent", title: "Taxa às claras", text: "A taxa de serviço aparece pro comprador no checkout. O padrão é 10% e você ajusta por evento." },
  { icon: "credit-card", title: "Pix e cartão em 12x", text: "O comprador paga com Pix ou cartão em até 12 parcelas, com autenticação 3DS no cartão." },
  { icon: "wallet", title: "Saldo por evento", text: "Cada evento tem o próprio saldo: o que está liberado, o que está em custódia e o que já foi pra saque." },
  { icon: "whatsapp", title: "QR pelo WhatsApp", text: "O ingresso chega no WhatsApp do comprador. Ninguém precisa baixar app nem procurar e-mail na fila." },
  { icon: "qr", title: "Check-in no celular", text: "A portaria lê o QR com o celular. O fluxo foi pensado pra noite em que a internet do local oscila." },
  { icon: "transfer", title: "Revenda oficial", text: "Quem não pode ir anuncia o ingresso dentro da Nokta. Enquanto ele está anunciado, o QR fica suspenso, o que evita uso duplicado." },
];

/** Recursos de divulgação e relacionamento da Nokta. */
export const RECURSOS_DIVULGACAO: Feature[] = [
  { icon: "megaphone", title: "Promoters com comissão", text: "Cada promoter ganha link e código próprios. A comissão é calculada sobre o que ele vendeu." },
  { icon: "crown", title: "Lista VIP com link", text: "Você manda um link, a pessoa se inscreve e o nome já cai na lista da portaria." },
  { icon: "users", title: "CRM do seu público", text: "Quem comprou fica na sua base. Você manda campanha por e-mail ou WhatsApp pro próximo evento." },
  { icon: "tag", title: "Cupons", text: "Cupom de desconto por evento pra parceiros, influenciadores ou quem já é cliente." },
];

/** Módulo de bar e restaurante da Nokta. */
export const RECURSOS_BAR: Feature[] = [
  { icon: "qr", title: "Cardápio digital com QR", text: "Um QR só pras mesas e pra bio. O que acabou some do cardápio na hora." },
  { icon: "receipt", title: "Comandas e pedidos", text: "Comanda aberta no painel ou na maquininha do garçom, com o pedido indo direto pro preparo." },
  { icon: "chair", title: "Reservas e fila", text: "As reservas do dia separadas em confirmadas, a chegar e não vieram. A fila de espera fica em ordem." },
  { icon: "box", title: "Estoque", text: "Alerta do que está abaixo do mínimo antes de faltar no meio da noite." },
  { icon: "sack-dollar", title: "Financeiro e caixa", text: "Abertura e fechamento de caixa, com a diferença entre o esperado e o contado." },
  { icon: "user-shield", title: "Equipe com permissões", text: "Garçom, caixa e gerente veem só o que o papel de cada um permite." },
];
