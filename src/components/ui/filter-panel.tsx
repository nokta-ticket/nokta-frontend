"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * Filtros com 4+ grupos: painel lateral fixo de 260px no desktop (lg+) e
 * gaveta inferior no celular, aberta por um botão "Filtros" com contagem
 * dos ativos. Use com `FilterGroup` pra cada bloco.
 *
 *   <FilterPanel activeCount={2} onClear={…}>…grupos…</FilterPanel>
 */
export function FilterPanel({ children, activeCount = 0, onClear, title = "Filtros", className, mobileTrigger }: { children: ReactNode; activeCount?: number; onClear?: () => void; title?: string; className?: string; mobileTrigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const clear = onClear && activeCount > 0 ? (
    <Button variant="link" size="sm" onClick={onClear} className="h-auto text-caption">
      Limpar
    </Button>
  ) : null;

  return (
    <>
      <aside className={cn("hidden w-[260px] shrink-0 lg:block", className)}>
        <div className="sticky top-24 flex flex-col gap-5 rounded-card border border-border bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Icon name="sliders" size={13} />
              {title}
              {activeCount > 0 ? <span className="rounded-pill bg-brand-soft px-1.5 py-0.5 text-micro font-semibold text-brand tnum">{activeCount}</span> : null}
            </h2>
            {clear}
          </div>
          {children}
        </div>
      </aside>

      <div className="lg:hidden">
        {mobileTrigger ?? (
          <Button variant="outline" leftIcon="sliders" onClick={() => setOpen(true)}>
            {title}
            {activeCount > 0 ? <span className="rounded-pill bg-brand-soft px-1.5 py-0.5 text-micro font-semibold text-brand tnum">{activeCount}</span> : null}
          </Button>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <SheetBody>{children}</SheetBody>
            <SheetFooter>
              {onClear ? (
                <Button variant="ghost" onClick={onClear} disabled={activeCount === 0}>
                  Limpar
                </Button>
              ) : null}
              <Button onClick={() => setOpen(false)}>Ver resultados</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

/** Bloco de filtro: título pequeno + opções. */
export function FilterGroup({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="mb-2 text-micro font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

/** Opção de filtro em pílula (toggle). */
export function FilterChip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("press inline-flex h-8 items-center gap-1.5 rounded-pill border px-3 text-caption font-medium transition-colors", active ? "border-transparent bg-brand text-brand-foreground" : "border-border bg-surface-2 text-muted-foreground hover:border-border-strong hover:text-foreground", className)}>
      {active ? <Icon name="check" size={10} /> : null}
      {children}
    </button>
  );
}
