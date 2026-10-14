import type { ReactNode } from "react";
import { PageHeader as UiPageHeader } from "@/components/ui/page-header";

/**
 * Cabeçalho de página do painel (título + descrição + ações).
 * @deprecated Use `PageHeader` de `@/components/ui/page-header` direto — este
 * wrapper só mantém a assinatura antiga enquanto as páginas são migradas.
 */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <UiPageHeader title={title} description={description} actions={actions} />;
}
