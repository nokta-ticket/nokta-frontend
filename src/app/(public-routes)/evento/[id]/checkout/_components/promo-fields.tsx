"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import type { PromoterPreview } from "./checkout-types";

export type CupomStatus = "idle" | "checking" | "valid" | "invalid";

function Section({ icon, title, badge, open, onOpenChange, children, last }: { icon: IconName; title: string; badge?: ReactNode; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode; last?: boolean }) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className={cn(!last && "border-b border-border")}>
      <CollapsibleTrigger asChild>
        <button type="button" className="group flex h-12 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-surface-2">
          <Icon name={icon} size={15} className="text-brand" />
          <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>
          {badge}
          <Icon name="chevron-down" size={12} className="text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Cupom (desconto puro) e código do promoter (atribuição da venda), cada um
 * num bloco colapsável. São mecanismos separados de propósito: o cupom pode
 * vir por `?cupom=`; o código do promoter é sempre digitado aqui e trava
 * depois que a reserva é criada (ver comentário no checkout-client).
 */
export function PromoFields({ cupomCodigo, cupomDesconto, cupomStatus, onApplyCupom, promoterCode, onPromoterCodeChange, promoterChecking, promoterPreview, promoterLocked, className }: { cupomCodigo: string; cupomDesconto: number; cupomStatus: CupomStatus; onApplyCupom: (code: string) => void; promoterCode: string; onPromoterCodeChange: (code: string) => void; promoterChecking: boolean; promoterPreview: PromoterPreview | null; promoterLocked: boolean; className?: string }) {
  const [cupomInput, setCupomInput] = useState(cupomCodigo);
  const [cupomOpen, setCupomOpen] = useState(Boolean(cupomCodigo));
  const [promoterOpen, setPromoterOpen] = useState(Boolean(promoterCode));

  useEffect(() => {
    if (cupomCodigo) {
      setCupomInput(cupomCodigo);
      setCupomOpen(true);
    }
  }, [cupomCodigo]);

  const applyCupom = () => onApplyCupom(cupomInput.trim().toUpperCase());

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Section icon="tag" title="Cupom de desconto" open={cupomOpen} onOpenChange={setCupomOpen} badge={cupomStatus === "valid" && cupomDesconto > 0 ? <StatusBadge tone="success" dot={false}>−{cupomDesconto}%</StatusBadge> : null}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyCupom();
          }}
        >
          <Input value={cupomInput} onChange={(e) => setCupomInput(e.target.value.toUpperCase())} placeholder="Ex.: NOKTA10" autoCapitalize="characters" autoComplete="off" spellCheck={false} className="uppercase placeholder:normal-case" aria-label="Código do cupom" />
          <Button type="submit" variant="secondary" className="h-11 shrink-0 md:h-10" disabled={!cupomInput.trim() || cupomStatus === "checking"} loading={cupomStatus === "checking"}>
            Aplicar
          </Button>
        </form>
        {cupomStatus === "valid" ? (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-success">
            <Icon name="check-circle" size={12} />
            Cupom {cupomCodigo} aplicado: {cupomDesconto}% de desconto nos ingressos.
          </p>
        ) : cupomStatus === "invalid" ? (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-caption text-danger">
            <Icon name="exclamation-circle" size={12} />
            Esse cupom não vale pra este evento. Confira o código e tente de novo.
          </p>
        ) : null}
      </Section>

      <Section icon="megaphone" title="Código do promoter" open={promoterOpen} onOpenChange={setPromoterOpen} last badge={promoterPreview?.valid ? <StatusBadge tone="success" dot={false}>Válido</StatusBadge> : null}>
        <p className="mb-2.5 text-caption text-muted-foreground">Recebeu um código de quem está divulgando este evento? Digite aqui.</p>
        <Input value={promoterCode} onChange={(e) => onPromoterCodeChange(e.target.value.toUpperCase())} placeholder="Ex.: JOAO10" autoCapitalize="characters" autoComplete="off" spellCheck={false} disabled={promoterLocked} className="uppercase placeholder:normal-case" aria-label="Código do promoter" />
        {promoterChecking ? (
          <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
            <Icon name="loader" size={12} className="animate-spin" />
            Verificando código…
          </p>
        ) : promoterPreview ? (
          <p role={promoterPreview.valid ? undefined : "alert"} className={cn("mt-2 flex items-center gap-1.5 text-caption", promoterPreview.valid ? "text-success" : "text-danger")}>
            <Icon name={promoterPreview.valid ? "check-circle" : "exclamation-circle"} size={12} />
            {promoterPreview.valid ? (promoterPreview.discountApplicableCents > 0 ? `Código válido — ${formatBRL(promoterPreview.discountApplicableCents / 100)} de desconto.` : "Código válido.") : promoterPreview.message}
          </p>
        ) : null}
        {promoterLocked ? <p className="mt-2 text-caption text-subtle-foreground">Sua reserva já foi criada — pra trocar o código, volte e recomece a compra.</p> : null}
      </Section>
    </Card>
  );
}
