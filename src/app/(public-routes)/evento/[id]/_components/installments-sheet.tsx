"use client";

import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBRL } from "@/lib/format";

export type InstallmentRow = { n: number; installmentCents: number; totalCents: number; semJuros: boolean };

/** Folha inferior com a tabela de parcelas no cartão (GET /pagamento/tabela-parcelas). */
export function InstallmentsSheet({ open, onOpenChange, rows, loading }: { open: boolean; onOpenChange: (open: boolean) => void; rows: InstallmentRow[]; loading: boolean }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto sm:max-w-md sm:rounded-t-modal">
        <SheetHeader>
          <SheetTitle>Parcele no cartão</SheetTitle>
          <SheetDescription>Valores já incluem taxa de serviço e processamento.</SheetDescription>
        </SheetHeader>
        <SheetBody className="gap-0 pt-0">
          {loading ? (
            <div className="space-y-2 py-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState compact icon="credit-card" title="Sem tabela de parcelas agora" description="Você vê as opções de parcelamento no pagamento." />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((p) => (
                <li key={p.n} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-foreground tnum">
                    <span className="font-semibold">{p.n}x</span> de <span className="font-semibold">{formatBRL(p.installmentCents / 100)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-caption text-muted-foreground tnum">{formatBRL(p.totalCents / 100)}</span>
                    {p.semJuros ? (
                      <StatusBadge tone="success" dot={false}>
                        sem juros
                      </StatusBadge>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
