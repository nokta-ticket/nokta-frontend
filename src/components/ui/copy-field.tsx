"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/lib/toast";

/**
 * Valor copiável (link da lista VIP, link do promoter, código). O texto
 * trunca; o botão confirma com ícone de check por 1,5s e toast.
 */
export function CopyField({ value, label = "Copiar", copiedLabel = "Copiado", mono, className, size = "md" }: { value: string; label?: string; copiedLabel?: string; mono?: boolean; className?: string; size?: "sm" | "md" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  return (
    <div className={cn("flex items-center gap-2 rounded-input border border-border bg-surface-2 pl-3.5", size === "sm" ? "h-9 pr-1" : "h-11 pr-1.5 md:h-10", className)}>
      <span className={cn("min-w-0 flex-1 truncate text-foreground", size === "sm" ? "text-caption" : "text-sm", mono && "font-mono")} title={value}>
        {value}
      </span>
      <button type="button" onClick={copy} className={cn("press flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 font-semibold transition-colors", size === "sm" ? "h-7 text-micro" : "h-8 text-caption", copied ? "bg-success-bg text-success" : "bg-surface text-foreground shadow-thumb hover:bg-surface-3")}>
        <Icon name={copied ? "check" : "copy"} size={11} />
        {copied ? copiedLabel : label}
      </button>
    </div>
  );
}
