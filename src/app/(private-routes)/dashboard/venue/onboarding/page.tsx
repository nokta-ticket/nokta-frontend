import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingContent } from "./_components/onboarding-content";

export default function VenueOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <PageHeader title="Primeiros passos" />
          <Skeleton className="h-16 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
