import { Suspense } from "react";
import { ConfiguracoesContent, ConfiguracoesSkeleton } from "./_components/configuracoes-content";

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<ConfiguracoesSkeleton />}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
