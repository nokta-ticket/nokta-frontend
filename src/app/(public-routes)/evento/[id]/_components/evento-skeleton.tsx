import { Skeleton } from "@/components/ui/skeleton";

/** Loading da página do evento — copia o layout real (banner, título, chips, lotes; sidebar no desktop). */
export function EventoSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-2 lg:px-6 lg:pt-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div>
          <Skeleton className="aspect-[818/355] w-full rounded-[20px] lg:rounded-[24px]" />
          <div className="mt-5 space-y-3 px-1">
            <Skeleton className="h-9 w-4/5 rounded-lg" />
            <Skeleton className="h-9 w-1/2 rounded-lg" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-40 rounded-pill" />
              <Skeleton className="h-8 w-24 rounded-pill" />
            </div>
          </div>
          <div className="mt-8 space-y-2.5 lg:hidden">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-[72px] w-full rounded-card" />
            <Skeleton className="h-[72px] w-full rounded-card" />
            <Skeleton className="h-[72px] w-full rounded-card" />
          </div>
          <div className="mt-8 space-y-2.5">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-[420px] w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
