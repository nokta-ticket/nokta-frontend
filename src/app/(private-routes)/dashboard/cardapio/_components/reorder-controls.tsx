"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

/**
 * Reordenação simples (mover para cima/baixo) para listas curtas sem
 * arrastar. `index`/`total` referem-se à posição na lista JÁ ORDENADA.
 */
export function ReorderControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  disabled = false,
  className,
}: {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const btn = "flex h-5 w-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className={cn("flex shrink-0 flex-col", className)}>
      <button type="button" aria-label="Mover para cima" disabled={disabled || index === 0} onClick={onMoveUp} className={btn}>
        <Icon name="chevron-up" size={10} />
      </button>
      <button type="button" aria-label="Mover para baixo" disabled={disabled || index === total - 1} onClick={onMoveDown} className={btn}>
        <Icon name="chevron-down" size={10} />
      </button>
    </div>
  );
}

/**
 * Dada a lista ordenada e os índices a trocar, monta o payload em lote
 * `{ items: [{id, displayOrder}] }` para os endpoints /reorder existentes.
 */
export function buildSwapReorderPayload<T extends { id: number }>(
  list: T[],
  indexA: number,
  indexB: number,
): { items: { id: number; displayOrder: number }[] } {
  const items = list.map((item, i) => ({ id: item.id, displayOrder: i }));
  const tmp = items[indexA].displayOrder;
  items[indexA] = { ...items[indexA], displayOrder: items[indexB].displayOrder };
  items[indexB] = { ...items[indexB], displayOrder: tmp };
  return { items };
}
