"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Callout } from "@/components/ui/callout";
import type { Tone } from "@/components/ui/badge";
import type { CrmChannel } from "@/services/crm";
import { formatMicros, type CrmAccountStatus, type CrmCampaignEstimate, type CrmCampaignStatus, type CrmRecipientStatus, type CrmTemplatePreview, type CrmTemplateStatus } from "@/services/crm-marketing";
import { fmtDate } from "../../financeiro/_components/finance-ui";
import { ChannelIcon, num, people } from "./crm-ui";

export const CAMPAIGN_STATUS: Record<CrmCampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  SCHEDULED: { label: "Agendada", tone: "info" },
  VALIDATING: { label: "Preparando", tone: "info" },
  QUEUED: { label: "Na fila", tone: "info" },
  SENDING: { label: "Enviando", tone: "info" },
  COMPLETED: { label: "Concluída", tone: "success" },
  PARTIALLY_FAILED: { label: "Concluída com falhas", tone: "warning" },
  FAILED: { label: "Não enviada", tone: "danger" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
};

export const RECIPIENT_STATUS: Record<CrmRecipientStatus, { label: string; tone: Tone }> = {
  QUEUED: { label: "Na fila", tone: "neutral" },
  SENDING: { label: "Enviando", tone: "info" },
  SENT: { label: "Enviado", tone: "neutral" },
  DELIVERED: { label: "Entregue", tone: "success" },
  FAILED: { label: "Falhou", tone: "danger" },
  BOUNCED: { label: "Endereço rejeitado", tone: "danger" },
  COMPLAINED: { label: "Marcou como spam", tone: "danger" },
  SKIPPED: { label: "Não enviado", tone: "neutral" },
};

export const SKIP_REASON: Record<string, string> = {
  NO_LONGER_ELIGIBLE: "Saiu da lista ou foi bloqueado antes do envio",
  NO_CREDITS: "Faltou crédito de e-mail",
};

/** O estado de um modelo depende do canal: e-mail não passa por análise. */
export function templateStatus(channel: CrmChannel, status: CrmTemplateStatus): { label: string; tone: Tone } {
  if (channel === "EMAIL") return status === "APPROVED" ? { label: "Pronto", tone: "success" } : { label: "Incompleto", tone: "neutral" };
  const map: Record<CrmTemplateStatus, { label: string; tone: Tone }> = {
    DRAFT: { label: "Rascunho", tone: "neutral" },
    IN_REVIEW: { label: "Em análise na Meta", tone: "info" },
    APPROVED: { label: "Aprovado", tone: "success" },
    REJECTED: { label: "Rejeitado", tone: "danger" },
    PAUSED: { label: "Pausado pela Meta", tone: "warning" },
    DISABLED: { label: "Desativado", tone: "neutral" },
  };
  return map[status];
}

export const ACCOUNT_STATUS: Record<CrmAccountStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Pendente", tone: "warning" },
  CONNECTED: { label: "Conectado", tone: "success" },
  ERROR: { label: "Com erro", tone: "danger" },
  DISCONNECTED: { label: "Desconectado", tone: "neutral" },
};

/** Lista do que impede uma ação. */
export function Blockers({ items, title = "Falta para enviar" }: { items: string[]; title?: string }) {
  if (!items.length) return null;
  return (
    <Callout tone="danger" title={title}>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Callout>
  );
}

