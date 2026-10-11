"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrmChannel } from "@/services/crm";
import { formatMicros, type CrmAccountStatus, type CrmCampaignEstimate, type CrmCampaignStatus, type CrmRecipientStatus, type CrmTemplatePreview, type CrmTemplateStatus } from "@/services/crm-marketing";
import { fmtDate, type PillTone } from "../../financeiro/_components/finance-ui";
import { ChannelIcon, num, people } from "./crm-ui";

export const CAMPAIGN_STATUS: Record<CrmCampaignStatus, { label: string; tone: PillTone }> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  SCHEDULED: { label: "Agendada", tone: "violet" },
  VALIDATING: { label: "Preparando", tone: "violet" },
  QUEUED: { label: "Na fila", tone: "violet" },
  SENDING: { label: "Enviando", tone: "violet" },
  COMPLETED: { label: "Concluída", tone: "success" },
  PARTIALLY_FAILED: { label: "Concluída com falhas", tone: "loss" },
  FAILED: { label: "Não enviada", tone: "loss" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

export const RECIPIENT_STATUS: Record<CrmRecipientStatus, { label: string; tone: PillTone }> = {
  QUEUED: { label: "Na fila", tone: "neutral" },
  SENDING: { label: "Enviando", tone: "violet" },
  SENT: { label: "Enviado", tone: "neutral" },
  DELIVERED: { label: "Entregue", tone: "success" },
  FAILED: { label: "Falhou", tone: "loss" },
  BOUNCED: { label: "Endereço rejeitado", tone: "loss" },
  COMPLAINED: { label: "Marcou como spam", tone: "loss" },
  SKIPPED: { label: "Não enviado", tone: "neutral" },
};

export const SKIP_REASON: Record<string, string> = {
  NO_LONGER_ELIGIBLE: "Saiu da lista ou foi bloqueado antes do envio",
  NO_CREDITS: "Faltou crédito de e-mail",
};

/** O estado de um modelo depende do canal: e-mail não passa por análise. */
export function templateStatus(channel: CrmChannel, status: CrmTemplateStatus): { label: string; tone: PillTone } {
  if (channel === "EMAIL") return status === "APPROVED" ? { label: "Pronto", tone: "success" } : { label: "Incompleto", tone: "neutral" };
  const map: Record<CrmTemplateStatus, { label: string; tone: PillTone }> = {
    DRAFT: { label: "Rascunho", tone: "neutral" },
    IN_REVIEW: { label: "Em análise na Meta", tone: "violet" },
    APPROVED: { label: "Aprovado", tone: "success" },
    REJECTED: { label: "Rejeitado", tone: "loss" },
    PAUSED: { label: "Pausado pela Meta", tone: "loss" },
    DISABLED: { label: "Desativado", tone: "neutral" },
  };
  return map[status];
}

export const ACCOUNT_STATUS: Record<CrmAccountStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "Pendente", tone: "violet" },
  CONNECTED: { label: "Conectado", tone: "success" },
  ERROR: { label: "Com erro", tone: "loss" },
  DISCONNECTED: { label: "Desconectado", tone: "neutral" },
};

