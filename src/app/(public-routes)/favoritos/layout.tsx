import type { ReactNode } from "react";

// Fase 5.3, Etapa 5 — /favoritos exige sessão (não está na lista de
// publicRoutes do middleware.ts), mas vive em (public-routes) por
// convenção de pasta pré-existente, não por ser público de verdade. Sem
// isso, virava HTML estático compartilhado (ver comentário em
// (private-routes)/layout.tsx).
export const dynamic = "force-dynamic";

export default function FavoritosLayout({ children }: { children: ReactNode }) {
  return children;
}
