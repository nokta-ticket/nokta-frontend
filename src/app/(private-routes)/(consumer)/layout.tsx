import type { ReactNode } from "react";
import { PublicShell } from "@/components/shell/public-shell";

// Área do comprador (meus ingressos, revendas, perfil): mesmo shell da
// bilheteria pública, só exige sessão (ver middleware).
export default function ConsumerLayout({ children }: { children: ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
