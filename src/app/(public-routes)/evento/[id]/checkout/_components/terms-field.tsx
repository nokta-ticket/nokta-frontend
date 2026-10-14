"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";

/** Aceite dos termos (obrigatório pra pagar). A área toda do card é clicável. */
export function TermsField({ checked, onChange, className }: { checked: boolean; onChange: (checked: boolean) => void; className?: string }) {
  return (
    <label htmlFor="checkout-terms" className={cn("flex cursor-pointer items-start gap-3 rounded-card border border-border bg-surface p-4 text-caption leading-relaxed text-muted-foreground shadow-card transition-colors hover:border-border-strong", className)}>
      <Checkbox id="checkout-terms" checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5 size-5 rounded-[6px] border-border-strong" />
      <span>
        Li e aceito os{" "}
        <Link href="/termos" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">
          Termos de Uso
        </Link>
        , a{" "}
        <Link href="/privacidade" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">
          Política de Privacidade
        </Link>{" "}
        e a{" "}
        <Link href="/politica-de-cancelamento" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">
          Política de Cancelamento e Reembolso
        </Link>{" "}
        (arrependimento em até 7 dias corridos; sem reembolso por desistência após esse prazo). Estou ciente de que, após o check-in, o serviço será considerado utilizado.
      </span>
    </label>
  );
}
