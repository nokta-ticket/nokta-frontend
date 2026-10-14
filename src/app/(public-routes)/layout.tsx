import type { ReactNode } from "react";
import { PublicShell } from "@/components/shell/public-shell";

/**
 * `modal` é o slot paralelo `@modal`: as rotas de auth interceptadas
 * (`@modal/(.)login` etc.) abrem como card por cima da página atual quando
 * a navegação é interna; `@modal/default.tsx` rende nada no resto.
 */
export default function PublicRoutesLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      <PublicShell>{children}</PublicShell>
      {modal}
    </>
  );
}
