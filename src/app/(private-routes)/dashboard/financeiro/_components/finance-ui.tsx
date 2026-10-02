"use client";

import { useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Superfície padrão do dashboard (mesma da Início). */
export const SURFACE = "rounded-[20px] border border-[#ebe8f2] bg-white";
/** Card escuro "Panorama" da Início — reservado ao número principal da tela. */
export const PANORAMA = "rounded-[20px] bg-gradient-to-br from-[#1d1834] via-[#191530] to-[#141020] text-white shadow-[0_10px_30px_rgba(28,24,48,0.22)]";
export const PRESSABLE = "transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100";
export const LOSS_TEXT = "text-[#9b1c35]";

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
const PILL_TONE: Record<PillTone, string> = {
  neutral: "bg-[#f2f0f7] text-[#3a3746]",
  success: "bg-emerald-50 text-emerald-800",
  loss: "bg-[#fcf2f4] text-[#9b1c35]",
  violet: "bg-[#f3edff] text-[#6d28d9]",
};
export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={cn("inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-semibold", PILL_TONE[tone])}>{children}</span>;
}

/**
 * Detalhe que abre ao passar o mouse (desktop) ou ao tocar (celular).
 * Portal do Radix: nunca é cortado por tabela/overflow.
 */
export function HoverDetail({
  trigger,
  children,
  label,
  className,
  align = "center",
}: {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  className?: string;
  align?: "start" | "center" | "end";
}) {
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
        className={cn("rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet-500", className)}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
        className="w-[320px] rounded-[14px] border-[#ebe8f2] bg-white p-4 text-[13.5px] text-[#1c1a24] shadow-[0_12px_32px_rgba(28,24,48,0.16)]"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** Ícone ⓘ com explicação curta. */
export function InfoTip({ text, label, dark = false }: { text: string; label: string; dark?: boolean }) {
  return (
    <HoverDetail
      label={label}
      trigger={<Info size={15} strokeWidth={1.8} className={dark ? "text-white/60" : "text-[#6b6878]"} aria-hidden="true" />}
      className="flex h-5 w-5 items-center justify-center"
    >
      <p className="leading-relaxed text-[#3a3746]">{text}</p>
    </HoverDetail>
  );
}

/** Linha do detalhe de taxas: rótulo, explicação e valor. */
export function FeeLine({ title, hint, value, muted = false }: { title: string; hint: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-[12.5px] text-[#6b6878]">{hint}</span>
      </span>
      <span className={cn("shrink-0 whitespace-nowrap font-poppins font-semibold tabular-nums", muted && "text-[#6b6878]")}>{value}</span>
    </div>
  );
}

/** Valor sublinhado em pontilhado: sinaliza que dá para abrir o detalhe. */
export const DOTTED = "underline decoration-[#d6cdf3] decoration-dotted underline-offset-4 hover:decoration-[#7c3aed]";
