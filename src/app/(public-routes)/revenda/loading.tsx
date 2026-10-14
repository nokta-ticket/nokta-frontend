import { ResaleCardSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Mesmo layout da lista de revenda (título, filtro, linhas, coluna lateral). */
export default function RevendaLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 lg:px-6 lg:pt-8" aria-busy>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 flex items-center justify-between gap-3">
        <Skeleton className="h-11 w-full rounded-input sm:max-w-xs md:h-10" />
        <Skeleton className="hidden h-4 w-28 sm:block" />
      </div>
      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ResaleCardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-10 space-y-4 lg:mt-0">
          <Skeleton className="h-80 w-full rounded-card" />
          <Skeleton className="h-36 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
