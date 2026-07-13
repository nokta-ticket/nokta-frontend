import { AlertCircle } from "lucide-react";
import { PageState } from "@/components/ui/page-state";

/** Estado de erro padrão do dashboard, com retry opcional. */
export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar os dados.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <PageState
      title={title}
      description={description}
      icon={<AlertCircle className="h-8 w-8 text-red-500" />}
      actionLabel={onRetry ? "Tentar novamente" : undefined}
      onAction={onRetry}
    />
  );
}
