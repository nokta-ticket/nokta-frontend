"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatBRLCents, formatEventDate } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Tone } from "@/components/ui/badge";
import {
  VENUE_FINANCIAL_PAYMENT_METHOD_LABEL,
  VENUE_PAYMENT_METHOD_LABEL,
  type VenueFinancialPaymentMethod,
  type VenuePayableStatus,
  type VenuePaymentMethod,
  type VenueReconciliationStatus,
} from "@/services/venue-finance";

/* ---------- tempo ---------- */

export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** "2026-10-14" → "14/10". */
export function formatDayMonth(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return d && m ? `${d}/${m}` : dateStr;
}

/** ISO → "14/10" no fuso da operação. */
export function formatDaySP(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
}

/** ISO → "21:33" no fuso da operação. */
export function formatTimeSP(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}

/** ISO → "14/10 · 21:33". */
export function formatDateTimeSP(iso: string): string {
  return `${formatDaySP(iso)} · ${formatTimeSP(iso)}`;
}

/** ISO → "14/10/2026". */
export function formatFullDateSP(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "2026-10-14" → "Ter, 14 de outubro". */
export function formatDayLong(dateStr: string): string {
  return formatEventDate(dateStr);
}

/** ISO → "YYYY-MM-DD" (pra `<input type="date">`), no fuso da operação. */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

/** "YYYY-MM-DD" → ISO à meia-noite de São Paulo (03:00Z). */
export function dateInputToIso(date: string): string {
  return `${date}T03:00:00.000Z`;
}

/* ---------- dinheiro ---------- */

/** "1.234,56" / "1234,56" / "1234.56" / "R$ 12" → centavos (null quando inválido). */
export function parseBRLToCents(raw: string): number | null {
  const cleaned = raw.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  let normalized: string;
  if (cleaned.includes(",")) normalized = cleaned.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, "");
  else normalized = cleaned;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Centavos → "1.234,56" (pra preencher um input). */
export function centsToInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 349 bps → "3,49%". */
export function formatBps(bps: number): string {
  return `${(bps / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** "R$ 1,2 mil" pros ticks do eixo. */
export function formatCompactBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}

export function idempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type MoneyTone = "auto" | "in" | "out" | "pending" | "neutral" | "muted";
const MONEY_CLASS: Record<Exclude<MoneyTone, "auto">, string> = {
  in: "text-money-in",
  out: "text-money-out",
  pending: "text-money-pending",
  neutral: "text-foreground",
  muted: "text-muted-foreground",
};

/**
 * Valor em dinheiro com cor semântica: negativo em `text-money-out`,
 * positivo em `text-money-in` (`tone="auto"`). Sinal tipográfico (−/+).
 */
export function Money({ cents, tone = "auto", signed = false, strong = false, className }: { cents: number; tone?: MoneyTone; signed?: boolean; strong?: boolean; className?: string }) {
  const resolved = tone === "auto" ? (cents < 0 ? "out" : cents > 0 ? "in" : "neutral") : tone;
  const abs = formatBRLCents(Math.abs(cents));
  const text = cents < 0 ? `−${abs}` : signed && cents > 0 ? `+${abs}` : abs;
  return <span className={cn("tnum", MONEY_CLASS[resolved], strong && "font-semibold", className)}>{text}</span>;
}

/** Diferença de caixa: "Bateu", "Faltou R$ x", "Sobrou R$ x" ou "Caixa aberto". */
export function CashDifference({ cents, open }: { cents: number | null; open?: boolean }) {
  if (open || cents === null) return <span className="text-muted-foreground">Caixa aberto</span>;
  if (cents === 0) return <span className="text-muted-foreground">Bateu</span>;
  return (
    <span className={cn("tnum font-semibold", cents < 0 ? "text-money-out" : "text-money-in")}>
      {cents < 0 ? "Faltou" : "Sobrou"} {formatBRLCents(Math.abs(cents))}
    </span>
  );
}

/* ---------- métodos de pagamento ---------- */

export const METHOD_ICON: Record<VenuePaymentMethod, IconName> = {
  CASH: "money",
  PIX: "pix",
  DEBIT_CARD: "credit-card",
  CREDIT_CARD: "credit-card",
  VOUCHER: "ticket-simple",
  OTHER: "coins",
};

export const FIN_METHOD_ICON: Record<VenueFinancialPaymentMethod, IconName> = {
  CASH: "money",
  PIX: "pix",
  BANK_TRANSFER: "money-transfer",
  DEBIT_CARD: "credit-card",
  CREDIT_CARD: "credit-card",
  BOLETO: "barcode",
  OTHER: "coins",
};

export const PAYMENT_METHODS: VenuePaymentMethod[] = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH", "VOUCHER", "OTHER"];
export const FIN_PAYMENT_METHODS: VenueFinancialPaymentMethod[] = ["PIX", "BANK_TRANSFER", "CASH", "DEBIT_CARD", "CREDIT_CARD", "BOLETO", "OTHER"];

/** Ícone inline + rótulo do método (venda). */
export function MethodChip({ method, className }: { method: VenuePaymentMethod; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-foreground", className)}>
      <Icon name={METHOD_ICON[method]} size={13} className="text-muted-foreground" />
      {VENUE_PAYMENT_METHOD_LABEL[method] ?? method}
    </span>
  );
}

/** Ícone inline + rótulo do método (pagamento de conta / receita). */
export function FinMethodChip({ method, className }: { method: VenueFinancialPaymentMethod; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-foreground", className)}>
      <Icon name={FIN_METHOD_ICON[method]} size={13} className="text-muted-foreground" />
      {VENUE_FINANCIAL_PAYMENT_METHOD_LABEL[method] ?? method}
    </span>
  );
}

/* ---------- status ---------- */

export const PAYABLE_STATUS_TONE: Record<VenuePayableStatus, Tone> = {
  PENDING: "warning",
  PARTIALLY_PAID: "info",
  PAID: "success",
  OVERDUE: "danger",
  CANCELED: "neutral",
};

export const RECONCILIATION_STATUS_TONE: Record<VenueReconciliationStatus, Tone> = {
  PENDING: "warning",
  MATCHED: "success",
  DIVERGENT: "danger",
};

/* ---------- linhas de resumo ---------- */

/** Par rótulo/valor numa lista vertical (totais de venda, movimento da gaveta). */
export function SummaryRow({ label, children, strong, className }: { label: ReactNode; children: ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-1.5", strong && "mt-1 border-t border-border pt-2.5", className)}>
      <span className={cn("text-sm", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("tnum text-sm", strong ? "font-semibold text-foreground" : "text-foreground")}>{children}</span>
    </div>
  );
}

/** Barra fina proporcional (uma série → uma cor). */
export function ShareBar({ ratio, className }: { ratio: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, ratio * 100));
  return (
    <span className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)} aria-hidden>
      <span className="block h-full rounded-full bg-chart-1 transition-[width] duration-500 ease-out-soft" style={{ width: `${pct}%` }} />
    </span>
  );
}

/* ---------- caixa ---------- */

/** Linha de `GET /cash-sessions` (o service tipa como `unknown[]`). */
export interface CashSessionRow {
  id: number;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  expectedCashCents: number;
  countedCashCents: number | null;
  differenceCents: number | null;
  operatorName: string | null;
  cashRegister: { id: number; nome: string };
}
