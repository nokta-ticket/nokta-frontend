import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export interface OrderLine {
  id: number;
  nome: string;
  lote: number;
  quantity: number;
  /** Total da linha já com cupom. */
  lineTotal: number;
  /** Total da linha sem cupom (igual a `lineTotal` quando não há desconto). */
  lineOriginal: number;
  gratis: boolean;
}

function Row({ label, value, muted = true, className }: { label: ReactNode; value: ReactNode; muted?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 text-sm", muted ? "text-muted-foreground" : "text-foreground", className)}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0 tnum">{value}</span>
    </div>
  );
}

/**
 * Resumo do pedido: itens (quantidade × lote), desconto, taxas e total.
 * No celular fica no corpo da página; no desktop é a coluna direita sticky
 * (com o botão de pagar em `footer`). As taxas aparecem só quando existem.
 */
export function OrderSummary({ lines, subtotal, valorDesconto, cupomCodigo, taxaServico, taxaProtecao, taxaProcessamento, total, isFree, installmentsHint, footer, className }: { lines: OrderLine[]; subtotal: number; valorDesconto: number; cupomCodigo: string; taxaServico: number; taxaProtecao: number | null; taxaProcessamento: number; total: number; isFree: boolean; installmentsHint?: string | null; footer?: ReactNode; className?: string }) {
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-base font-semibold text-foreground">Seu pedido</h2>
        <span className="text-caption text-muted-foreground tnum">
          {count} {count === 1 ? "ingresso" : "ingressos"}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border px-4 sm:px-5">
        {lines.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-4 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-caption font-bold text-foreground tnum">{l.quantity}×</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{l.nome}</p>
                {/lote/i.test(l.nome) ? null : <p className="text-caption text-muted-foreground">{l.lote}º lote</p>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-sm font-semibold tnum", l.gratis ? "text-success" : "text-foreground")}>{l.gratis ? "Grátis" : formatBRL(l.lineTotal)}</p>
              {l.lineOriginal !== l.lineTotal ? <p className="text-caption text-subtle-foreground tnum line-through">{formatBRL(l.lineOriginal)}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      {!isFree ? (
        <div className="space-y-2 border-t border-border px-4 py-4 sm:px-5">
          <Row label="Ingressos" value={formatBRL(subtotal + valorDesconto)} />
          {valorDesconto > 0 ? (
            <Row
              label={
                <span className="inline-flex items-center gap-1.5 text-success">
                  <Icon name="tag" size={11} />
                  Cupom {cupomCodigo}
                </span>
              }
              value={<span className="text-success">− {formatBRL(valorDesconto)}</span>}
            />
          ) : null}
          {taxaServico > 0 ? <Row label="Taxa de serviço" value={formatBRL(taxaServico)} /> : null}
          {taxaProtecao !== null && taxaProtecao > 0 ? <Row label="Proteção de compra" value={formatBRL(taxaProtecao)} /> : null}
          {taxaProcessamento > 0 ? <Row label="Taxa de processamento" value={formatBRL(taxaProcessamento)} /> : null}
        </div>
      ) : null}

      <div className="flex items-end justify-between gap-4 border-t border-border bg-surface-2/50 px-4 py-4 sm:px-5">
        <div>
          <p className="text-caption text-muted-foreground">Total a pagar</p>
          {installmentsHint && !isFree ? <p className="text-caption text-muted-foreground tnum">{installmentsHint}</p> : null}
        </div>
        <p className={cn("text-stat font-bold tnum", isFree ? "text-success" : "text-foreground")}>{isFree ? "Grátis" : formatBRL(total)}</p>
      </div>

      {footer ? <div className="border-t border-border px-4 py-4 sm:px-5">{footer}</div> : null}
    </Card>
  );
}
