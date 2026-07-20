"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reordenação simples (sem lib de drag-and-drop): mover para cima/baixo.
 * `index`/`total` referem-se à posição dentro da lista JÁ ORDENADA exibida.
 */
export function ReorderControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  disabled = false,
}: {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-6"
        aria-label="Mover para cima"
        disabled={disabled || index === 0}
        onClick={onMoveUp}
      >
        <ChevronUp size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-6"
        aria-label="Mover para baixo"
        disabled={disabled || index === total - 1}
        onClick={onMoveDown}
      >
        <ChevronDown size={14} />
      </Button>
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
