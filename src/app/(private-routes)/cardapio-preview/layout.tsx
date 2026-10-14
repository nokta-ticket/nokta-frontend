import type { ReactNode } from "react";
import { ForceTheme } from "@/components/theme/theme-provider";

/**
 * Documento "nu" do preview do cardápio (renderizado num <iframe> pelo
 * painel). Sempre escuro, como a página pública real — o tema do painel
 * não vaza pra cá.
 */
export default function CardapioPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ForceTheme theme="dark" />
      {children}
    </>
  );
}
