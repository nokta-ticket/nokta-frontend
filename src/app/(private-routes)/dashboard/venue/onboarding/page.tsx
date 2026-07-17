import { Suspense } from "react";
import { PageContainer } from "../../_components/page/page-container";
import { PageHeader } from "../../_components/page/page-header";
import { BlockSkeleton } from "../../_components/states/loading-state";
import { OnboardingContent } from "./_components/onboarding-content";

export default function VenueOnboardingPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <PageHeader title="Configuração guiada do Venue" description="Ative e configure seu estabelecimento passo a passo." />
          <BlockSkeleton className="h-96" />
        </PageContainer>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
