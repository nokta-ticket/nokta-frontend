import type { ReactNode } from "react";
import { PageState } from "@/components/ui/page-state";

/** Estado vazio padrão do dashboard (wrapper fino sobre o PageState existente). */
export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <PageState
      title={title}
      description={description}
      icon={icon}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
