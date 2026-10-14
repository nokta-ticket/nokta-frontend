import type { ReactNode } from "react";
import { NOINDEX } from "@/lib/seo/metadata";

// Recuperar/redefinir senha (fluxo de auth) — fora do índice de busca (a página é client component, por isso o
// metadata mora neste layout de servidor).
export const metadata = NOINDEX;

export default function NoindexLayout({ children }: { children: ReactNode }) {
  return children;
}
