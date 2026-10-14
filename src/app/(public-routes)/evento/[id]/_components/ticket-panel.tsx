"use client";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatBRL, formatDateBR } from "@/lib/format";
import { calcTaxa, maxInstallmentLabel, type InstallmentRules, type Ticket } from "./event-pricing";

export type ClosedReason = "cancelado" | "encerrado" | "vendas" | null;

export type CouponState = {
  applied: { code: string; desconto: number } | null;
  open: boolean;
  code: string;
  loading: boolean;
  error: string;
  onOpen: () => void;
  onClose: () => void;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onRemove: () => void;
};

export type PurchaseState = {
  totalSelecionado: number;
  /** Soma dos lotes escolhidos (com cupom, sem taxa), em reais. */
  totalValor: number;
  /** Mesmo total com a taxa de serviço — base do parcelamento. */
  totalComTaxa: number;
  /** "12x R$ 15,90" */
  parcelaLabel: string;
  closedReason: ClosedReason;
  onOpenInstallments: (subtotalReais: number) => void;
  onContinue: () => void;
};

const CLOSED_LABEL: Record<Exclude<ClosedReason, null>, string> = { cancelado: "Evento cancelado", encerrado: "Evento encerrado", vendas: "Vendas encerradas" };

export function ClosedCallout({ reason }: { reason: Exclude<ClosedReason, null> }) {
  if (reason === "cancelado") return <Callout tone="danger" title="Evento cancelado">Não há mais ingressos à venda.</Callout>;
  if (reason === "encerrado") return <Callout tone="neutral" title="Evento encerrado">Esse rolê já aconteceu.</Callout>;
  return <Callout tone="warning" title="Vendas encerradas">As vendas terminam 2 horas antes do início do evento.</Callout>;
}

/** − [n] + com alvos de 44px. */
function QuantityStepper({ value, onChange, canAdd, disabled }: { value: number; onChange: (delta: number) => void; canAdd: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(-1)} disabled={disabled || value === 0} aria-label="Tirar um ingresso" className="press flex size-11 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3 disabled:opacity-30 disabled:hover:bg-surface-2">
        <Icon name="minus" size={12} />
      </button>
      <span className="w-6 text-center text-[15px] font-bold text-foreground tnum" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(1)} disabled={disabled || !canAdd} aria-label="Adicionar um ingresso" className={cn("press flex size-11 items-center justify-center rounded-full transition-colors disabled:opacity-30", value > 0 ? "bg-brand text-brand-foreground hover:bg-brand-hover" : "bg-surface-2 text-foreground hover:bg-surface-3")}>
        <Icon name="plus" size={12} />
      </button>
    </div>
  );
}

function TicketRow({ ticket, qty, onChangeQty, taxaPercent, rules, precoComDesconto, couponApplied, closed, onOpenInstallments }: { ticket: Ticket; qty: number; onChangeQty: (delta: number) => void; taxaPercent: number; rules: InstallmentRules; precoComDesconto: (valor: number) => number; couponApplied: boolean; closed: boolean; onOpenInstallments: (subtotalReais: number) => void }) {
  const valorFinal = precoComDesconto(ticket.valor);
  const taxa = calcTaxa(valorFinal, taxaPercent);
  const limitDate = formatDateBR(ticket.dataLimite);
  const isGratuito = valorFinal === 0;
  // Lote sem unidades restantes: mostra "Esgotado" em vez de só travar o "+".
  const esgotado = ticket.disponivelParaVenda && ticket.quantidade <= 0;
  const disponivel = ticket.disponivelParaVenda && !esgotado && !closed;
  const parcela = maxInstallmentLabel(valorFinal + taxa, rules);

  return (
    <li className={cn("flex items-center gap-3 px-4 py-3.5 transition-colors", qty > 0 && "bg-brand/5", !disponivel && !closed && "opacity-70")}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{ticket.nome}</p>
        <p className="mt-1 text-sm tnum">
          {isGratuito ? (
            <span className="font-semibold text-brand">Gratuito</span>
          ) : (
            <>
              {couponApplied ? <s className="mr-1.5 text-caption text-subtle-foreground">{formatBRL(ticket.valor)}</s> : null}
              <span className="font-semibold text-foreground">{formatBRL(valorFinal)}</span>
              <span className="text-caption text-muted-foreground"> + {formatBRL(taxa)} taxa</span>
            </>
          )}
        </p>
        {!isGratuito && valorFinal >= 60 ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {rules.maxSemJuros > 0 ? <span className="text-caption font-semibold text-success">até {rules.maxSemJuros}x sem juros</span> : null}
            <button type="button" onClick={() => onOpenInstallments(valorFinal + taxa)} className="inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground">
              ou {parcela}
              <Icon name="info" size={11} />
            </button>
          </div>
        ) : null}
        {limitDate ? <p className="mt-0.5 text-caption text-subtle-foreground">Vendas até {limitDate}</p> : null}
      </div>

      <div className="shrink-0">
        {esgotado ? (
          <StatusBadge tone="danger" dot={false}>
            Esgotado
          </StatusBadge>
        ) : !ticket.disponivelParaVenda ? (
          <StatusBadge tone="neutral" dot={false}>
            Em breve
          </StatusBadge>
        ) : closed ? null : (
          <QuantityStepper value={qty} onChange={onChangeQty} canAdd={qty < ticket.quantidade} />
        )}
      </div>
    </li>
  );
}

