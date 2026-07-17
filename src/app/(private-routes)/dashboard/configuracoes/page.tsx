import { Suspense } from "react";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { ConfiguracoesContent } from "./_components/configuracoes-content";

export default function ConfiguracoesPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <PageHeader title="Configurações" description="Dados e preferências da organização." />
          <BlockSkeleton className="h-96" />
        </PageContainer>
      }
    >
      <ConfiguracoesContent />
    </Suspense>
  );
}
