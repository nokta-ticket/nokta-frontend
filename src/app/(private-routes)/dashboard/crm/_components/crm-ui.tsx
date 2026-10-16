"use client";

import { useTicketsAccess } from "@/context/TicketsAccessContext";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import type { CrmChannel, CrmChannelState, CrmFilterOptions, CrmFilters, CrmSourceType } from "@/services/crm";

export const CHANNEL_LABEL: Record<CrmChannel, string> = { EMAIL: "E-mail", WHATSAPP: "WhatsApp", PUSH: "Notificação" };

/** "por e-mail", "por WhatsApp", "por notificação". */
export const CHANNEL_BY: Record<CrmChannel, string> = { EMAIL: "e-mail", WHATSAPP: "WhatsApp", PUSH: "notificação" };

/** Abas do CRM (a página sincroniza com `?tab=`). */
export const CRM_TABS = ["contacts", "audiences", "campaigns", "templates", "channels"] as const;
export type CrmTabKey = (typeof CRM_TABS)[number];

/** Recorte "trazidos por você": contatos que vieram de planilha. */
export const IMPORTED_FILTER: CrmFilters = { sources: ["IMPORT"] };

/**
 * O que este usuário pode fazer no CRM. Só esconde o que ele não pode usar:
 * quem autoriza de verdade é o backend, em cada rota.
 */
export function useCrmPermissions() {
  const { can } = useTicketsAccess();
  return {
    /** Importar, registrar autorização e saída, bloquear, apagar, salvar públicos. */
    manage: can("tickets.crm.manage"),
    exportData: can("tickets.crm.export"),
    /** Criar modelos, criar, agendar e cancelar campanhas, enviar mensagem individual. */
    campaigns: can("tickets.crm.campaigns.manage"),
    /** Configurar remetente de e-mail e conectar o WhatsApp. */
    channels: can("tickets.crm.channels.manage"),
  };
}
export type CrmPermissions = ReturnType<typeof useCrmPermissions>;

/** Critério único de "pode receber", dito do mesmo jeito em toda a tela. */
export const ELIGIBILITY_RULE =
  "Conta quem pode receber divulgação sua naquele canal: tem o endereço, não pediu para sair e não está bloqueado. Quem comprou, pegou VIP, foi convidado ou recebeu ingresso de um evento seu recebe até pedir para sair. Contato de planilha depende do que foi declarado na importação. Notificação só chega a quem tem o app da Nokta Tickets (ou o site) com notificações ativas.";

export function ReadOnlyNote({ children }: { children: string }) {
  return <p className="surface-inset rounded-xl px-4 py-3 text-body text-muted-foreground">{children}</p>;
}

export const SOURCE_LABEL: Record<CrmSourceType, string> = {
  PURCHASE: "Comprou ingresso",
  TICKET_RECEIVED: "Recebeu ingresso",
  IMPORT: "Importado",
  SIGNUP: "Cadastro",
};

const int = new Intl.NumberFormat("pt-BR");
export const num = (n: number) => int.format(n);
export const people = (n: number) => `${num(n)} ${n === 1 ? "pessoa" : "pessoas"}`;

/** "+5511999998888" → "(11) 99999-8888". Número de fora do Brasil fica como está. */
export function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(phone);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : phone;
}

