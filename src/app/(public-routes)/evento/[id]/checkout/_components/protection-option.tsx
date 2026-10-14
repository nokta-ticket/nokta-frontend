"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

const COVERAGES = ["Infecção por COVID-19 e isolamento", "Acidente, doença ou lesão", "Emergência doméstica", "Roubo de documentos", "Falha no transporte público", "Condição médica preexistente", "Intimação judicial", "Falha de veículo privado", "Chamada de serviços de emergência", "E muitos outros…"];

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", selected ? "border-brand bg-brand" : "border-border-strong")}>
      {selected ? <span className="size-2 rounded-full bg-brand-foreground" /> : null}
    </span>
  );
}

/**
 * Proteção de compra (seguro). Duas opções exclusivas; a primeira vem
 * marcada (recomendada). As coberturas abrem num toggle fora do botão da
 * opção pra não aninhar controles.
 */
export function ProtectionOption({ selected, onChange, price, className }: { selected: boolean; onChange: (selected: boolean) => void; price: number; className?: string }) {
  const [showCoverages, setShowCoverages] = useState(false);
  return (
    <section className={cn("space-y-3", className)}>
      <h2 className="text-base font-semibold text-foreground">Proteção de compra</h2>
      <Card className="overflow-hidden" role="radiogroup" aria-label="Proteção de compra">
        <div className={cn("transition-colors", selected && "bg-brand-soft/30")}>
          <button type="button" role="radio" aria-checked={selected} onClick={() => onChange(true)} className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-2/60">
            <RadioDot selected={selected} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Compra protegida por {formatBRL(price)}</span>
                <Badge variant="secondary">Recomendado</Badge>
              </span>
              <span className="mt-0.5 block text-caption text-muted-foreground">Dinheiro de volta se um imprevisto te impedir de ir (doença, acidente, transporte…).</span>
            </span>
          </button>
          <div className="px-4 pb-3 pl-12">
            <button type="button" onClick={() => setShowCoverages((v) => !v)} aria-expanded={showCoverages} className="inline-flex min-h-8 items-center gap-1 text-caption font-semibold text-brand hover:underline">
              {showCoverages ? "Esconder coberturas" : "Ver as coberturas"}
              <Icon name="chevron-down" size={10} className={cn("transition-transform", showCoverages && "rotate-180")} />
            </button>
            {showCoverages ? (
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {COVERAGES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-caption text-muted-foreground">
                    <Icon name="check" size={10} className="mt-0.5 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <button type="button" role="radio" aria-checked={!selected} onClick={() => onChange(false)} className={cn("flex w-full items-start gap-3 border-t border-border px-4 py-4 text-left transition-colors hover:bg-surface-2/60", !selected && "bg-brand-soft/30")}>
          <RadioDot selected={!selected} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">Seguir sem proteção</span>
            <span className="mt-0.5 block text-caption text-muted-foreground">Tenho certeza que vou ao evento.</span>
          </span>
        </button>

        <p className="border-t border-border px-4 py-3 text-caption text-subtle-foreground">
          Ao aderir à proteção, você concorda com os{" "}
          <Link href="/termos" target="_blank" className="text-brand underline-offset-2 hover:underline">
            termos e condições
          </Link>
          .
        </p>
      </Card>
    </section>
  );
}
