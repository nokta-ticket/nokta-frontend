import type { ReactNode } from "react";

/** Transição de rota do painel: cada navegação remonta este template e anima a entrada. */
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