function Row({ label, value, hint, strong = false }: { label: ReactNode; value: ReactNode; hint?: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className={cn("block text-sm", strong ? "font-semibold text-foreground" : "text-foreground")}>{label}</span>
        {hint ? <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{hint}</span> : null}
      </dt>
      <dd className={cn("shrink-0 whitespace-nowrap text-right tnum", strong ? "text-lg font-semibold text-foreground" : "text-sm font-semibold text-foreground")}>{value}</dd>
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
  const audienceHint = [`${people(audience.total)} no público`, out > 0 ? `${num(out)} não ${out === 1 ? "pode" : "podem"} receber por ${channel === "EMAIL" ? "e-mail" : "WhatsApp"}` : null, audience.recentlyContacted > 0 ? `${num(audience.recentlyContacted)} já ${audience.recentlyContacted === 1 ? "recebeu" : "receberam"} uma mensagem sua nas últimas 24 horas` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <dl className="divide-y divide-border">
      {!individual ? (
        <Row
          strong
          label={
            <span className="flex items-center gap-2">
              <ChannelIcon channel={channel} size={14} />
              Vão receber
            </span>
          }
          value={people(audience.willReceive)}
          hint={audienceHint}
        />
      ) : null}

      {cost.chargedBy === "NOKTA" && cost.credits ? (
        <>
          <Row label={individual ? "Crédito de e-mail" : "Créditos de e-mail"} value={num(cost.credits.needed)} hint={cost.credits.needed === 0 ? undefined : [cost.credits.fromFree ? `${num(cost.credits.fromFree)} da franquia do mês` : null, cost.credits.fromPaid ? `${num(cost.credits.fromPaid)} dos seus créditos` : null, cost.credits.missing ? `faltam ${num(cost.credits.missing)}` : null].filter(Boolean).join(" · ")} />
          <Row
            strong
            label="Custo estimado"
            value={cost.credits.needed === 0 ? "—" : cost.credits.fromPaid === 0 ? "Incluído no plano" : cost.totalCostMicros === null ? "A definir" : formatMicros(cost.totalCostMicros)}
            hint={cost.credits.fromPaid === 0 ? (cost.credits.needed > 0 ? `Sai da franquia de e-mails do seu plano: restam ${num(cost.credits.balance.freeRemaining)} de ${num(cost.credits.balance.freeMonthly)} neste mês.` : undefined) : cost.unitCostMicros === null ? "A Nokta ainda não definiu o preço do crédito de e-mail." : `${num(cost.credits.fromPaid)} × ${formatMicros(cost.unitCostMicros)} por e-mail, dos créditos que você já tem.`}
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
              {cost.unitCostMicros === null ? "A Nokta ainda não cadastrou o valor de tabela da Meta para estimar." : `${num(cost.recipients)} × ${formatMicros(cost.unitCostMicros)} por mensagem, pelo valor de tabela da Meta${cost.ratesCheckedAt ? ` conferido em ${fmtDate(cost.ratesCheckedAt)}` : ""}.`} A Meta cobra direto na sua conta do WhatsApp Business. A Nokta não cobra nem repassa esse valor.
            </>
          }
        />
      )}
    </dl>
  );
}

/** Prévia de um e-mail, isolada da página (sem script, sem acesso ao painel). */
export function EmailPreviewFrame({ html, className }: { html: string; className?: string }) {
  return <iframe title="Prévia do e-mail" sandbox="" srcDoc={html} className={cn("w-full rounded-card border border-border bg-white", className)} />;
}

/** Prévia de uma mensagem de WhatsApp, como balão de conversa. */
export function WhatsappBubble({ preview }: { preview: Extract<CrmTemplatePreview, { channel: "WHATSAPP" }> }) {
  return (
    <div className="surface-inset rounded-card p-4">
      <div className="max-w-[340px] rounded-xl rounded-tl-none bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-card">
        {preview.headerText ? <p className="mb-1 font-semibold">{preview.headerText}</p> : null}
        <p className="whitespace-pre-wrap break-words">{preview.body || <span className="text-subtle-foreground">O texto da mensagem aparece aqui.</span>}</p>
        {preview.footer ? <p className="mt-1.5 text-caption text-muted-foreground">{preview.footer}</p> : null}
      </div>
      {preview.buttons.length ? (
        <div className="mt-1 max-w-[340px] space-y-1">
          {preview.buttons.map((b, i) => (
            <div key={i} className="rounded-xl bg-surface px-3.5 py-2 text-center text-sm font-medium text-info shadow-card">
              {b.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Prévia de e-mail ou WhatsApp, conforme o canal. */
export function PreviewBox({ preview, height = "h-[420px]" }: { preview: CrmTemplatePreview; height?: string }) {
  if (preview.channel === "WHATSAPP") return <WhatsappBubble preview={preview} />;
  return (
    <div>
      <p className="mb-2 text-caption">
        <span className="text-muted-foreground">Assunto:</span> <span className="font-medium text-foreground">{preview.subject}</span>
      </p>
      <EmailPreviewFrame html={preview.html} className={height} />
    </div>
  );
}
