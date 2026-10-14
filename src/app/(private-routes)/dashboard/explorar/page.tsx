import { Suspense } from "react";
import { ExplorarContent, ExplorarSkeleton } from "./_components/explorar-content";

export default function ExplorarPage() {
  return (
    <Suspense fallback={<ExplorarSkeleton />}>
      <ExplorarContent />
    </Suspense>
  );
}
