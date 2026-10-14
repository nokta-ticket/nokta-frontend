import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState as UiEmptyState } from "@/components/ui/empty-state";

/**
 * Estado vazio padrão do dashboard.
 * @deprecated Use `EmptyState` de `@/components/ui/empty-state` (ícone tipado
 * do registry). Este wrapper mantém a assinatura antiga (`icon` em ReactNode é
 * ignorado — o primitivo novo desenha o ícone da entidade pelo nome).
 */
export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; icon?: ReactNode; actionLabel?: string; onAction?: () => void }) {
  return (
    <UiEmptyState
      title={title}
      description={description}
      action={
        actionLabel && onAction ? (
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
