import { Suspense } from "react";
import { PageContainer } from "../_components/page/page-container";
import { PageHeader } from "../_components/page/page-header";
import { BlockSkeleton } from "../_components/states/loading-state";
import { OnboardingContent } from "./_components/onboarding-content";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <PageHeader title="Bem-vindo à Nokta" description="Conte como o seu negócio funciona para recomendarmos as funcionalidades certas." />
          <BlockSkeleton className="h-96" />
        </PageContainer>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
