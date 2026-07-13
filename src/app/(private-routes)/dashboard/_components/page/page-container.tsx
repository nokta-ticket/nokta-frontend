import type { ReactNode } from "react";

/** Wrapper de largura/spacing padrão de toda página do dashboard. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>;
}
