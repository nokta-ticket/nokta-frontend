import type { ReactNode } from "react";

/**
 * Transição de rota da bilheteria: cada navegação remonta este template e
 * o conteúdo entra com fade. Só opacidade de propósito — `transform` aqui
 * viraria containing block e faria barras `position: fixed` das páginas
 * (compra, checkout) pularem durante a animação.
 */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className="page-fade flex flex-1 flex-col">{children}</div>;
}
