import { ErrorState as UiErrorState } from "@/components/ui/empty-state";

/**
 * Estado de erro padrão do dashboard, com retry opcional.
 * @deprecated Use `ErrorState` de `@/components/ui/empty-state`.
 */
export function ErrorState({ title = "Algo deu errado", description = "Não foi possível carregar os dados.", onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <UiErrorState title={title} description={description} onRetry={onRetry} />;
}
