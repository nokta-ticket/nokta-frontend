import { Skeleton } from "@/components/ui/skeleton";

/** Copia o layout real do checkout (coluna principal + resumo à direita no desktop). */
export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 lg:px-6 lg:py-8" aria-busy>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-8 w-20 rounded-pill" />
          </div>
          <div className="flex items-center gap-3.5 rounded-card border border-border bg-surface p-3">
            <Skeleton className="aspect-video w-[132px] rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-card lg:hidden" />
          <Skeleton className="h-24 w-full rounded-card" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-[76px] rounded-card" />
              <Skeleton className="h-[76px] rounded-card" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-80 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
