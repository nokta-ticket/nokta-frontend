import { Skeleton } from "@/components/ui/skeleton";

export default function MeusIngressosLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 lg:px-6 lg:pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56 rounded-lg" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-11 w-full rounded-pill sm:w-64" />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-11 w-full rounded-pill sm:w-56" />
        <Skeleton className="h-11 w-full rounded-input sm:w-80" />
      </div>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-card" />
            <div className="space-y-2 px-0.5">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
