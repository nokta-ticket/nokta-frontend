"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildRedirectTarget } from "../_lib/redirect-target";
import { PageContainer } from "./page/page-container";
import { BlockSkeleton } from "./states/loading-state";

function Redirecting() {
  return (
    <PageContainer>
      <BlockSkeleton className="h-96" />
    </PageContainer>
  );
}

function RouteRedirectInner({ to }: { to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomingQuery = searchParams.toString();

  useEffect(() => {
    router.replace(buildRedirectTarget(to, incomingQuery));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, incomingQuery]);

  return <Redirecting />;
}

/**
 * Redirect fino client-side (rotas canônicas → implementação existente, ou
 * rota antiga → canônica). `router.replace` em vez de `router.push` — não
 * empilha no histórico, então "voltar" não fica preso num loop de redirect.
 *
 * Query string do usuário é preservada e mesclada com a de `to` (se `to` já
 * tiver `?tab=x`, ela nunca é sobrescrita por um parâmetro que o usuário
 * trouxe — a rota alvo declarada sempre vence em caso de conflito).
 *
 * Traz sua própria fronteira de Suspense (exige `useSearchParams`) — quem
 * usa este componente não precisa lembrar de envolver com `<Suspense>`.
 */
export function RouteRedirect({ to }: { to: string }) {
  return (
    <Suspense fallback={<Redirecting />}>
      <RouteRedirectInner to={to} />
    </Suspense>
  );
}
