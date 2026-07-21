import type { ReactNode } from "react";

// Fase 5.3, Etapa 5 — o Root Layout parou de usar API dinâmica (Etapa 2),
// o que deixou o Next livre pra prerenderizar estaticamente qualquer rota
// que não force o contrário. Todo (private-routes) exige sessão (ver
// middleware.ts) — precisa continuar dinâmica/no-store de verdade, nunca
// virar HTML estático compartilhado num cache de CDN. `force-dynamic` sem
// nenhuma API dinâmica de verdade: a proteção real continua sendo o
// Middleware (redireciona pra login sem cookie) e a API (401 sem sessão
// HttpOnly válida) — isto aqui é só pra nunca virar artefato estático.
export const dynamic = "force-dynamic";

export default function PrivateRoutesLayout({ children }: { children: ReactNode }) {
  return children;
}