/** Lista do que impede uma ação, em vermelho contido. */
export function Blockers({ items, title = "Falta para enviar" }: { items: string[]; title?: string }) {
  if (!items.length) return null;
  return (
    <div className="rounded-[14px] border border-[#f0d7dc] bg-[#fcf5f6] px-4 py-3.5 text-[13.5px] text-[#7f1529]">
      <p className="flex items-center gap-2 font-semibold">
        <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 pl-6 leading-relaxed">
        {items.map((item) => (
          <li key={item} className="list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value, hint, strong = false }: { label: ReactNode; value: ReactNode; hint?: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className={cn("block text-[14px]", strong ? "font-semibold text-[#1c1a24]" : "text-[#3a3746]")}>{label}</span>
        {hint ? <span className="mt-0.5 block text-[13px] leading-relaxed text-[#6b6878]">{hint}</span> : null}
      </dt>
      <dd className={cn("shrink-0 whitespace-nowrap text-right font-poppins tabular-nums", strong ? "text-[18px] font-bold text-[#1c1a24]" : "text-[14px] font-semibold")}>{value}</dd>
    </div>
  );
}

/**
 * Quem vai receber e quanto custa, antes de confirmar. Mesma leitura na
 * campanha e na mensagem individual.
 */
export function EstimateSummary({ estimate, channel, individual = false }: { estimate: CrmCampaignEstimate; channel: CrmChannel; individual?: boolean }) {
  const { audience, cost } = estimate;
  const out = audience.total - audience.eligible;
  const audienceHint = [
    `${people(audience.total)} no público`,
    out > 0 ? `${num(out)} não ${out === 1 ? "pode" : "podem"} receber por ${channel === "EMAIL" ? "e-mail" : "WhatsApp"}` : null,
    audience.recentlyContacted > 0 ? `${num(audience.recentlyContacted)} já ${audience.recentlyContacted === 1 ? "recebeu" : "receberam"} uma mensagem sua nas últimas 24 horas` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <dl className="divide-y divide-[#f2f0f7]">
      {!individual ? (
        <Row
          strong
          label={
            <span className="flex items-center gap-2">
              <ChannelIcon channel={channel} size={16} />
              Vão receber
            </span>
          }
          value={people(audience.willReceive)}
          hint={audienceHint}
        />
      ) : null}

      {cost.chargedBy === "NOKTA" && cost.credits ? (
        <>
          <Row
            label={individual ? "Crédito de e-mail" : "Créditos de e-mail"}
            value={num(cost.credits.needed)}
            hint={
              cost.credits.needed === 0
                ? undefined
                : [cost.credits.fromFree ? `${num(cost.credits.fromFree)} da franquia do mês` : null, cost.credits.fromPaid ? `${num(cost.credits.fromPaid)} dos seus créditos` : null, cost.credits.missing ? `faltam ${num(cost.credits.missing)}` : null]
                    .filter(Boolean)
                    .join(" · ")
            }
          />
          <Row
            strong
            label="Custo estimado"
            value={cost.credits.needed === 0 ? "—" : cost.credits.fromPaid === 0 ? "Incluído no plano" : cost.totalCostMicros === null ? "A definir" : formatMicros(cost.totalCostMicros)}
            hint={
              cost.credits.fromPaid === 0
                ? cost.credits.needed > 0 ? `Sai da franquia de e-mails do seu plano: restam ${num(cost.credits.balance.freeRemaining)} de ${num(cost.credits.balance.freeMonthly)} neste mês.` : undefined
                : cost.unitCostMicros === null
                  ? "A Nokta ainda não definiu o preço do crédito de e-mail."
                  : `${num(cost.credits.fromPaid)} × ${formatMicros(cost.unitCostMicros)} por e-mail, dos créditos que você já tem.`
            }
          />
          <Row label="Saldo depois do envio" value={`${num(Math.max(0, cost.credits.balance.available - cost.credits.needed + cost.credits.missing))} e-mails`} />
        </>
      ) : (
        <Row
          strong
          label="Custo estimado"
          value={cost.totalCostMicros === null ? "Sem estimativa" : formatMicros(cost.totalCostMicros)}
          hint={
            <>
              {cost.unitCostMicros === null
                ? "A Nokta ainda não cadastrou o valor de tabela da Meta para estimar."
                : `${num(cost.recipients)} × ${formatMicros(cost.unitCostMicros)} por mensagem, pelo valor de tabela da Meta${cost.ratesCheckedAt ? ` conferido em ${fmtDate(cost.ratesCheckedAt)}` : ""}.`}{" "}
              A Meta cobra direto na sua conta do WhatsApp Business. A Nokta não cobra nem repassa esse valor.
            </>
          }
        />
      )}
    </dl>
  );
}

/** Prévia de um e-mail, isolada da página (sem script, sem acesso ao painel). */
export function EmailPreviewFrame({ html, className }: { html: string; className?: string }) {
  return <iframe title="Prévia do e-mail" sandbox="" srcDoc={html} className={cn("w-full rounded-[14px] border border-[#ebe8f2] bg-[#f4f2f8]", className)} />;
}

/** Prévia de uma mensagem de WhatsApp, como balão de conversa. */
export function WhatsappBubble({ preview }: { preview: Extract<CrmTemplatePreview, { channel: "WHATSAPP" }> }) {
  return (
    <div className="rounded-[14px] bg-[#efe9df] p-4">
      <div className="max-w-[340px] rounded-[10px] rounded-tl-none bg-white px-3.5 py-2.5 text-[14.5px] leading-relaxed text-[#111b21] shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
        {preview.headerText ? <p className="mb-1 font-semibold">{preview.headerText}</p> : null}
        <p className="whitespace-pre-wrap break-words">{preview.body || <span className="text-[#8a8796]">O texto da mensagem aparece aqui.</span>}</p>
        {preview.footer ? <p className="mt-1.5 text-[12.5px] text-[#667781]">{preview.footer}</p> : null}
      </div>
      {preview.buttons.length ? (
        <div className="mt-1 max-w-[340px] space-y-1">
          {preview.buttons.map((b, i) => (
            <div key={i} className="rounded-[10px] bg-white px-3.5 py-2 text-center text-[14px] font-medium text-[#027eb5] shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
              {b.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
