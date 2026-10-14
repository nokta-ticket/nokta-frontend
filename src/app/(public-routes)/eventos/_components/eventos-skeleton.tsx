import { EventCardSkeleton, EventRowSkeleton } from "@/components/events/event-card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading da busca — mesmo layout da página (título, campo grande, linhas no celular e grade no desktop). */
export function EventosSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <Skeleton className="h-9 w-40 rounded-lg lg:h-11" />
      <Skeleton className="mt-4 h-14 w-full rounded-pill lg:max-w-2xl" />
      <Skeleton className="mt-6 h-4 w-32" />
      <div className="mt-4 space-y-2.5 lg:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventRowSkeleton key={i} />
        ))}
      </div>
      <div className="mt-6 hidden grid-cols-4 gap-6 lg:grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
