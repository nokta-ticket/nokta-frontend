import { Suspense } from "react";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { ExplorarContent } from "./_components/explorar-content";

export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <PageHeader title="Explore a Nokta" description="Conheça e ative as funcionalidades disponíveis para o seu negócio." />
          <BlockSkeleton className="h-96" />
        </PageContainer>
      }
    >
      <ExplorarContent />
    </Suspense>
  );
}
