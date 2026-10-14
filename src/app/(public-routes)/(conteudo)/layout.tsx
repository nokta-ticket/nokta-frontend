import type { ReactNode } from "react";
import { MarketingShell } from "@/components/marketing/marketing-shell";

/**
 * Páginas de conteúdo do nokta.live (soluções, comparativos, guias). O
 * shell da bilheteria não desenha nada aqui (rotas chromeless em
 * public-shell.tsx); a moldura é o MarketingShell.
 */
export default function ConteudoLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
