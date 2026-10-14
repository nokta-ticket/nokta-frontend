"use client";

import { useState, type ReactNode } from "react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cn";

/**
 * Tela do Pix gerado: QR grande num card com destaque, código copia-e-cola
 * e o estado "aguardando pagamento" pulsando. A confirmação em si é feita
 * por quem renderiza (polling do status) — este painel só exibe.
 */
export function PixPanel({ code, amountLabel, meta, className }: { code: string; amountLabel?: string; meta?: ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não deu pra copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <Card accent className={cn("items-center p-5 text-center sm:p-6", className)}>
      <p className="text-base font-semibold text-foreground">Escaneie o QR Code no app do seu banco</p>
      <p className="mt-1 max-w-xs text-caption text-muted-foreground">Ou copie o código e pague no Pix Copia e Cola. A confirmação é imediata.</p>

      {/* QR precisa de fundo branco pra leitura — exceção funcional ao tema escuro. */}
      <div className="mt-5 rounded-2xl bg-white p-3 shadow-card">
        <QRCode value={code} size={200} aria-label="QR Code do Pix" />
      </div>

      {amountLabel ? <p className="mt-4 text-stat font-bold text-foreground tnum">{amountLabel}</p> : null}

      <Button variant="outline" size="full" leftIcon={copied ? "check" : "copy"} onClick={copy} className="mt-4 max-w-sm">
        {copied ? "Código copiado!" : "Copiar código Pix"}
      </Button>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="pulse-ring size-2 rounded-full bg-brand" aria-hidden />
          Aguardando pagamento
        </span>
        {meta ? <span className="tnum">· {meta}</span> : null}
      </div>
    </Card>
  );
}
