"use client";

import { useRef, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
import { StatusBadge, type Tone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/**
 * Helpers compartilhados do Financeiro (ingressos e bar). Os nomes
 * exportados são contrato com `_venue/` — só o visual mudou pra tokens.
 */

/** Superfície padrão do painel (card). */
export const SURFACE = "rounded-card border border-border bg-surface shadow-card";
/** Card de destaque — reservado ao número principal da tela. */
export const PANORAMA = "card-accent rounded-card border border-border bg-surface text-foreground shadow-card";
export const PRESSABLE = "press transition-[transform,background-color,color] duration-150 ease-out motion-reduce:active:scale-100";
export const LOSS_TEXT = "text-money-out";

/** Centavos em reais, com "−" tipográfico para negativos. */
export function brl(cents: number): string {
  const abs = (Math.abs(cents) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${cents < 0 ? "− " : ""}R$ ${abs}`;
}

const SP = "America/Sao_Paulo";
/** Instante (timestamp) no calendário de São Paulo. */
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: SP });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { timeZone: SP, hour: "2-digit", minute: "2-digit" });
/** Coluna @db.Date (sem hora): lida em UTC para não voltar um dia. */
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
export const fmtDayShort = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export type PillTone = "neutral" | "success" | "loss" | "violet";
const PILL_TONE: Record<PillTone, Tone> = { neutral: "neutral", success: "success", loss: "danger", violet: "brand" };
/** Etiqueta de status (compat): delega pro StatusBadge com tom semântico. */
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <StatusBadge tone={PILL_TONE[tone]}>{children}</StatusBadge>;
}

/**
 * Detalhe que abre ao passar o mouse (desktop) ou ao tocar (celular).
 * Portal do Radix: nunca é cortado por tabela/overflow.
 */
export function HoverDetail({ trigger, children, label, className, align = "center" }: { trigger: ReactNode; children: ReactNode; label: string; className?: string; align?: "start" | "center" | "end" }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        onClick={(e) => e.stopPropagation()}
        className={cn("rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand", className)}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} onOpenAutoFocus={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()} className="scale-in w-[320px] rounded-card border-border bg-surface p-4 text-sm text-foreground shadow-2">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** Ícone ⓘ com explicação curta. */
export function InfoTip({ text, label, dark = false }: { text: string; label: string; dark?: boolean }) {
  return (
    <HoverDetail label={label} trigger={<Icon name="info" size={13} className={dark ? "text-foreground/60" : "text-subtle-foreground"} />} className="flex h-5 w-5 items-center justify-center">
      <p className="leading-relaxed text-muted-foreground">{text}</p>
    </HoverDetail>
  );
}

/** Linha do detalhe de taxas: rótulo, explicação e valor. */
export function FeeLine({ title, hint, value, muted = false }: { title: string; hint: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="block text-caption text-muted-foreground">{hint}</span>
      </span>
      <span className={cn("shrink-0 whitespace-nowrap font-semibold tnum", muted ? "text-muted-foreground" : "text-foreground")}>{value}</span>
    </div>
  );
}

/** Valor sublinhado em pontilhado: sinaliza que dá para abrir o detalhe. */
export const DOTTED = "underline decoration-border-strong decoration-dotted underline-offset-4 hover:decoration-brand";
