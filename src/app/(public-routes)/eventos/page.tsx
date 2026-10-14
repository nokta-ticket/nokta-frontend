import type { Metadata } from "next";
import { Suspense } from "react";
import { EventosClient } from "./_components/eventos-client";
import { EventosSkeleton } from "./_components/eventos-skeleton";

export const metadata: Metadata = { title: "Buscar eventos" };

// useSearchParams (?name=) exige um Suspense por volta na renderização estática.
export default function EventosPage() {
  return (
    <Suspense fallback={<EventosSkeleton />}>
      <EventosClient />
    </Suspense>
  );
}
