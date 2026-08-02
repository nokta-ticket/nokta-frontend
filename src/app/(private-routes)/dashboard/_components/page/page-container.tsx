import type { ReactNode } from "react";

/** Wrapper de spacing padrão de toda página do dashboard — ocupa 100% da largura disponível. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-6">{children}</div>;
}
