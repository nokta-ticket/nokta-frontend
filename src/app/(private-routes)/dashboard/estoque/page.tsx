import { Suspense } from "react";
import { EstoqueContent, EstoqueSkeleton } from "./_components/estoque-content";

/** A aba vem de `?tab=` (useSearchParams) — por isso o Suspense aqui. */
export default function VenueEstoquePage() {
  return (
    <Suspense fallback={<EstoqueSkeleton />}>
      <EstoqueContent />
    </Suspense>
  );
}