function CouponField({ coupon, autoFocus }: { coupon: CouponState; autoFocus?: boolean }) {
  if (coupon.applied) {
    return (
      <div className="flex items-center justify-between gap-3">
        <StatusBadge tone="success">
          {coupon.applied.code} · {coupon.applied.desconto}% off
        </StatusBadge>
        <Button variant="subtle" size="sm" onClick={coupon.onRemove}>
          Remover
        </Button>
      </div>
    );
  }
  if (!coupon.open) {
    return (
      <button type="button" onClick={coupon.onOpen} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-hover">
        <Icon name="tag" size={13} />
        Tem cupom de desconto?
      </button>
    );
  }
  return (
    <Field label="Cupom" htmlFor="cupom" error={coupon.error || undefined}>
      <div className="flex gap-2">
        <Input
          id="cupom"
          autoFocus={autoFocus}
          value={coupon.code}
          onChange={(e) => coupon.onCodeChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && coupon.onApply()}
          placeholder="Digite o código"
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={coupon.error ? true : undefined}
          className="uppercase placeholder:normal-case"
        />
        <Button onClick={coupon.onApply} loading={coupon.loading} disabled={!coupon.code.trim()} className="h-11 shrink-0 md:h-10">
          Aplicar
        </Button>
        <Button variant="ghost" size="icon" onClick={coupon.onClose} aria-label="Fechar cupom" className="size-11 shrink-0 md:size-10">
          <Icon name="close" size={14} />
        </Button>
      </div>
    </Field>
  );
}

/** Total + parcelas + CTA. `layout="bar"` é a barra fixa do celular; `"stack"` o rodapé do card no desktop. */
export function PurchaseSummary({ purchase, layout }: { purchase: PurchaseState; layout: "bar" | "stack" }) {
  const { totalSelecionado, totalValor, totalComTaxa, parcelaLabel, closedReason } = purchase;
  const disabled = totalSelecionado === 0 || closedReason !== null;
  const hasSelection = totalSelecionado > 0;
  const ctaLabel = closedReason ? CLOSED_LABEL[closedReason] : "Comprar";

  const totals = hasSelection ? (
    <>
      <p className="text-caption text-muted-foreground">
        {totalSelecionado} ingresso{totalSelecionado > 1 ? "s" : ""}
      </p>
      <p className="text-xl font-bold leading-none text-foreground tnum">{formatBRL(totalValor)}</p>
      <button type="button" onClick={() => purchase.onOpenInstallments(totalComTaxa)} className="mt-1 inline-flex items-center gap-1 text-caption text-muted-foreground transition-colors hover:text-foreground">
        ou {parcelaLabel}
        <Icon name="info" size={11} />
      </button>
    </>
  ) : (
    <p className="text-sm text-muted-foreground">{closedReason ? CLOSED_LABEL[closedReason] : "Escolha seus ingressos"}</p>
  );

  if (layout === "bar") {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">{totals}</div>
        <Button size="lg" shape="pill" disabled={disabled} onClick={purchase.onContinue} rightIcon={closedReason ? undefined : "arrow-right"} className="shrink-0">
          {ctaLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="min-h-[52px]">{totals}</div>
      <Button size="full" shape="pill" disabled={disabled} onClick={purchase.onContinue} rightIcon={closedReason ? undefined : "arrow-right"}>
        {ctaLabel}
      </Button>
    </div>
  );
}

/**
 * Card de ingressos: lotes em linhas (nome, preço, stepper), cupom e — só
 * no desktop — total e botão (no celular esse papel é da barra fixa).
 */
export function TicketPanel({ tickets, quantities, onChangeQty, taxaPercent, rules, precoComDesconto, coupon, purchase, className, id }: { tickets: Ticket[]; quantities: Record<number, number>; onChangeQty: (ticketId: number, delta: number, max: number) => void; taxaPercent: number; rules: InstallmentRules; precoComDesconto: (valor: number) => number; coupon: CouponState; purchase: PurchaseState; className?: string; id?: string }) {
  const closed = purchase.closedReason !== null;

  return (
    <section id={id} className={cn("scroll-mt-24", className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="mb-3 text-title font-semibold tracking-tight text-foreground lg:hidden">
        Ingressos
      </h2>
      <Card accent className="overflow-hidden">
        <div className="hidden items-center justify-between px-5 pt-5 lg:flex">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Ingressos</h2>
          <Icon name="ticket" size={16} className="text-brand" />
        </div>

        {closed ? (
          <div className="px-4 pt-4 lg:px-5">
            <ClosedCallout reason={purchase.closedReason as Exclude<ClosedReason, null>} />
          </div>
        ) : null}

        <ul className="divide-y divide-border lg:mt-3 lg:border-t lg:border-border">
          {tickets.map((tk) => (
            <TicketRow key={tk.id} ticket={tk} qty={quantities[tk.id] ?? 0} onChangeQty={(delta) => onChangeQty(tk.id, delta, tk.quantidade)} taxaPercent={taxaPercent} rules={rules} precoComDesconto={precoComDesconto} couponApplied={coupon.applied !== null} closed={closed} onOpenInstallments={purchase.onOpenInstallments} />
          ))}
        </ul>

        {!closed ? (
          <div className="border-t border-border px-4 py-3 lg:px-5">
            <CouponField coupon={coupon} autoFocus />
          </div>
        ) : null}

        <div className="hidden border-t border-border px-5 py-5 lg:block">
          <PurchaseSummary purchase={purchase} layout="stack" />
        </div>
      </Card>
    </section>
  );
}