/** "há 34 dias", "há 5 meses". */
export function ago(iso: string | null): string {
  if (!iso) return "";
  // Dia de calendário em São Paulo, não blocos de 24h: uma compra de ontem à noite é "ontem".
  const dayOf = (d: Date) => Date.parse(d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
  const days = Math.round((dayOf(new Date()) - dayOf(new Date(iso))) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 60) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months < 24 ? `há ${months} meses` : `há ${Math.floor(months / 12)} anos`;
}

export type ChannelTone = "ok" | "off" | "out";

/** O que dizer sobre um canal de um contato: situação curta + explicação. */
export function channelStatus(channel: CrmChannel, state: CrmChannelState): { tone: ChannelTone; short: string; detail: string } {
  if (state.eligible) {
    return state.legalBasis === "CONSENT" ? { tone: "ok", short: "Autorizou", detail: "Autorizou receber suas mensagens por este canal." } : { tone: "ok", short: "Pode receber", detail: "Tem ingresso de evento seu: pode receber sua divulgação, sempre com a opção de sair." };
  }
  if (state.reason === "NO_ADDRESS" && channel === "PUSH") {
    return { tone: "off", short: "Sem notificações", detail: "Não tem o app da Nokta Tickets (ou o site) com notificações ativas, ou desligou as novidades dos produtores." };
  }
  if (state.reason === "NO_ADDRESS") {
    return { tone: "off", short: channel === "EMAIL" ? "Sem e-mail" : "Sem telefone", detail: channel === "EMAIL" ? "Não há e-mail cadastrado." : "Não há telefone cadastrado." };
  }
  if (state.reason === "NO_CONSENT") {
    return { tone: "off", short: "Não autorizou", detail: "Veio de planilha sem autorização declarada. Registre a autorização quando a pessoa pedir." };
  }
  if (state.suppressionReason === "MANUAL_BLOCK") return { tone: "out", short: "Bloqueado", detail: "Você bloqueou este contato. Dá para desbloquear quando quiser." };
  if (state.suppressionReason === "BOUNCE" || state.suppressionReason === "INVALID") return { tone: "out", short: "Endereço inválido", detail: "As mensagens para este endereço voltam." };
  if (state.suppressionReason === "COMPLAINT") return { tone: "out", short: "Marcou como spam", detail: "A pessoa marcou uma mensagem sua como spam." };
  return { tone: "out", short: "Pediu para sair", detail: "A pessoa pediu para não receber mais. Só ela pode voltar a autorizar." };
}

export const TONE_TEXT: Record<ChannelTone, string> = { ok: "text-success", off: "text-subtle-foreground", out: "text-danger" };
const TONE_MARK: Record<ChannelTone, string> = {
  ok: "bg-success-bg text-success ring-success-ring",
  off: "bg-surface-2 text-subtle-foreground ring-border",
  out: "bg-danger-bg text-danger ring-danger-ring",
};

export function ChannelIcon({ channel, size = 14, className }: { channel: CrmChannel; size?: number; className?: string }) {
  return <Icon name={channel === "EMAIL" ? "mail" : channel === "PUSH" ? "bell" : "whatsapp"} size={size} className={className} />;
}

/**
 * Marca de um canal na tabela: a cor é a situação, e o clique abre a janela
 * do canal (por que pode ou não receber e, se puder, enviar uma mensagem).
 * Clicar nunca envia nada.
 */
export function ChannelMark({ channel, state, onOpen }: { channel: CrmChannel; state: CrmChannelState; onOpen: () => void }) {
  const status = channelStatus(channel, state);
  const label = `${CHANNEL_LABEL[channel]}: ${status.short.toLowerCase()}`;
  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}. Abrir detalhes`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={cn("press flex size-8 items-center justify-center rounded-full ring-1 ring-inset outline-none transition-[box-shadow] duration-150 hover:ring-2 hover:ring-brand-ring focus-visible:ring-2 focus-visible:ring-brand", TONE_MARK[status.tone])}
    >
      <ChannelIcon channel={channel} />
    </button>
  );
}

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });

/** Filtros em frases curtas, para mostrar as regras de um público. */
export function describeFilters(filters: CrmFilters, options?: CrmFilterOptions): string[] {
  const eventName = (id: number) => options?.events.find((e) => e.id === id)?.name ?? `evento ${id}`;
  const ticketName = (id: number) => options?.events.flatMap((e) => e.ticketTypes).find((t) => t.id === id)?.name ?? `ingresso ${id}`;
  const out: string[] = [];
  if (filters.search) out.push(`Busca "${filters.search}"`);
  if (filters.purchasedEventIds?.length) out.push(`Comprou: ${filters.purchasedEventIds.map(eventName).join(" ou ")}`);
  if (filters.ticketTypeIds?.length) out.push(`Ingresso: ${filters.ticketTypeIds.map(ticketName).join(" ou ")}`);
  if (filters.attendedEventIds?.length) out.push(`Foi a: ${filters.attendedEventIds.map(eventName).join(" ou ")}`);
  if (filters.purchasedFrom && filters.purchasedTo) out.push(`Comprou entre ${day(filters.purchasedFrom)} e ${day(filters.purchasedTo)}`);
  else if (filters.purchasedFrom) out.push(`Comprou desde ${day(filters.purchasedFrom)}`);
  else if (filters.purchasedTo) out.push(`Comprou até ${day(filters.purchasedTo)}`);
  if (filters.minOrders) out.push(filters.minOrders === 2 ? "2 compras ou mais" : `${filters.minOrders} compras ou mais`);
  if (filters.inactiveDays) out.push(`Sem comprar há ${filters.inactiveDays} dias`);
  if (filters.sources?.length) out.push(filters.sources.map((s) => SOURCE_LABEL[s]).join(" ou "));
  if (filters.eligibleChannel) out.push(`Pode receber ${CHANNEL_BY[filters.eligibleChannel]}`);
  return out;
}

/** Compara filtros ignorando ordem de chaves e chaves vazias. */
export function sameFilters(a: CrmFilters, b: CrmFilters): boolean {
  const norm = (f: CrmFilters) =>
    JSON.stringify(
      Object.entries(f)
        .filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
        .sort(([x], [y]) => x.localeCompare(y)),
    );
  return norm(a) === norm(b);
}

export function hasFilters(filters: CrmFilters): boolean {
  return !sameFilters(filters, {});
}

/** Texto curto de apoio ("Só você vê", explicações). */
export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-caption leading-relaxed text-muted-foreground", className)}>{children}</p>;
}
